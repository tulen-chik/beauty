import { 
  AuthResponse, 
  LoginCredentials, 
  PasswordResetConfirm,
  SignupCredentials, 
  VerificationCodeRequest} from '@/types/auth';
import { axiosInstance } from './axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://147.45.231.110';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>('/api/v1/auth/login', credentials);
    return data;
  },

  async signup(credentials: SignupCredentials): Promise<void> {
    const params = new URLSearchParams({
      email: credentials.email,
      password: credentials.password,
    });

    await axiosInstance.post(`/api/v1/auth/signup?${params}`);
  },

  async verifyEmail(data: VerificationCodeRequest): Promise<void> {
    await axiosInstance.post('/api/v1/auth/signup/email/verification-code', data);
  },

  async requestPasswordReset(email: string): Promise<void> {
    await axiosInstance.post('/api/v1/auth/login/password-reset/email', email);
  },

  async resetPassword(data: PasswordResetConfirm): Promise<void> {
    await axiosInstance.post('/api/v1/auth/login/password-reset/new-password', data);
  },
}; 