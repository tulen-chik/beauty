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
  weeklySchedule: SalonWorkDay[]; // Single week pattern that repeats
  updatedAt: string;
}

export interface SalonSettings {
  business?: {
    name: string;
    email?: string;
    phone?: string;
    timezone: string;
    currency: string;
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
  city?: string;
  description?: string;
  createdAt: string;
  avatarUrl?: string;
  avatarStoragePath?: string;
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