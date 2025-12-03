'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { authService } from '@/lib/firebase/auth';
import { 
  readUserAction,
  createUserAction,
  updateUserAction,
  getUserByEmailAction,
  getUserByIdAction,
} from '@/app/actions/userActions';
// --- ДОБАВЛЕНО: Импорт функций для работы с аватарами ---
import {
  uploadUserAvatarAction,
  deleteUserAvatarAction,
  getUserAvatarAction,
} from '@/app/actions/storageActions';

import type { User } from '@/types/database';

interface UserContextType {
  currentUser: (User & { userId: string }) | null;
  firebaseUser: any | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  getUserByEmail: (email: string) => Promise<User | null>;
  getUserById: (userId: string) => Promise<User | null>;
  // --- ДОБАВЛЕНО: Новые методы для аватаров ---
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  getAvatar: (userId: string) => Promise<{ url: string, storagePath: string } | null>; // Новый метод
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<(User & { userId: string }) | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ... (остальной код кеширования и useEffect без изменений)
  const USER_CACHE_KEY = 'user_cache';
  const USER_CACHE_TIMESTAMP_KEY = 'user_cache_timestamp';
  const CACHE_DURATION = 5 * 60 * 1000;

  const saveUserToCache = useCallback((userData: (User & { userId: string }) | null) => {
    try {
      if (userData) {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
        localStorage.setItem(USER_CACHE_TIMESTAMP_KEY, Date.now().toString());
      } else {
        localStorage.removeItem(USER_CACHE_KEY);
        localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
      }
    } catch (error) {
      console.warn('Failed to save user to cache:', error);
    }
  }, []);

  const loadUserFromCache = useCallback((): (User & { userId: string }) | null => {
    try {
      const cachedUser = localStorage.getItem(USER_CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(USER_CACHE_TIMESTAMP_KEY);
      
      if (!cachedUser || !cachedTimestamp) {
        return null;
      }

      const timestamp = parseInt(cachedTimestamp);
      const now = Date.now();
      
      if (now - timestamp > CACHE_DURATION) {
        localStorage.removeItem(USER_CACHE_KEY);
        localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
        return null;
      }

      return JSON.parse(cachedUser);
    } catch (error) {
      console.warn('Failed to load user from cache:', error);
      return null;
    }
  }, []);

  const clearUserCache = useCallback(() => {
    try {
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.warn('Failed to clear user cache:', error);
    }
  }, []);

  const refreshUser = useCallback(async (uid: string, options?: { force?: boolean }) => {
    // Если нет принудительного обновления, проверяем кеш
    if (!options?.force) {
      const cachedUser = loadUserFromCache();
      if (cachedUser && cachedUser.userId === uid) {
        setCurrentUser(cachedUser);
        setLoading(false);
        return;
      }
    }

    // Если есть флаг force или кеш невалиден, идем в базу
    try {
      setLoading(true);
      setError(null);
      
      const userData = await readUserAction(uid);
      if (userData) {
        const userWithId = { userId: uid, ...userData };
        setCurrentUser(userWithId);
        saveUserToCache(userWithId); // Обновляем кеш свежими данными
      } else {
        setCurrentUser(null);
        clearUserCache(); // Очищаем, если пользователя нет
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user'));
    } finally {
      setLoading(false);
    }
  }, [loadUserFromCache, saveUserToCache, clearUserCache]);
    
  useEffect(() => {
    const checkCacheOnMount = async () => {
      const cachedUser = loadUserFromCache();
      if (cachedUser) {
        setCurrentUser(cachedUser);
        setLoading(false);
      }
    };

    checkCacheOnMount();

    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        await refreshUser(firebaseUser.uid);
      } else {
        setCurrentUser(null);
        clearUserCache();
      }
      setLoading(false);
    });

    const checkRedirectResult = async () => {
      try {
        console.log('Checking for redirect result...');
        const redirectResult = await authService.getRedirectResult();
        if (redirectResult) {
          console.log('Redirect result found:', redirectResult);
          const { user, name } = redirectResult;
          setFirebaseUser(user);
          
          const userData = await readUserAction(user.uid);
          if (!userData) {
            console.log('Creating new user from Google auth...');
            await createUserAction(user.uid, {
              email: user.email || '',
              displayName: name,
              avatarUrl: '',
              avatarStoragePath: '',
                createdAt: new Date().toISOString(),
              role: 'user',
              settings: {
                language: 'en',
                notifications: true
              }
            });
          } else {
            console.log('User already exists, updating...');
          }
          
          await refreshUser(user.uid);
        } else {
          console.log('No redirect result found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking redirect result:', error);
        setLoading(false);
      }
    };

    timeoutRef.current = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, resetting loading state');
        setLoading(false);
      }
    }, 10000);

    checkRedirectResult();

    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [refreshUser]);

  // ... (login, register, logout и другие существующие функции без изменений)
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await authService.login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to login'));
      throw err;
    }
  };

const register = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      setLoading(true);
      const firebaseUser = await authService.register(email, password, displayName);
      setFirebaseUser(firebaseUser);
      const existing = await readUserAction(firebaseUser.uid);
      if (!existing) {
        await createUserAction(firebaseUser.uid, {
          email: firebaseUser.email || email,
          displayName,
          avatarUrl: '',
          avatarStoragePath: '',
          createdAt: new Date().toISOString(),
          role: 'user',
          settings: {
            language: 'en',
            notifications: true,
          },
        });
      }
      await refreshUser(firebaseUser.uid);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to register'));
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      clearUserCache();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to logout'));
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await authService.resetPassword(email);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reset password'));
      throw err;
    }
  };

  const updateProfile = async (displayName?: string, photoURL?: string) => {
    try {
      setError(null);
      await authService.updateUserProfile(displayName, photoURL);
      if (firebaseUser) {
        await refreshUser(firebaseUser.uid);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      throw err;
    }
  };

  const updateEmail = async (newEmail: string) => {
    try {
      setError(null);
      await authService.updateUserEmail(newEmail);
      if (firebaseUser) {
        await refreshUser(firebaseUser.uid);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update email'));
      throw err;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setError(null);
      await authService.updateUserPassword(newPassword);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update password'));
      throw err;
    }
  };

  const deleteAccount = async () => {
    try {
      setError(null);
      await authService.deleteAccount();
      clearUserCache();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete account'));
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    let result: any = null;
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting Google login...');
      result = await authService.loginWithGoogle();
      
      if (result === null) {
        console.log('Google login using redirect method...');
        return;
      }
      
      console.log('Google login successful via popup:', result);
      const { user, name } = result;
      setFirebaseUser(user);
      
      const userData = await readUserAction(user.uid);
      if (!userData) {
        console.log('Creating new user from Google popup auth...');
        await createUserAction(user.uid, {
          email: user.email || '',
          displayName: name,
          avatarUrl: '',
          avatarStoragePath: '',
          createdAt: new Date().toISOString(),
          role: 'user',
          settings: {
            language: 'en',
            notifications: true
          }
        });
      } else {
        console.log('User already exists from Google popup auth...');
      }
      
      await refreshUser(user.uid);
      setLoading(false);
    } catch (err) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
      setLoading(false);
      throw err;
    }
  };

  const getUserByEmail = async (email: string) => {
    const res = await getUserByEmailAction(email);
    return res as unknown as User | null;
  };

  const getUserById = async (userId: string) => {
    return await getUserByIdAction(userId);
  };

  // --- ДОБАВЛЕНО: Реализация методов для работы с аватарами ---

  const uploadAvatar = async (file: File) => {
    if (!currentUser) {
      throw new Error('Пользователь должен быть авторизован для загрузки аватара.');
    }

    try {
      setError(null);

      // Если был старый аватар — удаляем файл и запись о нем
      if (currentUser.avatarStoragePath) {
        await deleteUserAvatarAction(currentUser.avatarStoragePath);
      }

      // Отправляем файл через API роут (Server Actions не принимают File напрямую)
      const fd = new FormData();
      fd.append('file', file);
      fd.append('userId', currentUser.userId);

      const resp = await fetch('/api/upload/user-avatar', {
        method: 'POST',
        body: fd,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || 'Не удалось загрузить аватар');
      }
      const { url, storagePath } = await resp.json();

      await updateUserAction(currentUser.userId, { avatarUrl: url, avatarStoragePath: storagePath });

      // Принудительно обновляем пользователя
      await refreshUser(currentUser.userId, { force: true });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Не удалось загрузить аватар');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeAvatar = async () => {
    if (!currentUser || !currentUser.avatarStoragePath) {
      console.log('Нет аватара для удаления.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await deleteUserAvatarAction(currentUser.avatarStoragePath);

      await updateUserAction(currentUser.userId, {
        avatarUrl: '',
        avatarStoragePath: '',
      });

      // Здесь также вызываем с флагом принудительного обновления
      await refreshUser(currentUser.userId, { force: true });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Не удалось удалить аватар');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAvatar = async (userId: string) => {
    try {
      const avatarData = await getUserAvatarAction(userId);
      if (avatarData) {
        return { url: avatarData.url, storagePath: avatarData.storagePath };
      }
      return null;
    } catch (error) {
      console.error("Error fetching user avatar:", error);
      return null;
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        error,
        login,
        register,
        logout,
        resetPassword,
        updateProfile,
        updateEmail,
        updatePassword,
        deleteAccount,
        loginWithGoogle,
        getUserByEmail,
        getUserById,
        // --- ДОБАВЛЕНО: Передаем новые методы в провайдер ---
        uploadAvatar,
        removeAvatar,
        getAvatar,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};