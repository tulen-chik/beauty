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
  isApp: boolean;
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

export type ChatMessageType = 'text' | 'image' | 'file' | 'system';

export type ChatMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderType: 'customer' | 'salon';
  senderName: string;
  messageType: ChatMessageType;
  content: string;
  attachments?: {
    url: string;
    filename: string;
    size: number;
    type: string;
  }[];
  status: ChatMessageStatus;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
}

export interface Chat {
  id: string;
  salonId: string;
  customerUserId: string;
  customerName: string;
  customerPhone?: string;
  appointmentId?: string;
  serviceId?: string;
  status: 'active' | 'archived' | 'closed';
  lastMessageAt: string;
  lastMessagePreview?: string;
  unreadCount: {
    customer: number;
    salon: number;
  };
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  closedAt?: string;
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  userType: 'customer' | 'salon';
  displayName: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeenAt: string;
  joinedAt: string;
  leftAt?: string;
}

export interface ChatNotification {
  id: string;
  chatId: string;
  userId: string;
  messageId: string;
  type: 'new_message' | 'message_read' | 'chat_archived' | 'chat_closed';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

// Salon rating types
export interface SalonRatingCategories {
  service?: number;
  cleanliness?: number;
  atmosphere?: number;
  staff?: number;
  value?: number;
}

export interface SalonRating {
  id: string;
  salonId: string;
  customerUserId: string;
  customerName: string;
  appointmentId?: string;
  serviceId?: string;
  rating: number;
  review: string;
  categories?: SalonRatingCategories;
  isAnonymous: boolean;
  isVerified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
}

export interface SalonRatingResponse {
  id: string;
  ratingId: string;
  salonId: string;
  responseText: string;
  respondedBy: string;
  respondedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalonRatingHelpful {
  id: string;
  ratingId: string;
  userId: string;
  isHelpful: boolean;
  createdAt: string;
}

export interface SalonRatingStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  categoryAverages?: {
    service?: number;
    cleanliness?: number;
    atmosphere?: number;
    staff?: number;
    value?: number;
  };
}

// Blog types
export interface BlogAuthor {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  bio?: string;
  social?: {
    instagram?: string;
    telegram?: string;
    website?: string;
  };
}

export interface BlogCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export type BlogPostStatus = 'published' | 'draft';

export interface BlogPostSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: any[];
  authorId: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: number;
  categoryId: string;
  tags: string[];
  image: string;
  featured: boolean;
  status: BlogPostStatus;
  seo?: BlogPostSEO;
}

export type BlockColor = 
  | 'gray' 
  | 'rose' 
  | 'pink' 
  | 'purple' 
  | 'indigo' 
  | 'blue' 
  | 'green' 
  | 'yellow';

// --- Определения для каждого типа контентного блока ---

/**
 * Блок для обычного текстового абзаца.
 */
export interface ParagraphBlock {
  type: 'paragraph';
  content: string;
}

/**
 * Блок для заголовков разных уровней (H2, H3, H4).
 */
export interface HeadingBlock {
  type: 'heading';
  level: 2 | 3 | 4;
  content: string;
}

/**
 * Блок для маркированного списка.
 */
export interface ListBlock {
  type: 'list';
  items: string[];
}

/**
 * Блок для пошаговых инструкций.
 */
export interface StepsBlock {
  type: 'steps';
  steps: string[];
}

/**
 * Блок для выделения советов или важных заметок.
 */
export interface TipBlock {
  type: 'tip';
  title: string;
  content: string;
  color: BlockColor;
}

/**
 * Информационный блок с заголовком и списком пунктов.
 */
export interface InfoBoxBlock {
  type: 'infoBox';
  title: string;
  items: string[];
  color: BlockColor;
}

/**
 * Блок для обзора продукта с рейтингом.
 */
export interface ProductRatingBlock {
  type: 'productRating';
  name: string;
  rating: string; // Например, "9/10"
  description: string;
  color: BlockColor;
}

/**
 * Дискриминированное объединение (discriminated union) для всех возможных типов контентных блоков.
 * Свойство `type` служит дискриминантом, позволяя TypeScript точно определять
 * структуру объекта внутри условных конструкций (например, switch-case).
 */
export type BlogContent =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | StepsBlock
  | TipBlock
  | InfoBoxBlock
  | ProductRatingBlock;