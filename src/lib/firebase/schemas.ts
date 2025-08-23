import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  avatarUrl: z.string().optional(),
  avatarStoragePath: z.string().optional(),
  createdAt: z.string(),
  role: z.enum(['admin', 'user']),
  settings: z.object({
    language: z.string(),
    notifications: z.boolean()
  })
});

export const salonMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['owner', 'manager', 'employee', 'viewer']),
  joinedAt: z.string(),
});

export const salonWorkTimeSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const salonWorkDaySchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  isOpen: z.boolean(),
  times: z.array(salonWorkTimeSchema),
});

export const salonScheduleSchema = z.object({
  salonId: z.string(),
  weeks: z.array(z.array(salonWorkDaySchema)),
  updatedAt: z.string(),
});

export const salonSettingsSchema = z.object({
  business: z.object({
    name: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    address: z.string(),
    timezone: z.string(),
    currency: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }).optional(),
  notifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    reminderTime: z.number()
  }).optional(),
  security: z.object({
    twoFactor: z.boolean(),
    sessionTimeout: z.number(),
    passwordExpiry: z.number()
  }).optional(),
  integrations: z.object({
    googleCalendar: z.boolean(),
    telegramBot: z.boolean(),
    whatsapp: z.boolean()
  }).optional()
});

export const salonSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(2),
  phone: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  members: z.array(salonMemberSchema),
  schedule: salonScheduleSchema.optional(),
  settings: salonSettingsSchema.optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

export const userSalonsSchema = z.object({
  userId: z.string(),
  salons: z.array(z.object({
    salonId: z.string(),
    role: z.enum(['owner', 'manager', 'employee', 'viewer']),
    joinedAt: z.string(),
  })),
});

export const salonInvitationSchema = z.object({
  salonId: z.string(),
  email: z.string().email(),
  role: z.enum(['owner', 'manager', 'employee', 'viewer']),
  invitedBy: z.string(),
  status: z.enum(['pending', 'accepted', 'declined', 'expired']),
  createdAt: z.string(),
});

export const serviceCategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  createdAt: z.string(),
});

export const salonServiceSchema = z.object({
  salonId: z.string(),
  categoryIds: z.array(z.string()).optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  durationMinutes: z.number().int().positive(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
}); 

export const appointmentSchema = z.object({
  salonId: z.string(),
  serviceId: z.string(),
  employeeId: z.string().optional(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().optional(),
  customerUserId: z.string().optional(),
  startAt: z.string(),
  durationMinutes: z.number().int().positive(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});