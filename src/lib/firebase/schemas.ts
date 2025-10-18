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

// --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
export const salonScheduleSchema = z.object({
  salonId: z.string(),
  weeklySchedule: z.array(salonWorkDaySchema), 
  updatedAt: z.string(),
});

export const salonSettingsSchema = z.object({
  business: z.object({
    name: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().optional(),
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
  city: z.string().optional(),
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
  salonId: z.string(),
});

export const salonServiceSchema = z.object({
  salonId: z.string(),
  categoryIds: z.array(z.string()).optional(),
  name: z.string().min(2),
  city: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  durationMinutes: z.number().int().positive(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isApp: z.boolean(),
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

// Chat schemas
export const chatMessageSchema = z.object({
  chatId: z.string(),
  senderId: z.string(),
  senderType: z.enum(['customer', 'salon']),
  senderName: z.string().min(1),
  messageType: z.enum(['text', 'image', 'file', 'system']),
  content: z.string().min(1),
  attachments: z.array(z.object({
    url: z.string().url(),
    filename: z.string(),
    size: z.number().positive(),
    type: z.string()
  })).optional(),
  status: z.enum(['sent', 'delivered', 'read', 'failed']),
  createdAt: z.string(),
  updatedAt: z.string(),
  readAt: z.string().optional(),
});

export const chatSchema = z.object({
  salonId: z.string(),
  customerUserId: z.string(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  appointmentId: z.string().optional(),
  serviceId: z.string().optional(),
  status: z.enum(['active', 'archived', 'closed']),
  lastMessageAt: z.string(),
  lastMessagePreview: z.string().optional(),
  unreadCount: z.object({
    customer: z.number().int().min(0),
    salon: z.number().int().min(0),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  archivedAt: z.string().optional(),
  closedAt: z.string().optional(),
});

export const chatParticipantSchema = z.object({
  chatId: z.string(),
  userId: z.string(),
  userType: z.enum(['customer', 'salon']),
  displayName: z.string().min(1),
  avatarUrl: z.string().url().optional(),
  isOnline: z.boolean(),
  lastSeenAt: z.string(),
  joinedAt: z.string(),
  leftAt: z.string().optional(),
});

export const chatNotificationSchema = z.object({
  chatId: z.string(),
  userId: z.string(),
  messageId: z.string(),
  type: z.enum(['new_message', 'message_read', 'chat_archived', 'chat_closed']),
  title: z.string().min(1),
  body: z.string().min(1),
  isRead: z.boolean(),
  createdAt: z.string(),
  readAt: z.string().optional(),
});

// Salon rating schemas
export const salonRatingSchema = z.object({
  salonId: z.string(),
  customerUserId: z.string(),
  customerName: z.string().min(1),
  appointmentId: z.string().optional(),
  serviceId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  review: z.string().min(10).max(1000),
  categories: z.object({
    service: z.number().int().min(1).max(5).optional(),
    cleanliness: z.number().int().min(1).max(5).optional(),
    atmosphere: z.number().int().min(1).max(5).optional(),
    staff: z.number().int().min(1).max(5).optional(),
    value: z.number().int().min(1).max(5).optional(),
  }).optional(),
  isAnonymous: z.boolean(),
  isVerified: z.boolean(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.string(),
  updatedAt: z.string(),
  approvedAt: z.string().optional(),
  rejectedAt: z.string().optional(),
  rejectedReason: z.string().optional(),
});

export const salonRatingResponseSchema = z.object({
  ratingId: z.string(),
  salonId: z.string(),
  responseText: z.string().min(1).max(500),
  respondedBy: z.string(),
  respondedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const salonRatingHelpfulSchema = z.object({
  ratingId: z.string(),
  userId: z.string(),
  isHelpful: z.boolean(),
  createdAt: z.string(),
});

// Blog schemas
export const blogAuthorSchema = z.object({
  name: z.string().min(2),
  avatar: z.string().url().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
  social: z.object({
    instagram: z.string().url().optional(),
    telegram: z.string().url().optional(),
    website: z.string().url().optional(),
  }).optional(),
});

export const blogCategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const blogPostSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  excerpt: z.string().min(10),
  content: z.array(z.any()),
  authorId: z.string(),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  readTime: z.number().int().positive(),
  categoryId: z.string(),
  tags: z.array(z.string()),
  image: z.string(),
  featured: z.boolean(),
  status: z.enum(['published', 'draft']),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

export const servicePromotionPlanSchema = z.object({
  name: z.string().min(3, "Название должно содержать минимум 3 символа"),
  description: z.string().min(10, "Описание должно содержать минимум 10 символов"),
  price: z.number().nonnegative("Цена не может быть отрицательной"),
  currency: z.string().length(3, "Код валюты должен состоять из 3 символов"),
  durationDays: z.number().int().positive("Длительность должна быть положительным целым числом"),
  searchPriority: z.number().int().positive("Приоритет должен быть положительным целым числом"),
  features: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string().datetime("Неверный формат даты создания"),
});

// Subscription Plan Schema
export const subscriptionPlanSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Название плана должно содержать минимум 2 символа'),
  description: z.string().min(10, 'Описание должно содержать минимум 10 символов'),
  price: z.number().min(0, 'Цена не может быть отрицательной'),
  currency: z.string().default('RUB'),
  billingPeriod: z.enum(['monthly', 'quarterly', 'yearly']),
  features: z.array(z.string()),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  createdAt: z.string().or(z.date()).transform(val => new Date(val).toISOString()),
  updatedAt: z.string().or(z.date()).transform(val => new Date(val).toISOString())
});

// Subscription Billing Schema
export const subscriptionBillingSchema = z.object({
  id: z.string().optional(),
  subscriptionId: z.string(),
  amount: z.number().min(0, 'Сумма не может быть отрицательной'),
  currency: z.string().default('RUB'),
  status: z.enum(['pending', 'paid', 'failed', 'refunded']),
  paymentMethod: z.string().optional(),
  paymentIntentId: z.string().optional(),
  billingPeriodStart: z.string().or(z.date()).transform(val => new Date(val).toISOString()),
  billingPeriodEnd: z.string().or(z.date()).transform(val => new Date(val).toISOString()),
  paidAt: z.string().or(z.date()).transform(val => new Date(val).toISOString()).optional(),
  createdAt: z.string().or(z.date()).transform(val => new Date(val).toISOString()),
  updatedAt: z.string().or(z.date()).transform(val => new Date(val).toISOString())
});

// Subscription Schema
export const subscriptionSchema = z.object({
  id: z.string().optional(),
  salonId: z.string(),
  planId: z.string(),
  status: z.enum(['active', 'canceled', 'past_due', 'unpaid', 'trialing']),
  currentPeriodStart: z.string().or(z.date()).transform(val => new Date(val).toISOString()),
  currentPeriodEnd: z.string().or(z.date()).transform(val => new Date(val).toISOString()),
  cancelAtPeriodEnd: z.boolean().default(false),
  canceledAt: z.string().or(z.date()).transform(val => new Date(val).toISOString()).optional(),
  trialStart: z.string().or(z.date()).transform(val => new Date(val).toISOString()).optional(),
  trialEnd: z.string().or(z.date()).transform(val => new Date(val).toISOString()).optional(),
  createdAt: z.string().or(z.date()).transform(val => new Date(val).toISOString()),
  // updatedAt: z.string().or(z.date()).transform(val => new Date(val).toISOString())
});

export const servicePromotionSchema = z.object({
  serviceId: z.string().min(1, "ID услуги обязателен"),
  salonId: z.string().min(1, "ID салона обязателен"),
  planId: z.string().min(1, "ID плана обязателен"),
  status: z.enum(['active', 'cancelled', 'expired', 'pending_payment', 'paused']),
  startDate: z.string().datetime("Неверный формат даты начала"),
  endDate: z.string().datetime("Неверный формат даты окончания"),
  nextPaymentDate: z.string().datetime("Неверный формат даты следующего платежа").optional(),
  createdAt: z.string().datetime("Неверный формат даты создания"),
  updatedAt: z.string().datetime("Неверный формат даты обновления"),
});

export const promotionAnalyticsSchema = z.object({
  servicePromotionId: z.string().min(1, "ID продвижения услуги обязателен"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате YYYY-MM-DD"),
  impressions: z.number().int().nonnegative("Количество показов не может быть отрицательным"),
  clicks: z.number().int().nonnegative("Количество кликов не может быть отрицательным"),
  averageRank: z.number().positive("Средний ранг должен быть положительным числом"),
  bookingsCount: z.number().int().nonnegative("Количество записей не может быть отрицательным"),
});