'use client';

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// 1. Импорт серверных действий
import * as salonActions from '@/app/actions/salonActions';

// 2. Импорт клиентских функций для Storage
import { 
  deleteSalonAvatar, 
  uploadSalonAvatar 
} from '@/lib/firebase/database';

import { useGeolocation } from './index';

// Импортируем типы
import type { Salon, SalonRole, UserSalons, SalonMember } from '@/types/database';

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

  const handleRequest = useCallback(async <T,>(request: () => Promise<T>, showLoading = true): Promise<T> => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await request();
      if (showLoading) setLoading(false);
      return result;
    } catch (e: any) {
      console.error("Salon Context Error:", e);
      setError(e.message || 'An unexpected error occurred');
      if (showLoading) setLoading(false);
      throw e;
    }
  }, []);

  // --- Методы для работы с данными ---

  const fetchSalon = useCallback((salonId: string) => {
    return handleRequest(async () => {
      const salon = await salonActions.getSalonByIdAction(salonId);
      if (salon) {
        setSalons(prev => {
          const exists = prev.some(s => s.id === salonId);
          if (exists) return prev.map(s => s.id === salonId ? salon : s);
          return [...prev, salon];
        });
      }
      return salon;
    });
  }, [handleRequest]);

  const fetchUserSalons = useCallback((userId: string) => {
    return handleRequest(async () => {
      const data = await salonActions.getUserSalonsAction(userId);
      
      if (!data || !data.salons || data.salons.length === 0) {
        setUserSalons(null);
        return null;
      }

      setUserSalons(data);
      return data;
    });
  }, [handleRequest]);

  const createSalon = useCallback(async (salonId: string, data: Omit<Salon, 'id'>, userId: string) => {
    return handleRequest(async () => {
      if (!data.coordinates?.lat || !data.coordinates?.lng) {
        throw new Error('Координаты салона обязательны для определения города.');
      }
      const salonCity = await getCityFromCoordinates({ latitude: data.coordinates.lat, longitude: data.coordinates.lng });
      if (!salonCity) {
        throw new Error('Не удалось определить город по указанным координатам.');
      }

      const currentUserSalons = await salonActions.getUserSalonsAction(userId);
      if (currentUserSalons && currentUserSalons.salons.length >= 3) {
        throw new Error('Вы не можете иметь более 3 салонов');
      }
      
      const finalSalonData = { ...data, city: salonCity };
      
      const salon = await salonActions.createSalonAction(salonId, finalSalonData);
      
      const newSalonEntry = { salonId, role: 'owner' as SalonRole, joinedAt: new Date().toISOString() };
      
      if (currentUserSalons) {
        await salonActions.updateUserSalonsAction(userId, { salons: [...currentUserSalons.salons, newSalonEntry] });
      } else {
        // ИСПРАВЛЕНО: Добавлен userId в объект данных
        await salonActions.createUserSalonsAction(userId, { userId, salons: [newSalonEntry] });
      }
      
      setSalons((prev) => [...prev, salon]);
      const updatedUserSalons = await salonActions.getUserSalonsAction(userId);
      setUserSalons(updatedUserSalons);

      return salon;
    });
  }, [handleRequest, getCityFromCoordinates]);

  const updateSalon = useCallback(async (salonId: string, data: Partial<Salon>) => {
    return handleRequest(async () => {
      const dataToUpdate: Partial<Salon> = { ...data };

      if (data.coordinates && data.coordinates.lat !== undefined && data.coordinates.lng !== undefined) {
        const newSalonCity = await getCityFromCoordinates({
          latitude: data.coordinates.lat,
          longitude: data.coordinates.lng,
        });

        if (newSalonCity) {
          dataToUpdate.city = newSalonCity;
        } else {
          console.warn(`Не удалось определить город для обновленных координат салона ${salonId}`);
        }
      }

      if (dataToUpdate.settings && typeof dataToUpdate.settings.business !== 'undefined') {
        const cleanBusinessSettings = { ...dataToUpdate.settings.business };
        delete (cleanBusinessSettings as any).address;
        delete (cleanBusinessSettings as any).coordinates;
        dataToUpdate.settings.business = cleanBusinessSettings;
      }

      const updated = await salonActions.updateSalonAction(salonId, dataToUpdate);
      
      setSalons((prev) => prev.map((s) => (s.id === salonId ? updated : s)));
      return updated;
    });
  }, [handleRequest, getCityFromCoordinates]);

  const deleteSalon = useCallback(async (salonId: string) => {
    return handleRequest(async () => {
      if (userSalons) {
        const updatedUserSalons = { ...userSalons, salons: userSalons.salons.filter(s => s.salonId !== salonId) };
        await salonActions.updateUserSalonsAction(userSalons.userId, updatedUserSalons);
        setUserSalons(updatedUserSalons);
      }

      await salonActions.deleteSalonAction(salonId);
      setSalons(prev => prev.filter(s => s.id !== salonId));
    });
  }, [handleRequest, userSalons]);

  const updateAvatar = useCallback(async (salonId: string, file: File): Promise<Salon> => {
    return handleRequest(async () => {
      const { url, storagePath } = await uploadSalonAvatar(salonId, file);
      await salonActions.updateSalonAvatarDbAction(salonId, url, storagePath);
      
      const updatedSalon = await salonActions.getSalonByIdAction(salonId);
      if (!updatedSalon) {
        throw new Error("Не удалось получить обновленные данные салона после загрузки аватара.");
      }

      setSalons((prev) => prev.map((s) => (s.id === salonId ? updatedSalon : s)));
      return updatedSalon;
    });
  }, [handleRequest]);

  const removeAvatar = useCallback(async (salonId: string): Promise<void> => {
    return handleRequest(async () => {
      const currentSalon = salons.find(s => s.id === salonId) || await salonActions.getSalonByIdAction(salonId);
      
      if (currentSalon?.avatarStoragePath) {
        await deleteSalonAvatar(currentSalon.avatarStoragePath);
      }

      await salonActions.removeSalonAvatarDbAction(salonId);

      const updatedSalonData = { avatarUrl: '', avatarStoragePath: '' };
      setSalons((prev) => prev.map((s) => (s.id === salonId ? { ...s, ...updatedSalonData } : s)));
    });
  }, [handleRequest, salons]);

  const fetchSalonsByCity = useCallback((options: { city: string; limit: number; startAfterKey?: string }) => {
    return handleRequest(() => salonActions.getSalonsByCityPaginatedAction(options));
  }, [handleRequest]);

  const updateSalonMembers = useCallback(async (salonId: string, updatedMembers: SalonMember[]) => {
    return handleRequest(async () => {
      const originalSalon = salons.find(s => s.id === salonId) || await salonActions.getSalonByIdAction(salonId);
      if (!originalSalon) throw new Error(`Салон с ID ${salonId} не найден.`);
      
      const originalMembers = originalSalon.members || [];
      const originalUserIds = originalMembers.map(m => m.userId);
      const newUserIds = updatedMembers.map(m => m.userId);
      const allAffectedUserIds = Array.from(new Set([...originalUserIds, ...newUserIds]));

      await salonActions.updateSalonAction(salonId, { members: updatedMembers });

      await Promise.all(allAffectedUserIds.map(async (userId) => {
        try {
          const userSalonsData = await salonActions.getUserSalonsAction(userId);
          const newMemberInfo = updatedMembers.find(m => m.userId === userId);
          let updatedUserSalonsList = userSalonsData?.salons || [];

          if (newMemberInfo) {
            const existingEntryIndex = updatedUserSalonsList.findIndex(s => s.salonId === salonId);
            if (existingEntryIndex > -1) {
              updatedUserSalonsList[existingEntryIndex].role = newMemberInfo.role;
            } else {
              updatedUserSalonsList.push({ salonId, role: newMemberInfo.role, joinedAt: newMemberInfo.joinedAt });
            }
          } else {
            updatedUserSalonsList = updatedUserSalonsList.filter(s => s.salonId !== salonId);
          }
          
          if (userSalonsData) {
            await salonActions.updateUserSalonsAction(userId, { salons: updatedUserSalonsList });
          } else if (newMemberInfo) {
             // ИСПРАВЛЕНО: Добавлен userId в объект данных
             await salonActions.createUserSalonsAction(userId, { userId, salons: updatedUserSalonsList });
          }

        } catch (e) {
          console.error(`Error updating user ${userId}:`, e);
        }
      }));

      setSalons(prev => prev.map(s => s.id === salonId ? { ...s, members: updatedMembers } : s));
    });
  }, [handleRequest, salons]);
  
  const value: SalonContextType = useMemo(() => ({
    salons, userSalons, updateSalonMembers, fetchSalon, fetchUserSalons, createSalon, updateSalon, deleteSalon, fetchSalonsByCity, loading, error, updateAvatar, removeAvatar,
  }), [
    salons, userSalons, updateSalonMembers, fetchSalon, fetchUserSalons, createSalon, updateSalon, deleteSalon, fetchSalonsByCity, loading, error, updateAvatar, removeAvatar,
  ]);

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
};