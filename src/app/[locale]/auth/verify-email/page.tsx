'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

import { VerificationCodeFormData } from '@/lib/validations/auth';

import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const { verifyEmail, isLoading, error, clearError } = useAuth();
  const searchParams = useSearchParams();
  const t = useTranslations('auth');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = searchParams.get('email') || '';
  
  const [formData, setFormData] = useState<VerificationCodeFormData>({
    email,
    code: ''
  });

  // Фокусировка и ввод кода
  const handleChange = (e: ChangeEvent<HTMLInputElement>, idx: number) => {
    clearError();
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) return;
    
    const newCode = [...code];
    newCode[idx] = val[0];
    setCode(newCode);
    setFormData(prev => ({ ...prev, code: newCode.join('') }));

    // Фокус на следующий инпут
    if (idx < 5 && val) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  // Обработка удаления
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  // Обработка вставки
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    clearError();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) {
        newCode[i] = pastedData[i];
      }
    }
    setCode(newCode);
    setFormData(prev => ({ ...prev, code: newCode.join('') }));

    // Фокус на последний заполненный инпут или следующий пустой
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyEmail(formData);
    } catch (error) {
      // Errors are handled in the context
    }
  };

  const handleResendCode = () => {
    if (timer > 0) return;
    setTimer(60);
    // TODO: Implement resend logic
    console.log('Resending verification code');
  };

  // Таймер
  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  return (
    <div className="bg-black-02 rounded-3xl shadow-xl p-10 w-full max-w-md flex flex-col gap-6 relative">
      <div className="flex flex-col gap-4">
        <div className="w-12 h-12 flex items-center justify-center pb-6">
          <svg width="50" height="51" viewBox="0 0 60 61" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 0.5C46.5686 0.5 60 13.9315 60 30.5C60 47.0684 47.7325 60.4999 31.1641 60.5C18.4884 60.5 11.9001 46.2838 24.9932 38.5029L27.9277 41.5762L31.499 40.4912L37.0068 46.1201C38.5644 45.2962 41.4978 41.9749 40.7686 35.2822C40.3253 35.7259 38.9519 36.7723 37.0068 37.4111C40.8058 34.4069 47.7052 25.8125 44.9092 15.4688C40.4643 14.2138 29.8877 14.1378 23.1406 23.873C23.1913 23.1377 23.6652 21.2186 25.1543 19.4238C22.9002 19.0689 17.6022 19.3632 14.4414 23.3789L20.2158 29.1973L19.3037 32.5439L21.8848 35.2471C15.6669 48.8453 3.95871e-05 42.0224 0 30.5C0 13.9315 13.4315 0.500005 30 0.5ZM36.8174 20.5078C38.5587 20.5079 39.9707 21.9219 39.9707 23.665C39.9705 25.408 38.5586 26.8212 36.8174 26.8213C35.0761 26.8213 33.6643 25.4081 33.6641 23.665C33.6641 21.9218 35.076 20.5078 36.8174 20.5078Z" fill="url(#paint0_linear_4_835)" />
            <defs>
              <linearGradient id="paint0_linear_4_835" x1="9.07143" y1="31.25" x2="54.4922" y2="21.0434" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF4400" />
                <stop offset="1" stopColor="#FF883D" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="flex gap-2">
          <Link href="/auth/login" className="w-12 h-12 flex">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="40" height="40" rx="12" fill="url(#paint1_linear_4_906)" />
              <path d="M22 14.5L16 20.5L22 26.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="paint1_linear_4_906" x1="6.0476" y1="20.5" x2="36.328" y2="13.696" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FF4400" />
                  <stop offset="1" stopColor="#FF883D" />
                </linearGradient>
              </defs>
            </svg>
          </Link>
          <h1 className="text-4xl font-bold text-white">{t('verifyEmail')}</h1>
        </div>
        <p className="text-gray text-base">
          {t('verifyEmailMessage', { email })}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-500 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <p>{error.message}</p>
                {error.validationErrors?.map((err, index) => (
                  <p key={index} className="mt-1">{err.message}</p>
                ))}
              </div>
              <button 
                onClick={clearError} 
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-white font-semibold">{t('verificationCode')}</label>
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`w-12 h-12 text-center text-xl font-semibold bg-black-03 rounded-xl border ${
                  error?.field === 'code' ? 'border-red-500' : 'border-gray-700'
                } focus:border-accent focus:outline-none`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 text-center mt-2">
            {t('verificationCodeHint')}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 mt-2">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={timer > 0}
            className={`text-sm ${timer > 0 ? 'text-gray-500' : 'text-accent hover:underline'}`}
          >
            {timer > 0 
              ? t('resendCodeIn', { seconds: timer })
              : t('resendCode')
            }
          </button>
        </div>

        <button
          type="submit"
          className="w-full mt-4 py-1 rounded-xl text-lg text-white bg-gradient-to-r from-[#FF4400] to-[#FF883D] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? t('loading') : t('verifyEmail')}
        </button>
      </form>
    </div>
  );
} 