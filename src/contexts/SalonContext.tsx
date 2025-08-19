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

  // Получить салон по id
  const fetchSalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const salon = await salonOperations.read(salonId);
      setLoading(false);
      return salon;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, []);

  // Получить салоны пользователя
  const fetchUserSalons = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const userSalons = await userSalonsOperations.read(userId);
      setUserSalons(userSalons);
      setLoading(false);
      return userSalons;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, []);

  // Создать салон
  const createSalon = useCallback(async (salonId: string, data: Omit<Salon, 'id'>, userId: string) => {
    setLoading(true);
    setError(null);
    try {
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
      setLoading(false);
      return updated;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  // Удалить салон
  const deleteSalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      await salonOperations.delete(salonId);
      setSalons((prev) => prev.filter((s) => s.id !== salonId));
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

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