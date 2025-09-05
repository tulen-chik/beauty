import React, { 
  createContext, 
  useContext, 
  useState, 
  ReactNode, 
  useMemo, 
  useCallback 
} from 'react';
import { 
  // Основные операции для услуг
  salonServiceOperations, 
  getAllSalonServices, 
  uploadServiceImage, 
  deleteServiceImage, 
  getServiceImages,
} from '@/lib/firebase/database';
import type { 
  SalonService, 
  ServicePromotion, 
  PromotionAnalytics, 
  ServiceImage 
} from '@/types/database';

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

  // --- Реализация существующих методов ---

  const getService = useCallback(async (serviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const service = await salonServiceOperations.read(serviceId);
      setLoading(false);
      return service;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, []);

  const createService = useCallback(async (serviceId: string, data: Omit<SalonService, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const service = await salonServiceOperations.create(serviceId, data);
      setLoading(false);
      return service;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const updateService = useCallback(async (serviceId: string, data: Partial<SalonService>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await salonServiceOperations.update(serviceId, data);
      setLoading(false);
      return updated;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const deleteService = useCallback(async (serviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      await salonServiceOperations.delete(serviceId);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const getServicesBySalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const all = await getAllSalonServices();
      const result = Object.entries(all)
        .map(([id, data]) => ({ ...(data as any), id }))
        .filter((s) => s.salonId === salonId);
      setLoading(false);
      return result;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  const uploadImage = useCallback(async (serviceId: string, file: File) => {
    setLoading(true);
    setError(null);
    try {
      const img = await uploadServiceImage(serviceId, file);
      setLoading(false);
      return img;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const deleteImage = useCallback(async (storagePath: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteServiceImage(storagePath);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const getImages = useCallback(async (serviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const images = await getServiceImages(serviceId);
      setLoading(false);
      return images;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  

  // --- Сборка значения контекста ---

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