'use client';

import React, { createContext, useContext, useState } from 'react';
import { ZodError } from 'zod';

import { publicationApi } from '@/lib/api/publication';
import { 
  CreatePublicationRequest, 
  PublicationContextType, 
  PublicationError, 
  PublicationWithCommentsResponse, 
  ValidationError 
} from '@/types/publication';

const PublicationContext = createContext<PublicationContextType | undefined>(undefined);

export function PublicationProvider({ children }: { children: React.ReactNode }) {
  const [publications, setPublications] = useState<PublicationWithCommentsResponse[]>([]);
  const [currentPublication, setCurrentPublication] = useState<PublicationWithCommentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PublicationError | null>(null);

  const clearError = () => setError(null);

  const handleValidationError = (zodError: ZodError): ValidationError[] => {
    return zodError.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
  };

  const handleError = (error: unknown, defaultMessage: string) => {
    console.error(defaultMessage, error);
    
    if (error instanceof ZodError) {
      setError({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        validationErrors: handleValidationError(error)
      });
    } else if (error instanceof Error) {
      setError({
        message: error.message || defaultMessage,
        code: 'PUBLICATION_ERROR'
      });
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as { message?: string; code?: string; field?: string };
      setError({
        message: errorObj.message || defaultMessage,
        code: errorObj.code,
        field: errorObj.field
      });
    } else {
      setError({
        message: defaultMessage,
        code: 'UNKNOWN_ERROR'
      });
    }
  };

  const createPublication = async (data: CreatePublicationRequest) => {
    try {
      setIsLoading(true);
      clearError();
      
      const newPublication = await publicationApi.createPublication(data);
      setPublications(prev => [newPublication, ...prev]);
    } catch (error) {
      handleError(error, 'Failed to create publication');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getPublicationsByUser = async (userId: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      const userPublications = await publicationApi.getPublicationsByUser(userId);
      setPublications(userPublications);
    } catch (error) {
      handleError(error, 'Failed to fetch user publications');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getLatestPublications = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      const latestPublications = await publicationApi.getLatestPublications();
      setPublications(latestPublications);
    } catch (error) {
      handleError(error, 'Failed to fetch latest publications');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getPublicationById = async (publicationId: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      const publication = await publicationApi.getPublicationById(publicationId);
      setCurrentPublication(publication);
    } catch (error) {
      handleError(error, 'Failed to fetch publication');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePublication = async (publicationId: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      await publicationApi.deletePublication(publicationId);
      setPublications(prev => prev.filter(pub => pub.id !== publicationId));
      if (currentPublication?.id === publicationId) {
        setCurrentPublication(null);
      }
    } catch (error) {
      handleError(error, 'Failed to delete publication');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    publications,
    currentPublication,
    isLoading,
    error,
    createPublication,
    getPublicationsByUser,
    getLatestPublications,
    getPublicationById,
    deletePublication,
    clearError,
  };

  return (
    <PublicationContext.Provider value={value}>
      {children}
    </PublicationContext.Provider>
  );
}

export function usePublication() {
  const context = useContext(PublicationContext);
  if (context === undefined) {
    throw new Error('usePublication must be used within a PublicationProvider');
  }
  return context;
} 