"use client"
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

import SearchBox from './SearchBox';

interface AppHeaderProps {
  isMobile?: boolean;
}

export default function AppHeader({ isMobile }: AppHeaderProps) {
  const t = useTranslations('common');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <header className={`w-full flex fixed items-center transition-all duration-300 z-30
      ${isMobile ? 'px-4 py-3 pl-[80px] pt-[20px]' : 'px-8 py-4 pl-[140px] pt-[40px]'}`}>
      <div className="flex items-center justify-end gap-2 sm:gap-4 w-full">
        {isSearchOpen ? (
          <SearchBox
            query={query}
            setQuery={setQuery}
            onClose={() => {
              setIsSearchOpen(false);
              setQuery('');
            }}
          />
        ) : (
          <button
            className={`flex items-center justify-center rounded-xl bg-black-02 hover:bg-black-04 transition
              ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}
            onClick={() => setIsSearchOpen(true)}
            aria-label={t('search')}
          >
            <svg className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="7" stroke="#8B8B99" strokeWidth="2" />
              <path d="M20 20L17 17" stroke="#8B8B99" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <button className={`flex items-center justify-center rounded-xl bg-black-02 hover:bg-black-04 transition relative
          ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}>
          <svg className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C13.1046 22 14 21.1046 14 20H10C10 21.1046 10.8954 22 12 22Z" fill="#fff" />
            <path d="M18 16V11C18 7.68629 15.3137 5 12 5C8.68629 5 6 7.68629 6 11V16L4 18V19H20V18L18 16Z" stroke="#fff" strokeWidth="2" />
          </svg>
          <span className={`absolute bg-accent rounded-full border-2 border-black
            ${isMobile ? 'top-1.5 right-1.5 w-2 h-2' : 'top-2 right-2 w-3 h-3'}`}></span>
        </button>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className={`text-white font-semibold ${isMobile ? 'hidden' : 'text-base'}`}>{t('username')}</span>
            <img src="/avatar.jpg" alt="avatar" className={`rounded-full object-cover border-2 border-accent
              ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
          </div>
        </div>
      </div>
    </header>
  );
} 