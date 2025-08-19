import { 
  type User as FirebaseUser,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth, 
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';

import { userOperations } from './database';

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Регистрация
  register: async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Обновляем профиль пользователя
    await updateProfile(user, { displayName });
    
    // Создаем запись в базе данных
    await userOperations.create(user.uid, {
      email,
      displayName,
      createdAt: new Date().toISOString(),
      role: 'user',
      settings: {
        language: 'en',
        notifications: true
      }
    });
    
    return user;
  },

  // Вход
  login: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Выход
  logout: async () => {
    await signOut(auth);
  },

  // Сброс пароля
  resetPassword: async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  },

  // Обновление профиля
  updateUserProfile: async (displayName?: string, photoURL?: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    
    await updateProfile(user, { displayName, photoURL });
    if (displayName) {
      await userOperations.update(user.uid, { displayName });
    }
  },

  // Обновление email
  updateUserEmail: async (newEmail: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    
    await updateEmail(user, newEmail);
    await userOperations.update(user.uid, { email: newEmail });
  },

  // Обновление пароля
  updateUserPassword: async (newPassword: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    
    await updatePassword(user, newPassword);
  },

  // Удаление аккаунта
  deleteAccount: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    
    await userOperations.delete(user.uid);
    await deleteUser(user);
  },

  // Получение текущего пользователя
  getCurrentUser: () => auth.currentUser,

  // Подписка на изменения состояния аутентификации
  onAuthStateChange: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  async loginWithGoogle() {
    try {
      console.log('Attempting Google popup authentication...');
      // Сначала пробуем popup метод
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log('Google popup authentication successful');
      // Get the user's name from Google profile
      const name = user.displayName || '';
      
      return {
        user,
        name
      };
    } catch (error: any) {
      console.log('Google popup auth error:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      
      // Проверяем различные типы ошибок, которые могут возникнуть при блокировке popup
      const isPopupBlocked = 
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/cancelled-popup-request' ||
        error.message?.includes('Cross-Origin-Opener-Policy') ||
        error.message?.includes('window.closed') ||
        error.message?.includes('popup') ||
        error.message?.includes('blocked') ||
        error.message?.includes('cancelled') ||
        error.message?.includes('COOP') ||
        error.message?.includes('cross-origin');
      
      if (isPopupBlocked) {
        console.log('Popup blocked or failed, trying redirect method...');
        
        try {
          // Используем redirect метод как fallback
          await signInWithRedirect(auth, googleProvider);
          
          // Возвращаем null, так как redirect не возвращает результат сразу
          return null;
        } catch (redirectError) {
          console.error('Google redirect auth also failed:', redirectError);
          throw redirectError;
        }
      }
      
      // Если это другая ошибка, пробрасываем её
      throw error;
    }
  },

  // Функция для получения результата redirect аутентификации
  async getRedirectResult() {
    try {
      console.log('Getting redirect result...');
      const result = await getRedirectResult(auth);
      if (result) {
        console.log('Redirect result found:', result.user.email);
        const user = result.user;
        const name = user.displayName || '';
        return { user, name };
      } else {
        console.log('No redirect result found');
      }
      return null;
    } catch (error) {
      console.error('Error getting redirect result:', error);
      throw error;
    }
  }
}; 