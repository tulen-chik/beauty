import React, { createContext, ReactNode, useCallback,useContext, useMemo, useState } from 'react';


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
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, ...data }),
      });
      if (!response.ok) {
        throw new Error('Failed to create invitation');
      }
      const invitation = await response.json();
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
      const response = await fetch(`/api/invitations/${invitationId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setLoading(false);
          return null;
        }
        throw new Error('Failed to get invitation');
      }
      const invitation = await response.json();
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
      const response = await fetch(`/api/invitations/${options.invitationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: options.userId }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to accept invitation' }));
        throw new Error(err.error);
      }
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
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update invitation');
      }
      const updated = await response.json();
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
      const response = await fetch(`/api/invitations/${invitationId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete invitation');
      }
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
      const response = await fetch(`/api/invitations?email=${email}`);
      if (!response.ok) {
        throw new Error('Failed to get invitations by email');
      }
      const all = await response.json();
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
      const response = await fetch(`/api/invitations?salonId=${salonId}`);
      if (!response.ok) {
        throw new Error('Failed to get invitations by salon');
      }
      const all = await response.json();
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