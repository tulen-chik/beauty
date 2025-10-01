import { endAt as fbEndAt, get, orderByChild, query, ref, startAt as fbStartAt } from 'firebase/database';

import { createOperation, deleteOperation,readOperation, updateOperation } from './crud';
import { db } from './init';
import { appointmentSchema } from './schemas';

import type { Appointment, AppointmentStatus } from '@/types/database';

export const appointmentOperations = {
  create: (salonId: string, appointmentId: string, data: Omit<Appointment, 'id'>) =>
    createOperation(`appointments/${salonId}/${appointmentId}`, data, appointmentSchema),

  read: (salonId: string, appointmentId: string) =>
    readOperation<Appointment>(`appointments/${salonId}/${appointmentId}`),

  update: (salonId: string, appointmentId: string, data: Partial<Appointment>) =>
    updateOperation(`appointments/${salonId}/${appointmentId}`, data, appointmentSchema),

  delete: (salonId: string, appointmentId: string) =>
    deleteOperation(`appointments/${salonId}/${appointmentId}`),

  listBySalon: async (
    salonId: string,
    opts?: {
      startAt?: string;
      endAt?: string;
      status?: AppointmentStatus;
      employeeId?: string;
      serviceId?: string;
      customerUserId?: string;
    }
  ): Promise<Appointment[]> => {
    try {
      console.log(`📊 listBySalon called:`, { salonId, opts });

      const baseRef = ref(db, `appointments/${salonId}`);
      let snapshot;
      if (opts?.startAt || opts?.endAt) {
        let q = query(baseRef, orderByChild('startAt'));
        if (opts?.startAt) q = query(q, fbStartAt(opts.startAt));
        if (opts?.endAt) q = query(q, fbEndAt(opts.endAt));
        snapshot = await get(q);
      } else {
        snapshot = await get(baseRef);
      }

      if (!snapshot.exists()) {
        console.log(`📊 No appointments found for salon ${salonId}`);
        return [];
      }

      const raw = snapshot.val() as Record<string, Omit<Appointment, 'id'> | Appointment>;
      console.log(`📊 Raw appointments data:`, raw);

      const list: Appointment[] = Object.entries(raw).map(([id, appt]) => {
        const { id: _ignored, ...rest } = (appt as any) ?? {};
        return { id, ...(rest as Omit<Appointment, 'id'>) } as Appointment;
      });

      console.log(`📊 Initial appointments list:`, list);

      const filtered = list.filter((a) => {
        if (opts?.status && a.status !== opts.status) {
          console.log(`🚫 Filtering out appointment ${a.id} (status mismatch: ${a.status} vs ${opts.status})`);
          return false;
        }
        if (opts?.employeeId && a.employeeId !== opts.employeeId) {
          console.log(`🚫 Filtering out appointment ${a.id} (employee mismatch: ${a.employeeId} vs ${opts.employeeId})`);
          return false;
        }
        if (opts?.serviceId && a.serviceId !== opts.serviceId) {
          console.log(`🚫 Filtering out appointment ${a.id} (service mismatch: ${a.serviceId} vs ${opts.serviceId})`);
          return false;
        }
        if (opts?.customerUserId && a.customerUserId !== opts.customerUserId) {
          console.log(`🚫 Filtering out appointment ${a.id} (customer mismatch: ${a.customerUserId} vs ${opts.customerUserId})`);
          return false;
        }
        console.log(`✅ Keeping appointment ${a.id}`);
        return true;
      });

      console.log(`📊 Final filtered appointments: ${filtered.length}`, filtered);
      return filtered;
    } catch (error) {
      console.error(`❌ Error in listBySalon:`, error);
      return [];
    }
  },

  listByDay: async (salonId: string, date: Date): Promise<Appointment[]> => {
    try {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const startIso = dayStart.toISOString();
      const endIso = dayEnd.toISOString();

      console.log(`📅 listByDay called:`, {
        salonId,
        date: date.toISOString(),
        dayStart: startIso,
        dayEnd: endIso
      });

      const appointments = await appointmentOperations.listBySalon(salonId, { startAt: startIso, endAt: endIso });
      console.log(`📅 listByDay result: ${appointments.length} appointments`, appointments);

      return appointments;
    } catch (error) {
      console.error(`❌ Error in listByDay:`, error);
      return [];
    }
  },

  isTimeSlotAvailable: async (
    salonId: string,
    startAtIso: string,
    durationMinutes: number,
    employeeId?: string,
    excludeAppointmentId?: string
  ): Promise<boolean> => {
    try {
      const start = new Date(startAtIso);
      const end = new Date(startAtIso);
      end.setMinutes(end.getMinutes() + durationMinutes);

      console.log(`🔍 Checking availability for slot:`, {
        salonId,
        startAtIso,
        start: start.toISOString(),
        end: end.toISOString(),
        durationMinutes,
        employeeId,
        excludeAppointmentId
      });

      // Fetch the day's appointments and check overlaps client-side
      const appts = await appointmentOperations.listByDay(salonId, start);
      console.log(`📅 Found ${appts.length} appointments for the day:`, appts);

      const relevant = appts.filter((a) => {
        if (excludeAppointmentId && a.id === excludeAppointmentId) {
          console.log(`🚫 Excluding appointment ${a.id} (excludeAppointmentId)`);
          return false;
        }
        if (employeeId && a.employeeId !== employeeId) {
          console.log(`🚫 Excluding appointment ${a.id} (employee mismatch: ${a.employeeId} vs ${employeeId})`);
          return false;
        }
        // Only consider active bookings
        if (a.status === 'cancelled' || a.status === 'no_show') {
          console.log(`🚫 Excluding appointment ${a.id} (status: ${a.status})`);
          return false;
        }
        console.log(`✅ Including appointment ${a.id} (employee: ${a.employeeId}, status: ${a.status})`);
        return true;
      });

      console.log(`📊 Relevant appointments after filtering: ${relevant.length}`, relevant);

      const overlaps = relevant.some((a) => {
        const aStart = new Date(a.startAt);
        const aEnd = new Date(a.startAt);
        aEnd.setMinutes(aEnd.getMinutes() + a.durationMinutes);
        
        const hasOverlap = aStart < end && start < aEnd;
        
        console.log(`🔍 Checking overlap with appointment ${a.id}:`, {
          appointmentStart: aStart.toISOString(),
          appointmentEnd: aEnd.toISOString(),
          requestedStart: start.toISOString(),
          requestedEnd: end.toISOString(),
          hasOverlap
        });
        
        return hasOverlap;
      });

      const isAvailable = !overlaps;
      console.log(`✅ Time slot availability result: ${isAvailable} (overlaps: ${overlaps})`);
      
      return isAvailable;
    } catch (error) {
      console.error(`❌ Error checking time slot availability:`, error);
      // В случае ошибки считаем слот доступным, чтобы не блокировать пользователя
      return true;
    }
  },
};
