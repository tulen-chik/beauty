export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  avatarUrl: string;
  avatarStoragePath: string;
  role: 'admin' | 'user';
  settings: {
    language: string;
    notifications: boolean;
  };
}

export type SalonRole = 'owner' | 'manager' | 'employee' | 'viewer';

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface SalonWorkTime {
  start: string;
  end: string;
}

export interface SalonWorkDay {
  day: WeekDay;
  isOpen: boolean;
  times: SalonWorkTime[];
}

export interface SalonSchedule {
  salonId: string;
  weeks: SalonWorkDay[][];
  updatedAt: string;
}

export interface SalonSettings {
  business?: {
    name: string;
    email?: string;
    phone?: string;
    address: string;
    timezone: string;
    currency: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    reminderTime: number;
  };
  security?: {
    twoFactor: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
  };
  integrations?: {
    googleCalendar: boolean;
    telegramBot: boolean;
    whatsapp: boolean;
  };
}

export interface Salon {
  id: string;
  name: string;
  address: string;
  phone?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: SalonMember[];
  schedule?: SalonSchedule;
  settings?: SalonSettings;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface SalonMember {
  userId: string;
  role: SalonRole;
  joinedAt: string;
}

export interface UserSalons {
  userId: string;
  salons: Array<{
    salonId: string;
    role: SalonRole;
    joinedAt: string;
  }>;
}

export interface SalonInvitation {
  id: string;
  salonId: string;
  email: string;
  role: SalonRole;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface ServiceImage {
  id: string;
  serviceId: string;
  url: string;
  storagePath: string;
  uploadedAt: string;
}

export interface SalonService {
  id: string;
  salonId: string;
  categoryIds?: string[];
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  images?: ServiceImage[];
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  salonId: string;
  serviceId: string;
  employeeId?: string;
  customerName?: string;
  customerPhone?: string;
  customerUserId?: string;
  startAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}