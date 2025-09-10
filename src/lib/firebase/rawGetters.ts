import { db } from './init';
import { get, ref } from 'firebase/database';

export const getAllSalonInvitations = async () => {
  const snapshot = await get(ref(db, 'salonInvitations'));
  return snapshot.exists() ? snapshot.val() : {};
};

export const getAllServiceCategories = async () => {
  const snapshot = await get(ref(db, 'serviceCategories'));
  return snapshot.exists() ? snapshot.val() : {};
};

export const getAllSalonServices = async () => {
  const snapshot = await get(ref(db, 'salonServices'));
  return snapshot.exists() ? snapshot.val() : {};
};

export const getAllSalons = async () => {
  const snapshot = await get(ref(db, 'salons'));
  return snapshot.exists() ? snapshot.val() : {};
};
