'use server';

import nodemailer from 'nodemailer';
import { Firestore, Settings } from '@google-cloud/firestore';
import type { User } from '@/types/user';

let transporter: nodemailer.Transporter | null = null;
let firestoreInstance: Firestore | null = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('[email] SMTP credentials are missing. Emails will not be sent.');
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }
  return transporter!;
}

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

export async function sendEmail(options: {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
}) {
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@example.com';
  const fromName = process.env.SMTP_FROM_NAME || 'Charming.by';

  try {
    const tx = getTransporter();
    if (!options.to?.length) {
      console.warn('[email] No recipients provided, skipping send.');
      return;
    }

    await tx.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: options.to.join(', '),
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  } catch (err) {
    console.error('[email] Failed to send email:', err);
  }
}

export async function resolveRecipientEmails(salonId: string, employeeId?: string, customerUserId?: string): Promise<string[]> {
  const db = getDb();
  try {
    if (!salonId || typeof salonId !== 'string') {
      return [];
    }
    
    // Если запрашиваем email конкретного клиента (когда салон создает чат)
    if (customerUserId && !employeeId) {
      const userDoc = await db.collection('users').doc(customerUserId).get();
      if (userDoc.exists) {
        const user = userDoc.data() as User;
        if (user?.email && typeof user.email === 'string' && user.email.includes('@')) {
          return [user.email];
        }
      }
      return [];
    }
    
    // Иначе ищем email среди членов салона
    const salonSnap = await db.collection('salons').doc(salonId).get();
    if (!salonSnap.exists) return [];
    
    const salon = salonSnap.data() as { members?: Array<{ userId: string }> } | undefined;
    const members = salon?.members || [];

    const targetUserIds = employeeId
      ? members.filter((m) => m.userId === employeeId).map((m) => m.userId)
      : members.map((m) => m.userId);

    if (targetUserIds.length === 0) return [];

    // Получаем email пользователей
    const userDocs = await Promise.all(
      targetUserIds.map((uid) => {
        if (!uid || typeof uid !== 'string') return null;
        return db.collection('users').doc(uid).get();
      })
    );

    const emails: string[] = [];
    for (const d of userDocs) {
      if (d && d.exists) {
        const u = d.data() as User;
        if (u?.email && typeof u.email === 'string' && u.email.includes('@')) {
          emails.push(u.email);
        }
      }
    }

    // Убираем дубликаты и пустые
    return Array.from(new Set(emails.filter(Boolean)));
  } catch (err) {
    console.error('[email] resolveRecipientEmails error:', err);
    return [];
  }
}
