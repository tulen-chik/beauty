'use client';

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// 1. Импорт серверных действий

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
  // Добавлен новый метод в интерфейс
  getSalonAvatar: (salonId: string) => Promise<{ url: string; storagePath: string } | null>;
  
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
      const response = await fetch(`/api/salons/${salonId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch salon');
      }
      const salon = await response.json();
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
      const response = await fetch(`/api/users/${userId}/salons`);
      if (!response.ok) {
        if (response.status === 404) {
            setUserSalons(null);
            return null;
        }
        throw new Error('Failed to fetch user salons');
      }
      const data = await response.json();
      
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

      const userSalonsResponse = await fetch(`/api/users/${userId}/salons`);
      let currentUserSalons = null;
      if (userSalonsResponse.ok) {
        currentUserSalons = await userSalonsResponse.json();
      } else if (userSalonsResponse.status !== 404) {
        throw new Error('Failed to get user salons');
      }

      if (currentUserSalons && currentUserSalons.salons.length >= 3) {
        throw new Error('Вы не можете иметь более 3 салонов');
      }

      const finalSalonData = { ...data, city: salonCity };

      const createSalonResponse = await fetch('/api/salons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salonId, ...finalSalonData }),
      });
      if (!createSalonResponse.ok) throw new Error('Failed to create salon');
      const salon = await createSalonResponse.json();

      const newSalonEntry = { salonId, role: 'owner' as SalonRole, joinedAt: new Date().toISOString() };

      if (currentUserSalons) {
        await fetch(`/api/users/${userId}/salons`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salons: [...currentUserSalons.salons, newSalonEntry] }),
        });
      } else {
        await fetch(`/api/users/${userId}/salons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, salons: [newSalonEntry] }),
        });
      }

      setSalons((prev) => [...prev, salon]);
      const updatedUserSalonsResponse = await fetch(`/api/users/${userId}/salons`);
      if (!updatedUserSalonsResponse.ok) throw new Error('Failed to fetch updated user salons');
      const updatedUserSalons = await updatedUserSalonsResponse.json();
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

      const response = await fetch(`/api/salons/${salonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpdate),
      });
      if (!response.ok) throw new Error('Failed to update salon');
      const updated = await response.json();
      
      setSalons((prev) => prev.map((s) => (s.id === salonId ? updated : s)));
      return updated;
    });
  }, [handleRequest, getCityFromCoordinates]);

  const deleteSalon = useCallback(async (salonId: string) => {
    return handleRequest(async () => {
      if (userSalons) {
        const updatedUserSalonsList = userSalons.salons.filter(s => s.salonId !== salonId);
        await fetch(`/api/users/${userSalons.userId}/salons`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salons: updatedUserSalonsList }),
        });
        setUserSalons({ ...userSalons, salons: updatedUserSalonsList });
      }

      await fetch(`/api/salons/${salonId}`, { method: 'DELETE' });
      setSalons(prev => prev.filter(s => s.id !== salonId));
    });
  }, [handleRequest, userSalons]);

  const updateAvatar = useCallback(async (salonId: string, file: File): Promise<Salon> => {
    return handleRequest(async () => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('salonId', salonId);

      const resp = await fetch('/api/upload/salon-avatar', {
        method: 'POST',
        body: fd,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || 'Не удалось загрузить аватар салона');
      }
      const { url, storagePath } = await resp.json();

      const updateResponse = await fetch(`/api/salons/${salonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: url, avatarStoragePath: storagePath }),
      });
      if (!updateResponse.ok) throw new Error('Failed to update salon with new avatar');
      const updatedSalon = await updateResponse.json();

      setSalons((prev) => prev.map((s) => (s.id === salonId ? updatedSalon : s)));
      return updatedSalon;
    });
  }, [handleRequest]);

  const removeAvatar = useCallback(async (salonId: string): Promise<void> => {
    return handleRequest(async () => {
      let currentSalon = salons.find(s => s.id === salonId);
      if (!currentSalon) {
        const response = await fetch(`/api/salons/${salonId}`);
        if (response.ok) {
          currentSalon = await response.json();
        }
      }
      
      if (currentSalon?.avatarStoragePath) {
        const response = await fetch('/api/upload/salon-avatar/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storagePath: currentSalon.avatarStoragePath }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error || 'Не удалось удалить аватар салона');
        }
      }

      await fetch(`/api/salons/${salonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: '', avatarStoragePath: '' }),
      });

      const updatedSalonData = { avatarUrl: '', avatarStoragePath: '' };
      setSalons((prev) => prev.map((s) => (s.id === salonId ? { ...s, ...updatedSalonData } : s)));
    });
  }, [handleRequest, salons]);

  // --- Новый метод: Получение аватара ---
  const getSalonAvatar = useCallback((salonId: string) => {
    // Передаем false вторым аргументом, чтобы не включать глобальный лоадер при загрузке картинки
    return handleRequest(async () => {
      const response = await fetch(`/api/salons/${salonId}/avatar`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch salon avatar');
      }
      return await response.json();
    }, false);
  }, [handleRequest]);

  const fetchSalonsByCity = useCallback((options: { city: string; limit: number; startAfterKey?: string }) => {
    return handleRequest(async () => {
      const { city, limit, startAfterKey } = options;
      const params = new URLSearchParams({
        city,
        limit: String(limit),
      });
      if (startAfterKey) {
        params.append('startAfterKey', startAfterKey);
      }
      const response = await fetch(`/api/salons?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch salons by city');
      }
      return await response.json();
    });
  }, [handleRequest]);

  const updateSalonMembers = useCallback(async (salonId: string, updatedMembers: SalonMember[]) => {
    return handleRequest(async () => {
      let originalSalon = salons.find(s => s.id === salonId);
      if (!originalSalon) {
        const response = await fetch(`/api/salons/${salonId}`);
        if (!response.ok) throw new Error(`Салон с ID ${salonId} не найден.`);
        originalSalon = await response.json();
      }
      if (!originalSalon) throw new Error(`Салон с ID ${salonId} не найден.`);

      const originalMembers = originalSalon.members || [];
      const originalUserIds = originalMembers.map(m => m.userId);
      const newUserIds = updatedMembers.map(m => m.userId);
      const allAffectedUserIds = Array.from(new Set([...originalUserIds, ...newUserIds]));

      await fetch(`/api/salons/${salonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers }),
      });

      await Promise.all(allAffectedUserIds.map(async (userId) => {
        try {
          const userSalonsResponse = await fetch(`/api/users/${userId}/salons`);
          let userSalonsData = null;
          if (userSalonsResponse.ok) {
            userSalonsData = await userSalonsResponse.json();
          } else if (userSalonsResponse.status !== 404) {
            throw new Error('Failed to get user salons');
          }

          const newMemberInfo = updatedMembers.find(m => m.userId === userId);
          let updatedUserSalonsList = userSalonsData?.salons || [];

          if (newMemberInfo) {
            const existingEntryIndex = updatedUserSalonsList.findIndex((s: { salonId: string }) => s.salonId === salonId);
            if (existingEntryIndex > -1) {
              updatedUserSalonsList[existingEntryIndex].role = newMemberInfo.role;
            } else {
              updatedUserSalonsList.push({ salonId, role: newMemberInfo.role, joinedAt: newMemberInfo.joinedAt });
            }
          } else {
            updatedUserSalonsList = updatedUserSalonsList.filter((s: { salonId: string }) => s.salonId !== salonId);
          }

          if (userSalonsData) {
            await fetch(`/api/users/${userId}/salons`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ salons: updatedUserSalonsList }),
            });
          } else if (newMemberInfo) {
            await fetch(`/api/users/${userId}/salons`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, salons: updatedUserSalonsList }),
            });
          }
        } catch (e) {
          console.error(`Error updating user ${userId}:`, e);
        }
      }));

      setSalons(prev => prev.map(s => s.id === salonId ? { ...s, members: updatedMembers } : s));
    });
  }, [handleRequest, salons]);
  
  const value: SalonContextType = useMemo(() => ({
    salons, 
    userSalons, 
    updateSalonMembers, 
    fetchSalon, 
    fetchUserSalons, 
    createSalon, 
    updateSalon, 
    deleteSalon, 
    fetchSalonsByCity, 
    loading, 
    error, 
    updateAvatar, 
    removeAvatar,
    getSalonAvatar // Добавляем метод в value
  }), [
    salons, 
    userSalons, 
    updateSalonMembers, 
    fetchSalon, 
    fetchUserSalons, 
    createSalon, 
    updateSalon, 
    deleteSalon, 
    fetchSalonsByCity, 
    loading, 
    error, 
    updateAvatar, 
    removeAvatar,
    getSalonAvatar // Добавляем метод в зависимости
  ]);

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
};