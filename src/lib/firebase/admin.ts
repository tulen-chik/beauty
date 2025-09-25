import { App, cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
// ИЗМЕНЕНО: Импортируем getDatabase вместо getFirestore
import { getDatabase } from 'firebase-admin/database';

// Инициализация Firebase Admin
function initializeFirebaseAdmin() {
  const apps = getApps();
  
  if (apps.length > 0) {
    return {
      app: apps[0],
      auth: getAuth(apps[0]),
      // ИЗМЕНЕНО: Получаем экземпляр Realtime Database
      database: getDatabase(apps[0])
    };
  }

  // Проверяем наличие необходимых переменных окружения
  const useDefaultCredentials = process.env.NODE_ENV === 'production' && 
                             process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!useDefaultCredentials && (
    !process.env.FIREBASE_ADMIN_PROJECT_ID || 
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY
  )) {
    throw new Error('Missing Firebase Admin environment variables');
  }

  const app = initializeApp({
    credential: useDefaultCredentials 
      ? applicationDefault()
      : cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    // ИЗМЕНЕНО: Указываем URL для Realtime Database
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });

  // Инициализируем Realtime Database
  const database = getDatabase(app);
  const auth = getAuth(app);

  return {
    app,
    auth,
    database,
  };
}

// Получение экземпляра аутентификации
export function getAdminAuth() {
  const { auth } = initializeFirebaseAdmin();
  return auth;
}

// ИЗМЕНЕНО: Функция для получения экземпляра Realtime Database
export function getAdminDatabase() {
  const { database } = initializeFirebaseAdmin();
  return database;
}

// Вспомогательная функция для проверки роли пользователя (без изменений)
export async function hasUserRole(uid: string, role: string): Promise<boolean> {
  try {
    const auth = getAdminAuth();
    const user = await auth.getUser(uid);
    return user.customClaims?.role === role;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}