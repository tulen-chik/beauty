export interface SalonRatingCategories {
  service?: number;
  cleanliness?: number;
  atmosphere?: number;
  staff?: number;
  value?: number;
}

export interface SalonRatingAttachment {
  url: string;
  filename: string;
  size: number;
  type: string;
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
  attachments?: SalonRatingAttachment[];
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
