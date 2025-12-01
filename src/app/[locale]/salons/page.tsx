"use client";
import Link from "next/link";
import { useTranslations } from 'next-intl'; 
import { useEffect, useState, useMemo } from "react";
import { Building2 } from "lucide-react";

import { useSalon } from "@/contexts/SalonContext";
import { useUser } from "@/contexts/UserContext";

// --- 1. ОПРЕДЕЛЯЕМ ТИП РОЛИ ---
export type SalonRole = 'owner' | 'manager' | 'employee' | 'viewer';

// --- 2. СОЗДАЕМ ФУНКЦИЮ ДЛЯ ПЕРЕВОДА РОЛЕЙ ---
const getRoleLabel = (role: SalonRole, t: (key: string) => string): string => {
  const roleMap: Record<SalonRole, string> = {
    owner: t('roles.owner'),
    manager: t('roles.manager'),
    employee: t('roles.employee'),
    viewer: t('roles.viewer'),
  };
  return roleMap[role] || role;
};

// --- СКЕЛЕТЫ ---
const SalonNameSkeleton = () => (
  <span className="inline-block h-6 w-40 bg-gray-200 rounded-md animate-pulse"></span>
);

// --- ИСПРАВЛЕННЫЙ КОМПОНЕНТ АВАТАРА ---
const SalonAvatar = ({ salonId, className = "" }: { salonId: string; className?: string }) => {
  const { getSalonAvatar, salons } = useSalon();
  
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  // Начинаем загрузку всегда, так как ссылка в БД может быть протухшей
  const [isFetching, setIsFetching] = useState(true);

  // Достаем салон из контекста только для проверки наличия, 
  // но НЕ доверяем его avatarUrl, если это Signed URL
  const contextSalon = useMemo(() => 
    salons.find(s => s.id === salonId), 
    [salons, salonId]
  );

  useEffect(() => {
    let isMounted = true;
    
    const loadAvatar = async () => {
      try {
        // Всегда запрашиваем свежую ссылку
        const avatarData = await getSalonAvatar(salonId);
        if (isMounted && avatarData?.url) {
          setFetchedUrl(avatarData.url);
        }
      } catch (error) {
        console.error("Error loading salon avatar:", error);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };

    loadAvatar();

    return () => { isMounted = false; };
  }, [salonId, getSalonAvatar]); // Убрали contextSalon из зависимостей, чтобы не блокировать загрузку

  // ПРИОРИТЕТ: 
  // 1. Свежая ссылка (fetchedUrl) - самая важная
  // 2. Ссылка из контекста (contextSalon?.avatarUrl) - запасной вариант (на случай если это публичная ссылка без токена)
  const finalAvatarUrl = fetchedUrl || contextSalon?.avatarUrl;

  // Показываем скелетон, только если у нас вообще нет никакого URL и идет загрузка
  if (!finalAvatarUrl && isFetching) {
    return (
      <div className={`w-12 h-12 bg-gray-200 rounded-full animate-pulse ${className}`} />
    );
  }

  if (finalAvatarUrl) {
    return (
      <img 
        src={finalAvatarUrl} 
        alt="Salon Avatar"
        className={`w-12 h-12 rounded-full object-cover border-2 border-gray-200 ${className}`}
        // Если картинка протухла и вернула ошибку загрузки, можно скрыть её или показать заглушку
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          // Можно добавить логику повторного запроса, но проще показать заглушку
        }}
      />
    );
  }

  return (
    <div className={`w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center border-2 border-rose-200 ${className}`}>
      <Building2 className="w-6 h-6 text-rose-600" />
    </div>
  );
};

const SalonListItemSkeleton = () => (
  <li className="p-4 border rounded-xl flex flex-col md:flex-row md:items-center md:justify-between animate-pulse">
    <div className="flex items-center gap-3 flex-1">
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-300 rounded-md"></div>
        <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
        <div className="h-3 w-32 bg-gray-200 rounded-md"></div>
      </div>
    </div>
    <div className="mt-2 md:mt-0 h-10 w-full md:w-28 bg-gray-200 rounded-xl"></div>
  </li>
);

function SalonName({ salonId }: { salonId: string }) {
  const t = useTranslations('salons'); 
  const { fetchSalon, salons } = useSalon();
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existingSalon = salons.find(s => s.id === salonId);
    
    if (existingSalon) {
      setName(existingSalon.name);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const getSalonName = async () => {
      try {
        const salon = await fetchSalon(salonId);
        if (isMounted && salon) {
          setName(salon.name);
        }
      } catch (error) {
        console.error("Failed to fetch salon name:", error);
        if (isMounted) setName(t('failedToLoadName')); 
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getSalonName();

    return () => { isMounted = false; };
  }, [salonId, fetchSalon, salons, t]); 

  if (loading) {
    return <SalonNameSkeleton />
  }

  return <>{name}</>;
}

// Основной компонент страницы
export default function UserSalonsPage() {
  const t = useTranslations('salons'); 
  const { fetchUserSalons, userSalons, loading, error } = useSalon();
  const [fetched, setFetched] = useState(false);
  const { currentUser } = useUser();
  const userId = currentUser?.userId;

  useEffect(() => {
    if (userId && !fetched) {
      fetchUserSalons(userId);
      setFetched(true);
    }
  }, [userId, fetched, fetchUserSalons]);

  const hasMaxSalons = userSalons?.salons && userSalons.salons.length >= 3;

  const showSkeletons = loading && !userSalons;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('pageTitle')}</h1>
          {!hasMaxSalons && (
            <Link
              href="/salons/create"
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold shadow hover:bg-rose-700 transition-all"
            >
              {t('createButton')}
            </Link>
          )}
        </div>
        {hasMaxSalons && (
          <div className="mb-6 p-4 bg-pink-50 border-l-4 border-pink-400 text-pink-700">
            <p>{t('maxSalonsReached', { max: 3 })}</p>
          </div>
        )}
        
        {showSkeletons && (
          <ul className="space-y-4">
            <SalonListItemSkeleton />
            <SalonListItemSkeleton />
          </ul>
        )}

        {error && <div className="text-center text-red-500">{error}</div>}
        
        {!loading && !userSalons && !error && (
          <div className="text-center text-gray-500">{t('noSalons')}</div>
        )}
        
        {userSalons && (
          <ul className="space-y-4">
            {userSalons.salons.map((s) => {
              const translatedRole = getRoleLabel(s.role as SalonRole, t);

              return (
                <li key={s.salonId} className="p-4 border rounded-xl flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <SalonAvatar salonId={s.salonId} />
                    <div>
                      <div className="font-semibold text-lg text-gray-900">
                        <Link href={`/salons/${s.salonId}/appointments`} className="hover:underline text-rose-600">
                          <SalonName salonId={s.salonId} />
                        </Link>
                      </div>
                      <div className="text-sm text-gray-600">{t('role', { role: translatedRole })}</div>
                      <div className="text-xs text-gray-400">{t('joined', { date: new Date(s.joinedAt).toLocaleDateString() })}</div>
                    </div>
                  </div>
                  <Link
                    href={`/salons/${s.salonId}/schedule`}
                    className="mt-2 md:mt-0 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl font-semibold border border-rose-200 hover:bg-rose-100 transition-all"
                  >
                    {t('goToCRM')}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}