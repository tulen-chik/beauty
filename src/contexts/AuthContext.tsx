"use client";

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect,useState } from 'react';
import { ZodError } from 'zod';

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
const USER_COOKIE_NAME = 'user_data';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();

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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = Cookies.get(TOKEN_COOKIE_NAME);
        const storedUser = Cookies.get(USER_COOKIE_NAME);
        
        if (storedToken && storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            handleError(error, 'Error parsing user data from cookie');
            // If there's an error parsing the cookie, clear it
            Cookies.remove(TOKEN_COOKIE_NAME);
            Cookies.remove(USER_COOKIE_NAME);
          }
        }
      } catch (error) {
        handleError(error, 'Error initializing authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      clearError();
      
      // Validate credentials
      loginSchema.parse(credentials);
      
      const response = await authApi.login(credentials);
      const userData = { id: response.user_id, email: credentials.email };
      
      // Set cookies with secure options
      Cookies.set(TOKEN_COOKIE_NAME, response.access_token, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: 7 // 7 days
      });
      
      Cookies.set(USER_COOKIE_NAME, JSON.stringify(userData), {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: 7 // 7 days
      });
      
      setUser(userData);
      router.push('/'); // Redirect to home page after login
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
      
      // Validate credentials
      signupSchema.parse(credentials);
      
      await authApi.signup(credentials);
      // After signup, user needs to verify email
      router.push('/verify-email');
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
      
      // Validate verification data
      verificationCodeSchema.parse(data);
      
      await authApi.verifyEmail(data);
      // After verification, redirect to login
      router.push('/login');
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
      // After requesting password reset, redirect to reset confirmation page
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
      
      // Validate reset password data
      passwordResetConfirmSchema.parse(data);
      
      await authApi.resetPassword(data);
      // After password reset, redirect to login
      router.push('/login');
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
      // Remove cookies
      Cookies.remove(TOKEN_COOKIE_NAME);
      Cookies.remove(USER_COOKIE_NAME);
      setUser(null);
      router.push('/login');
    } catch (error) {
      handleError(error, 'Logout failed');
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
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