import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { salonServiceOperations, getAllSalonServices, uploadServiceImage, deleteServiceImage, getServiceImages } from '@/lib/firebase/database';
import type { SalonService } from '@/types/database';

interface SalonServiceContextType {
  getService: (serviceId: string) => Promise<SalonService | null>;
  createService: (serviceId: string, data: Omit<SalonService, 'id'>) => Promise<SalonService>;
  updateService: (serviceId: string, data: Partial<SalonService>) => Promise<SalonService>;
  deleteService: (serviceId: string) => Promise<void>;
  getServicesBySalon: (salonId: string) => Promise<SalonService[]>;
  uploadImage: (serviceId: string, file: File) => Promise<any>;
  deleteImage: (storagePath: string) => Promise<void>;
  getImages: (serviceId: string) => Promise<any[]>;
  loading: boolean;
  error: string | null;
}

const SalonServiceContext = createContext<SalonServiceContextType | undefined>(undefined);

export const useSalonService = () => {
  const ctx = useContext(SalonServiceContext);
  if (!ctx) throw new Error('useSalonService must be used within SalonServiceProvider');
  return ctx;
};

export const SalonServiceProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Получить все услуги по salonId
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
    setError(null);
    try {
      const img = await uploadServiceImage(serviceId, file);
      return img;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const deleteImage = useCallback(async (storagePath: string) => {
    setError(null);
    try {
      await deleteServiceImage(storagePath);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const getImages = useCallback(async (serviceId: string) => {
    setError(null);
    try {
      const images = await getServiceImages(serviceId);
      return images;
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, []);

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