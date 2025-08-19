import { db } from './init';
import { equalTo, get, orderByChild, query, ref, remove, set, update, startAt as fbStartAt, endAt as fbEndAt } from 'firebase/database';
import { salonSchema, userSchema, userSalonsSchema, salonInvitationSchema, serviceCategorySchema, salonServiceSchema, salonScheduleSchema, appointmentSchema } from './schemas';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

import type { Salon, User, UserSalons, SalonInvitation, ServiceCategory, SalonService, SalonSchedule, Appointment, AppointmentStatus } from '@/types/database';

// Базовые операции CRUD
const createOperation = async <T>(
  path: string,
  data: Omit<T, 'id'>,
  schema: any
) => {
  const validatedData = schema.parse(data);
  const newRef = ref(db, path);
  await set(newRef, validatedData);
  return validatedData;
};

const readOperation = async <T>(path: string): Promise<T | null> => {
  const snapshot = await get(ref(db, path));
  return snapshot.exists() ? (snapshot.val() as T) : null;
};

const updateOperation = async <T>(path: string, data: Partial<T>, schema: any) => {
  const validatedData = schema.parse({ ...(await readOperation<T>(path)), ...data });
  await update(ref(db, path), validatedData);
  return validatedData;
};

const deleteOperation = async (path: string) => {
  await remove(ref(db, path));
};

// Операции с пользователями
export const userOperations = {
  create: (userId: string, data: Omit<User, 'id'>) =>
    createOperation(`users/${userId}`, data, userSchema),
  read: (userId: string) => readOperation<User>(`users/${userId}`),
  update: (userId: string, data: Partial<User>) =>
    updateOperation(`users/${userId}`, data, userSchema),
  delete: (userId: string) => deleteOperation(`users/${userId}`),
  getByEmail: async (email: string) => {
    const usersRef = query(ref(db, 'users'), orderByChild('email'), equalTo(email));
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return null;
    const [userId, userData] = Object.entries(snapshot.val())[0];
    return { userId, ...(userData as User) };
  },
  getById: async (userId: string) => {
    const snapshot = await get(ref(db, `users/${userId}`));
    return snapshot.exists() ? (snapshot.val() as User) : null;
  }
};

export const salonOperations = {
  create: (salonId: string, data: Omit<Salon, 'id'>) =>
    createOperation(`salons/${salonId}`, data, salonSchema),
  read: (salonId: string) => readOperation<Salon>(`salons/${salonId}`),
  update: (salonId: string, data: Partial<Salon>) =>
    updateOperation(`salons/${salonId}`, data, salonSchema),
  delete: (salonId: string) => deleteOperation(`salons/${salonId}`),
};

export const userSalonsOperations = {
  create: (userId: string, data: Omit<UserSalons, 'id'>) =>
    createOperation(`userSalons/${userId}`, data, userSalonsSchema),
  read: (userId: string) => readOperation<UserSalons>(`userSalons/${userId}`),
  update: (userId: string, data: Partial<UserSalons>) =>
    updateOperation(`userSalons/${userId}`, data, userSalonsSchema),
  delete: (userId: string) => deleteOperation(`userSalons/${userId}`),
};

export const salonInvitationOperations = {
  create: (invitationId: string, data: Omit<SalonInvitation, 'id'>) =>
    createOperation(`salonInvitations/${invitationId}`, data, salonInvitationSchema),
  read: (invitationId: string) => readOperation<SalonInvitation>(`salonInvitations/${invitationId}`),
  update: (invitationId: string, data: Partial<SalonInvitation>) =>
    updateOperation(`salonInvitations/${invitationId}`, data, salonInvitationSchema),
  delete: (invitationId: string) => deleteOperation(`salonInvitations/${invitationId}`),
};

export const serviceCategoryOperations = {
  create: (categoryId: string, data: Omit<ServiceCategory, 'id'>) =>
    createOperation(`serviceCategories/${categoryId}`, data, serviceCategorySchema),
  read: (categoryId: string) => readOperation<ServiceCategory>(`serviceCategories/${categoryId}`),
  update: (categoryId: string, data: Partial<ServiceCategory>) =>
    updateOperation(`serviceCategories/${categoryId}`, data, serviceCategorySchema),
  delete: (categoryId: string) => deleteOperation(`serviceCategories/${categoryId}`),
};

export const salonServiceOperations = {
  create: (serviceId: string, data: Omit<SalonService, 'id'>) =>
    createOperation(`salonServices/${serviceId}`, data, salonServiceSchema),
  read: (serviceId: string) => readOperation<SalonService>(`salonServices/${serviceId}`),
  update: (serviceId: string, data: Partial<SalonService>) =>
    updateOperation(`salonServices/${serviceId}`, data, salonServiceSchema),
  delete: (serviceId: string) => deleteOperation(`salonServices/${serviceId}`),
};

export const salonScheduleOperations = {
  create: (salonId: string, data: SalonSchedule) =>
    createOperation(`salonSchedules/${salonId}`, data, salonScheduleSchema),
  read: (salonId: string) => readOperation<SalonSchedule>(`salonSchedules/${salonId}`),
  update: (salonId: string, data: Partial<SalonSchedule>) =>
    updateOperation(`salonSchedules/${salonId}`, data, salonScheduleSchema),
  delete: (salonId: string) => deleteOperation(`salonSchedules/${salonId}`),
};

// Appointments operations
export const appointmentOperations = {
  // Create appointment under a salon namespace: appointments/{salonId}/{appointmentId}
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

  // Check if a time slot is available (no overlapping appointments). Optional employee scope
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

// Загрузка изображения для сервиса
export const uploadServiceImage = async (serviceId: string, file: File) => {
  const storage = getStorage();
  const id = `${Date.now()}-${file.name}`;
  const path = `serviceImages/${serviceId}/${id}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  const url = await getDownloadURL(ref);
  return {
    id,
    serviceId,
    url,
    storagePath: path,
    uploadedAt: new Date().toISOString(),
  };
};

// Удаление изображения сервиса
export const deleteServiceImage = async (storagePath: string) => {
  const storage = getStorage();
  const ref = storageRef(storage, storagePath);
  await deleteObject(ref);
};

// Получить все изображения сервиса
export const getServiceImages = async (serviceId: string) => {
  const storage = getStorage();
  const dirRef = storageRef(storage, `serviceImages/${serviceId}`);
  const res = await listAll(dirRef);
  const images = await Promise.all(
    res.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        id: itemRef.name,
        serviceId,
        url,
        storagePath: itemRef.fullPath,
        uploadedAt: '', // Можно хранить дату в БД, если нужно
      };
    })
  );
  return images;
};

// Получить все приглашения в салоны (raw)
export const getAllSalonInvitations = async () => {
  const snapshot = await get(ref(db, 'salonInvitations'));
  return snapshot.exists() ? snapshot.val() : {};
};

export const getAllServiceCategories = async () => {
  const snapshot = await get(ref(db, 'serviceCategories'));
  return snapshot.exists() ? snapshot.val() : {};
};

export const getAllSalonServices = async () => {
  const snapshot = await get(ref(db, 'salonServices'));
  return snapshot.exists() ? snapshot.val() : {};
};

export const getAllSalons = async () => {
  const snapshot = await get(ref(db, 'salons'));
  return snapshot.exists() ? snapshot.val() : {};
};
