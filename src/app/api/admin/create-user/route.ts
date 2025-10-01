// ИЗМЕНЕНО: Импортируем ServerValue для временных меток Realtime Database
import { ServerValue } from 'firebase-admin/database';
import { NextResponse } from 'next/server';

// ИЗМЕНЕНО: Импортируем getAdminDatabase вместо getAdminFirestore
import { getAdminAuth, getAdminDatabase } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const userData = await request.json();
    
    // Validate required fields
    if (!userData.email || !userData.password || !userData.displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }

    // Get Firebase Admin instances
    const auth = getAdminAuth();
    // ИЗМЕНЕНО: Получаем экземпляр Realtime Database
    const db = getAdminDatabase();

    // Check if user already exists
    try {
      await auth.getUserByEmail(userData.email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    } catch (error: any) {
      // User not found is expected, continue with creation
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      phoneNumber: userData.phone || '',
      emailVerified: true,
      disabled: false,
    });

    // Set custom claims for role-based access
    await auth.setCustomUserClaims(userRecord.uid, {
      role: userData.role || 'user',
    });

    // Create comprehensive user profile in Realtime Database
    const userProfile = {
      uid: userRecord.uid,
      email: userData.email,
      displayName: userData.displayName,
      phone: userData.phone || null,
      role: userData.role || 'user',
      avatarUrl: '',
      avatarStoragePath: '',
      // ИЗМЕНЕНО: Используем ServerValue.TIMESTAMP для Realtime Database
      createdAt: ServerValue.TIMESTAMP,
      updatedAt: ServerValue.TIMESTAMP,
      settings: {
        language: 'ru',
        notifications: true,
        emailNotifications: true,
        smsNotifications: true
      },
      preferences: {
        theme: 'light',
        timezone: 'Europe/Moscow'
      },
      status: 'active',
      lastLogin: ServerValue.TIMESTAMP,
      createdBy: userData.adminId || 'system',
      metadata: {
        isEmailVerified: true,
        isPhoneVerified: false,
        registrationMethod: 'admin'
      }
    };

    // Save to Realtime Database with better error handling
    try {
      if (!db) throw new Error('Realtime Database not initialized');
      
      // ИЗМЕНЕНО: Создаем запись пользователя в Realtime Database
      // Данные сохраняются по пути /users/{uid}
      await db.ref(`users/${userRecord.uid}`).set(userProfile);
      
      console.log('User profile created successfully:', userRecord.uid);
    } catch (dbError) {
      console.error('Realtime Database error:', dbError);
      // Attempt to clean up the auth user if database fails
      try {
        await auth.deleteUser(userRecord.uid);
      } catch (deleteError) {
        console.error('Failed to clean up auth user:', deleteError);
      }
      throw new Error(`Failed to create user profile: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

    // Return the created user data (without sensitive info)
    const { password, ...userDataWithoutPassword } = userData;
    return NextResponse.json(
      { 
        id: userRecord.uid,
        ...userDataWithoutPassword,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error in create-user API:', error);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    // Handle specific Firebase Auth errors
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

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';