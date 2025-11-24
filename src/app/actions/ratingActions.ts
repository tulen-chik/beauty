'use server';

import { Firestore, Settings } from '@google-cloud/firestore';
import { revalidatePath } from 'next/cache';

import {
  salonRatingHelpfulSchema,
  salonRatingResponseSchema,
  salonRatingSchema,
} from '@/lib/firebase/schemas';

import type {
  SalonRating,
  SalonRatingHelpful,
  SalonRatingResponse,
  SalonRatingStats,
} from '@/types/database';

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
// --- Действия для Рейтингов (SalonRating) ---
// ==========================================

export async function createSalonRatingAction(ratingId: string, data: Omit<SalonRating, 'id'>) {
  const validated = salonRatingSchema.parse(data);
  await getDb().collection('salonRatings').doc(ratingId).set(validated);
  revalidatePath(`/salons/${validated.salonId}`);
  return { ...validated, id: ratingId } as SalonRating;
}

export async function readSalonRatingAction(ratingId: string) {
  const data = await readDoc<SalonRating>('salonRatings', ratingId);
  return data ? { ...data, id: ratingId } : null;
}

export async function updateSalonRatingAction(ratingId: string, data: Partial<SalonRating>) {
  const db = getDb();
  const docRef = db.collection('salonRatings').doc(ratingId);
  
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('Rating not found');
  
  const current = snap.data() as SalonRating;
  const validated = salonRatingSchema.partial().parse(data);
  
  const updated = { 
    ...current, 
    ...validated, 
    updatedAt: new Date().toISOString() 
  };
  
  await docRef.set(updated, { merge: true });
  revalidatePath(`/salons/${current.salonId}`);
  return { ...updated, id: ratingId } as SalonRating;
}

export async function deleteSalonRatingAction(ratingId: string) {
  const current = await readDoc<SalonRating>('salonRatings', ratingId);
  await getDb().collection('salonRatings').doc(ratingId).delete();
  if (current) revalidatePath(`/salons/${current.salonId}`);
}

export async function getSalonRatingsBySalonAction(salonId: string): Promise<SalonRating[]> {
  const snap = await getDb()
    .collection('salonRatings')
    .where('salonId', '==', salonId)
    .get();

  if (snap.empty) return [];
  
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<SalonRating, 'id'>), id: d.id }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAverageSalonRatingAction(salonId: string): Promise<number> {
  const ratings = await getSalonRatingsBySalonAction(salonId);
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, r) => sum + r.rating, 0);
  return total / ratings.length;
}

export async function getSalonRatingStatsAction(salonId: string): Promise<SalonRatingStats> {
  const ratings = await getSalonRatingsBySalonAction(salonId);
  const approved = ratings.filter((r) => r.status === 'approved');
  
  const totalRatings = approved.length;
  const averageRating = totalRatings > 0 ? approved.reduce((s, r) => s + r.rating, 0) / totalRatings : 0;
  
  const ratingDistribution: SalonRatingStats['ratingDistribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  approved.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) ratingDistribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
  });

  let categoryAverages: SalonRatingStats['categoryAverages'] | undefined;
  if (approved.some((r) => r.categories)) {
    const categories = ['service', 'cleanliness', 'atmosphere', 'staff', 'value'] as const;
    const ca: NonNullable<SalonRatingStats['categoryAverages']> = {} as any;
    
    categories.forEach((c) => {
      const vals = approved
        .filter((r) => r.categories && r.categories[c])
        .map((r) => r.categories![c]!);
      if (vals.length) ca[c] = vals.reduce((s, v) => s + v, 0) / vals.length;
    });
    
    if (Object.keys(ca).length) {
      categoryAverages = ca;
    }
  }
  return { averageRating, totalRatings, ratingDistribution, categoryAverages } as SalonRatingStats;
}

export async function getSalonRatingsByCustomerAction(customerUserId: string): Promise<SalonRating[]> {
  const snap = await getDb()
    .collection('salonRatings')
    .where('customerUserId', '==', customerUserId)
    .get();

  if (snap.empty) return [];
  
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<SalonRating, 'id'>), id: d.id }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getSalonRatingByAppointmentAction(appointmentId: string): Promise<SalonRating | null> {
  const snap = await getDb()
    .collection('salonRatings')
    .where('appointmentId', '==', appointmentId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...(d.data() as Omit<SalonRating, 'id'>), id: d.id } as SalonRating;
}

export async function approveSalonRatingAction(ratingId: string): Promise<void> {
  const now = new Date().toISOString();
  await getDb().collection('salonRatings').doc(ratingId).set({ 
    status: 'approved', 
    approvedAt: now, 
    updatedAt: now 
  }, { merge: true });
}

export async function rejectSalonRatingAction(ratingId: string, reason: string): Promise<void> {
  const now = new Date().toISOString();
  await getDb().collection('salonRatings').doc(ratingId).set({ 
    status: 'rejected', 
    rejectedAt: now, 
    rejectedReason: reason, 
    updatedAt: now 
  }, { merge: true });
}

export async function markSalonRatingAsVerifiedAction(ratingId: string): Promise<void> {
  const now = new Date().toISOString();
  await getDb().collection('salonRatings').doc(ratingId).set({ 
    isVerified: true, 
    updatedAt: now 
  }, { merge: true });
}

// ==========================================
// --- Действия для Ответов (SalonRatingResponse) ---
// ==========================================

export async function createSalonRatingResponseAction(responseId: string, data: Omit<SalonRatingResponse, 'id'>) {
  const validated = salonRatingResponseSchema.parse(data);
  await getDb().collection('salonRatingResponses').doc(responseId).set(validated);
  return { ...validated, id: responseId } as SalonRatingResponse;
}

export async function readSalonRatingResponseAction(responseId: string) {
  const data = await readDoc<SalonRatingResponse>('salonRatingResponses', responseId);
  return data ? { ...data, id: responseId } : null;
}

export async function updateSalonRatingResponseAction(responseId: string, data: Partial<SalonRatingResponse>) {
  const db = getDb();
  const docRef = db.collection('salonRatingResponses').doc(responseId);
  
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('Rating response not found');
  
  const current = snap.data() as SalonRatingResponse;
  const validated = salonRatingResponseSchema.partial().parse(data);
  const updated = { ...current, ...validated };
  
  await docRef.set(updated, { merge: true });
  return { ...updated, id: responseId } as SalonRatingResponse;
}

export async function deleteSalonRatingResponseAction(responseId: string) {
  await getDb().collection('salonRatingResponses').doc(responseId).delete();
}

export async function getSalonRatingResponsesByRatingAction(ratingId: string): Promise<SalonRatingResponse[]> {
  const snap = await getDb()
    .collection('salonRatingResponses')
    .where('ratingId', '==', ratingId)
    .get();

  if (snap.empty) return [];
  
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<SalonRatingResponse, 'id'>), id: d.id }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ==========================================
// --- Действия для Полезности (SalonRatingHelpful) ---
// ==========================================

export async function addSalonRatingHelpfulVoteAction(ratingId: string, userId: string, isHelpful: boolean) {
  const helpfulId = `${ratingId}_${userId}`;
  const data: Omit<SalonRatingHelpful, 'id'> = {
    ratingId,
    userId,
    isHelpful,
    createdAt: new Date().toISOString(),
  };
  const validated = salonRatingHelpfulSchema.parse(data);
  await getDb().collection('salonRatingHelpfuls').doc(helpfulId).set(validated);
}

export async function removeSalonRatingHelpfulVoteAction(ratingId: string, userId: string) {
  const helpfulId = `${ratingId}_${userId}`;
  await getDb().collection('salonRatingHelpfuls').doc(helpfulId).delete();
}

export async function updateSalonRatingHelpfulVoteAction(ratingId: string, userId: string, isHelpful: boolean) {
  const helpfulId = `${ratingId}_${userId}`;
  const data: Partial<SalonRatingHelpful> = { 
    isHelpful, 
    createdAt: new Date().toISOString() 
  };
  await getDb().collection('salonRatingHelpfuls').doc(helpfulId).set(data, { merge: true });
}

export async function getSalonRatingHelpfulVotesByRatingAction(ratingId: string): Promise<SalonRatingHelpful[]> {
  const snap = await getDb()
    .collection('salonRatingHelpfuls')
    .where('ratingId', '==', ratingId)
    .get();

  if (snap.empty) return [];
  return snap.docs.map((d) => ({ ...(d.data() as Omit<SalonRatingHelpful, 'id'>), id: d.id }));
}

export async function getSalonRatingHelpfulStatsAction(ratingId: string): Promise<{ helpful: number; notHelpful: number }> {
  const helpfuls = await getSalonRatingHelpfulVotesByRatingAction(ratingId);
  const helpful = helpfuls.filter((h) => h.isHelpful).length;
  const notHelpful = helpfuls.filter((h) => !h.isHelpful).length;
  return { helpful, notHelpful };
}

export async function hasUserVotedOnSalonRatingAction(ratingId: string, userId: string): Promise<SalonRatingHelpful | null> {
  const helpfulId = `${ratingId}_${userId}`;
  const d = await getDb().collection('salonRatingHelpfuls').doc(helpfulId).get();
  return d.exists ? ({ ...(d.data() as Omit<SalonRatingHelpful, 'id'>), id: helpfulId } as SalonRatingHelpful) : null;
}

export async function toggleSalonRatingHelpfulVoteAction(ratingId: string, userId: string, isHelpful: boolean): Promise<void> {
  const existing = await hasUserVotedOnSalonRatingAction(ratingId, userId);
  if (existing) {
    if (existing.isHelpful === isHelpful) {
      await removeSalonRatingHelpfulVoteAction(ratingId, userId);
    } else {
      await updateSalonRatingHelpfulVoteAction(ratingId, userId, isHelpful);
    }
  } else {
    await addSalonRatingHelpfulVoteAction(ratingId, userId, isHelpful);
  }
}