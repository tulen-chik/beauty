// ИЗМЕНЕНО: Импортируем Firestore и Settings для прямого подключения
import { Firestore, Settings, FieldValue } from '@google-cloud/firestore';
import { NextResponse } from 'next/server';
import { User } from '@/types/database';

// Оставляем getAdminAuth для управления пользователями в Firebase Authentication
import { getAdminAuth } from '@/lib/firebase/admin';

// --- ИНИЦИАЛИЗАЦИЯ КЛИЕНТА FIRESTORE (КАК В ПРИМЕРЕ) ---

let firestoreInstance: Firestore | null = null;

/**
 * Инициализирует и возвращает экземпляр Firestore, используя
 * учетные данные из переменных окружения.
 */
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
// --- ЭНДПОИНТ ДЛЯ СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ ---

export async function POST(request: Request) {
  try {
    // 1. Парсинг тела запроса
    const userData = await request.json();

    // 2. Валидация обязательных полей
    if (!userData.email || !userData.password || !userData.displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }

    // 3. Получение экземпляров Firebase Admin Auth и Firestore
    const auth = getAdminAuth();
    // ИЗМЕНЕНО: Получаем экземпляр Firestore через новую функцию getDb()
    const db = getDb();

    // 4. Проверка, существует ли пользователь с таким email
    try {
      await auth.getUserByEmail(userData.email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    } catch (error: any) {
      // Ошибка 'auth/user-not-found' ожидаема, продолжаем создание
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // 5. Создание пользователя в Firebase Authentication
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      phoneNumber: userData.phone || '',
      emailVerified: true,
      disabled: false,
    });

    // 6. Установка кастомных прав (роли)
    await auth.setCustomUserClaims(userRecord.uid, {
      role: userData.role || 'user',
    });

    // 7. Формирование полного профиля пользователя для Firestore
    const userProfile: Omit<User, 'id'> = {
          email: userData.email,
          displayName: userData.displayName,
          avatarUrl: '',
          avatarStoragePath: '',
          createdAt: new Date().toISOString(),
          role: userData.role || 'user',
          settings: {
            language: 'en',
            notifications: true,
          },
        };

    // 8. Сохранение профиля в Firestore с обработкой ошибок
    try {
      // Создаем запись пользователя в коллекции 'users' с ID равным uid
      await db.collection('users').doc(userRecord.uid).set(userProfile);
      console.log('User profile created successfully in Firestore:', userRecord.uid);
    } catch (dbError) {
      console.error('Firestore error:', dbError);
      // Если не удалось сохранить профиль в БД, пытаемся удалить созданного пользователя из Auth
      try {
        await auth.deleteUser(userRecord.uid);
        console.log('Cleaned up auth user due to Firestore failure:', userRecord.uid);
      } catch (deleteError) {
        console.error('CRITICAL: Failed to clean up auth user after DB error:', deleteError);
      }
      // Пробрасываем ошибку дальше
      throw new Error(`Failed to create user profile: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

    // 9. Возвращаем успешный ответ с данными созданного пользователя
    const { password, ...userDataWithoutPassword } = userData;
    return NextResponse.json(
      {
        id: userRecord.uid,
        ...userDataWithoutPassword,
        createdAt: new Date().toISOString(), // Возвращаем ISO строку для клиента
      },
      { status: 201 }
    );

  } catch (error: any) {
    // 10. Обработка общих ошибок
    console.error('Error in create-user API:', error);

    // Обработка специфичных ошибок Firebase Auth
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password should be at least 6 characters' },
        { status: 400 }
      );
    }

    // Ответ по умолчанию для всех остальных ошибок
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Экспорт для динамического рендеринга
export const dynamic = 'force-dynamic';