'use server';

import { Firestore, Settings } from '@google-cloud/firestore';
import { appointmentSchema } from '@/lib/firebase/schemas';
import type { Appointment, AppointmentStatus } from '@/types/database';
import { sendEmail } from '@/lib/email';
import type { User } from '@/types/user';

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

// ==========================================
// --- Основные действия (CRUD) ---
// ==========================================

export async function createAppointmentAction(
  salonId: string,
  appointmentId: string,
  data: Omit<Appointment, 'id'>
): Promise<Appointment> {
  const validated = appointmentSchema.parse(data);
  const path = `salons/${salonId}/appointments/${appointmentId}`;
  
  await getDb().doc(path).set(validated);
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
  
  return { ...validated, id: appointmentId } as Appointment;
}

export async function getAppointmentAction(
  salonId: string,
  appointmentId: string
): Promise<Appointment | null> {
  const path = `salons/${salonId}/appointments/${appointmentId}`;
  const data = await readDoc<Omit<Appointment, 'id'>>(path);
  
  return data ? { ...data, id: appointmentId } as Appointment : null;
}

export async function updateAppointmentAction(
  salonId: string,
  appointmentId: string,
  data: Partial<Appointment>
): Promise<Appointment> {
  const db = getDb();
  const docRef = db.collection('salons').doc(salonId).collection('appointments').doc(appointmentId);

  const snap = await docRef.get();
  if (!snap.exists) throw new Error('Appointment not found');

  const current = snap.data() as Appointment;
  const validated = appointmentSchema.partial().parse(data);
  const updated = { ...current, ...validated };

  await docRef.set(updated, { merge: true });
  
  return { ...updated, id: appointmentId } as Appointment;
}

export async function deleteAppointmentAction(
  salonId: string,
  appointmentId: string
): Promise<void> {
  await getDb()
    .collection('salons')
    .doc(salonId)
    .collection('appointments')
    .doc(appointmentId)
    .delete();
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
}

export async function getAppointmentsByUserAction(userId: string): Promise<Appointment[]> {
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
}

export async function getAppointmentsByDayAction(
  salonId: string,
  date: Date | string
): Promise<Appointment[]> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  
  const startIso = dayStart.toISOString();
  const endIso = dayEnd.toISOString();

  return getAppointmentsBySalonAction(salonId, { startAt: startIso, endAt: endIso });
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
  // Получаем все записи на этот день
  const appts = await getAppointmentsByDayAction(salonId, startAtIso);

  const start = new Date(startAtIso);
  const end = new Date(startAtIso);
  end.setMinutes(end.getMinutes() + durationMinutes);

  // Фильтруем записи, которые могут конфликтовать
  const relevant = appts.filter((a) => {
    if (excludeAppointmentId && a.id === excludeAppointmentId) return false;
    if (employeeId && a.employeeId !== employeeId) return false;
    // Игнорируем отмененные записи, если нужно (обычно cancelled не занимают слот)
    if (a.status === "completed") return false; 
    return true;
  });

  // Проверяем пересечение интервалов
  const overlaps = relevant.some((a) => {
    const aStart = new Date(a.startAt);
    const aEnd = new Date(a.startAt);
    aEnd.setMinutes(aEnd.getMinutes() + a.durationMinutes);

// Логика пересечения: (StartA < EndB) и (EndA > StartB)
return aStart < end && start < aEnd;
});

return !overlaps;
}

// --- Helpers ---
async function resolveRecipientEmails(salonId: string, employeeId?: string): Promise<string[]> {
const db = getDb();
try {
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
targetUserIds.map((uid) => db.collection('users').doc(uid).get())
);

const emails: string[] = [];
for (const d of userDocs) {
if (d.exists) {
const u = d.data() as User;
if (u?.email) emails.push(u.email);
}
}

// Убираем дубликаты и пустые
return Array.from(new Set(emails.filter(Boolean)));
} catch (err) {
console.error('[appointments] resolveRecipientEmails error:', err);
return [];
}
}