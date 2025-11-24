'use server';

import { Firestore, Settings } from '@google-cloud/firestore';
import type { ServiceCategory } from '@/types/database';
import { serviceCategorySchema } from '@/lib/firebase/schemas';

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

const readOperation = async <T>(collection: string, id: string): Promise<T | null> => {
  try {
    const snap = await getDb().collection(collection).doc(id).get();
    return snap.exists ? (snap.data() as T) : null;
  } catch (err: any) {
    if (err && (err.code === 5 || err.code === 'not-found')) return null;
    throw err;
  }
};

// --- Отдельные экспорты вместо объекта ---

export async function createServiceCategoryAction(categoryId: string, data: Omit<ServiceCategory, 'id'>) {
  const validated = serviceCategorySchema.parse(data);
  await getDb().collection('serviceCategories').doc(categoryId).set(validated);
  return { ...validated, id: categoryId } as ServiceCategory;
}

export async function readServiceCategoryAction(categoryId: string) {
  const data = await readOperation<ServiceCategory>('serviceCategories', categoryId);
  return data ? { ...data, id: categoryId } : null;
}

export async function updateServiceCategoryAction(categoryId: string, data: Partial<ServiceCategory>) {
  const current = await readOperation<ServiceCategory>('serviceCategories', categoryId);
  if (!current) throw new Error('Service category not found');
  
  const validated = serviceCategorySchema.partial().parse(data);
  const updated = { ...current, ...validated };
  
  await getDb().collection('serviceCategories').doc(categoryId).set(updated, { merge: true });
  return { ...updated, id: categoryId } as ServiceCategory;
}

export async function deleteServiceCategoryAction(categoryId: string) {
  await getDb().collection('serviceCategories').doc(categoryId).delete();
}

export async function getServiceCategoriesBySalonIdAction(salonId: string): Promise<ServiceCategory[]> {
  const snap = await getDb().collection('serviceCategories').where('salonId', '==', salonId).get();
  if (snap.empty) return [];
  return snap.docs.map((d) => ({ ...(d.data() as Omit<ServiceCategory, 'id'>), id: d.id }));
}

export async function getRandomServiceCategoriesAction(limit: number = 15): Promise<ServiceCategory[]> {
  const snap = await getDb().collection('serviceCategories').get();
  if (snap.empty) return [];
  
  const allCategories: ServiceCategory[] = snap.docs.map((d) => ({ 
    ...(d.data() as Omit<ServiceCategory, 'id'>), 
    id: d.id 
  }));

  // Перемешивание (Fisher-Yates)
  for (let i = allCategories.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCategories[i], allCategories[j]] = [allCategories[j], allCategories[i]];
  }
  
  return allCategories.slice(0, limit);
}