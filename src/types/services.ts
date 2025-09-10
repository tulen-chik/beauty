export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  salonId: string;
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
  // Добавлено поле для отслеживания статуса продвижения
  promotionStatus?: 'active' | 'paused' | 'inactive';
}
