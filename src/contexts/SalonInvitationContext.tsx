import React, { createContext, ReactNode, useCallback,useContext, useMemo, useState } from 'react';

import { getInvitationByIdAction, updateInvitationAction, deleteInvitationAction, createInvitationAction, acceptInvitationAction, getInvitationsByEmailAction, getInvitationsBySalonIdAction } from '@/app/actions/salonActions';

import type { SalonInvitation } from '@/types/database';

interface SalonInvitationContextType {
  createInvitation: (invitationId: string, data: Omit<SalonInvitation, 'id'>) => Promise<SalonInvitation>;
  getInvitation: (invitationId: string) => Promise<SalonInvitation | null>;
  updateInvitation: (invitationId: string, data: Partial<SalonInvitation>) => Promise<SalonInvitation>;
  deleteInvitation: (invitationId: string) => Promise<void>;
  getInvitationsByEmail: (email: string) => Promise<SalonInvitation[]>;
  getInvitationsBySalon: (salonId: string) => Promise<SalonInvitation[]>;
  acceptInvitation: (options: { invitationId: string; userId: string }) => Promise<void>; // Новый метод
  loading: boolean;
  error: string | null;
}

const SalonInvitationContext = createContext<SalonInvitationContextType | undefined>(undefined);

export const useSalonInvitation = () => {
  const ctx = useContext(SalonInvitationContext);
  if (!ctx) throw new Error('useSalonInvitation must be used within SalonInvitationProvider');
  return ctx;
};

export const SalonInvitationProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvitation = useCallback(async (invitationId: string, data: Omit<SalonInvitation, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const invitation = await createInvitationAction(invitationId, data);
      setLoading(false);
      return invitation;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const getInvitation = useCallback(async (invitationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const invitation = await getInvitationByIdAction(invitationId);
      setLoading(false);
      return invitation;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, []);

    const acceptInvitation = useCallback(async (options: { invitationId: string; userId: string }) => {
    setLoading(true);
    setError(null);
    try {
      await acceptInvitationAction(options.invitationId, options.userId);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInvitation = useCallback(async (invitationId: string, data: Partial<SalonInvitation>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateInvitationAction(invitationId, data);
      setLoading(false);
      return updated;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const deleteInvitation = useCallback(async (invitationId: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteInvitationAction(invitationId);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  // Получить все приглашения для пользователя (по email)
  const getInvitationsByEmail = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const all = await getInvitationsByEmailAction(email);
      setLoading(false);
      return all;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  // Получить все приглашения для салона (по salonId)
  const getInvitationsBySalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const all = await getInvitationsBySalonIdAction(salonId);
      setLoading(false);
      return all;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  const value: SalonInvitationContextType = useMemo(() => ({
    createInvitation,
    getInvitation,
    updateInvitation,
    deleteInvitation,
    getInvitationsByEmail,
    getInvitationsBySalon,
    loading,
    error,
    acceptInvitation,
  }), [
    createInvitation,
    getInvitation,
    updateInvitation,
    deleteInvitation,
    getInvitationsByEmail,
    getInvitationsBySalon,
    loading,
    error,
    acceptInvitation,
  ]);

  return (
    <SalonInvitationContext.Provider value={value}>
      {children}
    </SalonInvitationContext.Provider>
  );
}; 