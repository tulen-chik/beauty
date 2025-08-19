'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

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
    <main className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-black mb-4">Error</h1>
          <h2 className="text-2xl font-medium text-gray-800 mb-2">{t('errorTitle')}</h2>
          <p className="text-gray-600">{t('errorDescription')}</p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={reset}
            className="px-8 py-3 border-2 border-black text-black font-medium hover:bg-black hover:text-white transition-colors duration-200"
          >
            {t('tryAgain')}
          </button>
          <Link 
            href="/workspaces"
            className="px-8 py-3 border border-gray-400 text-gray-600 font-medium hover:bg-gray-100 transition-colors duration-200"
          >
            {t('backToHome')}
          </Link>
        </div>
      </div>
    </main>
  );
} 