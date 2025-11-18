import React, { createContext, ReactNode, useCallback,useContext, useMemo, useState } from 'react';

import { appointmentOperations } from '@/lib/firebase/database';

import type { Appointment, AppointmentStatus } from '@/types/database';

interface ListOptions {
  startAt?: string;
  endAt?: string;
  status?: AppointmentStatus;
  employeeId?: string;
  serviceId?: string;
}

interface AppointmentContextType {
  // CRUD
  createAppointment: (
    salonId: string,
    appointmentId: string,
    data: Omit<Appointment, 'id'>
  ) => Promise<Appointment>;
  getAppointment: (salonId: string, appointmentId: string) => Promise<Appointment | null>;
  updateAppointment: (
    salonId: string,
    appointmentId: string,
    data: Partial<Appointment>
  ) => Promise<Appointment>;
  deleteAppointment: (salonId: string, appointmentId: string) => Promise<void>;

  // Queries
  listAppointments: (salonId: string, options?: ListOptions) => Promise<Appointment[]>;
  listAppointmentsByDay: (salonId: string, date: Date) => Promise<Appointment[]>;
  listAppointmentsByCustomer: (userId: string) => Promise<Appointment[]>;

  // Availability
  isTimeSlotAvailable: (
    salonId: string,
    startAtIso: string,
    durationMinutes: number,
    employeeId?: string,
    excludeAppointmentId?: string
  ) => Promise<boolean>;

  // Helper to book with availability check
  bookIfAvailable: (
    salonId: string,
    appointmentId: string,
    data: Omit<Appointment, 'id'>,
    employeeId?: string
  ) => Promise<{ ok: boolean; appointment?: Appointment; reason?: string }>;

  // UI state
  loading: boolean;
  error: string | null;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointment = () => {
  const ctx = useContext(AppointmentContext);
  if (!ctx) throw new Error('useAppointment must be used within AppointmentProvider');
  return ctx;
};

export const AppointmentProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAppointment = useCallback(async (
    salonId: string,
    appointmentId: string,
    data: Omit<Appointment, 'id'>
  ) => {
    setLoading(true);
    setError(null);
    try {
      const created = await appointmentOperations.create(salonId, appointmentId, data);
      setLoading(false);
      return { ...created, id: appointmentId } as Appointment;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const getAppointment = useCallback(async (salonId: string, appointmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const appt = await appointmentOperations.read(salonId, appointmentId);
      setLoading(false);
      return appt ? ({ ...appt, id: appointmentId } as Appointment) : null;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, []);

  const updateAppointment = useCallback(async (
    salonId: string,
    appointmentId: string,
    data: Partial<Appointment>
  ) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await appointmentOperations.update(salonId, appointmentId, data);
      setLoading(false);
      return { ...updated, id: appointmentId } as Appointment;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const deleteAppointment = useCallback(async (salonId: string, appointmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      await appointmentOperations.delete(salonId, appointmentId);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const listAppointments = useCallback(async (salonId: string, options?: ListOptions) => {
    setLoading(true);
    setError(null);
    try {
      const list = await appointmentOperations.listBySalon(salonId, options);
      setLoading(false);
      return list;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  const listAppointmentsByDay = useCallback(async (salonId: string, date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const list = await appointmentOperations.listByDay(salonId, date);
      setLoading(false);
      return list;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  const isTimeSlotAvailable = useCallback(async (
    salonId: string,
    startAtIso: string,
    durationMinutes: number,
    employeeId?: string,
    excludeAppointmentId?: string
  ) => {
    setError(null);
    try {
      return await appointmentOperations.isTimeSlotAvailable(
        salonId,
        startAtIso,
        durationMinutes,
        employeeId,
        excludeAppointmentId
      );
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  }, []);

  const listAppointmentsByCustomer = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await appointmentOperations.listByUser(userId);
      return list;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const bookIfAvailable = useCallback(async (
    salonId: string,
    appointmentId: string,
    data: Omit<Appointment, 'id'>,
    employeeId?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const ok = await appointmentOperations.isTimeSlotAvailable(
        salonId,
        data.startAt,
        data.durationMinutes,
        employeeId
      );
      if (!ok) {
        setLoading(false);
        return { ok: false, reason: 'Время недоступно' };
      }
      const created = await appointmentOperations.create(salonId, appointmentId, data);
      setLoading(false);
      return { ok: true, appointment: { ...created, id: appointmentId } as Appointment };
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return { ok: false, reason: e.message };
    }
  }, []);

  const value: AppointmentContextType = useMemo(() => ({
    createAppointment,
    getAppointment,
    updateAppointment,
    deleteAppointment,
    listAppointments,
    listAppointmentsByDay,
    isTimeSlotAvailable,
    listAppointmentsByCustomer,
    bookIfAvailable,
    loading,
    error,
  }), [
    createAppointment,
    getAppointment,
    updateAppointment,
    deleteAppointment,
    listAppointments,
    listAppointmentsByDay,
    isTimeSlotAvailable,
    listAppointmentsByCustomer,
    bookIfAvailable,
    loading,
    error,
  ]);

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};

