export interface ServicePromotionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  searchPriority: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface ServicePromotion {
  id: string;
  serviceId: string;
  salonId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending_payment' | 'paused';
  startDate: string;
  endDate: string;
  nextPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionAnalytics {
  id: string;
  servicePromotionId: string;
  date: string;
  impressions: number;
  clicks: number;
  averageRank: number;
  bookingsCount: number;
}
