import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
});

export const signupSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const verificationCodeSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  code: z.string()
    .length(6, 'Verification code must be exactly 6 characters')
    .regex(/^\d+$/, 'Verification code must contain only numbers'),
});

export const passwordResetRequestSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
});

export const passwordResetConfirmSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  reset_token: z.string().min(1, 'Reset token is required'),
  new_password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

// Types inferred from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type VerificationCodeFormData = z.infer<typeof verificationCodeSchema>;
export type PasswordResetRequestFormData = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmFormData = z.infer<typeof passwordResetConfirmSchema>; 