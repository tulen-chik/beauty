"use client";
import Link from "next/link";
import { useTranslations } from 'next-intl'; 
import { useEffect, useState } from "react";

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


// --- СКЕЛЕТЫ (ОСТАВЛЕНЫ БЕЗ ИЗМЕНЕНИЙ) ---
const SalonNameSkeleton = () => (
  <span className="inline-block h-6 w-40 bg-gray-200 rounded-md animate-pulse"></span>
);

const SalonListItemSkeleton = () => (
  <li className="p-4 border rounded-xl flex flex-col md:flex-row md:items-center md:justify-between animate-pulse">
    <div className="space-y-2 flex-1">
      <div className="h-7 w-48 bg-gray-300 rounded-md"></div>
      <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
      <div className="h-3 w-32 bg-gray-200 rounded-md"></div>
    </div>
    <div className="mt-2 md:mt-0 h-10 w-full md:w-28 bg-gray-200 rounded-xl"></div>
  </li>
);

function SalonName({ salonId }: { salonId: string }) {
  const t = useTranslations('salons'); 
  const { fetchSalon } = useSalon();
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSalonName = async () => {
      try {
        setLoading(true);
        const salon = await fetchSalon(salonId);
        if (salon) {
          setName(salon.name);
        }
      } catch (error) {
        console.error("Failed to fetch salon name:", error);
        setName(t('failedToLoadName')); 
      } finally {
        setLoading(false);
      }
    };

    getSalonName();
  }, [salonId, fetchSalon, t]); 

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
        
        {loading && (
          <ul className="space-y-4">
            <SalonListItemSkeleton />
            <SalonListItemSkeleton />
          </ul>
        )}

        {error && <div className="text-center text-red-500">{error}</div>}
        
        {!loading && !userSalons && (
          <div className="text-center text-gray-500">{t('noSalons')}</div>
        )}
        
        {/* Условие 2: Если загрузка завершена и userSalons - это объект, показываем список */}
        {!loading && userSalons && (
          <ul className="space-y-4">
            {userSalons.salons.map((s) => {
              const translatedRole = getRoleLabel(s.role as SalonRole, t);

              return (
                <li key={s.salonId} className="p-4 border rounded-xl flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-lg text-gray-900">
                      <Link href={`/salons/${s.salonId}/appointments`} className="hover:underline text-rose-600">
                        <SalonName salonId={s.salonId} />
                      </Link>
                    </div>
                    <div className="text-sm text-gray-600">{t('role', { role: translatedRole })}</div>
                    <div className="text-xs text-gray-400">{t('joined', { date: new Date(s.joinedAt).toLocaleDateString() })}</div>
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