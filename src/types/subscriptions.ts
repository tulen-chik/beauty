export interface SalonSubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalonSubscription {
  id: string;
  salonId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialStart?: string;
  trialEnd?: string;
  createdAt: string;
}

export interface SubscriptionBilling {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentDate: string;
  dueDate: string;
  invoiceUrl?: string;
  failureReason?: string;
  createdAt: string;
}

export interface SubscriptionFeature {
  key: string;
  name: string;
  description: string;
  category: 'core' | 'analytics' | 'marketing' | 'integrations' | 'support';
  isCore: boolean;
}

// Предустановленные планы подписок
export const DEFAULT_SUBSCRIPTION_PLANS: Omit<SalonSubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Базовый',
    description: 'Идеально для небольших салонов',
    price: 990,
    currency: 'RUB',
    billingPeriod: 'monthly',
    features: [
      'Неограниченное количество услуг',
      'Неограниченное количество сотрудников',
      'Неограниченное количество записей',
      'Базовая аналитика',
      'Email поддержка'
    ],
    isActive: true
  },
  {
    name: 'Профессиональный',
    description: 'Для растущих салонов красоты',
    price: 2490,
    currency: 'RUB',
    billingPeriod: 'monthly',
    features: [
      'Неограниченное количество услуг',
      'Неограниченное количество сотрудников',
      'Неограниченное количество записей',
      'Расширенная аналитика',
      'Кастомный брендинг',
      'Приоритетная поддержка',
      'API доступ'
    ],
    isActive: true,
    isPopular: true
  },
  {
    name: 'Премиум',
    description: 'Для сетей салонов и крупного бизнеса',
    price: 4990,
    currency: 'RUB',
    billingPeriod: 'monthly',
    features: [
      'Неограниченные услуги',
      'Неограниченные сотрудники',
      'Неограниченные записи',
      'Полная аналитика',
      'Мультилокации',
      'Персональный менеджер',
      'Интеграции с внешними системами'
    ],
    isActive: true
  }
];
