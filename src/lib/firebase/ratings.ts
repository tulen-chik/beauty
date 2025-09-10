import type { SalonRating, SalonRatingHelpful, SalonRatingResponse, SalonRatingStats } from '@/types/database';
import { salonRatingHelpfulSchema, salonRatingResponseSchema, salonRatingSchema } from './schemas';
import { createOperation, readOperation, updateOperation, deleteOperation } from './crud';
import { db } from './init';
import { get, ref } from 'firebase/database';

export const salonRatingOperations = {
  create: (ratingId: string, data: Omit<SalonRating, 'id'>) =>
    createOperation(`salonRatings/${ratingId}`, data, salonRatingSchema),
  read: (ratingId: string) => readOperation<SalonRating>(`salonRatings/${ratingId}`),
  update: (ratingId: string, data: Partial<SalonRating>) =>
    updateOperation(`salonRatings/${ratingId}`, data, salonRatingSchema),
  delete: (ratingId: string) => deleteOperation(`salonRatings/${ratingId}`),

  getBySalon: async (salonId: string): Promise<SalonRating[]> => {
    try {
      const snapshot = await get(ref(db, `salonRatings`));
      if (!snapshot.exists()) return [];
      const ratings = snapshot.val() as Record<string, SalonRating>;
      return Object.entries(ratings)
        .map(([id, rating]) => ({ ...rating, id }))
        .filter(rating => rating.salonId === salonId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (_) {
      return [];
    }
  },

  getAverageRating: async (salonId: string): Promise<number> => {
    try {
      const ratings = await salonRatingOperations.getBySalon(salonId);
      if (ratings.length === 0) return 0;
      const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
      return totalRating / ratings.length;
    } catch (_) {
      return 0;
    }
  },

  getRatingStats: async (salonId: string): Promise<SalonRatingStats> => {
    try {
      const ratings = await salonRatingOperations.getBySalon(salonId);
      const approvedRatings = ratings.filter(r => r.status === 'approved');
      const totalRatings = approvedRatings.length;
      const averageRating = totalRatings > 0 ? approvedRatings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings : 0;

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as SalonRatingStats['ratingDistribution'];
      approvedRatings.forEach(rating => {
        if (rating.rating >= 1 && rating.rating <= 5) {
          ratingDistribution[rating.rating as keyof typeof ratingDistribution]++;
        }
      });

      const categoryAverages: SalonRatingStats['categoryAverages'] = {};
      if (approvedRatings.some(r => r.categories)) {
        const categories = ['service', 'cleanliness', 'atmosphere', 'staff', 'value'] as const;
        categories.forEach(category => {
          const categoryRatings = approvedRatings
            .filter(r => r.categories && r.categories[category])
            .map(r => r.categories![category]!);
          if (categoryRatings.length > 0) {
            categoryAverages[category] = categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length;
          }
        });
      }

      return {
        averageRating,
        totalRatings,
        ratingDistribution,
        categoryAverages: Object.keys(categoryAverages).length > 0 ? categoryAverages : undefined,
      };
    } catch (_) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      } as SalonRatingStats;
    }
  },

  getByCustomer: async (customerUserId: string): Promise<SalonRating[]> => {
    try {
      const snapshot = await get(ref(db, 'salonRatings'));
      if (!snapshot.exists()) return [];
      const ratings = snapshot.val() as Record<string, SalonRating>;
      return Object.entries(ratings)
        .map(([id, rating]) => ({ ...rating, id }))
        .filter(rating => rating.customerUserId === customerUserId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (_) {
      return [];
    }
  },

  getByAppointment: async (appointmentId: string): Promise<SalonRating | null> => {
    try {
      const snapshot = await get(ref(db, 'salonRatings'));
      if (!snapshot.exists()) return null;
      const ratings = snapshot.val() as Record<string, SalonRating>;
      const rating = Object.entries(ratings)
        .map(([id, rating]) => ({ ...rating, id }))
        .find(rating => rating.appointmentId === appointmentId);
      return rating || null;
    } catch (_) {
      return null;
    }
  },

  approveRating: async (ratingId: string): Promise<void> => {
    const now = new Date().toISOString();
    await salonRatingOperations.update(ratingId, {
      status: 'approved',
      approvedAt: now,
      updatedAt: now
    });
  },

  rejectRating: async (ratingId: string, reason: string): Promise<void> => {
    const now = new Date().toISOString();
    await salonRatingOperations.update(ratingId, {
      status: 'rejected',
      rejectedAt: now,
      rejectedReason: reason,
      updatedAt: now
    });
  },

  markAsVerified: async (ratingId: string): Promise<void> => {
    const now = new Date().toISOString();
    await salonRatingOperations.update(ratingId, {
      isVerified: true,
      updatedAt: now
    });
  },
};

export const salonRatingResponseOperations = {
  create: (responseId: string, data: Omit<SalonRatingResponse, 'id'>) =>
    createOperation(`salonRatingResponses/${responseId}`, data, salonRatingResponseSchema),
  read: (responseId: string) => readOperation<SalonRatingResponse>(`salonRatingResponses/${responseId}`),
  update: (responseId: string, data: Partial<SalonRatingResponse>) =>
    updateOperation(`salonRatingResponses/${responseId}`, data, salonRatingResponseSchema),
  delete: (responseId: string) => deleteOperation(`salonRatingResponses/${responseId}`),
  getByRating: async (ratingId: string): Promise<SalonRatingResponse[]> => {
    try {
      const snapshot = await get(ref(db, `salonRatingResponses`));
      if (!snapshot.exists()) return [];
      const responses = snapshot.val() as Record<string, SalonRatingResponse>;
      return Object.entries(responses)
        .map(([id, response]) => ({ ...response, id }))
        .filter(response => response.ratingId === ratingId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (_) {
      return [];
    }
  },
};

export const salonRatingHelpfulOperations = {
  add: (ratingId: string, userId: string, isHelpful: boolean) => {
    const helpfulId = `${ratingId}_${userId}`;
    const data: Omit<SalonRatingHelpful, 'id'> = {
      ratingId,
      userId,
      isHelpful,
      createdAt: new Date().toISOString()
    };
    return createOperation(`salonRatingHelpfuls/${helpfulId}`, data, salonRatingHelpfulSchema);
  },

  remove: (ratingId: string, userId: string) => {
    const helpfulId = `${ratingId}_${userId}`;
    return deleteOperation(`salonRatingHelpfuls/${helpfulId}`);
  },

  update: (ratingId: string, userId: string, isHelpful: boolean) => {
    const helpfulId = `${ratingId}_${userId}`;
    const data: Partial<SalonRatingHelpful> = {
      isHelpful,
      createdAt: new Date().toISOString()
    };
    return updateOperation(`salonRatingHelpfuls/${helpfulId}`, data, salonRatingHelpfulSchema);
  },

  getByRating: async (ratingId: string): Promise<SalonRatingHelpful[]> => {
    try {
      const snapshot = await get(ref(db, `salonRatingHelpfuls`));
      if (!snapshot.exists()) return [];
      const helpfuls = snapshot.val() as Record<string, SalonRatingHelpful>;
      return Object.entries(helpfuls)
        .map(([id, helpful]) => ({ ...helpful, id }))
        .filter(helpful => helpful.ratingId === ratingId);
    } catch (_) {
      return [];
    }
  },

  getHelpfulStats: async (ratingId: string): Promise<{ helpful: number; notHelpful: number }> => {
    try {
      const helpfuls = await salonRatingHelpfulOperations.getByRating(ratingId);
      const helpful = helpfuls.filter(h => h.isHelpful).length;
      const notHelpful = helpfuls.filter(h => !h.isHelpful).length;
      return { helpful, notHelpful };
    } catch (_) {
      return { helpful: 0, notHelpful: 0 };
    }
  },

  hasUserVoted: async (ratingId: string, userId: string): Promise<SalonRatingHelpful | null> => {
    try {
      const helpfulId = `${ratingId}_${userId}`;
      const snapshot = await get(ref(db, `salonRatingHelpfuls/${helpfulId}`));
      return snapshot.exists() ? { ...(snapshot.val() as any), id: helpfulId } : null;
    } catch (_) {
      return null;
    }
  },

  toggleHelpful: async (ratingId: string, userId: string, isHelpful: boolean): Promise<void> => {
    const existingVote = await salonRatingHelpfulOperations.hasUserVoted(ratingId, userId);
    if (existingVote) {
      if (existingVote.isHelpful === isHelpful) {
        await salonRatingHelpfulOperations.remove(ratingId, userId);
      } else {
        await salonRatingHelpfulOperations.update(ratingId, userId, isHelpful);
      }
    } else {
      await salonRatingHelpfulOperations.add(ratingId, userId, isHelpful);
    }
  },
};
