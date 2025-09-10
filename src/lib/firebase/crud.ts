import { db } from './init';
import { get, ref, remove, set, update } from 'firebase/database';

// Base CRUD helpers used across firebase modules
export const createOperation = async <T>(
  path: string,
  data: Omit<T, 'id'>,
  schema: any
) => {
  const validatedData = schema.parse(data);
  const newRef = ref(db, path);
  await set(newRef, validatedData);
  return validatedData as T;
};

export const readOperation = async <T>(path: string): Promise<T | null> => {
  const snapshot = await get(ref(db, path));
  return snapshot.exists() ? (snapshot.val() as T) : null;
};

export const updateOperation = async <T>(path: string, data: Partial<T>, schema: any) => {
  const current = (await readOperation<T>(path)) as T | null;
  const validatedData = schema.parse({ ...(current as any), ...data });
  await update(ref(db, path), validatedData);
  return validatedData as T;
};

export const deleteOperation = async (path: string) => {
  await remove(ref(db, path));
};
