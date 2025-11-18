'use client';

import React, { 
  createContext, 
  ReactNode, 
  useCallback,
  useContext, 
  useMemo, 
  useState
} from 'react';

// 1. Импорт серверных действий (предполагаемый путь)
import * as salonActions from '@/app/actions/salonActions';

// 2. Импорт клиентских функций для Storage (так как файлы грузим с клиента)
import { 
  deleteServiceImage, 
  getServiceImages, 
  uploadServiceImage 
} from '@/lib/firebase/database';

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
    return handleRequest(() => salonActions.getSalonServiceByIdAction(serviceId));
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

      // Вызываем серверное действие
      return await salonActions.createSalonServiceAction(serviceId, serviceDataWithCity);
    });
  }, [handleRequest, fetchSalon, getCityFromCoordinates, userCity]);

  const updateService = useCallback((serviceId: string, data: Partial<SalonService>) => {
    return handleRequest(() => salonActions.updateSalonServiceAction(serviceId, data));
  }, [handleRequest]);

  const deleteService = useCallback((serviceId: string) => {
    return handleRequest(() => salonActions.deleteSalonServiceAction(serviceId));
  }, [handleRequest]);

  // --- Списки услуг ---

  const getServicesBySalon = useCallback((salonId: string, options: { search?: string; limit?: number } = {}) => {
    return handleRequest(async () => {
      // Получаем все услуги салона через серверное действие
      let services = await salonActions.getServicesBySalonAction(salonId);

      // Фильтрация по поиску происходит на клиенте (или можно добавить параметр search в Server Action)
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        services = services.filter(s => 
          s.name.toLowerCase().includes(searchLower) ||
          (s.description?.toLowerCase().includes(searchLower) ?? false)
        );
      }
      
      if (options.limit) {
        services = services.slice(0, options.limit);
      }
      
      return services;
    });
  }, [handleRequest]);

  const getAllServices = useCallback((options: { limit: number; startAfterKey?: string }) => {
    return handleRequest(() => salonActions.getSalonServicesPaginatedAction(options));
  }, [handleRequest]);

  const getServicesByCity = useCallback((options: { city: string; limit: number; startAfterKey?: string }) => {
    return handleRequest(() => salonActions.getSalonServicesByCityPaginatedAction(options));
  }, [handleRequest]);

  // --- Работа с изображениями ---
  // Примечание: Загрузка файлов обычно остается на клиенте (Firebase Storage SDK), 
  // так как передача File через Server Actions требует FormData.
  // Мы используем существующие клиентские функции, но оборачиваем их в handleRequest для обработки ошибок.

  const uploadImage = useCallback((serviceId: string, file: File) => {
    return handleRequest(() => uploadServiceImage(serviceId, file));
  }, [handleRequest]);

  const deleteImage = useCallback((storagePath: string, serviceId?: string) => {
    return handleRequest(async () => {
      await deleteServiceImage(storagePath);
      // Если нужно обновить UI или кэш, это произойдет автоматически при следующем запросе данных,
      // так как мы не храним локальный кэш в этом контексте.
    });
  }, [handleRequest]);

  const getImages = useCallback((serviceId: string) => {
    return handleRequest(() => getServiceImages(serviceId), false); // false = не показывать глобальный лоадер для картинок
  }, [handleRequest]);

  // --- Сборка значения контекста ---

  const value: SalonServiceContextType = useMemo(() => ({
    getService,
    createService,
    updateService,
    deleteService,
    getServicesBySalon,
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