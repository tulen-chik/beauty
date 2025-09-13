import React, { 
  createContext, 
  useContext, 
  useState, 
  ReactNode, 
  useMemo, 
  useCallback,
  useRef,
  useEffect 
} from 'react';
import { 
  salonServiceOperations, 
  getAllSalonServices, 
  uploadServiceImage, 
  deleteServiceImage, 
  getServiceImages,
} from '@/lib/firebase/database';
import type { 
  SalonService, 
  ServiceImage 
} from '@/types/database';

// Error boundary for service operations
class ServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Cache for service data with TTL
const serviceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Helper function to handle service cache
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
 * Определяет полный интерфейс для контекста управления услугами салона,
 * включая CRUD операции, работу с изображениями и управление продвижением.
 */
interface SalonServiceContextType {
  // --- Методы для работы с данными услуги ---
  getService: (serviceId: string) => Promise<SalonService | null>;
  createService: (serviceId: string, data: Omit<SalonService, 'id'>) => Promise<SalonService>;
  updateService: (serviceId: string, data: Partial<SalonService>) => Promise<SalonService>;
  deleteService: (serviceId: string) => Promise<void>;
  getServicesBySalon: (salonId: string) => Promise<SalonService[]>;

  // --- Методы для работы с изображениями услуги ---
  uploadImage: (serviceId: string, file: File) => Promise<ServiceImage>;
  deleteImage: (storagePath: string) => Promise<void>;
  getImages: (serviceId: string) => Promise<ServiceImage[]>;

  // --- Состояния контекста ---
  loading: boolean;
  error: string | null;
}

const SalonServiceContext = createContext<SalonServiceContextType | undefined>(undefined);

/**
 * Хук для удобного доступа к SalonServiceContext.
 */
export const useSalonService = () => {
  const ctx = useContext(SalonServiceContext);
  if (!ctx) throw new Error('useSalonService must be used within a SalonServiceProvider');
  return ctx;
};

/**
 * Провайдер, который предоставляет состояние и методы для управления услугами салона.
 * Этот провайдер теперь полностью независим и не требует SalonProvider в качестве родителя.
 */
export const SalonServiceProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRequests = useRef(new Map<string, Promise<any>>());
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // --- Реализация существующих методов ---

  const getService = useCallback(async (serviceId: string, useCache = true) => {
    const cacheKey = `service_${serviceId}`;
    
    // Check for pending request
    if (pendingRequests.current.has(cacheKey)) {
      return pendingRequests.current.get(cacheKey);
    }

    const fetchOperation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const service = await withServiceCache<SalonService | null>(
          cacheKey,
          async () => await salonServiceOperations.read(serviceId),
          useCache
        );
        
        return service;
      } catch (e: any) {
        const error = e instanceof Error ? e : new Error('Failed to fetch service');
        setError(error.message);
        throw new ServiceError(error.message, 'SERVICE_FETCH_ERROR');
      } finally {
        pendingRequests.current.delete(cacheKey);
        setLoading(false);
      }
    };

    const request = fetchOperation();
    pendingRequests.current.set(cacheKey, request);
    return request;
  }, []);

  const createService = useCallback(async (serviceId: string, data: Omit<SalonService, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Optimistic update
      const optimisticService: SalonService = {
        ...data,
        id: serviceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Update cache optimistically
      serviceCache.set(`service_${serviceId}`, { 
        data: optimisticService, 
        timestamp: Date.now() 
      });
      
      const service = await salonServiceOperations.create(serviceId, data);
      return service;
    } catch (e: any) {
      // Revert optimistic update on error
      serviceCache.delete(`service_${serviceId}`); 
      const error = e instanceof Error ? e : new Error('Failed to create service');
      setError(error.message);
      throw new ServiceError(error.message, 'SERVICE_CREATE_ERROR');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateService = useCallback(async (serviceId: string, data: Partial<SalonService>) => {
    const cacheKey = `service_${serviceId}`;
    const previousData = serviceCache.get(cacheKey)?.data as SalonService | undefined;
    
    try {
      setLoading(true);
      setError(null);
      
      // Optimistic update
      if (previousData) {
        const optimisticUpdate = {
          ...previousData,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        serviceCache.set(cacheKey, { 
          data: optimisticUpdate, 
          timestamp: Date.now() 
        });
      }
      
      const updated = await salonServiceOperations.update(serviceId, data);
      return updated;
    } catch (e: any) {
      // Revert optimistic update on error
      if (previousData) {
        serviceCache.set(cacheKey, { 
          data: previousData, 
          timestamp: Date.now() 
        });
      }
      const error = e instanceof Error ? e : new Error('Failed to update service');
      setError(error.message);
      throw new ServiceError(error.message, 'SERVICE_UPDATE_ERROR');
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
      
      // Optimistic update
      serviceCache.delete(cacheKey);
      
      await salonServiceOperations.delete(serviceId);
    } catch (e: any) {
      // Revert optimistic update on error
      if (previousData) {
        serviceCache.set(cacheKey, { 
          data: previousData, 
          timestamp: Date.now() 
        });
      }
      const error = e instanceof Error ? e : new Error('Failed to delete service');
      setError(error.message);
      throw new ServiceError(error.message, 'SERVICE_DELETE_ERROR');
    } finally {
      setLoading(false);
    }
  }, []);

  const getServicesBySalon = useCallback(async (salonId: string, options: { search?: string; limit?: number } = {}) => {
    const { search = '', limit } = options;
    const cacheKey = `salon_${salonId}_services_${search}_${limit || 'all'}`;
    
    // Check for pending request
    if (pendingRequests.current.has(cacheKey)) {
      return pendingRequests.current.get(cacheKey);
    }

    const fetchOperation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await withServiceCache<SalonService[]>(
          cacheKey,
          async () => {
            const all = await getAllSalonServices();
            let services = Object.entries(all)
              .map(([id, data]) => ({ ...(data as any), id } as SalonService));
            
            // Filter by salonId first
            services = services.filter(s => s.salonId === salonId);
            
            // Apply search filter if provided
            if (search) {
              const searchLower = search.toLowerCase();
              services = services.filter(s => 
                s.name.toLowerCase().includes(searchLower) ||
                (s.description?.toLowerCase().includes(searchLower) ?? false)
              );
            }
            
            // Apply limit if provided
            if (limit) {
              services = services.slice(0, limit);
            }
            
            return services;
          },
          !search // Only use cache if not searching
        );
        
        return result;
      } catch (e: any) {
        const error = e instanceof Error ? e : new Error('Failed to fetch salon services');
        setError(error.message);
        throw new ServiceError(error.message, 'SERVICES_FETCH_ERROR');
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
      
      // Invalidate cache for this service's images
      serviceCache.delete(`service_${serviceId}_images`);
      
      const img = await uploadServiceImage(serviceId, file);
      return img;
    } catch (e: any) {
      const error = e instanceof Error ? e : new Error('Failed to upload image');
      setError(error.message);
      throw new ServiceError(error.message, 'IMAGE_UPLOAD_ERROR');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteImage = useCallback(async (storagePath: string, serviceId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await deleteServiceImage(storagePath);
      
      // Invalidate cache for this service's images if serviceId is provided
      if (serviceId) {
        serviceCache.delete(`service_${serviceId}_images`);
      }
    } catch (e: any) {
      const error = e instanceof Error ? e : new Error('Failed to delete image');
      setError(error.message);
      throw new ServiceError(error.message, 'IMAGE_DELETE_ERROR');
    } finally {
      setLoading(false);
    }
  }, []);

  const getImages = useCallback(async (serviceId: string) => {
    const cacheKey = `service_${serviceId}_images`;
    
    // Check for pending request
    if (pendingRequests.current.has(cacheKey)) {
      return pendingRequests.current.get(cacheKey);
    }

    const fetchOperation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const images = await withServiceCache<ServiceImage[]>(
          cacheKey,
          () => getServiceImages(serviceId)
        );
        
        return images;
      } catch (e: any) {
        const error = e instanceof Error ? e : new Error('Failed to fetch service images');
        setError(error.message);
        throw new ServiceError(error.message, 'IMAGES_FETCH_ERROR');
      } finally {
        pendingRequests.current.delete(cacheKey);
        setLoading(false);
      }
    };

    const request = fetchOperation();
    pendingRequests.current.set(cacheKey, request);
    return request;
  }, []);

  

  // Clear pending requests on unmount
  useEffect(() => {
    return () => {
      // Clear all pending requests
      pendingRequests.current.clear();
      
      // Clear all debounce timers
      Object.values(debounceTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  // Build context value with memoization
  const value: SalonServiceContextType = useMemo(() => ({
    getService,
    createService,
    updateService,
    deleteService,
    getServicesBySalon,
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