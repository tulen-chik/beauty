"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Search as SearchIcon } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useTranslations } from 'next-intl';

interface Props {
  locale: string;
}

export default function SiteHeader({ locale }: Props) {
  const { currentUser, loading: authLoading } = useUser();
  const pathname = usePathname();
  const t = useTranslations('common');

  const [city, setCity] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoError(t('geolocation.unavailable'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          console.log('Coordinates:', latitude, longitude);
          
          // Используем OpenStreetMap Nominatim API для геокодирования
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=${locale}`
          );
          
          if (response.ok) {
            const data = await response.json();
            console.log('Geocoding result:', data);
            
            // Извлекаем название города из ответа
            const cityName = data.address?.city || 
                          data.address?.town || 
                          data.address?.village || 
                          data.address?.municipality ||
                          data.address?.county ||
                          t('geolocation.unknownCity');
            
            setCity(cityName);
          } else {
            console.error('Geocoding failed:', response.status);
            setCity(t('geolocation.unknownCity'));
          }
        } catch (error) {
          console.error('Error getting city name:', error);
          setCity(t('geolocation.unknownCity'));
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
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
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href={`/${locale}`} className="text-lg sm:text-xl font-bold text-gray-900">
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

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Location - Hidden on very small screens */}
            <div className="hidden xs:flex items-center gap-1 text-[10px] sm:text-xs text-gray-600 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600" />
              <span className="max-w-[80px] sm:max-w-none truncate">{city || geoError || t('geolocation.determiningCity')}</span>
            </div>
            
            {/* Auth Buttons */}
            {authLoading ? (
              <div className="text-xs sm:text-sm text-gray-600">{t('loading')}</div>
            ) : currentUser ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="px-2 sm:px-3 py-2 rounded-lg bg-rose-600 text-white text-xs sm:text-sm font-semibold hover:bg-rose-700">
                  {t('profile')}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100">
                  {t('login')}
                </Link>
                <Link href="/register" className="px-2 sm:px-3 py-2 rounded-lg bg-rose-600 text-white text-xs sm:text-sm font-semibold hover:bg-rose-700">
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <nav className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                isActive(item.href) ? 'text-rose-700 bg-rose-50' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

