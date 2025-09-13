import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { salonOperations, userSalonsOperations } from '@/lib/firebase/database';
import type { Salon, UserSalons, SalonRole } from '@/types/database';

interface SalonContextType {
  salons: Salon[];
  userSalons: UserSalons | null;
  fetchSalon: (salonId: string) => Promise<Salon | null>;
  fetchUserSalons: (userId: string) => Promise<UserSalons | null>;
  createSalon: (salonId: string, data: Omit<Salon, 'id'>, userId: string) => Promise<Salon>;
  updateSalon: (salonId: string, data: Partial<Salon>) => Promise<Salon>;
  deleteSalon: (salonId: string) => Promise<void>;
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

  // Ключи для localStorage
  const USER_SALONS_CACHE_KEY = 'user_salons_cache';
  const USER_SALONS_CACHE_TIMESTAMP_KEY = 'user_salons_cache_timestamp';
  const SALON_CACHE_PREFIX = 'salon_cache_';
  const SALON_CACHE_TIMESTAMP_PREFIX = 'salon_cache_timestamp_';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 минут в миллисекундах

  // Функция для сохранения пользовательских салонов в кеш
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

  // Функция для загрузки пользовательских салонов из кеша
  const loadUserSalonsFromCache = useCallback((userId: string): UserSalons | null => {
    try {
      const cachedUserSalons = localStorage.getItem(`${USER_SALONS_CACHE_KEY}_${userId}`);
      const cachedTimestamp = localStorage.getItem(`${USER_SALONS_CACHE_TIMESTAMP_KEY}_${userId}`);
      
      if (!cachedUserSalons || !cachedTimestamp) {
        return null;
      }

      const timestamp = parseInt(cachedTimestamp);
      const now = Date.now();
      
      // Проверяем, не устарел ли кеш
      if (now - timestamp > CACHE_DURATION) {
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

  // Функция для сохранения салона в кеш
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

  // Функция для загрузки салона из кеша
  const loadSalonFromCache = useCallback((salonId: string): Salon | null => {
    try {
      const cachedSalon = localStorage.getItem(`${SALON_CACHE_PREFIX}${salonId}`);
      const cachedTimestamp = localStorage.getItem(`${SALON_CACHE_TIMESTAMP_PREFIX}${salonId}`);
      
      if (!cachedSalon || !cachedTimestamp) {
        return null;
      }

      const timestamp = parseInt(cachedTimestamp);
      const now = Date.now();
      
      // Проверяем, не устарел ли кеш
      if (now - timestamp > CACHE_DURATION) {
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

  // Очистка кеша пользовательских салонов
  const clearUserSalonsCache = useCallback((userId: string) => {
    try {
      localStorage.removeItem(`${USER_SALONS_CACHE_KEY}_${userId}`);
      localStorage.removeItem(`${USER_SALONS_CACHE_TIMESTAMP_KEY}_${userId}`);
    } catch (error) {
      console.warn('Failed to clear user salons cache:', error);
    }
  }, []);

  // Очистка кеша салона
  const clearSalonCache = useCallback((salonId: string) => {
    try {
      localStorage.removeItem(`${SALON_CACHE_PREFIX}${salonId}`);
      localStorage.removeItem(`${SALON_CACHE_TIMESTAMP_PREFIX}${salonId}`);
    } catch (error) {
      console.warn('Failed to clear salon cache:', error);
    }
  }, []);

  // Получить салон по id
  const fetchSalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Сначала проверяем кеш
      const cachedSalon = loadSalonFromCache(salonId);
      if (cachedSalon) {
        setLoading(false);
        return cachedSalon;
      }

      const salon = await salonOperations.read(salonId);
      if (salon) {
        saveSalonToCache(salonId, salon);
      }
      setLoading(false);
      return salon;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, [loadSalonFromCache, saveSalonToCache]);

  // Получить салоны пользователя
  const fetchUserSalons = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Сначала проверяем кеш
      const cachedUserSalons = loadUserSalonsFromCache(userId);
      if (cachedUserSalons) {
        setUserSalons(cachedUserSalons);
        setLoading(false);
        return cachedUserSalons;
      }

      const userSalons = await userSalonsOperations.read(userId);
      setUserSalons(userSalons);
      if (userSalons) {
        saveUserSalonsToCache(userId, userSalons);
      }
      setLoading(false);
      return userSalons;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, [loadUserSalonsFromCache, saveUserSalonsToCache]);

  // Создать салон
  const createSalon = useCallback(async (salonId: string, data: Omit<Salon, 'id'>, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Check if user already has 3 or more salons
      const currentUserSalons = await fetchUserSalons(userId);
      if (currentUserSalons && currentUserSalons.salons.length >= 3) {
        throw new Error('Вы не можете иметь более 3 салонов');
      }
      
      const salon = await salonOperations.create(salonId, data);
      setSalons((prev) => [...prev, { ...data, id: salonId } as Salon]);
      setLoading(false);
      const existing = await userSalonsOperations.read(userId);
      const newSalonEntry = {
        salonId,
        role: 'owner' as SalonRole,
        joinedAt: new Date().toISOString(),
      };
      if (existing) {
        await userSalonsOperations.update(userId, {
          salons: [...existing.salons, newSalonEntry],
        });
      } else {
        await userSalonsOperations.create(userId, {
          userId,
          salons: [newSalonEntry],
        });
      }
      return salon;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  // Обновить салон
  const updateSalon = useCallback(async (salonId: string, data: Partial<Salon>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await salonOperations.update(salonId, data);
      setSalons((prev) => prev.map((s) => (s.id === salonId ? { ...s, ...data } : s)));
      // Обновляем кеш салона
      const cachedSalon = loadSalonFromCache(salonId);
      if (cachedSalon) {
        saveSalonToCache(salonId, { ...cachedSalon, ...data });
      }
      setLoading(false);
      return updated;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, [loadSalonFromCache, saveSalonToCache]);

  // Удалить салон
  const deleteSalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      await salonOperations.delete(salonId);
      setSalons((prev) => prev.filter((s) => s.id !== salonId));
      // Очищаем кеш салона
      clearSalonCache(salonId);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, [clearSalonCache]);

  const value: SalonContextType = useMemo(() => ({
    salons,
    userSalons,
    fetchSalon,
    fetchUserSalons,
    createSalon,
    updateSalon,
    deleteSalon,
    loading,
    error,
  }), [
    salons,
    userSalons,
    fetchSalon,
    fetchUserSalons,
    createSalon,
    updateSalon,
    deleteSalon,
    loading,
    error,
  ]);

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
}; 