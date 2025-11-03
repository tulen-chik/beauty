import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// Импортируем операции и хуки
import { salonOperations, userSalonsOperations, getSalonsByCityPaginated } from '@/lib/firebase/database';
import { useGeolocation } from './index';

import { ref, update } from "firebase/database"; 
import { db } from '@/lib/firebase/init';

// Импортируем ваши новые типы
import type { Salon, SalonRole, UserSalons, SalonMember } from '@/types/database';

// Интерфейс контекста остается без изменений, так как он уже соответствует типам
interface SalonContextType {
  salons: Salon[];
  userSalons: UserSalons | null;
  fetchSalon: (salonId: string) => Promise<Salon | null>;
  fetchUserSalons: (userId: string) => Promise<UserSalons | null>;
  createSalon: (salonId: string, data: Omit<Salon, 'id'>, userId: string) => Promise<Salon>;
  updateSalon: (salonId: string, data: Partial<Salon>) => Promise<Salon>;
  deleteSalon: (salonId: string) => Promise<void>;
  updateSalonMembers: (salonId: string, updatedMembers: SalonMember[]) => Promise<void>;
  fetchSalonsByCity: (options: { city: string; limit: number; startAfterKey?: string }) => Promise<{ salons: Salon[]; nextKey: string | null }>;

  updateAvatar: (salonId: string, file: File) => Promise<Salon>;
  removeAvatar: (salonId: string) => Promise<void>;
  
  loading: boolean;
  error: string | null;
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export const useSalon = () => {
  const ctx = useContext(SalonContext);
  if (!ctx) throw new Error('useSalon must be used within SalonProvider');
  return ctx;
};

export const SalonProvider = ({ children }: { children: ReactNode }) => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [userSalons, setUserSalons] = useState<UserSalons | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getCityFromCoordinates } = useGeolocation();

  // --- Логика кеширования (без изменений) ---
  const USER_SALONS_CACHE_KEY = 'user_salons_cache';
  const USER_SALONS_CACHE_TIMESTAMP_KEY = 'user_salons_cache_timestamp';
  const SALON_CACHE_PREFIX = 'salon_cache_';
  const SALON_CACHE_TIMESTAMP_PREFIX = 'salon_cache_timestamp_';
  const CACHE_DURATION = 5 * 60 * 1000;

  const saveUserSalonsToCache = useCallback((userId: string, userSalonsData: UserSalons | null) => {
    try {
      if (userSalonsData) {
        localStorage.setItem(`${USER_SALONS_CACHE_KEY}_${userId}`, JSON.stringify(userSalonsData));
        localStorage.setItem(`${USER_SALONS_CACHE_TIMESTAMP_KEY}_${userId}`, Date.now().toString());
      } else {
        localStorage.removeItem(`${USER_SALONS_CACHE_KEY}_${userId}`);
        localStorage.removeItem(`${USER_SALONS_CACHE_TIMESTAMP_KEY}_${userId}`);
      }
    } catch (error) {
      console.warn('Failed to save user salons to cache:', error);
    }
  }, []);

  const loadUserSalonsFromCache = useCallback((userId: string): UserSalons | null => {
    try {
      const cachedUserSalons = localStorage.getItem(`${USER_SALONS_CACHE_KEY}_${userId}`);
      const cachedTimestamp = localStorage.getItem(`${USER_SALONS_CACHE_TIMESTAMP_KEY}_${userId}`);
      if (!cachedUserSalons || !cachedTimestamp) return null;
      if (Date.now() - parseInt(cachedTimestamp) > CACHE_DURATION) {
        localStorage.removeItem(`${USER_SALONS_CACHE_KEY}_${userId}`);
        localStorage.removeItem(`${USER_SALONS_CACHE_TIMESTAMP_KEY}_${userId}`);
        return null;
      }
      return JSON.parse(cachedUserSalons);
    } catch (error) {
      console.warn('Failed to load user salons from cache:', error);
      return null;
    }
  }, []);



  const saveSalonToCache = useCallback((salonId: string, salonData: Salon | null) => {
    try {
      if (salonData) {
        localStorage.setItem(`${SALON_CACHE_PREFIX}${salonId}`, JSON.stringify(salonData));
        localStorage.setItem(`${SALON_CACHE_TIMESTAMP_PREFIX}${salonId}`, Date.now().toString());
      } else {
        localStorage.removeItem(`${SALON_CACHE_PREFIX}${salonId}`);
        localStorage.removeItem(`${SALON_CACHE_TIMESTAMP_PREFIX}${salonId}`);
      }
    } catch (error) {
      console.warn('Failed to save salon to cache:', error);
    }
  }, []);

  const loadSalonFromCache = useCallback((salonId: string): Salon | null => {
    try {
      const cachedSalon = localStorage.getItem(`${SALON_CACHE_PREFIX}${salonId}`);
      const cachedTimestamp = localStorage.getItem(`${SALON_CACHE_TIMESTAMP_PREFIX}${salonId}`);
      if (!cachedSalon || !cachedTimestamp) return null;
      if (Date.now() - parseInt(cachedTimestamp) > CACHE_DURATION) {
        localStorage.removeItem(`${SALON_CACHE_PREFIX}${salonId}`);
        localStorage.removeItem(`${SALON_CACHE_TIMESTAMP_PREFIX}${salonId}`);
        return null;
      }
      return JSON.parse(cachedSalon);
    } catch (error) {
      console.warn('Failed to load salon from cache:', error);
      return null;
    }
  }, []);

  const clearUserSalonsCache = useCallback((userId: string) => {
    try {
      localStorage.removeItem(`${USER_SALONS_CACHE_KEY}_${userId}`);
      localStorage.removeItem(`${USER_SALONS_CACHE_TIMESTAMP_KEY}_${userId}`);
    } catch (error) {
      console.warn('Failed to clear user salons cache:', error);
    }
  }, []);

  const clearSalonCache = useCallback((salonId: string) => {
    try {
      localStorage.removeItem(`${SALON_CACHE_PREFIX}${salonId}`);
      localStorage.removeItem(`${SALON_CACHE_TIMESTAMP_PREFIX}${salonId}`);
    } catch (error) {
      console.warn('Failed to clear salon cache:', error);
    }
  }, []);

  // --- Методы для работы с данными ---

  const fetchSalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const cachedSalon = loadSalonFromCache(salonId);
      if (cachedSalon) return cachedSalon;
      const salon = await salonOperations.read(salonId);
      if (salon) saveSalonToCache(salonId, salon);
      return salon;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadSalonFromCache, saveSalonToCache]);

  const fetchUserSalons = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const cachedUserSalons = loadUserSalonsFromCache(userId);
      if (cachedUserSalons) {
        setUserSalons(cachedUserSalons);
        return cachedUserSalons;
      }
      
      const userSalonsData = await userSalonsOperations.read(userId);

      // --- НАЧАЛО: КЛЮЧЕВОЕ ИЗМЕНЕНИЕ ---
      // Проверяем, существуют ли данные и есть ли в них непустой массив салонов.
      // Если нет - считаем, что для клиента данных нет (null).
      if (!userSalonsData || !userSalonsData.salons || userSalonsData.salons.length === 0) {
        setUserSalons(null);
        saveUserSalonsToCache(userId, null); // Также сохраняем null в кеш
        return null;
      }
      // --- КОНЕЦ: КЛЮЧЕВОЕ ИЗМЕНЕНИЕ ---

      // Если проверка пройдена, значит у пользователя есть салоны.
      setUserSalons(userSalonsData);
      saveUserSalonsToCache(userId, userSalonsData);
      return userSalonsData;
      
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadUserSalonsFromCache, saveUserSalonsToCache]);
const createSalon = useCallback(async (salonId: string, data: Omit<Salon, 'id'>, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!data.coordinates?.lat || !data.coordinates?.lng) {
        throw new Error('Координаты салона обязательны для определения города.');
      }
      const salonCity = await getCityFromCoordinates({ latitude: data.coordinates.lat, longitude: data.coordinates.lng });
      if (!salonCity) {
        throw new Error('Не удалось определить город по указанным координатам.');
      }
      const currentUserSalons = await fetchUserSalons(userId);
      if (currentUserSalons && currentUserSalons.salons.length >= 3) {
        throw new Error('Вы не можете иметь более 3 салонов');
      }
      
      const finalSalonData = { ...data, city: salonCity };
      const salon = await salonOperations.create(salonId, finalSalonData);
      setSalons((prev) => [...prev, { ...finalSalonData, id: salonId }]);
      
      const existing = await userSalonsOperations.read(userId);
      const newSalonEntry = { salonId, role: 'owner' as SalonRole, joinedAt: new Date().toISOString() };
      if (existing) {
        await userSalonsOperations.update(userId, { salons: [...existing.salons, newSalonEntry] });
      } else {
        await userSalonsOperations.create(userId, { userId, salons: [newSalonEntry] });
      }
      
      clearUserSalonsCache(userId);
      return salon;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fetchUserSalons, clearUserSalonsCache, getCityFromCoordinates, userSalonsOperations, clearUserSalonsCache]);

   const updateSalon = useCallback(async (salonId: string, data: Partial<Salon>) => {
    // Устанавливаем состояние загрузки и сбрасываем ошибки
    setLoading(true);
    setError(null);

    try {
      // 1. Создаем изменяемую копию данных, чтобы не мутировать исходный объект
      const dataToUpdate: Partial<Salon> = { ...data };

      // 2. Проверяем, были ли переданы новые координаты для обновления
      if (data.coordinates && data.coordinates.lat !== undefined && data.coordinates.lng !== undefined) {
        
        // 3. Если да, асинхронно получаем новый город по этим координатам
        const newSalonCity = await getCityFromCoordinates({
          latitude: data.coordinates.lat,
          longitude: data.coordinates.lng,
        });

        // 4. Если город успешно определен, добавляем его в объект для обновления
        if (newSalonCity) {
          dataToUpdate.city = newSalonCity;
        } else {
          // Предупреждаем в консоли, если город не удалось определить
          console.warn(`Не удалось определить город для обновленных координат салона ${salonId}`);
        }
      }

      // 5. Очищаем данные: принудительно удаляем дубликаты из `settings.business`, если они были переданы
      if (dataToUpdate.settings && typeof dataToUpdate.settings.business !== 'undefined') {
        // Создаем копию, чтобы не изменять dataToUpdate.settings.business напрямую в цикле
        const cleanBusinessSettings = { ...dataToUpdate.settings.business };
        
        // TypeScript будет ругаться, так как этих полей нет в типе.
        // Используем `as any` для обхода проверки типов в этом конкретном месте очистки.
        delete (cleanBusinessSettings as any).address;
        delete (cleanBusinessSettings as any).coordinates;

        dataToUpdate.settings.business = cleanBusinessSettings;
      }

      // 6. Вызываем операцию обновления в Firebase с полным и очищенным объектом
      const updated = await salonOperations.update(salonId, dataToUpdate);
      
      // 7. Обновляем локальное состояние контекста, чтобы все компоненты получили свежие данные
      setSalons((prev) => prev.map((s) => (s.id === salonId ? { ...s, ...dataToUpdate } : s)));
      
      // 8. Обновляем данные в локальном кэше для быстрого доступа при следующей загрузке
      const cachedSalon = loadSalonFromCache(salonId);
      if (cachedSalon) {
        saveSalonToCache(salonId, { ...cachedSalon, ...dataToUpdate });
      }
      
      // 9. Возвращаем полный обновленный объект салона.
      // Компонент, вызвавший этот метод, должен использовать этот результат для обновления своего локального состояния.
      setLoading(false);
      return updated;

    } catch (e: any) {
      // Обрабатываем возможные ошибки
      setError(e.message);
      setLoading(false);
      throw e; // Пробрасываем ошибку дальше, чтобы ее можно было поймать в UI
    }
  }, [loadSalonFromCache, saveSalonToCache, getCityFromCoordinates]);

  const deleteSalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      if (userSalons) {
        const updatedUserSalons = { ...userSalons, salons: userSalons.salons.filter(s => s.salonId !== salonId) };
        await userSalonsOperations.update(userSalons.userId, updatedUserSalons);
        saveUserSalonsToCache(userSalons.userId, updatedUserSalons);
      }
      await salonOperations.delete(salonId);
      clearSalonCache(salonId);
      setSalons(prev => prev.filter(s => s.id !== salonId));
      if (userSalons) setUserSalons(prev => ({ ...prev!, salons: prev!.salons.filter(s => s.salonId !== salonId) }));
    } catch (e: any) {
      console.error('Error deleting salon:', e);
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [clearSalonCache, userSalons, saveUserSalonsToCache]);

  const updateAvatar = useCallback(async (salonId: string, file: File): Promise<Salon> => {
    setLoading(true);
    setError(null);
    try {
      // Вызываем операцию, которая делает всю работу с файлами и базой данных
      await salonOperations.updateAvatar(salonId, file);
      
      // После успешного обновления, нам нужно получить свежие данные салона
      // `false` в read означает, что мы обходим кеш и берем данные напрямую из БД
      const updatedSalon = await salonOperations.read(salonId, false);
      if (!updatedSalon) {
        throw new Error("Не удалось получить обновленные данные салона после загрузки аватара.");
      }

      // Обновляем локальное состояние и кеш
      setSalons((prev) => prev.map((s) => (s.id === salonId ? updatedSalon : s)));
      saveSalonToCache(salonId, updatedSalon);

      return updatedSalon;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [saveSalonToCache]);

  const removeAvatar = useCallback(async (salonId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // Вызываем операцию, которая удаляет файл и очищает поля в БД
      await salonOperations.removeAvatar(salonId);

      // Обновляем локальное состояние, чтобы убрать аватар
      const updatedSalonData = { avatarUrl: '', avatarStoragePath: '' };
      setSalons((prev) => prev.map((s) => (s.id === salonId ? { ...s, ...updatedSalonData } : s)));

      // Обновляем кеш
      const cachedSalon = loadSalonFromCache(salonId);
      if (cachedSalon) {
        saveSalonToCache(salonId, { ...cachedSalon, ...updatedSalonData });
      }
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [loadSalonFromCache, saveSalonToCache]);

  const fetchSalonsByCity = useCallback(async (options: { city: string; limit: number; startAfterKey?: string }) => {
    setLoading(true);
    setError(null);
    try {
      return await getSalonsByCityPaginated(options);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSalonMembers = useCallback(async (salonId: string, updatedMembers: SalonMember[]) => {
    console.log(`[updateSalonMembers] START: Обновление участников для салона ${salonId}`);
    setLoading(true);
    setError(null);

    try {
      // --- ШАГ 1: Получение исходных данных ---
      const originalSalon = salons.find(s => s.id === salonId) || await fetchSalon(salonId);
      if (!originalSalon) {
        throw new Error(`Салон с ID ${salonId} не найден.`);
      }
      
      const originalMembers = originalSalon.members || [];
      console.log('[updateSalonMembers] Исходные участники:', JSON.stringify(originalMembers, null, 2));
      console.log('[updateSalonMembers] Новые (обновленные) участники:', JSON.stringify(updatedMembers, null, 2));

      // --- ШАГ 2: Определение всех затронутых пользователей ---
      const originalUserIds = originalMembers.map(m => m.userId);
      const newUserIds = updatedMembers.map(m => m.userId);
      const allAffectedUserIds = Array.from(new Set([...originalUserIds, ...newUserIds]));
      
      console.log(`[updateSalonMembers] Всего затронуто пользователей: ${allAffectedUserIds.length}. ID:`, allAffectedUserIds);

      // --- ШАГ 3: Подготовка объекта для атомарного обновления ---
      // Это базовый объект, который будет расширен
      const updates: { [key: string]: any } = {};
      updates[`salons/${salonId}/members`] = updatedMembers;
      
      console.log('[updateSalonMembers] Подготовлен базовый объект updates:', { [`salons/${salonId}/members`]: updatedMembers });

      // --- ШАГ 4: Асинхронная подготовка обновлений для каждого пользователя ---
      // ИСПРАВЛЕНИЕ: Мы будем собирать промисы, которые ВОЗВРАЩАЮТ нужные данные,
      // а не мутировать внешний объект `updates`.
      const userUpdatePromises = allAffectedUserIds.map(async (userId) => {
        try {
          console.log(`[UserUpdate] -> Начало обработки для пользователя ${userId}`);
          const userSalonsData = await userSalonsOperations.read(userId);
          const newMemberInfo = updatedMembers.find(m => m.userId === userId);
          let updatedUserSalonsList = userSalonsData?.salons || [];

          if (newMemberInfo) {
            // Пользователь остался в салоне (или был добавлен)
            const existingEntryIndex = updatedUserSalonsList.findIndex(s => s.salonId === salonId);
            if (existingEntryIndex > -1) {
              console.log(`[UserUpdate] -> Пользователь ${userId} уже в списке, обновляем роль на "${newMemberInfo.role}".`);
              updatedUserSalonsList[existingEntryIndex].role = newMemberInfo.role;
            } else {
              console.log(`[UserUpdate] -> Пользователь ${userId} добавляется в список салонов.`);
              updatedUserSalonsList.push({ salonId, role: newMemberInfo.role, joinedAt: newMemberInfo.joinedAt });
            }
          } else {
            // Пользователя удалили из салона
            console.warn(`[UserUpdate] -> Пользователь ${userId} удаляется из списка салонов.`);
            updatedUserSalonsList = updatedUserSalonsList.filter(s => s.salonId !== salonId);
          }
          
          // Возвращаем путь и данные для этого конкретного пользователя
          return { path: `userSalons/${userId}/salons`, data: updatedUserSalonsList };

        } catch (userError: any) {
            console.error(`[UserUpdate] -> ОШИБКА при обработке пользователя ${userId}:`, userError.message);
            // Возвращаем null, чтобы можно было отфильтровать и не прерывать всю операцию
            return null;
        }
      });

      // Дожидаемся выполнения всех промисов
      const userUpdateResults = await Promise.all(userUpdatePromises);

      // --- ШАГ 5: Финальная сборка объекта `updates` ---
      // Теперь мы безопасно собираем все результаты в один объект
      userUpdateResults.forEach(result => {
        if (result) { // Проверяем, что не было ошибки
          updates[result.path] = result.data;
        }
      });

      console.log('%c[updateSalonMembers] ФИНАЛЬНЫЙ ОБЪЕКТ ДЛЯ ЗАПИСИ В FIREBASE:', 'color: blue; font-weight: bold;', JSON.stringify(updates, null, 2));

      // --- ШАГ 6: Выполнение атомарной записи ---
      console.log('[updateSalonMembers] Отправка запроса в Firebase...');
      await update(ref(db), updates);
      console.log('%c[updateSalonMembers] SUCCESS: Данные успешно обновлены в Firebase!', 'color: green; font-weight: bold;');

      // --- ШАГ 7: Обновление локального состояния и кеша (только после успешной записи) ---
      setSalons(prev => prev.map(s => s.id === salonId ? { ...s, members: updatedMembers } : s));
      saveSalonToCache(salonId, { ...originalSalon, members: updatedMembers });
      allAffectedUserIds.forEach(userId => clearUserSalonsCache(userId));
      console.log('[updateSalonMembers] Локальное состояние и кеш обновлены.');

    } catch (e: any) {
      // --- Обработка ошибок ---
      console.error('%c[updateSalonMembers] FATAL ERROR: Произошла ошибка во время выполнения операции.', 'color: red; font-weight: bold;');
      console.error('Текст ошибки:', e.message);
      console.error('Полный объект ошибки:', e);
      setError(e.message);
      throw e; // Пробрасываем ошибку дальше для обработки в UI
    } finally {
      // --- Завершение ---
      setLoading(false);
      console.log('[updateSalonMembers] END: Операция завершена.');
    }
  }, [salons, fetchSalon, saveSalonToCache, clearUserSalonsCache, userSalonsOperations]); // Добавьте userSalonsOperations в зависимости
  
  const value: SalonContextType = useMemo(() => ({
    salons, userSalons, updateSalonMembers, fetchSalon, fetchUserSalons, createSalon, updateSalon, deleteSalon, fetchSalonsByCity, loading, error, updateAvatar, removeAvatar,
  }), [
    salons, userSalons, updateSalonMembers, fetchSalon, fetchUserSalons, createSalon, updateSalon, deleteSalon, fetchSalonsByCity, loading, error, updateAvatar, removeAvatar,
  ]);

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
};