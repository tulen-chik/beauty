import type { User } from '@/types/database';
import { userSchema } from './schemas';
import { createOperation, readOperation, updateOperation, deleteOperation } from './crud';
import { db } from './init';
import { equalTo, get, orderByChild, query, ref } from 'firebase/database';

export const userOperations = {
  create: (userId: string, data: Omit<User, 'id'>) =>
    createOperation(`users/${userId}`, data, userSchema),
  read: (userId: string) => readOperation<User>(`users/${userId}`),
  update: (userId: string, data: Partial<User>) =>
    updateOperation(`users/${userId}`, data, userSchema),
  delete: (userId: string) => deleteOperation(`users/${userId}`),
  list: async (): Promise<(User & { id: string })[]> => {
    const snapshot = await get(ref(db, 'users'));
    if (!snapshot.exists()) return [];
    const raw = snapshot.val() as Record<string, Omit<User, 'id'>>;
    return Object.entries(raw).map(([id, u]) => ({ id, ...(u as any) }));
  },
  getByEmail: async (email: string) => {
    const usersRef = query(ref(db, 'users'), orderByChild('email'), equalTo(email));
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return null;
    const [userId, userData] = Object.entries(snapshot.val())[0];
    return { userId, ...(userData as User) };
  },
  getById: async (userId: string) => {
    const snapshot = await get(ref(db, `users/${userId}`));
    return snapshot.exists() ? (snapshot.val() as User) : null;
  }
};
