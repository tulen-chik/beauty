import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  deleteServiceImage,
  getServiceImages,
  getServicesBySalonFromDB,
  // Импортируем новые функции для пагинации
  getSalonsByCityPaginated,
  getSalonServicesPaginated,
  salonInvitationOperations,
  salonOperations,
  salonScheduleOperations,
  salonServiceOperations,
  serviceCategoryOperations,
  uploadServiceImage,
  userOperations,
  userSalonsOperations
} from '@/lib/firebase/database';

import type {
  Salon,
  SalonInvitation,
  SalonSchedule,
  SalonService,
  ServiceCategory,
  ServiceImage,
  User,
  UserSalons
} from '@/types/database';
import { getAllSalonInvitations, getAllSalons, getAllServiceCategories } from '@/lib/firebase/rawGetters';

interface AdminStats {
  totalUsers: number;
  totalSalons: number;
  totalCategories: number;
  totalInvitations: number;
  activeSalons: number;
  pendingInvitations: number;
  recentUsers: User[];
  recentSalons: Salon[];
}

// Кэш для данных с временем жизни (TTL)
const adminCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 минуты

// Хелпер-функция для работы с кэшем
const withAdminCache = async <T,>(
  key: string,
  fn: () => Promise<T>,
  useCache = true
): Promise<T> => {
  const now = Date.now();
  const cached = adminCache.get(key);

  if (useCache && cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const data = await fn();
  adminCache.set(key, { data, timestamp: now });
  return data;
};

// Кастомный класс ошибок
class AdminError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AdminError';
  }
}

// --- Определение Типа Контекста ---

interface AdminContextType {
  // Статистика
  stats: AdminStats | null;
  refreshStats: () => Promise<void>;

  // Управление пользователями
  users: User[];
  loadUsers: () => Promise<(User & { id: string; })[]>;
  createUser: (userData: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
    role?: string;
    adminId: string;
  }) => Promise<User>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUserSalons: (userId: string) => Promise<UserSalons | null>;

  // Управление салонами
  salons: Salon[];
  loadSalonsByCity: (options: { city: string; limit?: number }) => Promise<void>;
  loadMoreSalons: () => Promise<void>;
  hasMoreSalons: boolean;
  fetchSalon: (salonId: string) => Promise<Salon | null>;
  updateSalon: (salonId: string, data: Partial<Salon>) => Promise<void>;
  deleteSalon: (salonId: string) => Promise<void>;

  // Управление услугами
  services: SalonService[];
  loadServices: (options?: { limit?: number }) => Promise<void>;
  loadMoreServices: () => Promise<void>;
  hasMoreServices: boolean;
  getSalonServices: (salonId: string) => Promise<SalonService[]>;
  createService: (data: Omit<SalonService, 'id' | 'city' | 'createdAt' | 'updatedAt'>) => Promise<SalonService>;
  updateService: (serviceId: string, data: Partial<SalonService>) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;

  // Управление изображениями
  getImages: (serviceId: string) => Promise<ServiceImage[]>;
  uploadImage: (serviceId: string, file: File) => Promise<ServiceImage>;
  deleteImage: (storagePath: string, serviceId?: string) => Promise<void>;

  // Управление категориями
  categories: ServiceCategory[];
  loadCategories: () => Promise<ServiceCategory[]>;
  createCategory: (categoryId: string, data: Omit<ServiceCategory, 'id'>) => Promise<void>;
  updateCategory: (categoryId: string, data: Partial<ServiceCategory>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Управление приглашениями
  invitations: SalonInvitation[];
  loadInvitations: () => Promise<void>;
  updateInvitation: (invitationId: string, data: Partial<SalonInvitation>) => Promise<void>;
  deleteInvitation: (invitationId: string) => Promise<void>;

  // Управление расписанием
  getSchedule: (salonId: string) => Promise<SalonSchedule | null>;
  createSchedule: (salonId: string, data: SalonSchedule) => Promise<SalonSchedule>;
  updateSchedule: (salonId: string, data: Partial<SalonSchedule>) => Promise<SalonSchedule>;
  deleteSchedule: (salonId: string) => Promise<void>;

  // Состояние UI
  loading: boolean;
  loadingMore: boolean; // Для пагинации
  error: string | null;
  setError: (error: string | null) => void;
}

// --- Создание Контекста и Хука ---

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};

// --- Провайдер Контекста ---

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [invitations, setInvitations] = useState<SalonInvitation[]>([]);
  const [schedules, setSchedules] = useState<Record<string, SalonSchedule>>({});

  // Состояние для пагинации салонов
  const [salons, setSalons] = useState<Salon[]>([]);
  const [salonsNextKey, setSalonsNextKey] = useState<string | null>(null);
  const [hasMoreSalons, setHasMoreSalons] = useState(true);
  const [currentSalonsCity, setCurrentSalonsCity] = useState<string | null>(null);

  // Состояние для пагинации услуг
  const [services, setServices] = useState<SalonService[]>([]);
  const [servicesNextKey, setServicesNextKey] = useState<string | null>(null);
  const [hasMoreServices, setHasMoreServices] = useState(true);

  const pendingRequests = useRef(new Map<string, Promise<any>>());

  // Cache keys for salon data
  const SALON_CACHE_PREFIX = 'admin_salon_cache_';
  const SALON_CACHE_TIMESTAMP_PREFIX = 'admin_salon_cache_timestamp_';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // --- Реализация Методов ---

  const getCityFromCoordinates = useCallback(async (coords: { latitude: number; longitude: number }): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&accept-language=en`
      );
      if (!response.ok) {
        console.error('Nominatim API request failed');
        return 'Unknown City';
      }
      const data = await response.json();
      return data.address?.city || data.address?.town || data.address?.village || 'Unknown City';
    } catch (err) {
      console.error('Failed to fetch city from coordinates:', err);
      return 'Unknown City';
    }
  }, []);

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

  const loadSalonFromCache = useCallback((salonId: string): Salon | null => {
    try {
      const cachedSalon = localStorage.getItem(`${SALON_CACHE_PREFIX}${salonId}`);
      const cachedTimestamp = localStorage.getItem(`${SALON_CACHE_TIMESTAMP_PREFIX}${salonId}`);
      if (!cachedSalon || !cachedTimestamp) return null;
      if (Date.now() - parseInt(cachedTimestamp) > CACHE_DURATION) {
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

  const refreshStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allSalons, allCategories, allInvitations] = await Promise.all([
        getAllSalons(),
        getAllServiceCategories(),
        getAllSalonInvitations()
      ]);
      const salonsArray = Object.entries(allSalons).map(([id, data]) => ({ ...(data as Salon), id }));
      const pendingInvitationsCount = Object.values(allInvitations).filter(
        (invitation) => (invitation as SalonInvitation).status === 'pending'
      ).length;
      const newStats: AdminStats = {
        totalUsers: users.length,
        totalSalons: salonsArray.length,
        totalCategories: Object.keys(allCategories).length,
        totalInvitations: Object.keys(allInvitations).length,
        activeSalons: salonsArray.length,
        pendingInvitations: pendingInvitationsCount,
        recentUsers: users.slice(-5).reverse(),
        recentSalons: salonsArray.slice(-5).reverse()
      };
      setStats(newStats);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [users]);

  const fetchSalon = useCallback(async (salonId: string) => {
    const cacheKey = `salon_${salonId}`;
    if (pendingRequests.current.has(cacheKey)) return pendingRequests.current.get(cacheKey);
    const fetchOperation = async () => {
      setLoading(true);
      setError(null);
      try {
        const cachedSalon = loadSalonFromCache(salonId);
        if (cachedSalon) return cachedSalon;
        const salon = await salonOperations.read(salonId);
        if (salon) {
          saveSalonToCache(salonId, salon);
          setSalons(prev => [...prev.filter(s => s.id !== salonId), salon]);
        }
        return salon;
      } catch (e: any) {
        const err = e instanceof Error ? e : new Error('Failed to fetch salon');
        setError(err.message);
        throw new AdminError(err.message, 'SALON_FETCH_ERROR');
      } finally {
        pendingRequests.current.delete(cacheKey);
        setLoading(false);
      }
    };
    const request = fetchOperation();
    pendingRequests.current.set(cacheKey, request);
    return request;
  }, [loadSalonFromCache, saveSalonToCache]);

  // Users management
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersList = await userOperations.list();
      setUsers(usersList);
      return usersList;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      const newUser = await response.json();
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId: string, data: Partial<User>) => {
    try {
      await userOperations.update(userId, data);
      setUsers(prev => prev.map(user => user.id === userId ? { ...user, ...data } : user));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await userOperations.delete(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const getUserSalons = useCallback(async (userId: string) => {
    try {
      return await userSalonsOperations.read(userId);
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  // Salons management with Pagination
  const loadSalonsByCity = useCallback(async (options: { city: string; limit?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const { city, limit = 10 } = options;
      const { salons: newSalons, nextKey } = await getSalonsByCityPaginated({ city, limit });
      setSalons(newSalons);
      setSalonsNextKey(nextKey);
      setHasMoreSalons(!!nextKey);
      setCurrentSalonsCity(city);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreSalons = useCallback(async () => {
    if (loadingMore || !hasMoreSalons || !currentSalonsCity) return;
    setLoadingMore(true);
    setError(null);
    try {
      const { salons: newSalons, nextKey } = await getSalonsByCityPaginated({
        city: currentSalonsCity,
        limit: 10,
        startAfterKey: salonsNextKey!,
      });
      setSalons(prev => [...prev, ...newSalons]);
      setSalonsNextKey(nextKey);
      setHasMoreSalons(!!nextKey);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreSalons, currentSalonsCity, salonsNextKey]);

  const updateSalon = useCallback(async (salonId: string, data: Partial<Salon>) => {
    try {
      await salonOperations.update(salonId, data);
      setSalons(prev => prev.map(s => s.id === salonId ? { ...s, ...data } : s));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const deleteSalon = useCallback(async (salonId: string) => {
    try {
      await salonOperations.delete(salonId);
      setSalons(prev => prev.filter(s => s.id !== salonId));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  // Services management
  const loadServices = useCallback(async (options?: { limit?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const limit = options?.limit ?? 10;
      const { services: newServices, nextKey } = await getSalonServicesPaginated({ limit });
      setServices(newServices);
      setServicesNextKey(nextKey);
      setHasMoreServices(!!nextKey);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreServices = useCallback(async () => {
    if (loadingMore || !hasMoreServices) return;
    setLoadingMore(true);
    setError(null);
    try {
      const { services: newServices, nextKey } = await getSalonServicesPaginated({
        limit: 10,
        startAfterKey: servicesNextKey!,
      });
      setServices(prev => [...prev, ...newServices]);
      setServicesNextKey(nextKey);
      setHasMoreServices(!!nextKey);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreServices, servicesNextKey]);

  const getSalonServices = useCallback(async (salonId: string) => {
    const cacheKey = `salon_${salonId}_services`;
    if (pendingRequests.current.has(cacheKey)) return pendingRequests.current.get(cacheKey);
    const fetchOperation = async () => {
      setLoading(true);
      try {
        return await withAdminCache<SalonService[]>(cacheKey, () => getServicesBySalonFromDB(salonId));
      } catch (e: any) {
        const err = e instanceof Error ? e : new Error('Failed to fetch salon services');
        setError(err.message);
        throw new AdminError(err.message, 'SERVICES_FETCH_ERROR');
      } finally {
        pendingRequests.current.delete(cacheKey);
        setLoading(false);
      }
    };
    const request = fetchOperation();
    pendingRequests.current.set(cacheKey, request);
    return request;
  }, []);

  const createService = useCallback(async (data: Omit<SalonService, 'id' | 'city' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    const tempId = `service_${Date.now()}`;
    try {
      const salon = await fetchSalon(data.salonId);
      if (!salon) throw new AdminError('Salon not found for this service', 'SALON_NOT_FOUND');
      let city = 'Unknown City';
      if (salon.coordinates?.lat && salon.coordinates?.lng) {
        city = await getCityFromCoordinates({ latitude: salon.coordinates.lat, longitude: salon.coordinates.lng });
      }
      const fullServiceData: Omit<SalonService, 'id'> = {
        ...data, city, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      setServices(prev => [{ ...fullServiceData, id: tempId }, ...prev]);
      const newService = await salonServiceOperations.create(tempId, fullServiceData);
      setServices(prev => prev.map(s => s.id === tempId ? { ...newService, id: tempId } : s));
      adminCache.delete(`salon_${data.salonId}_services`);
      return { ...newService, id: tempId };
    } catch (e: any) {
      setServices(prev => prev.filter(s => s.id !== tempId));
      const err = e instanceof Error ? e : new Error('Failed to create service');
      setError(err.message);
      throw new AdminError(err.message, 'SERVICE_CREATE_ERROR');
    } finally {
      setLoading(false);
    }
  }, [fetchSalon, getCityFromCoordinates]);

  const updateService = useCallback(async (serviceId: string, data: Partial<SalonService>) => {
    const originalServices = [...services];
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, ...data, updatedAt: new Date().toISOString() } : s));
    try {
      await salonServiceOperations.update(serviceId, data);
      const salonId = originalServices.find(s => s.id === serviceId)?.salonId;
      if (salonId) adminCache.delete(`salon_${salonId}_services`);
    } catch (e: any) {
      setServices(originalServices);
      const err = e instanceof Error ? e : new Error('Failed to update service');
      setError(err.message);
      throw new AdminError(err.message, 'SERVICE_UPDATE_ERROR');
    }
  }, [services]);

  const deleteService = useCallback(async (serviceId: string) => {
    const originalServices = [...services];
    const serviceToDelete = originalServices.find(s => s.id === serviceId);
    setServices(prev => prev.filter(s => s.id !== serviceId));
    try {
      await salonServiceOperations.delete(serviceId);
      if (serviceToDelete) adminCache.delete(`salon_${serviceToDelete.salonId}_services`);
    } catch (e: any) {
      setServices(originalServices);
      const err = e instanceof Error ? e : new Error('Failed to delete service');
      setError(err.message);
      throw new AdminError(err.message, 'SERVICE_DELETE_ERROR');
    }
  }, [services]);

  // Categories Management
  const loadCategories = useCallback(async () => {
    const cacheKey = 'all_categories';
    if (pendingRequests.current.has(cacheKey)) return pendingRequests.current.get(cacheKey);
    const fetchOperation = async () => {
      setLoading(true);
      try {
        const cats = await withAdminCache<ServiceCategory[]>(cacheKey, async () => {
          const all = await getAllServiceCategories();
          return Object.entries(all).map(([id, data]) => ({ ...data as ServiceCategory, id }));
        });
        setCategories(cats);
        return cats;
      } catch (e: any) {
        const err = e instanceof Error ? e : new Error('Failed to load categories');
        setError(err.message);
        throw new AdminError(err.message, 'CATEGORIES_FETCH_ERROR');
      } finally {
        pendingRequests.current.delete(cacheKey);
        setLoading(false);
      }
    };
    const request = fetchOperation();
    pendingRequests.current.set(cacheKey, request);
    return request;
  }, []);

  const createCategory = useCallback(async (categoryId: string, data: Omit<ServiceCategory, 'id'>) => {
    const optimisticCategory = { ...data, id: categoryId };
    setCategories(prev => [...prev, optimisticCategory]);
    try {
      await serviceCategoryOperations.create(categoryId, data);
      adminCache.delete('all_categories');
    } catch (e: any) {
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      const err = e instanceof Error ? e : new Error('Failed to create category');
      setError(err.message);
      throw new AdminError(err.message, 'CATEGORY_CREATE_ERROR');
    }
  }, []);

  const updateCategory = useCallback(async (categoryId: string, data: Partial<ServiceCategory>) => {
    const originalCategories = [...categories];
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...data } : c));
    try {
      await serviceCategoryOperations.update(categoryId, data);
      adminCache.delete('all_categories');
    } catch (e: any) {
      setCategories(originalCategories);
      const err = e instanceof Error ? e : new Error('Failed to update category');
      setError(err.message);
      throw new AdminError(err.message, 'CATEGORY_UPDATE_ERROR');
    }
  }, [categories]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    const originalCategories = [...categories];
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    try {
      await serviceCategoryOperations.delete(categoryId);
      adminCache.delete('all_categories');
    } catch (e: any) {
      setCategories(originalCategories);
      const err = e instanceof Error ? e : new Error('Failed to delete category');
      setError(err.message);
      throw new AdminError(err.message, 'CATEGORY_DELETE_ERROR');
    }
  }, [categories]);

  // Image Management
  const getImages = useCallback(async (serviceId: string) => {
    const cacheKey = `service_${serviceId}_images`;
    if (pendingRequests.current.has(cacheKey)) return pendingRequests.current.get(cacheKey);
    const fetchOperation = async () => {
      try {
        return await withAdminCache<ServiceImage[]>(cacheKey, () => getServiceImages(serviceId));
      } catch (e: any) {
        const err = e instanceof Error ? e : new Error('Failed to fetch images');
        setError(err.message);
        throw new AdminError(err.message, 'IMAGES_FETCH_ERROR');
      }
    };
    const request = fetchOperation();
    pendingRequests.current.set(cacheKey, request);
    return request;
  }, []);

  const uploadImage = useCallback(async (serviceId: string, file: File) => {
    setLoading(true);
    try {
      adminCache.delete(`service_${serviceId}_images`);
      return await uploadServiceImage(serviceId, file);
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error('Failed to upload image');
      setError(err.message);
      throw new AdminError(err.message, 'IMAGE_UPLOAD_ERROR');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteImage = useCallback(async (storagePath: string, serviceId?: string) => {
    setLoading(true);
    try {
      await deleteServiceImage(storagePath);
      if (serviceId) adminCache.delete(`service_${serviceId}_images`);
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error('Failed to delete image');
      setError(err.message);
      throw new AdminError(err.message, 'IMAGE_DELETE_ERROR');
    } finally {
      setLoading(false);
    }
  }, []);

  // Invitations management
  const loadInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const allInvitations = await getAllSalonInvitations();
      const invitationsArray = Object.entries(allInvitations).map(([id, data]) => ({ ...data as SalonInvitation, id }));
      setInvitations(invitationsArray);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInvitation = useCallback(async (invitationId: string, data: Partial<SalonInvitation>) => {
    try {
      await salonInvitationOperations.update(invitationId, data);
      setInvitations(prev => prev.map(inv => inv.id === invitationId ? { ...inv, ...data } : inv));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const deleteInvitation = useCallback(async (invitationId: string) => {
    try {
      await salonInvitationOperations.delete(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  useEffect(() => {
    return () => {
      pendingRequests.current.clear();
    };
  }, []);

  // Schedule management
  const getSchedule = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const cachedSchedule = schedules[salonId];
      if (cachedSchedule) return cachedSchedule;
      const schedule = await salonScheduleOperations.read(salonId);
      if (schedule) {
        setSchedules(prev => ({ ...prev, [salonId]: schedule }));
      }
      return schedule;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [schedules]);

  const createSchedule = useCallback(async (salonId: string, data: SalonSchedule) => {
    setLoading(true);
    setError(null);
    try {
      const schedule = await salonScheduleOperations.create(salonId, data);
      setSchedules(prev => ({ ...prev, [salonId]: schedule }));
      return schedule;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSchedule = useCallback(async (salonId: string, data: Partial<SalonSchedule>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await salonScheduleOperations.update(salonId, data);
      setSchedules(prev => ({ ...prev, [salonId]: { ...prev[salonId], ...updated } }));
      return updated;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSchedule = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      await salonScheduleOperations.delete(salonId);
      setSchedules(prev => {
        const newSchedules = { ...prev };
        delete newSchedules[salonId];
        return newSchedules;
      });
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Формирование значения контекста ---

  const value: AdminContextType = useMemo(() => ({
    stats, refreshStats,
    users, loadUsers, createUser, updateUser, deleteUser, getUserSalons,
    salons, loadSalonsByCity, loadMoreSalons, hasMoreSalons, fetchSalon, updateSalon, deleteSalon,
    services, loadServices, loadMoreServices, hasMoreServices, getSalonServices, createService, updateService, deleteService,
    getImages, uploadImage, deleteImage,
    categories, loadCategories, createCategory, updateCategory, deleteCategory,
    invitations, loadInvitations, updateInvitation, deleteInvitation,
    getSchedule, createSchedule, updateSchedule, deleteSchedule,
    loading, loadingMore, error, setError,
  }), [
    stats, users, salons, services, categories, invitations, loading, loadingMore, error, hasMoreSalons, hasMoreServices,
    refreshStats, loadUsers, createUser, updateUser, deleteUser, getUserSalons,
    loadSalonsByCity, loadMoreSalons, fetchSalon, updateSalon, deleteSalon,
    loadServices, loadMoreServices, getSalonServices, createService, updateService, deleteService,
    getImages, uploadImage, deleteImage,
    loadCategories, createCategory, updateCategory, deleteCategory,
    loadInvitations, updateInvitation, deleteInvitation,
    getSchedule, createSchedule, updateSchedule, deleteSchedule
  ]);

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};