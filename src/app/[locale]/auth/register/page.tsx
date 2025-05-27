'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { SignupFormData } from '@/lib/validations/auth';

import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const { signup, isLoading, error } = useAuth();
  const t = useTranslations('auth');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(formData);
    } catch (error) {
      // Errors are handled in the context
    }
  };

  return (
    <div className="bg-black-02 rounded-3xl shadow-xl p-10 w-full max-w-md flex flex-col gap-6 relative">
      <div className="flex flex-col gap-4">
        <div className="w-12 h-12 flex items-center justify-center">
          <svg width="60" height="61" viewBox="0 0 60 61" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 0.5C46.5686 0.5 60 13.9315 60 30.5C60 47.0684 47.7325 60.4999 31.1641 60.5C18.4884 60.5 11.9001 46.2838 24.9932 38.5029L27.9277 41.5762L31.499 40.4912L37.0068 46.1201C38.5644 45.2962 41.4978 41.9749 40.7686 35.2822C40.3253 35.7259 38.9519 36.7723 37.0068 37.4111C40.8058 34.4069 47.7052 25.8125 44.9092 15.4688C40.4643 14.2138 29.8877 14.1378 23.1406 23.873C23.1913 23.1377 23.6652 21.2186 25.1543 19.4238C22.9002 19.0689 17.6022 19.3632 14.4414 23.3789L20.2158 29.1973L19.3037 32.5439L21.8848 35.2471C15.6669 48.8453 3.95871e-05 42.0224 0 30.5C0 13.9315 13.4315 0.500005 30 0.5ZM36.8174 20.5078C38.5587 20.5079 39.9707 21.9219 39.9707 23.665C39.9705 25.408 38.5586 26.8212 36.8174 26.8213C35.0761 26.8213 33.6643 25.4081 33.6641 23.665C33.6641 21.9218 35.076 20.5078 36.8174 20.5078Z" fill="url(#paint0_linear_4_835)" />
            <defs>
              <linearGradient id="paint0_linear_4_835" x1="9.07143" y1="31.25" x2="54.4922" y2="21.0434" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF4400" />
                <stop offset="1" stopColor="#FF883D" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white">{t('register')}</h1>
        <p className="text-gray text-base">
          {t('haveAccount')}{' '}
          <Link href="/auth/login" className="text-accent underline">
            {t('signIn')}
          </Link>
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-white font-semibold">{t('email')}</label>
          <input 
            className="auth-input" 
            placeholder={t('email')} 
            type="email" 
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-white font-semibold">{t('password')}</label>
          <div className="relative">
            <input
              className="auth-input w-full"
              placeholder={t('password')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-slash-fill" viewBox="0 0 16 16">
                  <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7 7 0 0 0 2.79-.588M5.21 3.088A7 7 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474z" />
                  <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-white font-semibold">{t('confirmPassword')}</label>
          <div className="relative">
            <input
              className="auth-input w-full"
              placeholder={t('confirmPassword')}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
        </div>
        {error && (
          <>
            <p>{error.message}</p>
            {error.validationErrors?.map((err, index) => (
              <p key={index}>{err.field}: {err.message}</p>
            ))}
          </>
        )}
        <button
          type="submit"
          className="w-full mt-4 py-1 rounded-xl text-lg text-white bg-gradient-to-r from-[#FF4400] to-[#FF883D] hover:opacity-90 transition"
          disabled={isLoading}
        >
          {isLoading ? t('loading') : t('signUp')}
        </button>
      </form>
    </div>
  );
}