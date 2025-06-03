"use client";

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ZodError } from 'zod';
import { jwtDecode } from 'jwt-decode';

import { authApi } from '@/lib/api/auth';
import { 
  loginSchema, 
  passwordResetConfirmSchema, 
  signupSchema, 
  verificationCodeSchema} from '@/lib/validations/auth';

import { 
  AuthContextType, 
  AuthError,
  LoginCredentials, 
  PasswordResetConfirm,
  SignupCredentials, 
  User, 
  ValidationError, 
  VerificationCodeRequest} from '@/types/auth';

const TOKEN_COOKIE_NAME = 'access_token';
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
const USER_COOKIE_NAME = 'user_data';

interface DecodedToken {
  sub: string;
  is_banned: boolean;
  role: string;
  exp: number;
  email: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const clearError = () => setError(null);

  const decodeToken = useCallback((token: string): User | null => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return {
        id: decoded.sub,
        role: decoded.role,
        is_banned: decoded.is_banned,
        exp: decoded.exp,
        email: decoded.email
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, []);

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
        code: 'AUTH_ERROR'
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

  const initializeAuth = useCallback(async () => {
    try {
      const storedToken = Cookies.get(TOKEN_COOKIE_NAME);
      
      if (storedToken) {
        const decodedUser = decodeToken(storedToken);
        if (decodedUser) {
          const currentTime = Math.floor(Date.now() / 1000);
          if (decodedUser.exp > currentTime) {
            setUser(decodedUser);
          } else {
            // Token expired
            Cookies.remove(TOKEN_COOKIE_NAME);
            Cookies.remove(REFRESH_TOKEN_COOKIE_NAME);
            Cookies.remove(USER_COOKIE_NAME);
            setUser(null);
          }
        } else {
          // Invalid token
          Cookies.remove(TOKEN_COOKIE_NAME);
          Cookies.remove(REFRESH_TOKEN_COOKIE_NAME);
          Cookies.remove(USER_COOKIE_NAME);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      handleError(error, 'Error initializing authentication');
      setUser(null);
    } finally {
      console.log('user', user);
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [decodeToken]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      clearError();
      
      loginSchema.parse(credentials);
      
      const response = await authApi.login(credentials);
      const decodedUser = decodeToken(response.access_token);
      
      if (!decodedUser) {
        throw new Error('Invalid token received');
      }
      
      Cookies.set(TOKEN_COOKIE_NAME, response.access_token, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: 7
      });
      
      if (response.refresh_token) {
        Cookies.set(REFRESH_TOKEN_COOKIE_NAME, response.refresh_token.refresh_token, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          expires: 7
        });
      }
      
      setUser(decodedUser);
      router.push('/app');
    } catch (error) {
      handleError(error, 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      setIsLoading(true);
      clearError();
      
      signupSchema.parse(credentials);
      await authApi.signup(credentials);
      router.push('/auth/verify-email?email=' + credentials.email);
    } catch (error) {
      handleError(error, 'Signup failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (data: VerificationCodeRequest) => {
    try {
      setIsLoading(true);
      clearError();
      
      verificationCodeSchema.parse(data);
      await authApi.verifyEmail(data);
      router.push('/auth/login');
    } catch (error) {
      handleError(error, 'Email verification failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      await authApi.requestPasswordReset(email);
      router.push('/reset-password-confirmation');
    } catch (error) {
      handleError(error, 'Password reset request failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: PasswordResetConfirm) => {
    try {
      setIsLoading(true);
      clearError();
      
      passwordResetConfirmSchema.parse(data);
      await authApi.resetPassword(data);
      router.push('/auth/login');
    } catch (error) {
      handleError(error, 'Password reset failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      clearError();
      Cookies.remove(TOKEN_COOKIE_NAME);
      Cookies.remove(REFRESH_TOKEN_COOKIE_NAME);
      Cookies.remove(USER_COOKIE_NAME);
      setUser(null);
      router.push('/');
    } catch (error) {
      handleError(error, 'Logout failed');
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    error,
    login,
    signup,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 