import * as admin from 'firebase-admin';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import { NextResponse } from 'next/server';

function ensureAdmin() {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    } as any;
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName || !bucketName.trim()) {
      throw new Error('FIREBASE_STORAGE_BUCKET is not set.');
    }
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: bucketName });
  }
}

function getBucket() {
  ensureAdmin();
  const storage = getAdminStorage();
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName || !bucketName.trim()) {
    throw new Error('FIREBASE_STORAGE_BUCKET is not set.');
  }
  return storage.bucket(bucketName);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const salonId = (form.get('salonId') as string | null) || '';

    if (!file || !salonId) {
      return NextResponse.json({ error: 'Missing file or salonId' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = `${Date.now()}-${file.name}`;
    const path = `salonAvatars/${salonId}/${id}`;

    const bucket = getBucket();
    await bucket.file(path).save(buffer, { resumable: false, contentType: (file as any).type });
    const [url] = await bucket.file(path).getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });

    return NextResponse.json({ url, storagePath: path });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
