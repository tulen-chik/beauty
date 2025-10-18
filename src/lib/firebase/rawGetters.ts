import { get, ref, orderByKey, limitToFirst, startAt, query } from 'firebase/database';

import { db } from './init';
import { SalonService } from '@/types/services';

export const getAllSalonInvitations = async () => {
  const snapshot = await get(ref(db, 'salonInvitations'));
  return snapshot.exists() ? snapshot.val() : {};
};

export const getAllServiceCategories = async () => {
  const snapshot = await get(ref(db, 'serviceCategories'));
  return snapshot.exists() ? snapshot.val() : {};
};

export const getAllSalons = async () => {
  const snapshot = await get(ref(db, 'salons'));
  return snapshot.exists() ? snapshot.val() : {};
};

