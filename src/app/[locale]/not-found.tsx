'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('common');

  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-black mb-4">404</h1>
          <h2 className="text-2xl font-medium text-gray-800 mb-2">{t('notFoundTitle')}</h2>
          <p className="text-gray-600">{t('notFoundDescription')}</p>
        </div>

        <Link 
          href="/workspaces"
          className="inline-block px-8 py-3 border-2 border-black text-black font-medium hover:bg-black hover:text-white transition-colors duration-200"
        >
          {t('backToHome')}
        </Link>
      </div>
    </main>
  );
} 