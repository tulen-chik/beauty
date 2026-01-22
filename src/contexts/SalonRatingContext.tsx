'use client';

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';


import type { 
  SalonRating, 
  SalonRatingAttachment,
  SalonRatingCategories, 
  SalonRatingHelpful, 
  SalonRatingResponse, 
  SalonRatingStats
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
    isAnonymous?: boolean,
    attachments?: SalonRatingAttachment[]
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
    isAnonymous = false,
    attachments?: SalonRatingAttachment[]
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
        attachments,
        isAnonymous,
        isVerified: false,
        status: "approved",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratingId, ...data }),
      });
      if (!response.ok) {
        throw new Error('Failed to create rating');
      }
      const newRating = await response.json();
      
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
      const response = await fetch(`/api/ratings/${ratingId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to get rating');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  const updateRating = useCallback(async (ratingId: string, data: Partial<SalonRating>) => {
    setError(null);
    try {
      const response = await fetch(`/api/ratings/${ratingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update rating');
      }
      const updated = await response.json();
      
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
      const response = await fetch(`/api/ratings/${ratingId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete rating');
      }
      
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
      const response = await fetch(`/api/ratings?salonId=${salonId}`);
      if (!response.ok) {
        throw new Error('Failed to get ratings for salon');
      }
      const salonRatings = await response.json();
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
      const response = await fetch(`/api/ratings?customerUserId=${customerUserId}`);
      if (!response.ok) {
        throw new Error('Failed to get ratings for customer');
      }
      const customerRatings = await response.json();
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
      const response = await fetch(`/api/ratings?appointmentId=${appointmentId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to get rating by appointment');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  const getRatingStats = useCallback(async (salonId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/salons/${salonId}/rating-stats`);
      if (!response.ok) {
        throw new Error('Failed to get rating stats');
      }
      const stats = await response.json();
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
      const response = await fetch(`/api/ratings/${ratingId}/approve`, { method: 'PUT' });
      if (!response.ok) {
        throw new Error('Failed to approve rating');
      }
      
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
      const response = await fetch(`/api/ratings/${ratingId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        throw new Error('Failed to reject rating');
      }
      
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
      const response = await fetch(`/api/ratings/${ratingId}/verify`, { method: 'PUT' });
      if (!response.ok) {
        throw new Error('Failed to mark rating as verified');
      }
      
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

      const response = await fetch(`/api/ratings/${ratingId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId, ...data }),
      });
      if (!response.ok) {
        throw new Error('Failed to create response');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const getResponse = useCallback(async (responseId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/responses/${responseId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to get response');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  const updateResponse = useCallback(async (responseId: string, data: Partial<SalonRatingResponse>) => {
    setError(null);
    try {
      const response = await fetch(`/api/responses/${responseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update response');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const deleteResponse = useCallback(async (responseId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/responses/${responseId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete response');
      }
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const getResponsesByRating = useCallback(async (ratingId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/ratings/${ratingId}/responses`);
      if (!response.ok) {
        throw new Error('Failed to get responses');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, []);

  // Helpful operations

  const getHelpfulVotesByRating = useCallback(async (ratingId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/ratings/${ratingId}/helpful`);
      if (!response.ok) {
        throw new Error('Failed to get helpful votes');
      }
      const votes = await response.json();
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
      const response = await fetch(`/api/ratings/${ratingId}/helpful/stats`);
      if (!response.ok) {
        throw new Error('Failed to get helpful stats');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      return { helpful: 0, notHelpful: 0 };
    }
  }, []);

  const hasUserVoted = useCallback(async (ratingId: string, userId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/ratings/${ratingId}/helpful/vote?userId=${userId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to check user vote');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  const toggleHelpfulVote = useCallback(async (ratingId: string, userId: string, isHelpful: boolean) => {
    setError(null);
    try {
      const response = await fetch(`/api/ratings/${ratingId}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isHelpful }),
      });
      if (!response.ok) {
        throw new Error('Failed to toggle helpful vote');
      }
      
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