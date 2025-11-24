'use server';

import { Firestore, Settings, Transaction } from '@google-cloud/firestore';
import { revalidatePath } from 'next/cache';

// Импортируем схемы и типы
import {
  salonSchema,
  userSalonsSchema,
  salonInvitationSchema,
  salonServiceSchema,
  salonScheduleSchema,
} from '@/lib/firebase/schemas';

import type {
  Salon,
  SalonInvitation,
  SalonMember,
  SalonSchedule,
  SalonService,
  UserSalons,
} from '@/types/database';

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
      ignoreUndefinedProperties: true, // Важно для записи объектов с необязательными полями
    };

    firestoreInstance = new Firestore(firestoreSettings);
  }
  return firestoreInstance;
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
  // Если документ не найден после обновления (крайне маловероятно при merge), возвращаем то, что есть
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

/**
 * Принимает приглашение в салон (Атомарная операция через runTransaction).
 */
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
        // Если документа userSalons нет, создаем его
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

/**
 * Получает услуги с постраничной загрузкой
 */
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

/**
 * Получает услуги по городу с пагинацией
 */
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
// --- Сложные запросы (Пагинация Салонов) ---
// ==========================================

/**
 * Получает салоны в указанном городе с постраничной загрузкой.
 */
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