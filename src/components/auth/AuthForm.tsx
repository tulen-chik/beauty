'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useUser } from '@/contexts/UserContext';
import { ta } from 'date-fns/locale';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export const AuthForm = ({ mode }: AuthFormProps) => {
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, loginWithGoogle } = useUser();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  
  // Constants
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MIN_PASSWORD_LENGTH = 6;

  // Map server error messages/codes to localized strings
  const mapServerError = (err: unknown) => {
    // Handle Firebase Auth errors
    if (err && typeof err === 'object' && 'code' in err) {
      const error = err as { code: string; message?: string };
      const errorCode = error.code;
      const errorMessage = error.message || '';
      
      switch (errorCode) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          return tAuth('errors.invalidCredentials');
        case 'auth/email-already-in-use':
          return tAuth('errors.emailAlreadyInUse');
        case 'auth/weak-password':
          return tAuth('errors.weakPassword');
        case 'auth/invalid-email':
          return tAuth('errors.invalidEmail');
        case 'auth/network-request-failed':
          return tAuth('errors.requestFalied');
        case 'auth/internal-error':
          return tAuth('errors.internalError') || 'An internal error occurred. Please try again later.';
        default: {
          const msg = errorMessage || JSON.stringify(err);
          if (/password.*mismatch|passwords do not match/i.test(msg)) {
            return tAuth('errors.passwordsDoNotMatch');
          }
          if (/required/i.test(msg)) {
            return tAuth('errors.requiredField');
          }
          return msg;
        }
      }
    }
  
    // Fallback for non-Firebase errors
    const msg = err instanceof Error ? err.message : String(err);
    if (/required/i.test(msg)) return tAuth('errors.requiredField');
    return msg;
  };

  const validate = () => {
    const errs: { name?: string; email?: string; password?: string } = {};
    if (mode === 'register' && !name.trim()) errs.name = tAuth('errors.requiredField');
    if (!email.trim()) errs.email = tAuth('errors.requiredField');
    else if (!EMAIL_REGEX.test(email.trim())) errs.email = tAuth('errors.invalidEmail');
    if (!password) errs.password = tAuth('errors.requiredField');
    else if (password.length < MIN_PASSWORD_LENGTH) errs.password = tAuth('errors.weakPassword');
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    // client-side validation
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim());
      }
      router.push('/profile');
    } catch (err) {
      setError(mapServerError(err));
    } finally {
      setLoading(false);
    }
  }, [email, password, name, mode, login, register, router, validate, mapServerError]);

  // Handle auto-login from URL parameters
  useEffect(() => {
    const emailParam = searchParams?.get('email');
    const passwordParam = searchParams?.get('password');

    if (mode === 'login' && emailParam && passwordParam && !autoLoginAttempted) {
      setEmail(emailParam);
      setPassword(passwordParam);
      setAutoLoginAttempted(true);
      
      // Small delay to allow state updates before submitting
      const timer = setTimeout(() => {
        // eslint-disable-next-line no-console
        handleSubmit().catch(console.error);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, autoLoginAttempted, mode, handleSubmit]);

  // clear specific validation error on change
  const handleNameChange = (v: string) => { setName(v); if (validationErrors.name) setValidationErrors(prev => ({ ...prev, name: undefined })); };
  const handleEmailChange = (v: string) => { setEmail(v); if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: undefined })); };
  const handlePasswordChange = (v: string) => { setPassword(v); if (validationErrors.password) setValidationErrors(prev => ({ ...prev, password: undefined })); };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const result = await loginWithGoogle();
      if (result !== null) {
        router.push('/profile');
      } else {
        setError(tAuth('continueWithGoogle')); // localized hint about redirect
        setTimeout(() => {
          if (loading) {
            setLoading(false);
            setError(tAuth('errors.invalidCredentials'));
          }
        }, 15000);
      }
    } catch (err) {
      setError(mapServerError(err));
      setLoading(false);
    }
  };

  const floatingVariants = {
    animate: {
      y: [-8, 8, -8],
      rotate: [0, 3, -3, 0],
      transition: {
        duration: 8,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-white overflow-hidden px-4">
      {/* Decorative Elements */}
      <motion.div
        className="absolute top-20 -left-10 w-32 h-32 sm:w-48 sm:h-48 bg-rose-100/60 rounded-full blur-3xl"
        variants={floatingVariants}
        animate="animate"
      />
      <motion.div
        className="absolute bottom-20 -right-10 w-32 h-32 sm:w-48 sm:h-48 bg-pink-100/60 rounded-full blur-3xl"
        variants={floatingVariants}
        animate="animate"
        transition={{ delay: 2 }}
      />

      <motion.div
        className="relative w-full max-w-md space-y-6 sm:space-y-8 p-6 sm:p-10 bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center">
          <motion.div
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-rose-50 border border-rose-200 rounded-full mb-4 sm:mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-rose-600" />
            <span className="text-xs sm:text-sm font-semibold text-rose-700 tracking-wide">Charming</span>
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {mode === 'login' ? tAuth('login.title') : tAuth('register.title')}
          </h2>
        </div>
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="sr-only">
                  {tCommon('name')}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-3 sm:py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-shadow text-base"
                  placeholder={tCommon('name')}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
                {validationErrors.name && <div className="text-red-500 text-sm mt-2">{validationErrors.name}</div>}
              </div>
            )}
            <div>
              <label htmlFor="email" className="sr-only">
                {tCommon('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 sm:py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-shadow text-base"
                placeholder={tCommon('email')}
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
              />
              {validationErrors.email && <div className="text-red-500 text-sm mt-2">{validationErrors.email}</div>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {tCommon('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 sm:py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-shadow text-base"
                placeholder={tCommon('password')}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
              />
              {validationErrors.password && <div className="text-red-500 text-sm mt-2">{validationErrors.password}</div>}
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center font-medium p-3 bg-red-50 rounded-lg border border-red-200">{error}</div>}

          <div className="space-y-4">
            <motion.button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                mode === 'login' ? tAuth('signIn') : tAuth('signUp')
              )}
            </motion.button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{tAuth('or')}</span>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 sm:py-3 border border-gray-300 shadow-sm text-sm sm:text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.31v2.84C4.02 20.44 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.31c-.66 1.32-1.06 2.8-1.06 4.42s.4 3.1 1.06 4.42l3.53-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 4.02 3.56 2.31 7.07l3.53 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="hidden sm:inline">{tAuth('continueWithGoogle')}</span>
              <span className="sm:hidden">Google</span>
            </motion.button>

            <div className="text-center text-sm text-gray-600">
              {mode === 'login' ? (
                <>
                  {tAuth('noAccount')}{' '}
                  <Link href="/register" className="font-semibold text-rose-600 hover:text-rose-500 hover:underline">
                    {tAuth('switchToRegister')}
                  </Link>
                </>
              ) : (
                <>
                  {tAuth('haveAccount')}{' '}
                  <Link href="/login" className="font-semibold text-rose-600 hover:text-rose-500 hover:underline">
                    {tAuth('switchToLogin')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};