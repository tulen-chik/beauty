'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('errorTitle', { defaultValue: 'Oops! Something went wrong' })}</h1>
          <p className="text-gray-600 mb-8">
            {t('errorDescription', { 
              defaultValue: 'We encountered an unexpected error. Please try again or return to the homepage.' 
            })}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors duration-200 w-full sm:w-auto"
            >
              <RefreshCw className="h-5 w-5" />
              {t('tryAgain', { defaultValue: 'Try Again' })}
            </button>
            
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 w-full sm:w-auto"
            >
              <Home className="h-5 w-5" />
              {t('backToHome', { defaultValue: 'Back to Home' })}
            </Link>
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left">
            <p className="text-sm text-gray-600 mb-2">Error details (only visible in development):</p>
            <code className="block p-3 bg-gray-100 rounded text-xs text-red-500 overflow-x-auto">
              {error.message}
            </code>
          </div>
        </div>
      </div>
    </main>
  );
}