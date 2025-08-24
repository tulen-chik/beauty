import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { 
  salonRatingOperations, 
  salonRatingResponseOperations, 
  salonRatingHelpfulOperations 
} from '@/lib/firebase/database';
import type { 
  SalonRating, 
  SalonRatingResponse, 
  SalonRatingHelpful, 
  SalonRatingStats,
  SalonRatingCategories 
} from '@/types/database';

interface SalonRatingContextType {
  // Rating operations
  createRating: (
    ratingId: string,
    salonId: string,
    customerUserId: string,
    customerName: string,
    rating: number,
    review: string,
    categories?: SalonRatingCategories,
    appointmentId?: string,
    serviceId?: string,
    isAnonymous?: boolean
  ) => Promise<SalonRating>;
  getRating: (ratingId: string) => Promise<SalonRating | null>;
  updateRating: (ratingId: string, data: Partial<SalonRating>) => Promise<SalonRating>;
  deleteRating: (ratingId: string) => Promise<void>;
  getRatingsBySalon: (salonId: string) => Promise<SalonRating[]>;
  getRatingsByCustomer: (customerUserId: string) => Promise<SalonRating[]>;
  getRatingByAppointment: (appointmentId: string) => Promise<SalonRating | null>;
  getRatingStats: (salonId: string) => Promise<SalonRatingStats>;
  approveRating: (ratingId: string) => Promise<void>;
  rejectRating: (ratingId: string, reason: string) => Promise<void>;
  markRatingAsVerified: (ratingId: string) => Promise<void>;

  // Response operations
  createResponse: (
    responseId: string,
    ratingId: string,
    salonId: string,
    responseText: string,
    respondedBy: string
  ) => Promise<SalonRatingResponse>;
  getResponse: (responseId: string) => Promise<SalonRatingResponse | null>;
  updateResponse: (responseId: string, data: Partial<SalonRatingResponse>) => Promise<SalonRatingResponse>;
  deleteResponse: (responseId: string) => Promise<void>;
  getResponsesByRating: (ratingId: string) => Promise<SalonRatingResponse[]>;

  // Helpful operations
  addHelpfulVote: (ratingId: string, userId: string, isHelpful: boolean) => Promise<void>;
  removeHelpfulVote: (ratingId: string, userId: string) => Promise<void>;
  updateHelpfulVote: (ratingId: string, userId: string, isHelpful: boolean) => Promise<void>;
  getHelpfulVotesByRating: (ratingId: string) => Promise<SalonRatingHelpful[]>;
  getHelpfulStats: (ratingId: string) => Promise<{ helpful: number; notHelpful: number }>;
  hasUserVoted: (ratingId: string, userId: string) => Promise<SalonRatingHelpful | null>;
  toggleHelpfulVote: (ratingId: string, userId: string, isHelpful: boolean) => Promise<void>;

  // State
  ratings: Record<string, SalonRating[]>;
  ratingStats: Record<string, SalonRatingStats>;
  helpfulVotes: Record<string, SalonRatingHelpful[]>;

  // UI state
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

const SalonRatingContext = createContext<SalonRatingContextType | undefined>(undefined);

export const useSalonRating = () => {
  const ctx = useContext(SalonRatingContext);
  if (!ctx) throw new Error('useSalonRating must be used within SalonRatingProvider');
  return ctx;
};

export const SalonRatingProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, SalonRating[]>>({});
  const [ratingStats, setRatingStats] = useState<Record<string, SalonRatingStats>>({});
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, SalonRatingHelpful[]>>({});

  // Rating operations
  const createRating = useCallback(async (
    ratingId: string,
    salonId: string,
    customerUserId: string,
    customerName: string,
    rating: number,
    review: string,
    categories?: SalonRatingCategories,
    appointmentId?: string,
    serviceId?: string,
    isAnonymous = false
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data: Omit<SalonRating, 'id'> = {
        salonId,
        customerUserId,
        customerName,
        rating,
        review,
        categories,
        appointmentId,
        serviceId,
        isAnonymous,
        isVerified: false,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newRating = await salonRatingOperations.create(ratingId, data);
      
      // Update local state
      setRatings(prev => ({
        ...prev,
        [salonId]: [...(prev[salonId] || []), { ...newRating, id: ratingId }]
      }));

      setLoading(false);
      return { ...newRating, id: ratingId };
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const getRating = useCallback(async (ratingId: string) => {
    setError(null);
    try {
      return await salonRatingOperations.read(ratingId);
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  const updateRating = useCallback(async (ratingId: string, data: Partial<SalonRating>) => {
    setError(null);
    try {
      const updated = await salonRatingOperations.update(ratingId, data);
      
      // Update local state
      setRatings(prev => {
        const newRatings = { ...prev };
        Object.keys(newRatings).forEach(salonId => {
          newRatings[salonId] = newRatings[salonId].map(rating => 
            rating.id === ratingId ? { ...rating, ...data } : rating
          );
        });
        return newRatings;
      });

      return updated;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const deleteRating = useCallback(async (ratingId: string) => {
    setError(null);
    try {
      await salonRatingOperations.delete(ratingId);
      
      // Update local state
      setRatings(prev => {
        const newRatings = { ...prev };
        Object.keys(newRatings).forEach(salonId => {
          newRatings[salonId] = newRatings[salonId].filter(rating => rating.id !== ratingId);
        });
        return newRatings;
      });
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const getRatingsBySalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const salonRatings = await salonRatingOperations.getBySalon(salonId);
      setRatings(prev => ({ ...prev, [salonId]: salonRatings }));
      setLoading(false);
      return salonRatings;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  const getRatingsByCustomer = useCallback(async (customerUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const customerRatings = await salonRatingOperations.getByCustomer(customerUserId);
      setLoading(false);
      return customerRatings;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  const getRatingByAppointment = useCallback(async (appointmentId: string) => {
    setError(null);
    try {
      return await salonRatingOperations.getByAppointment(appointmentId);
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  const getRatingStats = useCallback(async (salonId: string) => {
    setError(null);
    try {
      const stats = await salonRatingOperations.getRatingStats(salonId);
      setRatingStats(prev => ({ ...prev, [salonId]: stats }));
      return stats;
    } catch (e: any) {
      setError(e.message);
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
  }, []);

  const approveRating = useCallback(async (ratingId: string) => {
    setError(null);
    try {
      await salonRatingOperations.approveRating(ratingId);
      
      // Update local state
      setRatings(prev => {
        const newRatings = { ...prev };
        Object.keys(newRatings).forEach(salonId => {
          newRatings[salonId] = newRatings[salonId].map(rating => 
            rating.id === ratingId 
              ? { ...rating, status: 'approved', approvedAt: new Date().toISOString() }
              : rating
          );
        });
        return newRatings;
      });
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const rejectRating = useCallback(async (ratingId: string, reason: string) => {
    setError(null);
    try {
      await salonRatingOperations.rejectRating(ratingId, reason);
      
      // Update local state
      setRatings(prev => {
        const newRatings = { ...prev };
        Object.keys(newRatings).forEach(salonId => {
          newRatings[salonId] = newRatings[salonId].map(rating => 
            rating.id === ratingId 
              ? { ...rating, status: 'rejected', rejectedAt: new Date().toISOString(), rejectedReason: reason }
              : rating
          );
        });
        return newRatings;
      });
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const markRatingAsVerified = useCallback(async (ratingId: string) => {
    setError(null);
    try {
      await salonRatingOperations.markAsVerified(ratingId);
      
      // Update local state
      setRatings(prev => {
        const newRatings = { ...prev };
        Object.keys(newRatings).forEach(salonId => {
          newRatings[salonId] = newRatings[salonId].map(rating => 
            rating.id === ratingId 
              ? { ...rating, isVerified: true }
              : rating
          );
        });
        return newRatings;
      });
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  // Response operations
  const createResponse = useCallback(async (
    responseId: string,
    ratingId: string,
    salonId: string,
    responseText: string,
    respondedBy: string
  ) => {
    setError(null);
    try {
      const data: Omit<SalonRatingResponse, 'id'> = {
        ratingId,
        salonId,
        responseText,
        respondedBy,
        respondedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return await salonRatingResponseOperations.create(responseId, data);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const getResponse = useCallback(async (responseId: string) => {
    setError(null);
    try {
      return await salonRatingResponseOperations.read(responseId);
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  const updateResponse = useCallback(async (responseId: string, data: Partial<SalonRatingResponse>) => {
    setError(null);
    try {
      return await salonRatingResponseOperations.update(responseId, data);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const deleteResponse = useCallback(async (responseId: string) => {
    setError(null);
    try {
      await salonRatingResponseOperations.delete(responseId);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const getResponsesByRating = useCallback(async (ratingId: string) => {
    setError(null);
    try {
      return await salonRatingResponseOperations.getByRating(ratingId);
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, []);

  // Helpful operations
  const addHelpfulVote = useCallback(async (ratingId: string, userId: string, isHelpful: boolean) => {
    setError(null);
    try {
      await salonRatingHelpfulOperations.add(ratingId, userId, isHelpful);
      
      // Update local state
      setHelpfulVotes(prev => ({
        ...prev,
        [ratingId]: [...(prev[ratingId] || []), {
          id: `${ratingId}_${userId}`,
          ratingId,
          userId,
          isHelpful,
          createdAt: new Date().toISOString()
        }]
      }));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const removeHelpfulVote = useCallback(async (ratingId: string, userId: string) => {
    setError(null);
    try {
      await salonRatingHelpfulOperations.remove(ratingId, userId);
      
      // Update local state
      setHelpfulVotes(prev => ({
        ...prev,
        [ratingId]: (prev[ratingId] || []).filter(vote => vote.userId !== userId)
      }));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const updateHelpfulVote = useCallback(async (ratingId: string, userId: string, isHelpful: boolean) => {
    setError(null);
    try {
      await salonRatingHelpfulOperations.update(ratingId, userId, isHelpful);
      
      // Update local state
      setHelpfulVotes(prev => ({
        ...prev,
        [ratingId]: (prev[ratingId] || []).map(vote => 
          vote.userId === userId ? { ...vote, isHelpful } : vote
        )
      }));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const getHelpfulVotesByRating = useCallback(async (ratingId: string) => {
    setError(null);
    try {
      const votes = await salonRatingHelpfulOperations.getByRating(ratingId);
      setHelpfulVotes(prev => ({ ...prev, [ratingId]: votes }));
      return votes;
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, []);

  const getHelpfulStats = useCallback(async (ratingId: string) => {
    setError(null);
    try {
      return await salonRatingHelpfulOperations.getHelpfulStats(ratingId);
    } catch (e: any) {
      setError(e.message);
      return { helpful: 0, notHelpful: 0 };
    }
  }, []);

  const hasUserVoted = useCallback(async (ratingId: string, userId: string) => {
    setError(null);
    try {
      return await salonRatingHelpfulOperations.hasUserVoted(ratingId, userId);
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  const toggleHelpfulVote = useCallback(async (ratingId: string, userId: string, isHelpful: boolean) => {
    setError(null);
    try {
      await salonRatingHelpfulOperations.toggleHelpful(ratingId, userId, isHelpful);
      
      // Refresh helpful votes for this rating
      await getHelpfulVotesByRating(ratingId);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, [getHelpfulVotesByRating]);

  const value: SalonRatingContextType = useMemo(() => ({
    // Rating operations
    createRating,
    getRating,
    updateRating,
    deleteRating,
    getRatingsBySalon,
    getRatingsByCustomer,
    getRatingByAppointment,
    getRatingStats,
    approveRating,
    rejectRating,
    markRatingAsVerified,

    // Response operations
    createResponse,
    getResponse,
    updateResponse,
    deleteResponse,
    getResponsesByRating,

    // Helpful operations
    addHelpfulVote,
    removeHelpfulVote,
    updateHelpfulVote,
    getHelpfulVotesByRating,
    getHelpfulStats,
    hasUserVoted,
    toggleHelpfulVote,

    // State
    ratings,
    ratingStats,
    helpfulVotes,

    // UI state
    loading,
    error,
    setError,
  }), [
    createRating,
    getRating,
    updateRating,
    deleteRating,
    getRatingsBySalon,
    getRatingsByCustomer,
    getRatingByAppointment,
    getRatingStats,
    approveRating,
    rejectRating,
    markRatingAsVerified,
    createResponse,
    getResponse,
    updateResponse,
    deleteResponse,
    getResponsesByRating,
    addHelpfulVote,
    removeHelpfulVote,
    updateHelpfulVote,
    getHelpfulVotesByRating,
    getHelpfulStats,
    hasUserVoted,
    toggleHelpfulVote,
    ratings,
    ratingStats,
    helpfulVotes,
    loading,
    error,
  ]);

  return (
    <SalonRatingContext.Provider value={value}>
      {children}
    </SalonRatingContext.Provider>
  );
};
