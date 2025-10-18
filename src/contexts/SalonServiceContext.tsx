import React, { 
  createContext, 
  ReactNode, 
  useCallback,
  useContext, 
  useEffect, 
  useMemo, 
  useRef,
  useState
} from 'react';

import { 
  deleteServiceImage, 
  getServiceImages,
  getSalonServicesPaginated, 
  getServicesBySalonFromDB,   
  salonServiceOperations, 
  uploadServiceImage,
  getSalonServicesByCityPaginated, 
} from '@/lib/firebase/database';

import type { 
  SalonService, 
  ServiceImage 
} from '@/types/database';
import { useGeolocation } from './GeolocationContext';
import { useSalon } from './SalonContext';

// Класс для кастомных ошибок
class ServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Кэш в памяти для данных услуг
const serviceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 минуты

// Хелпер для работы с кэшем
const withServiceCache = async <T,>(
  key: string,
  fn: () => Promise<T>,
  useCache = true
): Promise<T> => {
  const now = Date.now();
  const cached = serviceCache.get(key);
  
  if (useCache && cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const data = await fn();
  serviceCache.set(key, { data, timestamp: now });
  return data;
};

/**
 * Определяет полный интерфейс для контекста управления услугами салона.
 */
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
  const pendingRequests = useRef(new Map<string, Promise<any>>());

  const { getCityFromCoordinates, city: userCity } = useGeolocation(); 
  const { fetchSalon } = useSalon();

  // --- CRUD операции (без изменений) ---

  const getService = useCallback(async (serviceId: string, useCache = true) => {
    const cacheKey = `service_${serviceId}`;
    if (pendingRequests.current.has(cacheKey)) {
      return pendingRequests.current.get(cacheKey);
    }
    const fetchOperation = async () => {
      try {
        setLoading(true);
        setError(null);
        return await withServiceCache<SalonService | null>(
          cacheKey,
          () => salonServiceOperations.read(serviceId),
          useCache
        );
      } catch (e: any) {
        const err = e instanceof Error ? e : new Error('Failed to fetch service');
        setError(err.message);
        throw new ServiceError(err.message, 'SERVICE_FETCH_ERROR');
      } finally {
        pendingRequests.current.delete(cacheKey);
        setLoading(false);
      }
    };
    const request = fetchOperation();
    pendingRequests.current.set(cacheKey, request);
    return request;
  }, []);

  const createService = useCallback(async (serviceId: string, data: Omit<SalonService, 'id' | 'city' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const salon = await fetchSalon(data.salonId);
      if (!salon) {
        throw new ServiceError('Salon not found', 'SALON_NOT_FOUND');
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
        throw new ServiceError('Could not determine city for the service', 'CITY_NOT_FOUND');
      }

      // Создаем полный объект с городом и временными метками
      const serviceDataWithAllFields: Omit<SalonService, 'id'> = {
        ...data,
        city,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Оптимистичное обновление
      const optimisticService: SalonService = { 
        ...serviceDataWithAllFields, 
        id: serviceId, 
      };
      serviceCache.set(`service_${serviceId}`, { data: optimisticService, timestamp: Date.now() });

      // Создаем услугу в базе данных
      const service = await salonServiceOperations.create(serviceId, serviceDataWithAllFields);
      return service;
    } catch (e: any) {
      serviceCache.delete(`service_${serviceId}`); 
      const err = e instanceof Error ? e : new Error('Failed to create service');
      setError(err.message);
      throw new ServiceError(err.message, 'SERVICE_CREATE_ERROR');
    } finally {
      setLoading(false);
    }
  }, [fetchSalon, getCityFromCoordinates, userCity]);

  const updateService = useCallback(async (serviceId: string, data: Partial<SalonService>) => {
    const cacheKey = `service_${serviceId}`;
    const previousData = serviceCache.get(cacheKey)?.data as SalonService | undefined;
    try {
      setLoading(true);
      setError(null);
      if (previousData) {
        const optimisticUpdate = { ...previousData, ...data, updatedAt: new Date().toISOString() };
        serviceCache.set(cacheKey, { data: optimisticUpdate, timestamp: Date.now() });
      }
      const updated = await salonServiceOperations.update(serviceId, data);
      return updated;
    } catch (e: any) {
      if (previousData) {
        serviceCache.set(cacheKey, { data: previousData, timestamp: Date.now() });
      }
      const err = e instanceof Error ? e : new Error('Failed to update service');
      setError(err.message);
      throw new ServiceError(err.message, 'SERVICE_UPDATE_ERROR');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteService = useCallback(async (serviceId: string) => {
    const cacheKey = `service_${serviceId}`;
    const previousData = serviceCache.get(cacheKey)?.data as SalonService | undefined;
    try {
      setLoading(true);
      setError(null);
      serviceCache.delete(cacheKey);
      await salonServiceOperations.delete(serviceId);
    } catch (e: any) {
      if (previousData) {
        serviceCache.set(cacheKey, { data: previousData, timestamp: Date.now() });
      }
      const err = e instanceof Error ? e : new Error('Failed to delete service');
      setError(err.message);
      throw new ServiceError(err.message, 'SERVICE_DELETE_ERROR');
    } finally {
      setLoading(false);
    }
  }, []);

  const getServicesBySalon = useCallback(async (salonId: string, options: { search?: string; limit?: number } = {}) => {
    const { search = '', limit } = options;
    const cacheKey = `salon_${salonId}_services`;
    
    if (pendingRequests.current.has(cacheKey)) {
      return pendingRequests.current.get(cacheKey);
    }

    const fetchOperation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let services = await withServiceCache<SalonService[]>(
          cacheKey,
          () => getServicesBySalonFromDB(salonId), // Используем быструю функцию с серверной фильтрацией
          !search // Не кэшируем при поиске
        );

        if (search) {
          const searchLower = search.toLowerCase();
          services = services.filter(s => 
            s.name.toLowerCase().includes(searchLower) ||
            (s.description?.toLowerCase().includes(searchLower) ?? false)
          );
        }
        
        if (limit) {
          services = services.slice(0, limit);
        }
            
        return services;
      } catch (e: any) {
        const err = e instanceof Error ? e : new Error('Failed to fetch salon services');
        setError(err.message);
        throw new ServiceError(err.message, 'SERVICES_FETCH_ERROR');
      } finally {
        pendingRequests.current.delete(cacheKey);
        setLoading(false);
      }
    };

    const request = fetchOperation();
    pendingRequests.current.set(cacheKey, request);
    return request;
  }, []);

  const getAllServices = useCallback(async (options: { limit: number; startAfterKey?: string }) => {
    console.log('getAllServices called with options:', options);
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching services from database...');
      const result = await getSalonServicesPaginated(options);
      console.log('Successfully fetched services:', {
        count: result.services.length,
        nextKey: result.nextKey,
        sampleService: result.services[0] || 'No services found'
      });
      return result;
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('Error in getAllServices:', {
        error: errorMessage,
        stack: e.stack,
        options
      });
      setError(errorMessage);
      throw new ServiceError(errorMessage, 'ALL_SERVICES_FETCH_ERROR');
    } finally {
      console.log('Finished getAllServices, setting loading to false');
      setLoading(false);
    }
  }, []);

  const getServicesByCity = useCallback(async (options: { city: string; limit: number; startAfterKey?: string }) => {
    const { city, limit, startAfterKey } = options;
    // Ключ кэша зависит от города и ключа последней страницы
    const cacheKey = `services_city_${city}_${startAfterKey || 'first'}`;

    if (pendingRequests.current.has(cacheKey)) {
      return pendingRequests.current.get(cacheKey);
    }

    const fetchOperation = async () => {
      try {
        setLoading(true);
        setError(null);
        // Используем кэш для пагинированных данных
        return await withServiceCache(
          cacheKey,
          () => getSalonServicesByCityPaginated({ city, limit, startAfterKey })
        );
      } catch (e: any) {
        const err = e instanceof Error ? e : new Error('Failed to fetch services by city');
        setError(err.message);
        throw new ServiceError(err.message, 'CITY_SERVICES_FETCH_ERROR');
      } finally {
        pendingRequests.current.delete(cacheKey);
        setLoading(false);
      }
    };

    const request = fetchOperation();
    pendingRequests.current.set(cacheKey, request);
    return request;
  }, []);

  const uploadImage = useCallback(async (serviceId: string, file: File) => {
    try {
      setLoading(true);
      setError(null);
      serviceCache.delete(`service_${serviceId}_images`);
      return await uploadServiceImage(serviceId, file);
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error('Failed to upload image');
      setError(err.message);
      throw new ServiceError(err.message, 'IMAGE_UPLOAD_ERROR');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteImage = useCallback(async (storagePath: string, serviceId?: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteServiceImage(storagePath);
      if (serviceId) {
        serviceCache.delete(`service_${serviceId}_images`);
      }
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error('Failed to delete image');
      setError(err.message);
      throw new ServiceError(err.message, 'IMAGE_DELETE_ERROR');
    } finally {
      setLoading(false);
    }
  }, []);

  const getImages = useCallback(async (serviceId: string) => {
    const cacheKey = `service_${serviceId}_images`;
    if (pendingRequests.current.has(cacheKey)) {
      return pendingRequests.current.get(cacheKey);
    }
    const fetchOperation = async () => {
      try {
        setLoading(true);
        setError(null);
        return await withServiceCache<ServiceImage[]>(
          cacheKey,
          () => getServiceImages(serviceId)
        );
      } catch (e: any) {
        const err = e instanceof Error ? e : new Error('Failed to fetch service images');
        setError(err.message);
        throw new ServiceError(err.message, 'IMAGES_FETCH_ERROR');
      } finally {
        pendingRequests.current.delete(cacheKey);
        setLoading(false);
      }
    };
    const request = fetchOperation();
    pendingRequests.current.set(cacheKey, request);
    return request;
  }, []);

  // --- Эффекты и сборка контекста ---

  useEffect(() => {
    return () => {
      pendingRequests.current.clear();
    };
  }, []);

  const value: SalonServiceContextType = useMemo(() => ({
    getService,
    createService,
    updateService,
    deleteService,
    getServicesBySalon,
    getAllServices, 
    uploadImage,
    deleteImage,
    getImages,
    getServicesByCity,
    loading,
    error,
  }), [
    getService,
    createService,
    updateService,
    deleteService,
    getServicesBySalon,
    getAllServices, 
    uploadImage,
    deleteImage,
    getImages,
    getServicesByCity,
    loading,
    error,
  ]);

  return (
    <SalonServiceContext.Provider value={value}>
      {children}
    </SalonServiceContext.Provider>
  );
};