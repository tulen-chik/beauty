import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// Импортируем операции и хуки
import { salonOperations, userSalonsOperations, getSalonsByCityPaginated } from '@/lib/firebase/database';
import { useGeolocation } from './index';

// Импортируем ваши новые типы
import type { Salon, SalonRole, UserSalons } from '@/types/database';

// Интерфейс контекста остается без изменений, так как он уже соответствует типам
interface SalonContextType {
  salons: Salon[];
  userSalons: UserSalons | null;
  fetchSalon: (salonId: string) => Promise<Salon | null>;
  fetchUserSalons: (userId: string) => Promise<UserSalons | null>;
  createSalon: (salonId: string, data: Omit<Salon, 'id'>, userId: string) => Promise<Salon>;
  updateSalon: (salonId: string, data: Partial<Salon>) => Promise<Salon>;
  deleteSalon: (salonId: string) => Promise<void>;
  fetchSalonsByCity: (options: { city: string; limit: number; startAfterKey?: string }) => Promise<{ salons: Salon[]; nextKey: string | null }>;
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
      setUserSalons(userSalonsData);
      if (userSalonsData) saveUserSalonsToCache(userId, userSalonsData);
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

  const value: SalonContextType = useMemo(() => ({
    salons, userSalons, fetchSalon, fetchUserSalons, createSalon, updateSalon, deleteSalon, fetchSalonsByCity, loading, error,
  }), [
    salons, userSalons, fetchSalon, fetchUserSalons, createSalon, updateSalon, deleteSalon, fetchSalonsByCity, loading, error,
  ]);

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
};