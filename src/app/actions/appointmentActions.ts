'use server';

import { Firestore, Settings, Transaction } from '@google-cloud/firestore';
import { appointmentSchema } from '@/lib/firebase/schemas';
import type { Appointment, AppointmentStatus } from '@/types/database';
import { sendEmail } from '@/lib/email';
import type { User } from '@/types/user';
import {
  validateId,
  validateString,
  validatePhone,
  validateDate,
  validateDuration,
  handleError,
  createAppointmentDbGuards,
} from '@/lib/validation/appointmentGuards';

// --- Инициализация Firestore (Singleton) ---
let firestoreInstance: Firestore | null = null;

function getDb(): Firestore {
  if (!firestoreInstance) {
    const firestoreSettings: Settings = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      databaseId: 'beautyfirestore', // Указываем ID базы данных
      credentials: {
        client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        private_key: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      ignoreUndefinedProperties: true,
    };

    firestoreInstance = new Firestore(firestoreSettings);
  }
  return firestoreInstance;
}

const { checkSalonExists, checkServiceExists, checkEmployeeExists } = createAppointmentDbGuards(getDb);

// --- Вспомогательная функция чтения ---
const readDoc = async <T>(path: string): Promise<T | null> => {
  try {
    const snap = await getDb().doc(path).get();
    return snap.exists ? (snap.data() as T) : null;
  } catch (err: any) {
    if (err && (err.code === 5 || err.code === 'not-found')) return null;
    throw err;
  }
};

type SlimAppointment = Pick<Appointment, 'id' | 'startAt' | 'durationMinutes' | 'status' | 'employeeId'>;

const getDayBounds = (date: Date | string): { startIso: string; endIso: string } => {
  const dayStart = new Date(date);
  if (isNaN(dayStart.getTime())) {
    throw new Error('Неверная дата');
  }
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return { startIso: dayStart.toISOString(), endIso: dayEnd.toISOString() };
};

const fetchDayAppointmentsSlim = async (
  salonId: string,
  date: Date | string,
  employeeId?: string,
  tx?: Transaction
): Promise<SlimAppointment[]> => {
  const { startIso, endIso } = getDayBounds(date);
  const db = getDb();
  let q = db
    .collection('salons')
    .doc(salonId)
    .collection('appointments')
    .where('startAt', '>=', startIso)
    .where('startAt', '<', endIso)
    .select('startAt', 'durationMinutes', 'status', 'employeeId');

  if (employeeId) {
    q = q.where('employeeId', '==', employeeId);
  }

  const snap = tx ? await tx.get(q) : await q.get();
  if (snap.empty) return [];

  const items: SlimAppointment[] = [];
  snap.docs.forEach((doc) => {
    const data = doc.data() as Partial<Appointment>;
    if (!data.startAt || typeof data.durationMinutes !== 'number') {
      return;
    }
    items.push({
      id: doc.id,
      startAt: data.startAt,
      durationMinutes: data.durationMinutes,
      status: (data.status as AppointmentStatus) || 'pending',
      employeeId: data.employeeId,
    });
  });

  return items;
};

// ==========================================
// --- Основные действия (CRUD) ---
// ==========================================

export async function createAppointmentAction(
  salonId: string,
  appointmentId: string,
  data: Omit<Appointment, 'id'>
): Promise<Appointment> {
  try {
    // Валидация входных параметров
    validateId(salonId, 'ID салона');
    validateId(appointmentId, 'ID записи');
    validateId(data.serviceId, 'ID услуги');
    
    if (data.employeeId) {
      validateId(data.employeeId, 'ID сотрудника');
    }
    
    // Валидация и санитизация данных
    const sanitizedData = {
      ...data,
      customerName: validateString(data.customerName, 'Имя клиента', 100),
      customerPhone: validatePhone(data.customerPhone),
      notes: validateString(data.notes, 'Заметки', 1000),
    };
    
    validateDate(sanitizedData.startAt, 'Дата начала', false);
    validateDuration(sanitizedData.durationMinutes);
    
    // Валидация через схему
    const validated = appointmentSchema.parse({
      ...sanitizedData,
      salonId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Атомарная операция с проверкой доступности и существования сущностей
    const db = getDb();
    const result = await db.runTransaction(async (tx: Transaction) => {
      // Проверка существования салона
      await checkSalonExists(salonId, tx);
      
      // Проверка существования услуги
      await checkServiceExists(salonId, validated.serviceId, tx);
      
      // Проверка существования сотрудника (если указан)
      if (validated.employeeId) {
        await checkEmployeeExists(salonId, validated.employeeId, tx);
      }
      
      // Проверка доступности времени
      const appts = await fetchDayAppointmentsSlim(salonId, validated.startAt, validated.employeeId, tx);
      const start = new Date(validated.startAt);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + validated.durationMinutes);
      
      const conflicts = appts.filter((a) => {
        if (a.id === appointmentId) return false;
        if (validated.employeeId && a.employeeId !== validated.employeeId) return false;
        // Игнорируем завершенные и отмененные записи
        const status = a.status as string;
        if (status === 'completed' || status === 'cancelled') return false;
        
        const aStart = new Date(a.startAt);
        const aEnd = new Date(aStart);
        aEnd.setMinutes(aEnd.getMinutes() + a.durationMinutes);
        
        return aStart < end && start < aEnd;
      });
      
      if (conflicts.length > 0) {
        throw new Error('Выбранное время недоступно');
      }
      
      // Создание записи
      const path = `salons/${salonId}/appointments/${appointmentId}`;
      const appointmentRef = db.doc(path);
      tx.set(appointmentRef, validated);
      
      return validated;
    });
    
    // Best-effort уведомление по email. Ошибки не прерывают создание записи
    try {
      const recipients = await resolveRecipientEmails(salonId, validated.employeeId);
      if (recipients.length > 0) {
        const subject = 'Новая запись в расписании';
        const start = new Date(validated.startAt);
        const timeStr = isNaN(start.getTime()) ? validated.startAt : start.toLocaleString('ru-RU');
        const html = `
          <div>
            <p>Появилась новая запись в салоне <strong>${salonId}</strong>.</p>
            <p>Время: <strong>${timeStr}</strong></p>
            ${validated.customerName ? `<p>Клиент: <strong>${validated.customerName}</strong></p>` : ''}
            ${validated.notes ? `<p>Заметки: ${validated.notes}</p>` : ''}
          </div>
        `;
        await sendEmail({ to: recipients, subject, html, text: `Новая запись. Время: ${timeStr}` });
      }
    } catch (e) {
      console.error('[appointments] failed to send email notification:', e);
    }
    
    return { ...result, id: appointmentId } as Appointment;
  } catch (error) {
    throw handleError(error, 'Не удалось создать запись');
  }
}

export async function getAppointmentAction(
  salonId: string,
  appointmentId: string
): Promise<Appointment | null> {
  try {
    validateId(salonId, 'ID салона');
    validateId(appointmentId, 'ID записи');
    
    const path = `salons/${salonId}/appointments/${appointmentId}`;
    const data = await readDoc<Omit<Appointment, 'id'>>(path);
    
    return data ? { ...data, id: appointmentId } as Appointment : null;
  } catch (error) {
    throw handleError(error, 'Не удалось получить запись');
  }
}

export async function updateAppointmentAction(
  salonId: string,
  appointmentId: string,
  data: Partial<Appointment>
): Promise<Appointment> {
  try {
    validateId(salonId, 'ID салона');
    validateId(appointmentId, 'ID записи');
    
    // Валидация обновляемых полей
    const sanitizedData: Partial<Appointment> = {};
    if (data.customerName !== undefined) {
      sanitizedData.customerName = validateString(data.customerName, 'Имя клиента', 100);
    }
    if (data.customerPhone !== undefined) {
      sanitizedData.customerPhone = validatePhone(data.customerPhone);
    }
    if (data.notes !== undefined) {
      sanitizedData.notes = validateString(data.notes, 'Заметки', 1000);
    }
    if (data.startAt !== undefined) {
      validateDate(data.startAt, 'Дата начала', true); // При обновлении разрешаем прошлое
      sanitizedData.startAt = data.startAt;
    }
    if (data.durationMinutes !== undefined) {
      validateDuration(data.durationMinutes);
      sanitizedData.durationMinutes = data.durationMinutes;
    }
    if (data.serviceId !== undefined) {
      validateId(data.serviceId, 'ID услуги');
      sanitizedData.serviceId = data.serviceId;
    }
    if (data.employeeId !== undefined) {
      if (data.employeeId) {
        validateId(data.employeeId, 'ID сотрудника');
        sanitizedData.employeeId = data.employeeId;
      } else {
        sanitizedData.employeeId = undefined;
      }
    }
    if (data.status !== undefined) {
      sanitizedData.status = data.status;
    }
    
    const db = getDb();
    const result = await db.runTransaction(async (tx: Transaction) => {
      const docRef = db.collection('salons').doc(salonId).collection('appointments').doc(appointmentId);
      const snap = await tx.get(docRef);
      
      if (!snap.exists) {
        throw new Error('Запись не найдена');
      }
      
      const current = snap.data() as Appointment;
      
      // Проверка существования связанных сущностей при обновлении
      if (sanitizedData.serviceId && sanitizedData.serviceId !== current.serviceId) {
        await checkServiceExists(salonId, sanitizedData.serviceId, tx);
      }
      if (sanitizedData.employeeId && sanitizedData.employeeId !== current.employeeId) {
        await checkEmployeeExists(salonId, sanitizedData.employeeId, tx);
      }
      
      // Проверка доступности времени при изменении времени или длительности
      if (sanitizedData.startAt || sanitizedData.durationMinutes) {
        const startAt = sanitizedData.startAt || current.startAt;
        const durationMinutes = sanitizedData.durationMinutes || current.durationMinutes;
        
        const effectiveEmployeeId = sanitizedData.employeeId ?? current.employeeId;
        const appts = await fetchDayAppointmentsSlim(salonId, startAt, effectiveEmployeeId, tx);
        const start = new Date(startAt);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + durationMinutes);
        
        const conflicts = appts.filter((a) => {
          if (a.id === appointmentId) return false;
          const employeeId = sanitizedData.employeeId || current.employeeId;
          if (employeeId && a.employeeId !== employeeId) return false;
          // Игнорируем завершенные и отмененные записи
          const status = a.status as string;
          if (status === 'completed' || status === 'cancelled') return false;
          
          const aStart = new Date(a.startAt);
          const aEnd = new Date(aStart);
          aEnd.setMinutes(aEnd.getMinutes() + a.durationMinutes);
          
          return aStart < end && start < aEnd;
        });
        
        if (conflicts.length > 0) {
          throw new Error('Выбранное время недоступно');
        }
      }
      
      const validated = appointmentSchema.partial().parse(sanitizedData);
      const updated = {
        ...current,
        ...validated,
        updatedAt: new Date().toISOString(),
      };
      
      tx.set(docRef, updated, { merge: true });
      
      return updated;
    });
    
    return { ...result, id: appointmentId } as Appointment;
  } catch (error) {
    throw handleError(error, 'Не удалось обновить запись');
  }
}

export async function deleteAppointmentAction(
  salonId: string,
  appointmentId: string
): Promise<void> {
  try {
    validateId(salonId, 'ID салона');
    validateId(appointmentId, 'ID записи');
    
    const db = getDb();
    const docRef = db.collection('salons').doc(salonId).collection('appointments').doc(appointmentId);
    
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new Error('Запись не найдена');
    }
    
    await docRef.delete();
  } catch (error) {
    throw handleError(error, 'Не удалось удалить запись');
  }
}

// ==========================================
// --- Списки и Поиск ---
// ==========================================

export async function getAppointmentsBySalonAction(
  salonId: string,
  opts?: {
    startAt?: string;
    endAt?: string;
    status?: AppointmentStatus;
    employeeId?: string;
    serviceId?: string;
    customerUserId?: string;
  }
): Promise<Appointment[]> {
  try {
    validateId(salonId, 'ID салона');
    
    // Валидация опций запроса
    if (opts?.startAt) {
      validateDate(opts.startAt, 'Дата начала', true);
    }
    if (opts?.endAt) {
      validateDate(opts.endAt, 'Дата окончания', true);
    }
    if (opts?.employeeId) {
      validateId(opts.employeeId, 'ID сотрудника');
    }
    if (opts?.serviceId) {
      validateId(opts.serviceId, 'ID услуги');
    }
    if (opts?.customerUserId) {
      validateId(opts.customerUserId, 'ID клиента');
    }
    
    // Проверка существования салона
    await checkSalonExists(salonId);
    
    const db = getDb();
    let q = db.collection('salons').doc(salonId).collection('appointments') as FirebaseFirestore.Query;

    if (opts?.startAt) q = q.where('startAt', '>=', opts.startAt);
    if (opts?.endAt) q = q.where('startAt', '<=', opts.endAt);
    if (opts?.status) q = q.where('status', '==', opts.status);
    if (opts?.employeeId) q = q.where('employeeId', '==', opts.employeeId);
    if (opts?.serviceId) q = q.where('serviceId', '==', opts.serviceId);
    if (opts?.customerUserId) q = q.where('customerUserId', '==', opts.customerUserId);

    const snap = await q.get();
    if (snap.empty) return [];

    return snap.docs
      .map((d) => ({ ...(d.data() as Omit<Appointment, 'id'>), id: d.id } as Appointment))
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  } catch (error) {
    throw handleError(error, 'Не удалось получить список записей');
  }
}

export async function getAppointmentsByUserAction(userId: string): Promise<Appointment[]> {
  try {
    validateId(userId, 'ID пользователя');
    
    // Используем collectionGroup для поиска по всем подколлекциям 'appointments'
    const snap = await getDb()
      .collectionGroup('appointments')
      .where('customerUserId', '==', userId)
      .get();

    if (snap.empty) return [];

    return snap.docs.map((d) => ({ 
      ...(d.data() as Omit<Appointment, 'id'>), 
      id: d.id 
    } as Appointment));
  } catch (error) {
    throw handleError(error, 'Не удалось получить записи пользователя');
  }
}

export async function getAppointmentsByDayAction(
  salonId: string,
  date: Date | string
): Promise<Appointment[]> {
  try {
    validateId(salonId, 'ID салона');
    
    const { startIso, endIso } = getDayBounds(date);
    return getAppointmentsBySalonAction(salonId, { startAt: startIso, endAt: endIso });
  } catch (error) {
    throw handleError(error, 'Не удалось получить записи за день');
  }
}

// ==========================================
// --- Проверка доступности ---
// ==========================================

export async function checkAppointmentAvailabilityAction(
  salonId: string,
  startAtIso: string,
  durationMinutes: number,
  employeeId?: string,
  excludeAppointmentId?: string
): Promise<boolean> {
  try {
    validateId(salonId, 'ID салона');
    validateDate(startAtIso, 'Дата начала', true);
    validateDuration(durationMinutes);
    
    if (employeeId) {
      validateId(employeeId, 'ID сотрудника');
    }
    if (excludeAppointmentId) {
      validateId(excludeAppointmentId, 'ID записи для исключения');
    }
    
    // Проверка существования салона
    await checkSalonExists(salonId);
    
    // Получаем все записи на этот день c минимальным набором полей
    const appts = await fetchDayAppointmentsSlim(salonId, startAtIso, employeeId);

    const start = new Date(startAtIso);
    if (isNaN(start.getTime())) {
      return false;
    }
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMinutes);

    // Фильтруем записи, которые могут конфликтовать
    const relevant = appts.filter((a) => {
      if (excludeAppointmentId && a.id === excludeAppointmentId) return false;
      if (employeeId && a.employeeId !== employeeId) return false;
      // Игнорируем завершенные и отмененные записи
      const status = a.status as string;
      if (status === 'completed' || status === 'cancelled') return false; 
      return true;
    });

    // Проверяем пересечение интервалов
    const overlaps = relevant.some((a) => {
      const aStart = new Date(a.startAt);
      if (isNaN(aStart.getTime())) return false;
      const aEnd = new Date(aStart);
      aEnd.setMinutes(aEnd.getMinutes() + a.durationMinutes);

      // Логика пересечения: (StartA < EndB) и (EndA > StartB)
      return aStart < end && start < aEnd;
    });

    return !overlaps;
  } catch (error) {
    // При ошибке валидации возвращаем false (время недоступно)
    console.error('[checkAppointmentAvailability] Error:', error);
    return false;
  }
}

// --- Helpers ---
async function resolveRecipientEmails(salonId: string, employeeId?: string): Promise<string[]> {
  const db = getDb();
  try {
    if (!salonId || typeof salonId !== 'string') {
      return [];
    }
    
    const salonSnap = await db.collection('salons').doc(salonId).get();
    if (!salonSnap.exists) return [];
    
    const salon = salonSnap.data() as { members?: Array<{ userId: string }> } | undefined;
    const members = salon?.members || [];

    const targetUserIds = employeeId
      ? members.filter((m) => m.userId === employeeId).map((m) => m.userId)
      : members.map((m) => m.userId);

    if (targetUserIds.length === 0) return [];

    // Получаем email пользователей
    const userDocs = await Promise.all(
      targetUserIds.map((uid) => {
        if (!uid || typeof uid !== 'string') return null;
        return db.collection('users').doc(uid).get();
      })
    );

    const emails: string[] = [];
    for (const d of userDocs) {
      if (d && d.exists) {
        const u = d.data() as User;
        if (u?.email && typeof u.email === 'string' && u.email.includes('@')) {
          emails.push(u.email);
        }
      }
    }

    // Убираем дубликаты и пустые
    return Array.from(new Set(emails.filter(Boolean)));
  } catch (err) {
    console.error('[appointments] resolveRecipientEmails error:', err);
    return [];
  }
}