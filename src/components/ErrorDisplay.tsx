import React from 'react';
import { useTranslations } from 'next-intl';

interface ErrorDisplayProps {
  error: {
    message: string;
    validationErrors?: Array<{
      field: string;
      message: string;
    }>;
  };
  onClear?: () => void;
  className?: string;
}

export default function ErrorDisplay({ error, onClear, className = '' }: ErrorDisplayProps) {
  const t = useTranslations('common');

  if (!error) return null;

  return (
    <div className={`bg-black-02 rounded-xl p-4 border border-red-500/20 text-white ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" 
              fill="url(#errorGradient)" />
            <defs>
              <linearGradient id="errorGradient" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF4400" />
                <stop offset="1" stopColor="#FF883D" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-red-500 font-medium">{error.message}</p>
          {error.validationErrors && error.validationErrors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {error.validationErrors.map((err, index) => (
                <li key={index} className="text-red-400 text-sm">
                  {err.field}: {err.message}
                </li>
              ))}
            </ul>
          )}
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="flex-shrink-0 w-5 h-5 text-gray-400 hover:text-white transition-colors"
            aria-label={t('clearError')}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.47 0 0 4.47 0 10C0 15.53 4.47 20 10 20C15.53 20 20 15.53 20 10C20 4.47 15.53 0 10 0ZM15 13.59L13.59 15L10 11.41L6.41 15L5 13.59L8.59 10L5 6.41L6.41 5L10 8.59L13.59 5L15 6.41L11.41 10L15 13.59Z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
} 