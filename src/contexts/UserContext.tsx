'use client';
import { createContext, useCallback, useContext, useEffect,useRef,useState } from 'react';

import { authService } from '@/lib/firebase/auth';
import { userOperations } from '@/lib/firebase/database';

import { useDatabase } from './DatabaseContext';

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
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useDatabase();
  const [currentUser, setCurrentUser] = useState<(User & { userId: string }) | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ключи для localStorage
  const USER_CACHE_KEY = 'user_cache';
  const USER_CACHE_TIMESTAMP_KEY = 'user_cache_timestamp';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 минут в миллисекундах

  // Функция для сохранения пользователя в кеш
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

  // Функция для загрузки пользователя из кеша
  const loadUserFromCache = useCallback((): (User & { userId: string }) | null => {
    try {
      const cachedUser = localStorage.getItem(USER_CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(USER_CACHE_TIMESTAMP_KEY);
      
      if (!cachedUser || !cachedTimestamp) {
        return null;
      }

      const timestamp = parseInt(cachedTimestamp);
      const now = Date.now();
      
      // Проверяем, не устарел ли кеш
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

  // Очистка кеша
  const clearUserCache = useCallback(() => {
    try {
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.warn('Failed to clear user cache:', error);
    }
  }, []);

  const refreshUser = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Сначала проверяем кеш
      const cachedUser = loadUserFromCache();
      if (cachedUser && cachedUser.userId === uid) {
        setCurrentUser(cachedUser);
        setLoading(false);
        return;
      }

      const userData = await user.read(uid);
      if (userData) {
        const userWithId = { userId: uid, ...userData };
        setCurrentUser(userWithId);
        saveUserToCache(userWithId);
      } else {
        setCurrentUser(null);
        clearUserCache();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user'));
    } finally {
      setLoading(false);
    }
  }, [user, loadUserFromCache, saveUserToCache, clearUserCache]);
    
  useEffect(() => {
    // При монтировании проверяем кеш
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

    // Проверяем, есть ли результат redirect аутентификации
    const checkRedirectResult = async () => {
      try {
        console.log('Checking for redirect result...');
        // Проверяем результат redirect аутентификации
        const redirectResult = await authService.getRedirectResult();
        if (redirectResult) {
          console.log('Redirect result found:', redirectResult);
          const { user, name } = redirectResult;
          setFirebaseUser(user);
          
          // Create or update user in database
          const userData = await userOperations.read(user.uid);
          if (!userData) {
            console.log('Creating new user from Google auth...');
            await userOperations.create(user.uid, {
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
          // Если нет redirect результата, сбрасываем loading
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking redirect result:', error);
        // В случае ошибки также сбрасываем loading
        setLoading(false);
      }
    };

    // Добавляем таймаут для сброса loading, если что-то пошло не так
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, resetting loading state');
        setLoading(false);
      }
    }, 10000); // 10 секунд таймаут

    checkRedirectResult();

    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [refreshUser]);

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
      setLoading(true); // Устанавливаем загрузку в начале

      // 1. Вызываем сервис регистрации и дожидаемся его полного завершения
      // (включая создание записи в базе данных)
      const firebaseUser = await authService.register(email, password, displayName);

      // 2. Теперь, когда мы уверены, что пользователь создан и в Auth, и в DB,
      // мы можем вручную обновить состояние приложения.
      setFirebaseUser(firebaseUser);

      // 3. Вызываем refreshUser, который теперь гарантированно найдет данные
      // и установит currentUser.
      await refreshUser(firebaseUser.uid);

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to register'));
      // Важно пробросить ошибку дальше, чтобы компонент формы мог ее обработать
      throw err;
    } finally {
      // setLoading(false) можно не вызывать здесь, так как refreshUser
      // уже управляет состоянием загрузки.
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
      
      // Если результат null, значит используется redirect метод
      if (result === null) {
        console.log('Google login using redirect method...');
        // При redirect методе пользователь будет перенаправлен на страницу аутентификации
        // Результат будет обработан в useEffect ниже
        // Не сбрасываем loading, так как идет redirect
        return;
      }
      
      console.log('Google login successful via popup:', result);
      const { user, name } = result;
      setFirebaseUser(user);
      
      // Create or update user in database
      const userData = await userOperations.read(user.uid);
      if (!userData) {
        console.log('Creating new user from Google popup auth...');
        await userOperations.create(user.uid, {
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
    return await userOperations.getByEmail(email);
  };

  const getUserById = async (userId: string) => {
    return await userOperations.getById(userId);
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
        getUserById
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