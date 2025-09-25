import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { 
  getAllSalons, 
  getAllSalonServices, 
  getAllServiceCategories,
  getAllSalonInvitations,
  userOperations,
  salonOperations,
  salonServiceOperations,
  serviceCategoryOperations,
  salonInvitationOperations,
  userSalonsOperations
} from '@/lib/firebase/database';
import type { 
  User, 
  Salon, 
  SalonService, 
  ServiceCategory, 
  SalonInvitation,
  UserSalons 
} from '@/types/database';

interface AdminStats {
  totalUsers: number;
  totalSalons: number;
  totalServices: number;
  totalCategories: number;
  totalInvitations: number;
  activeSalons: number;
  pendingInvitations: number;
  recentUsers: User[];
  recentSalons: Salon[];
}

interface AdminContextType {
  // Stats
  stats: AdminStats | null;
  refreshStats: () => Promise<void>;
  
  // Users management
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
  
  // Salons management
  salons: Salon[];
  loadSalons: () => Promise<void>;
  updateSalon: (salonId: string, data: Partial<Salon>) => Promise<void>;
  deleteSalon: (salonId: string) => Promise<void>;
  
  // Services management
  services: SalonService[];
  loadServices: () => Promise<void>;
  updateService: (serviceId: string, data: Partial<SalonService>) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  
  // Categories management
  categories: ServiceCategory[];
  loadCategories: () => Promise<void>;
  createCategory: (categoryId: string, data: Omit<ServiceCategory, 'id'>) => Promise<void>;
  updateCategory: (categoryId: string, data: Partial<ServiceCategory>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  
  // Invitations management
  invitations: SalonInvitation[];
  loadInvitations: () => Promise<void>;
  updateInvitation: (invitationId: string, data: Partial<SalonInvitation>) => Promise<void>;
  deleteInvitation: (invitationId: string) => Promise<void>;
  
  // UI state
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [services, setServices] = useState<SalonService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [invitations, setInvitations] = useState<SalonInvitation[]>([]);

  // Stats management
  const refreshStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all data in parallel
      const [allSalons, allServices, allCategories, allInvitations] = await Promise.all([
        getAllSalons(),
        getAllSalonServices(),
        getAllServiceCategories(),
        getAllSalonInvitations()
      ]);

      const salonsArray = Object.entries(allSalons).map(([id, data]) => ({ ...data as Salon, id }));
      const servicesArray = Object.entries(allServices).map(([id, data]) => ({ ...data as SalonService, id }));
      const categoriesArray = Object.entries(allCategories).map(([id, data]) => ({ ...data as ServiceCategory, id }));
      const invitationsArray = Object.entries(allInvitations).map(([id, data]) => ({ ...data as SalonInvitation, id }));

      // Calculate stats
      const newStats: AdminStats = {
        totalUsers: users.length,
        totalSalons: salonsArray.length,
        totalServices: servicesArray.length,
        totalCategories: categoriesArray.length,
        totalInvitations: invitationsArray.length,
        activeSalons: salonsArray.length,
        pendingInvitations: invitationsArray.filter(i => i.status === 'pending').length,
        recentUsers: users.slice(-5).reverse(),
        recentSalons: salonsArray.slice(-5).reverse()
      };

      setStats(newStats);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }, [users, salons]);

  // Users management
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usersList = await userOperations.list();
      setUsers(usersList);
      setLoading(false);
      return usersList;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const createUser = useCallback(async (userData: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
    role?: string;
    adminId: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const newUser = await response.json();
      
      // Update the local users list
      setUsers(prevUsers => [...prevUsers, newUser]);
      
      return newUser;
    } catch (err) {
      console.error('Error creating user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId: string, data: Partial<User>) => {
    setError(null);
    try {
      await userOperations.update(userId, data);
      setUsers(prev => prev.map(user => user.id === userId ? { ...user, ...data } : user));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    setError(null);
    try {
      await userOperations.delete(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const getUserSalons = useCallback(async (userId: string) => {
    setError(null);
    try {
      return await userSalonsOperations.read(userId);
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  // Salons management
  const loadSalons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allSalons = await getAllSalons();
      const salonsArray = Object.entries(allSalons).map(([id, data]) => ({ ...data as Salon, id }));
      setSalons(salonsArray);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }, []);

  const updateSalon = useCallback(async (salonId: string, data: Partial<Salon>) => {
    setError(null);
    try {
      await salonOperations.update(salonId, data);
      setSalons(prev => prev.map(salon => salon.id === salonId ? { ...salon, ...data } : salon));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const deleteSalon = useCallback(async (salonId: string) => {
    setError(null);
    try {
      await salonOperations.delete(salonId);
      setSalons(prev => prev.filter(salon => salon.id !== salonId));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);


  // Services management
  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allServices = await getAllSalonServices();
      const servicesArray = Object.entries(allServices).map(([id, data]) => ({ ...data as SalonService, id }));
      setServices(servicesArray);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }, []);

  const updateService = useCallback(async (serviceId: string, data: Partial<SalonService>) => {
    setError(null);
    try {
      await salonServiceOperations.update(serviceId, data);
      setServices(prev => prev.map(service => service.id === serviceId ? { ...service, ...data } : service));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const deleteService = useCallback(async (serviceId: string) => {
    setError(null);
    try {
      await salonServiceOperations.delete(serviceId);
      setServices(prev => prev.filter(service => service.id !== serviceId));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  // Categories management
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allCategories = await getAllServiceCategories();
      const categoriesArray = Object.entries(allCategories).map(([id, data]) => ({ ...data as ServiceCategory, id }));
      setCategories(categoriesArray);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (categoryId: string, data: Omit<ServiceCategory, 'id'>) => {
    setError(null);
    try {
      await serviceCategoryOperations.create(categoryId, data);
      const newCategory = { ...data, id: categoryId };
      setCategories(prev => [...prev, newCategory]);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const updateCategory = useCallback(async (categoryId: string, data: Partial<ServiceCategory>) => {
    setError(null);
    try {
      await serviceCategoryOperations.update(categoryId, data);
      setCategories(prev => prev.map(category => category.id === categoryId ? { ...category, ...data } : category));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    setError(null);
    try {
      await serviceCategoryOperations.delete(categoryId);
      setCategories(prev => prev.filter(category => category.id !== categoryId));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  // Invitations management
  const loadInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allInvitations = await getAllSalonInvitations();
      const invitationsArray = Object.entries(allInvitations).map(([id, data]) => ({ ...data as SalonInvitation, id }));
      setInvitations(invitationsArray);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }, []);

  const updateInvitation = useCallback(async (invitationId: string, data: Partial<SalonInvitation>) => {
    setError(null);
    try {
      await salonInvitationOperations.update(invitationId, data);
      setInvitations(prev => prev.map(invitation => invitation.id === invitationId ? { ...invitation, ...data } : invitation));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const deleteInvitation = useCallback(async (invitationId: string) => {
    setError(null);
    try {
      await salonInvitationOperations.delete(invitationId);
      setInvitations(prev => prev.filter(invitation => invitation.id !== invitationId));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const value: AdminContextType = useMemo(() => ({
    // Stats
    stats,
    refreshStats,
    
    // Users management
    users,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserSalons,
    
    // Salons management
    salons,
    loadSalons,
    updateSalon,
    deleteSalon,
    
    // Services management
    services,
    loadServices,
    updateService,
    deleteService,
    
    // Categories management
    categories,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Invitations management
    invitations,
    loadInvitations,
    updateInvitation,
    deleteInvitation,
    
    // UI state
    loading,
    error,
    setError,
  }), [
    stats,
    refreshStats,
    users,
    loadUsers,
    updateUser,
    deleteUser,
    getUserSalons,
    salons,
    loadSalons,
    updateSalon,
    deleteSalon,
    services,
    loadServices,
    updateService,
    deleteService,
    categories,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    invitations,
    loadInvitations,
    updateInvitation,
    deleteInvitation,
    loading,
    error,
  ]);

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
