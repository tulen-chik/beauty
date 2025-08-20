"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Menu, X } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  locale: string;
}

export default function SiteHeader({ locale }: Props) {
  const { currentUser, loading: authLoading } = useUser();
  const pathname = usePathname();
  const t = useTranslations('common');

  const [city, setCity] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  
  // Состояние для управления открытием/закрытием мобильного меню
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Закрываем меню при изменении маршрута
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [pathname]);

  // Блокируем прокрутку фона, когда меню открыто
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Очистка при размонтировании компонента
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoError(t('geolocation.unavailable'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=${locale}`
          );
          
          if (response.ok) {
            const data = await response.json();
            const cityName = data.address?.city || 
                          data.address?.town || 
                          data.address?.village || 
                          data.address?.municipality ||
                          data.address?.county ||
                          t('geolocation.unknownCity');
            setCity(cityName);
          } else {
            setCity(t('geolocation.unknownCity'));
          }
        } catch (error) {
          setCity(t('geolocation.unknownCity'));
        }
      },
      (error) => {
        setGeoError(t('geolocation.permissionDenied'));
      },
      { maximumAge: 60_000, timeout: 10_000, enableHighAccuracy: false }
    );
  }, [locale, t]);

  const nav = [
    { href: `/${locale}`, label: t('navigation.home') },
    { href: `/${locale}/search`, label: t('navigation.search') },
    { href: `/${locale}/blog`, label: t('navigation.blog') },
  ];

  const isActive = (href: string) => {
    // Для главной страницы проверяем точное совпадение
    if (href === `/${locale}`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  // Компонент для кнопок авторизации, чтобы не дублировать код
  const AuthButtons = ({ isMobile = false }: { isMobile?: boolean }) => (
    authLoading ? (
      <div className={`text-sm text-gray-600 ${isMobile ? 'w-full text-center p-4' : ''}`}>{t('loading')}</div>
    ) : currentUser ? (
      <Link 
        href="/profile" 
        className={isMobile 
          ? "block w-full text-center px-4 py-3 rounded-lg bg-rose-600 text-white text-base font-semibold hover:bg-rose-700" 
          : "px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700"}
      >
        {t('profile')}
      </Link>
    ) : (
      <div className={`flex items-center gap-2 ${isMobile ? 'flex-col w-full' : ''}`}>
        <Link 
          href="/login" 
          className={isMobile 
            ? "block w-full text-center px-4 py-3 rounded-lg text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200" 
            : "px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100"}
        >
          {t('login')}
        </Link>
        <Link 
          href="/register" 
          className={isMobile 
            ? "block w-full text-center px-4 py-3 rounded-lg bg-rose-600 text-white text-base font-semibold hover:bg-rose-700" 
            : "px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700"}
        >
          {t('register')}
        </Link>
      </div>
    )
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Левая часть: Логотип и десктоп-навигация */}
            <div className="flex items-center gap-3">
              <Link href={`/${locale}`} className="text-xl font-bold text-gray-900">
                {t('brand.name')}
              </Link>
              <nav className="hidden md:flex items-center gap-1 ml-2">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isActive(item.href)
                        ? 'text-rose-700 bg-rose-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Правая часть: Гео, кнопки авторизации для десктопа и бургер для мобильных */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-600 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span className="truncate">{city || geoError || t('geolocation.determiningCity')}</span>
              </div>
              
              {/* Кнопки авторизации для десктопа */}
              <div className="hidden md:flex">
                <AuthButtons />
              </div>

              {/* Иконка бургера для мобильных */}
              <button 
                onClick={() => setIsMenuOpen(true)} 
                className="md:hidden p-2 -mr-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                aria-label="Открыть меню"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Мобильное меню (Drawer) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()} // Предотвращаем закрытие по клику на само меню
              className="fixed top-0 right-0 h-full w-full max-w-xs bg-white shadow-xl flex flex-col"
            >
              {/* Шапка меню */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <span className="font-bold text-lg">{t('brand.name')}</span>
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  aria-label="Закрыть меню"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Навигация в меню */}
              <nav className="flex-grow p-4 space-y-2">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
                      isActive(item.href)
                        ? 'text-rose-700 bg-rose-50'
                        : 'text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Футер меню: Гео и кнопки авторизации */}
              <div className="p-4 border-t border-gray-200 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 p-2 rounded-lg bg-gray-50">
                  <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span className="truncate">{city || geoError || t('geolocation.determiningCity')}</span>
                </div>
                <AuthButtons isMobile />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}