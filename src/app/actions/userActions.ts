'use server';

import { Firestore, Settings } from '@google-cloud/firestore';
import { userSchema } from '@/lib/firebase/schemas';
import type { User } from '@/types/database';

// Глобальная переменная для кэширования инстанса в dev-режиме (Next.js hot reload)
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
    const docRef = getDb().collection(collection).doc(id);
    const snap = await docRef.get();
    return snap.exists ? (snap.data() as T) : null;
  } catch (err: any) {
    if (err && (err.code === 5 || err.code === 'not-found')) {
      return null;
    }
    throw err;
  }
};

export async function createUserAction(userId: string, data: Omit<User, 'id'>) {
  const validated = userSchema.parse(data);
  try {
    await getDb().collection('users').doc(userId).set(validated);
  } catch (err: any) {
    console.error('Error creating user:', err);
    throw new Error('Failed to create user in Firestore.');
  }
  return { ...validated, id: userId } as User;
}

export async function readUserAction(userId: string) {
  try {
    const data = await readOperation<User>('users', userId);
    return data ? { ...data, id: userId } : null;
  } catch (err: any) {
    console.error('Error reading user:', err);
    return null;
  }
}

export async function updateUserAction(userId: string, data: Partial<User>) {
  const db = getDb();
  const docRef = db.collection('users').doc(userId);
  
  const snap = await docRef.get();
  
  if (!snap.exists) {
    throw new Error('User not found');
  }

  const current = snap.data() as User;
  const validated = userSchema.partial().parse(data);
  const updated = { ...current, ...validated };

  await docRef.set(updated, { merge: true });
  
  return { ...updated, id: userId } as User;
}

export async function deleteUserAction(userId: string) {
  await getDb().collection('users').doc(userId).delete();
}

export async function listUsersAction(): Promise<(User & { id: string })[]> {
  const snap = await getDb().collection('users').get();
  if (snap.empty) return [];
  
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<User, 'id'>),
  } as User & { id: string }));
}

export async function getUserByEmailAction(email: string) {
  const snap = await getDb()
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snap.empty) return null;
  
  const d = snap.docs[0];
  return { userId: d.id, ...(d.data() as User) };
}

export async function getUserByIdAction(userId: string) {
  const d = await getDb().collection('users').doc(userId).get();
  return d.exists ? (d.data() as User) : null;
}