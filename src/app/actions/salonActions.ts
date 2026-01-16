'use server';

import { Firestore, Settings, Transaction } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage'; // <--- Добавляем импорт Storage
import { revalidatePath } from 'next/cache';

// Импортируем схемы и типы
import {
  salonSchema,
  userSalonsSchema,
  salonInvitationSchema,
  salonServiceSchema,
  salonScheduleSchema,
  salonExceptionDaySchema,
} from '@/lib/firebase/schemas';

import type {
  Salon,
  SalonInvitation,
  SalonMember,
  SalonSchedule,
  SalonService,
  UserSalons,
  SalonExceptionDay,
  SalonWorkDay,
  WeekDay,
} from '@/types/database';

// УБИРАЕМ импорт клиентской функции
// import { getSalonAvatar } from '@/lib/firebase/storage'; 

// Инициализация Storage (если еще нет в этом файле)
const storage = new Storage({
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  credentials: {
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    private_key: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
});

// --- Инициализация Firestore (Singleton) ---
let firestoreInstance: Firestore | null = null;

function getDb(): Firestore {
  if (!firestoreInstance) {
    const firestoreSettings: Settings = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      databaseId: 'beautyfirestore',
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

// --- Инициализация Storage (Singleton) ---
let storageInstance: Storage | null = null;

function getStorage(): Storage {
  if (!storageInstance) {
    storageInstance = new Storage({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      credentials: {
        client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        private_key: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
    });
  }
  return storageInstance;
}

// --- Вспомогательная функция чтения ---
const readDoc = async <T>(collection: string, id: string): Promise<T | null> => {
  try {
    const snap = await getDb().collection(collection).doc(id).get();
    return snap.exists ? (snap.data() as T) : null;
  } catch (err: any) {
    if (err && (err.code === 5 || err.code === 'not-found')) {
      return null;
    }
    throw err;
  }
};

// ==========================================
// --- Действия для Салонов (Salon) ---
// ==========================================

export const createSalonAction = async (salonId: string, data: Omit<Salon, 'id'>): Promise<Salon> => {
  const validatedData = salonSchema.parse(data);
  await getDb().collection('salons').doc(salonId).set(validatedData);
  revalidatePath('/salons');
  return { ...validatedData, id: salonId };
};

export const getSalonByIdAction = async (salonId: string): Promise<Salon | null> => {
  const data = await readDoc<Salon>('salons', salonId);
  return data ? { ...data, id: salonId } : null;
};

export const updateSalonAction = async (salonId: string, data: Partial<Salon>): Promise<Salon> => {
  const db = getDb();
  const docRef = db.collection('salons').doc(salonId);

  const snap = await docRef.get();
  if (!snap.exists) throw new Error(`Salon with id ${salonId} not found.`);

  const current = snap.data() as Salon;
  const validatedData = salonSchema.partial().parse(data);
  const updatedData = { ...current, ...validatedData };

  await docRef.set(updatedData, { merge: true });
  
  revalidatePath(`/salons/${salonId}`);
  revalidatePath('/salons');
  return { ...updatedData, id: salonId };
};

export const deleteSalonAction = async (salonId: string): Promise<void> => {
  await getDb().collection('salons').doc(salonId).delete();
  revalidatePath('/salons');
};

export const updateSalonAvatarDbAction = async (salonId: string, avatarUrl: string, avatarStoragePath: string): Promise<void> => {
  await getDb().collection('salons').doc(salonId).set({
    avatarUrl,
    avatarStoragePath
  }, { merge: true });
  revalidatePath(`/salons/${salonId}`);
};

export const removeSalonAvatarDbAction = async (salonId: string): Promise<void> => {
  await getDb().collection('salons').doc(salonId).set({
    avatarUrl: '',
    avatarStoragePath: ''
  }, { merge: true });
  revalidatePath(`/salons/${salonId}`);
};

// ==========================================
// --- Действия для Салонов Пользователя (UserSalons) ---
// ==========================================

export const createUserSalonsAction = async (userId: string, data: Omit<UserSalons, 'id'>): Promise<UserSalons> => {
  const validatedData = userSalonsSchema.parse(data);
  await getDb().collection('userSalons').doc(userId).set(validatedData);
  return { ...validatedData, userId };
};

export const getUserSalonsAction = async (userId: string): Promise<UserSalons | null> => {
  const data = await readDoc<UserSalons>('userSalons', userId);
  return data ? { ...data, userId } : null;
};

export const updateUserSalonsAction = async (userId: string, data: Partial<UserSalons>): Promise<UserSalons> => {
  const db = getDb();
  await db.collection('userSalons').doc(userId).set(data, { merge: true });
  
  const updated = await readDoc<UserSalons>('userSalons', userId);
  if (!updated) throw new Error('Failed to update user salons');
  
  return { ...(updated as UserSalons), userId };
};

// ==========================================
// --- Действия для Приглашений (SalonInvitation) ---
// ==========================================

export const createInvitationAction = async (invitationId: string, data: Omit<SalonInvitation, 'id'>): Promise<SalonInvitation> => {
  const validatedData = salonInvitationSchema.parse(data);
  await getDb().collection('salonInvitations').doc(invitationId).set(validatedData);
  return { ...validatedData, id: invitationId };
};

export const getInvitationByIdAction = async (invitationId: string): Promise<SalonInvitation | null> => {
  const data = await readDoc<SalonInvitation>('salonInvitations', invitationId);
  return data ? { ...data, id: invitationId } : null;
};

export const updateInvitationAction = async (invitationId: string, data: Partial<SalonInvitation>): Promise<SalonInvitation> => {
  await getDb().collection('salonInvitations').doc(invitationId).set(data, { merge: true });
  const updated = await readDoc<SalonInvitation>('salonInvitations', invitationId);
  if (!updated) throw new Error('Invitation not found after update');
  return { ...(updated as SalonInvitation), id: invitationId };
};

export const deleteInvitationAction = async (invitationId: string): Promise<void> => {
  await getDb().collection('salonInvitations').doc(invitationId).delete();
};

export const getInvitationsByEmailAction = async (email: string): Promise<SalonInvitation[]> => {
  const snap = await getDb().collection('salonInvitations').where('email', '==', email).get();
  if (snap.empty) return [];
  return snap.docs.map((d) => ({ ...(d.data() as Omit<SalonInvitation, 'id'>), id: d.id }));
};

export const getInvitationsBySalonIdAction = async (salonId: string): Promise<SalonInvitation[]> => {
  const snap = await getDb().collection('salonInvitations').where('salonId', '==', salonId).get();
  if (snap.empty) return [];
  return snap.docs.map((d) => ({ ...(d.data() as Omit<SalonInvitation, 'id'>), id: d.id }));
};

export const acceptInvitationAction = async (invitationId: string, userId: string): Promise<void> => {
  const db = getDb();
  
  await db.runTransaction(async (tx: Transaction) => {
    const invitationRef = db.collection('salonInvitations').doc(invitationId);
    const invitationSnap = await tx.get(invitationRef);
    
    if (!invitationSnap.exists) throw new Error('Invitation not found.');
    const invitation = invitationSnap.data() as SalonInvitation;

    if (invitation.status !== 'pending') {
      console.log(`Приглашение ${invitationId} уже обработано. Статус: ${invitation.status}.`);
      return;
    }

    const salonRef = db.collection('salons').doc(invitation.salonId);
    const salonSnap = await tx.get(salonRef);
    if (!salonSnap.exists) throw new Error('Salon not found.');
    const salon = salonSnap.data() as Salon;

    const isAlreadyMember = (salon.members || []).some((m) => m.userId === userId);
    
    if (isAlreadyMember) {
      tx.update(invitationRef, { status: 'accepted' });
    } else {
      const userSalonsRef = db.collection('userSalons').doc(userId);
      const userSalonsSnap = await tx.get(userSalonsRef);
      
      const now = new Date().toISOString();
      const newMember: SalonMember = { userId, role: invitation.role, joinedAt: now };
      const updatedMembers = [ ...(salon.members || []), newMember ];

      const newUserSalonEntry = { salonId: invitation.salonId, role: invitation.role, joinedAt: now } as any;
      const existingUserSalons = userSalonsSnap.exists ? (userSalonsSnap.data() as UserSalons).salons || [] : [];
      const updatedUserSalonsList = [ ...existingUserSalons, newUserSalonEntry ];

      tx.update(invitationRef, { status: 'accepted' });
      tx.update(salonRef, { members: updatedMembers });
      
      if (userSalonsSnap.exists) {
        tx.update(userSalonsRef, { salons: updatedUserSalonsList });
      } else {
        tx.set(userSalonsRef, { userId, salons: updatedUserSalonsList }, { merge: true });
      }
    }
  });

  const invAfter = await readDoc<SalonInvitation>('salonInvitations', invitationId);
  if (invAfter) {
    revalidatePath(`/salons/${invAfter.salonId}`);
  }
  revalidatePath(`/profile`);
};

// ==========================================
// --- Действия для Услуг (SalonService) ---
// ==========================================

export const createSalonServiceAction = async (serviceId: string, data: Omit<SalonService, 'id'>): Promise<SalonService> => {
  const validatedData = salonServiceSchema.parse(data);
  await getDb().collection('salonServices').doc(serviceId).set(validatedData);
  revalidatePath(`/salons/${data.salonId}`);
  return { ...validatedData, id: serviceId };
};

export const getSalonServiceByIdAction = async (serviceId: string): Promise<SalonService | null> => {
  const data = await readDoc<SalonService>('salonServices', serviceId);
  return data ? { ...data, id: serviceId } : null;
};

export const updateSalonServiceAction = async (serviceId: string, data: Partial<SalonService>): Promise<SalonService> => {
  const db = getDb();
  const docRef = db.collection('salonServices').doc(serviceId);
  
  const snap = await docRef.get();
  if (!snap.exists) throw new Error("Service not found");
  
  const current = snap.data() as SalonService;
  const validatedData = salonServiceSchema.partial().parse(data);
  const updatedData = { ...current, ...validatedData };
  
  await docRef.set(updatedData, { merge: true });
  revalidatePath(`/salons/${current.salonId}`);
  return { ...updatedData, id: serviceId };
};

export const deleteSalonServiceAction = async (serviceId: string): Promise<void> => {
  const current = await readDoc<SalonService>('salonServices', serviceId);
  await getDb().collection('salonServices').doc(serviceId).delete();
  if (current) {
    revalidatePath(`/salons/${current.salonId}`);
  }
};

export const getServicesBySalonAction = async (salonId: string): Promise<SalonService[]> => {
  const snap = await getDb().collection('salonServices').where('salonId', '==', salonId).get();
  if (snap.empty) return [];
  return snap.docs.map((d) => ({ ...(d.data() as Omit<SalonService, 'id'>), id: d.id }));
};

export const getSalonServicesBySalonPaginatedAction = async (options: {
  salonId: string;
  limit: number;
  startAfterKey?: string;
}): Promise<{ services: SalonService[]; nextKey: string | null }> => {
  const { salonId, limit, startAfterKey } = options;
  const db = getDb();
  
  let q = db
    .collection('salonServices')
    .where('salonId', '==', salonId)
    .orderBy('createdAt', 'desc');

  if (startAfterKey) {
    const lastDoc = await db.collection('salonServices').doc(startAfterKey).get();
    if (lastDoc.exists) {
      const lastData = lastDoc.data() as SalonService;
      q = q.startAfter(lastData.createdAt);
    }
  }

  const snap = await q.limit(limit + 1).get();
  const docs = snap.docs;
  const hasNext = docs.length > limit;
  const pageDocs = docs.slice(0, limit);

  const services = pageDocs.map((d) => ({ ...(d.data() as Omit<SalonService, 'id'>), id: d.id }));
  const nextKey = hasNext ? docs[docs.length - 1].id : null;

  return { services, nextKey };
};

export const getSalonServicesPaginatedAction = async (options: { 
  limit: number; 
  startAfterKey?: string 
}): Promise<{ services: SalonService[]; nextKey: string | null }> => {
  const { limit, startAfterKey } = options;
  const db = getDb();
  let q = db.collection('salonServices').orderBy('createdAt', 'asc');

  if (startAfterKey) {
    const lastDoc = await db.collection('salonServices').doc(startAfterKey).get();
    if (lastDoc.exists) {
      const lastData = lastDoc.data() as SalonService;
      q = q.startAfter(lastData.createdAt);
    }
  }

  const snap = await q.limit(limit + 1).get();
  if (snap.empty) {
    return { services: [], nextKey: null };
  }

  const docs = snap.docs;
  const hasNext = docs.length > limit;
  const pageDocs = docs.slice(0, limit);
  
  const services = pageDocs.map((d) => ({ ...(d.data() as Omit<SalonService, 'id'>), id: d.id }));
  const nextKey = hasNext ? docs[docs.length - 1].id : null;
  
  return { services, nextKey };
};

export const getSalonServicesByCityPaginatedAction = async (options: {
  city: string;
  limit: number;
  startAfterKey?: string;
}): Promise<{ services: SalonService[]; nextKey: string | null }> => {
  const { city, limit, startAfterKey } = options;
  const db = getDb();
  
  let q = db.collection('salonServices')
    .where('city', '==', city)
    .orderBy('createdAt', 'desc');

  if (startAfterKey) {
    const lastDoc = await db.collection('salonServices').doc(startAfterKey).get();
    if (lastDoc.exists) {
      const lastData = lastDoc.data() as SalonService;
      q = q.startAfter(lastData.createdAt);
    }
  }

  const snap = await q.limit(limit + 1).get();
  const docs = snap.docs;
  const hasNext = docs.length > limit;
  const pageDocs = docs.slice(0, limit);
  
  const services = pageDocs.map((d) => ({ ...(d.data() as Omit<SalonService, 'id'>), id: d.id }));
  const nextKey = hasNext ? docs[docs.length - 1].id : null;
  
  return { services, nextKey };
};

// ==========================================
// --- Действия для Расписания (SalonSchedule) ---
// ==========================================

export const createSalonScheduleAction = async (salonId: string, data: SalonSchedule): Promise<SalonSchedule> => {
  const validatedData = salonScheduleSchema.parse(data);
  await getDb().collection('salonSchedules').doc(salonId).set(validatedData);
  revalidatePath(`/salons/${salonId}`);
  return validatedData;
};

export const getSalonScheduleAction = async (salonId: string): Promise<SalonSchedule | null> => {
  return await readDoc<SalonSchedule>('salonSchedules', salonId);
};

export const updateSalonScheduleAction = async (salonId: string, data: Partial<SalonSchedule>): Promise<SalonSchedule> => {
  const current = await readDoc<SalonSchedule>('salonSchedules', salonId);
  const base = current || { salonId, workDays: [], exceptions: [] };
  
  const validatedData = salonScheduleSchema.partial().parse(data);
  const updatedData = { ...base, ...validatedData } as SalonSchedule;

  await getDb().collection('salonSchedules').doc(salonId).set(updatedData, { merge: true });
  revalidatePath(`/salons/${salonId}`);
  return updatedData;
};

export const deleteSalonScheduleAction = async (salonId: string): Promise<void> => {
  await getDb().collection('salonSchedules').doc(salonId).delete();
  revalidatePath(`/salons/${salonId}`);
};

// ==========================================
// --- Действия для Исключений в Расписании ---
// ==========================================

export const addScheduleExceptionAction = async (
  salonId: string, 
  exception: SalonExceptionDay
): Promise<SalonSchedule> => {
  const validatedException = salonExceptionDaySchema.parse(exception);
  
  const current = await readDoc<SalonSchedule>('salonSchedules', salonId);
  if (!current) {
    throw new Error('Schedule not found for salon');
  }

  const exceptions = current.exceptions || [];
  const existingIndex = exceptions.findIndex(ex => ex.date === validatedException.date);
  
  if (existingIndex >= 0) {
    // Обновляем существующее исключение
    exceptions[existingIndex] = validatedException;
  } else {
    // Добавляем новое исключение
    exceptions.push(validatedException);
  }

  const updatedSchedule = {
    ...current,
    exceptions,
    updatedAt: new Date().toISOString()
  };

  await getDb().collection('salonSchedules').doc(salonId).set(updatedSchedule, { merge: true });
  revalidatePath(`/salons/${salonId}`);
  revalidatePath(`/salons/${salonId}/schedule`);
  
  return updatedSchedule;
};

export const removeScheduleExceptionAction = async (
  salonId: string, 
  date: string
): Promise<SalonSchedule> => {
  const current = await readDoc<SalonSchedule>('salonSchedules', salonId);
  if (!current || !current.exceptions) {
    throw new Error('Schedule or exceptions not found');
  }

  const filteredExceptions = current.exceptions.filter(ex => ex.date !== date);
  
  const updatedSchedule = {
    ...current,
    exceptions: filteredExceptions,
    updatedAt: new Date().toISOString()
  };

  await getDb().collection('salonSchedules').doc(salonId).set(updatedSchedule, { merge: true });
  revalidatePath(`/salons/${salonId}`);
  revalidatePath(`/salons/${salonId}/schedule`);
  
  return updatedSchedule;
};

export const getEffectiveScheduleAction = async (
  salonId: string, 
  date: string
): Promise<SalonWorkDay | null> => {
  const schedule = await readDoc<SalonSchedule>('salonSchedules', salonId);
  if (!schedule) {
    return null;
  }

  // Сначала проверяем исключения
  const exception = schedule.exceptions?.find(ex => ex.date === date);
  if (exception) {
    const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as WeekDay;
    return {
      day: dayOfWeek,
      isOpen: exception.isOpen,
      times: exception.times || []
    };
  }

  // Если нет исключения, используем еженедельное расписание
  const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as WeekDay;
  const weeklyDay = schedule.weeklySchedule.find(day => day.day === dayOfWeek);
  
  return weeklyDay || null;
};

export const getExceptionsInRangeAction = async (
  salonId: string, 
  startDate: string, 
  endDate: string
): Promise<SalonExceptionDay[]> => {
  const schedule = await readDoc<SalonSchedule>('salonSchedules', salonId);
  if (!schedule || !schedule.exceptions) {
    return [];
  }

  return schedule.exceptions.filter(exception => 
    exception.date >= startDate && exception.date <= endDate
  );
};

export const getScheduleForDateRangeAction = async (
  salonId: string, 
  startDate: string, 
  endDate: string
): Promise<Array<{ date: string; schedule: SalonWorkDay | null }>> => {
  const schedule = await readDoc<SalonSchedule>('salonSchedules', salonId);
  if (!schedule) {
    return [];
  }

  const result: Array<{ date: string; schedule: SalonWorkDay | null }> = [];
  let currentDate = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const daySchedule = await getEffectiveScheduleAction(salonId, dateStr);
    result.push({ date: dateStr, schedule: daySchedule });
    
    // Переходим к следующему дню
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
};

export const addMultipleExceptionsAction = async (
  salonId: string, 
  exceptions: SalonExceptionDay[]
): Promise<SalonSchedule> => {
  const validatedExceptions = exceptions.map(ex => salonExceptionDaySchema.parse(ex));
  
  const current = await readDoc<SalonSchedule>('salonSchedules', salonId);
  if (!current) {
    throw new Error('Schedule not found for salon');
  }

  const existingExceptions = current.exceptions || [];
  const mergedExceptions = [...existingExceptions];

  // Добавляем или обновляем исключения
  validatedExceptions.forEach(newException => {
    const existingIndex = mergedExceptions.findIndex(ex => ex.date === newException.date);
    if (existingIndex >= 0) {
      mergedExceptions[existingIndex] = newException;
    } else {
      mergedExceptions.push(newException);
    }
  });

  // Сортируем по дате
  mergedExceptions.sort((a, b) => a.date.localeCompare(b.date));

  const updatedSchedule = {
    ...current,
    exceptions: mergedExceptions,
    updatedAt: new Date().toISOString()
  };

  await getDb().collection('salonSchedules').doc(salonId).set(updatedSchedule, { merge: true });
  revalidatePath(`/salons/${salonId}`);
  revalidatePath(`/salons/${salonId}/schedule`);
  
  return updatedSchedule;
};

// ==========================================
// --- Сложные запросы (Пагинация Салонов) ---
// ==========================================

export const getSalonsByCityPaginatedAction = async (options: {
  city: string;
  limit: number;
  startAfterKey?: string;
}): Promise<{ salons: Salon[]; nextKey: string | null }> => {
  const { city, limit, startAfterKey } = options;
  const db = getDb();
  
  let q = db.collection('salons')
    .where('city', '==', city)
    .orderBy('name', 'asc');

  if (startAfterKey) {
    const lastDoc = await db.collection('salons').doc(startAfterKey).get();
    if (lastDoc.exists) {
      const lastData = lastDoc.data() as Salon;
      q = q.startAfter(lastData.name);
    }
  }

  const snap = await q.limit(limit + 1).get();
  const docs = snap.docs;
  const hasNext = docs.length > limit;
  const pageDocs = docs.slice(0, limit);
  
  const salons = pageDocs.map((d) => ({ ...(d.data() as Omit<Salon, 'id'>), id: d.id }));
  const nextKey = hasNext ? docs[docs.length - 1].id : null;
  
  return { salons, nextKey };
};

// ==========================================
// --- ПОЛУЧЕНИЕ АВАТАРА (СЕРВЕРНАЯ ЛОГИКА) ---
// ==========================================

/**
 * Получает аватар салона напрямую через Google Cloud Storage (Admin SDK).
 * Генерирует свежий Signed URL, чтобы избежать ошибки ExpiredToken.
 */
export const getSalonAvatarAction = async (salonId: string) => {
  try {
    const storage = getStorage();
    
    // Определяем имя бакета. Обычно это PROJECT_ID.appspot.com или из переменной окружения
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_ADMIN_PROJECT_ID}.appspot.com`;
    const bucket = storage.bucket(bucketName);
    
    const prefix = `salonAvatars/${salonId}/`;

    // Получаем список файлов в папке
    const [files] = await bucket.getFiles({ prefix });

    if (files.length === 0) {
      return null;
    }

    // Берем первый файл (предполагаем, что аватар один)
    const file = files[0];

    // Генерируем подписанную ссылку, действительную 2 часа
    // Это решает проблему с протухшими токенами
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 2, // 2 часа
    });

    return {
      url,
      storagePath: file.name,
      salonId
    };

  } catch (error) {
    console.error('Error getting salon avatar on server:', error);
    return null;
  }
};