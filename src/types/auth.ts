import { 
  LoginFormData, 
  PasswordResetConfirmFormData, 
  SignupFormData, 
  VerificationCodeFormData} from '@/lib/validations/auth';

export type LoginCredentials = LoginFormData;
export type SignupCredentials = SignupFormData;
export type VerificationCodeRequest = VerificationCodeFormData;
export type PasswordResetConfirm = PasswordResetConfirmFormData;

export interface PasswordResetRequest {
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
}

export interface User {
  id: string;
  email: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface AuthError {
  message: string;
  code?: string;
  field?: string;
  validationErrors?: ValidationError[];
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  verifyEmail: (data: VerificationCodeRequest) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (data: PasswordResetConfirm) => Promise<void>;
  logout: () => void;
  clearError: () => void;
} 