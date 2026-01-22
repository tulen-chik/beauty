'use client';

import React, { 
  createContext, 
  ReactNode, 
  useCallback,
  useContext, 
  useMemo, 
  useState
} from 'react';


import type { 
  SalonService, 
  ServiceImage 
} from '@/types/database';

import { useGeolocation } from './GeolocationContext';
import { useSalon } from './SalonContext';

// Интерфейс контекста (остался без изменений для совместимости)
interface SalonServiceContextType {
  // --- CRUD операции для одной услуги ---
  getService: (serviceId: string) => Promise<SalonService | null>;
  createService: (serviceId: string, data: Omit<SalonService, 'id' | 'city' | 'createdAt' | 'updatedAt'>) => Promise<SalonService>;
  updateService: (serviceId: string, data: Partial<SalonService>) => Promise<SalonService>;
  deleteService: (serviceId: string) => Promise<void>;

  // --- Методы для получения списков услуг ---
  getServicesBySalon: (salonId: string, options?: { search?: string; limit?: number }) => Promise<SalonService[]>;
  getServicesBySalonPaginated: (options: { salonId: string; limit: number; startAfterKey?: string }) => Promise<{ services: SalonService[]; nextKey: string | null }>;
  getAllServices: (options: { limit: number; startAfterKey?: string }) => Promise<{ services: SalonService[]; nextKey: string | null }>;
  getServicesByCity: (options: { city: string; limit: number; startAfterKey?: string }) => Promise<{ services: SalonService[]; nextKey: string | null }>;

  // --- Методы для работы с изображениями ---
  uploadImage: (serviceId: string, file: File) => Promise<ServiceImage>;
  deleteImage: (storagePath: string, serviceId?: string) => Promise<void>;
  getImages: (serviceId: string) => Promise<ServiceImage[]>;

  // --- Состояния контекста ---
  loading: boolean;
  error: string | null;
}

const SalonServiceContext = createContext<SalonServiceContextType | undefined>(undefined);

export const useSalonService = () => {
  const ctx = useContext(SalonServiceContext);
  if (!ctx) throw new Error('useSalonService must be used within a SalonServiceProvider');
  return ctx;
};

export const SalonServiceProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getCityFromCoordinates, city: userCity } = useGeolocation(); 
  const { fetchSalon } = useSalon();

  // Обертка для вызова действий (как в ChatContext)
  const handleRequest = useCallback(async <T,>(request: () => Promise<T>, showLoading = true): Promise<T> => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await request();
      if (showLoading) setLoading(false);
      return result;
    } catch (e: any) {
      console.error("Service Context Error:", e);
      setError(e.message || 'An unexpected error occurred');
      if (showLoading) setLoading(false);
      throw e;
    }
  }, []);

  // --- CRUD операции ---

  const getService = useCallback((serviceId: string) => {
    return handleRequest(async () => {
      const response = await fetch(`/api/services/${serviceId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to get service');
      }
      return await response.json();
    });
  }, [handleRequest]);

  const createService = useCallback(async (serviceId: string, data: Omit<SalonService, 'id' | 'city' | 'createdAt' | 'updatedAt'>) => {
    return handleRequest(async () => {
      // Логика определения города остается на клиенте, так как использует хук useGeolocation
      const salon = await fetchSalon(data.salonId);
      if (!salon) {
        throw new Error('Salon not found');
      }

      let city: string | null = null;
      if (salon.coordinates && salon.coordinates.lat && salon.coordinates.lng) {
        const coords = { latitude: salon.coordinates.lat, longitude: salon.coordinates.lng };
        city = await getCityFromCoordinates(coords);
      }
      if (!city || city === 'Unknown City') {
        city = userCity;
      }
      if (!city) {
        throw new Error('Could not determine city for the service');
      }

      // Подготавливаем данные
      const serviceDataWithCity = {
        ...data,
        city,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Вызываем API endpoint
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, ...serviceDataWithCity }),
      });
      if (!response.ok) {
        throw new Error('Failed to create service');
      }
      return await response.json();
    });
  }, [handleRequest, fetchSalon, getCityFromCoordinates, userCity]);

  const updateService = useCallback((serviceId: string, data: Partial<SalonService>) => {
    return handleRequest(async () => {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update service');
      }
      return await response.json();
    });
  }, [handleRequest]);

  const deleteService = useCallback((serviceId: string) => {
    return handleRequest(async () => {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete service');
      }
    });
  }, [handleRequest]);

  // --- Списки услуг ---

  const getServicesBySalon = useCallback((salonId: string, options: { search?: string; limit?: number } = {}) => {
    return handleRequest(async () => {
      const params = new URLSearchParams();
      if (options.search) {
        params.append('search', options.search);
      }
      if (options.limit) {
        params.append('limit', String(options.limit));
      }
      const response = await fetch(`/api/salons/${salonId}/services?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to get services for salon');
      }
      return await response.json();
    });
  }, [handleRequest]);

  const getServicesBySalonPaginated = useCallback((options: { salonId: string; limit: number; startAfterKey?: string }) => {
    return handleRequest(async () => {
      const { salonId, limit, startAfterKey } = options;
      const params = new URLSearchParams({ limit: String(limit) });
      if (startAfterKey) {
        params.append('startAfterKey', startAfterKey);
      }
      const response = await fetch(`/api/salons/${salonId}/services?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to get paginated services for salon');
      }
      return await response.json();
    });
  }, [handleRequest]);

  const getAllServices = useCallback((options: { limit: number; startAfterKey?: string }) => {
    return handleRequest(async () => {
      const { limit, startAfterKey } = options;
      const params = new URLSearchParams({ limit: String(limit) });
      if (startAfterKey) {
        params.append('startAfterKey', startAfterKey);
      }
      const response = await fetch(`/api/services?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to get all services');
      }
      return await response.json();
    });
  }, [handleRequest]);

  const getServicesByCity = useCallback((options: { city: string; limit: number; startAfterKey?: string }) => {
    return handleRequest(async () => {
      const { city, limit, startAfterKey } = options;
      const params = new URLSearchParams({ city, limit: String(limit) });
      if (startAfterKey) {
        params.append('startAfterKey', startAfterKey);
      }
      const response = await fetch(`/api/services?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to get services by city');
      }
      return await response.json();
    });
  }, [handleRequest]);

  // --- Работа с изображениями ---
  // Примечание: Загрузка файлов обычно остается на клиенте (Firebase Storage SDK), 
  // так как передача File через Server Actions требует FormData.
  // Мы используем существующие клиентские функции, но оборачиваем их в handleRequest для обработки ошибок.

  const uploadImage = useCallback((serviceId: string, file: File) => {
    return handleRequest(async () => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/services/${serviceId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      return await response.json();
    });
  }, [handleRequest]);

  const deleteImage = useCallback((storagePath: string, serviceId?: string) => {
    return handleRequest(async () => {
      const encodedPath = encodeURIComponent(storagePath);
      const response = await fetch(`/api/services/images/${encodedPath}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
    });
  }, [handleRequest]);

  const getImages = useCallback((serviceId: string) => {
    return handleRequest(async () => {
      const response = await fetch(`/api/services/${serviceId}/images`);
      if (!response.ok) {
        throw new Error('Failed to get images');
      }
      return await response.json();
    }, false);
  }, [handleRequest]);

  // --- Сборка значения контекста ---

  const value: SalonServiceContextType = useMemo(() => ({
    getService,
    createService,
    updateService,
    deleteService,
    getServicesBySalon,
    getServicesBySalonPaginated,
    getAllServices, 
    getServicesByCity,
    uploadImage,
    deleteImage,
    getImages,
    loading,
    error,
  }), [
    getService,
    createService,
    updateService,
    deleteService,
    getServicesBySalon,
    getServicesBySalonPaginated,
    getAllServices, 
    getServicesByCity,
    uploadImage,
    deleteImage,
    getImages,
    loading,
    error,
  ]);

  return (
    <SalonServiceContext.Provider value={value}>
      {children}
    </SalonServiceContext.Provider>
  );
};