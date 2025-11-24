'use server';

import * as admin from 'firebase-admin';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import { Firestore, Settings } from '@google-cloud/firestore';

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

function ensureAdmin() {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName || !bucketName.trim()) {
      throw new Error('FIREBASE_STORAGE_BUCKET is not set. Please set it to your storage bucket name, e.g. "<project-id>.appspot.com".');
    }
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: bucketName });
  }
}

const getBucket = () => {
  ensureAdmin();
  const storage = getAdminStorage();
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName || !bucketName.trim()) {
    throw new Error('FIREBASE_STORAGE_BUCKET is not set.');
  }
  return storage.bucket(bucketName);
};

const bufferFromFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

// Service images
export const uploadServiceImageAction = async (serviceId: string, file: File) => {
  const bucket = getBucket();
  const id = `${Date.now()}-${file.name}`;
  const path = `serviceImages/${serviceId}/${id}`;
  const buffer = await bufferFromFile(file);
  await bucket.file(path).save(buffer, { resumable: false, contentType: (file as any).type });
  const [url] = await bucket.file(path).getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  const uploadedAt = new Date().toISOString();
  await getDb().collection('serviceImages').doc(id).set({ id, serviceId, url, storagePath: path, uploadedAt });
  return { id, serviceId, url, storagePath: path, uploadedAt };
};

export const deleteServiceImageAction = async (storagePath: string) => {
  const bucket = getBucket();
  await bucket.file(storagePath).delete({ ignoreNotFound: true });
  const snap = await getDb().collection('serviceImages').where('storagePath', '==', storagePath).get();
  if (!snap.empty) {
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }
};

export const getServiceImagesAction = async (serviceId: string) => {
  const bucket = getBucket();
  const [files] = await bucket.getFiles({ prefix: `serviceImages/${serviceId}/` });
  const results = await Promise.all(files.map(async (file) => {
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    return { id: file.name.split('/').pop()!, serviceId, url, storagePath: file.name, uploadedAt: '' };
  }));
  return results;
};

// Blog images
export const uploadBlogImageAction = async (postId: string, file: File) => {
  const bucket = getBucket();
  const id = `${Date.now()}-${file.name}`;
  const path = `blog/images/${postId}/${id}`;
  const buffer = await bufferFromFile(file);
  await bucket.file(path).save(buffer, { resumable: false, contentType: (file as any).type });
  const [url] = await bucket.file(path).getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  const uploadedAt = new Date().toISOString();
  await getDb().collection('blogImages').doc(id).set({ id, postId, url, storagePath: path, uploadedAt });
  return { id, postId, url, storagePath: path, uploadedAt };
};

export const deleteBlogImageAction = async (storagePath: string) => {
  const bucket = getBucket();
  await bucket.file(storagePath).delete({ ignoreNotFound: true });
  const snap = await getDb().collection('blogImages').where('storagePath', '==', storagePath).get();
  if (!snap.empty) {
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }
};

// User avatars
export const uploadUserAvatarAction = async (userId: string, file: File) => {
  const bucket = getBucket();
  const id = `${Date.now()}-${file.name}`;
  const path = `userAvatars/${userId}/${id}`;
  const buffer = await bufferFromFile(file);
  await bucket.file(path).save(buffer, { resumable: false, contentType: (file as any).type });
  const [url] = await bucket.file(path).getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  const uploadedAt = new Date().toISOString();
  await getDb().collection('userAvatars').doc(id).set({ id, userId, url, storagePath: path, uploadedAt });
  return { id, userId, url, storagePath: path, uploadedAt };
};

export const deleteUserAvatarAction = async (storagePath: string) => {
  if (!storagePath) return;
  const bucket = getBucket();
  await bucket.file(storagePath).delete({ ignoreNotFound: true });
  const snap = await getDb().collection('userAvatars').where('storagePath', '==', storagePath).get();
  if (!snap.empty) {
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }
};

export const getUserAvatarAction = async (userId: string) => {
  const bucket = getBucket();
  const [files] = await bucket.getFiles({ prefix: `userAvatars/${userId}/` });
  if (files.length > 0) {
    const file = files[0];
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    return { id: file.name.split('/').pop()!, userId, url, storagePath: file.name };
  }
  return null;
};

// Salon avatars
export const uploadSalonAvatarAction = async (salonId: string, file: File) => {
  const bucket = getBucket();
  const id = `${Date.now()}-${file.name}`;
  const path = `salonAvatars/${salonId}/${id}`;
  const buffer = await bufferFromFile(file);
  await bucket.file(path).save(buffer, { resumable: false, contentType: (file as any).type });
  const [url] = await bucket.file(path).getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  const uploadedAt = new Date().toISOString();
  await getDb().collection('salonAvatars').doc(id).set({ id, salonId, url, storagePath: path, uploadedAt });
  return { id, salonId, url, storagePath: path, uploadedAt };
};

export const deleteSalonAvatarAction = async (storagePath: string) => {
  if (!storagePath) return;
  const bucket = getBucket();
  await bucket.file(storagePath).delete({ ignoreNotFound: true });
  const snap = await getDb().collection('salonAvatars').where('storagePath', '==', storagePath).get();
  if (!snap.empty) {
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }
};
