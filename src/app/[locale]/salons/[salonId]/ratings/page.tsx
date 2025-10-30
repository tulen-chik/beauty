'use client';

import { CheckCircle, Clock, Filter, Star, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import RatingCard from '@/components/RatingCard';
import RatingStats from '@/components/RatingStats';
// --- ИЗМЕНЕНИЕ: УДАЛЕН ИМПОРТ СПИННЕРА ---
// import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useSalonRating } from '@/contexts';
import { useUser } from '@/contexts';

// --- НАЧАЛО: НОВЫЕ КОМПОНЕНТЫ SKELETON ---

// Скелет для карточки отзыва
const RatingCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-1/3 bg-gray-300 rounded"></div>
          <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
        </div>
        <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  </div>
);

// Скелет для блока статистики
const RatingStatsSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
    <div className="h-7 w-1/2 bg-gray-300 rounded-lg mb-6"></div>
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1 space-y-3">
        <div className="h-8 w-32 bg-gray-200 rounded-lg"></div>
        <div className="h-5 w-24 bg-gray-200 rounded-md"></div>
      </div>
      <div className="flex-1 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
            <div className="h-3 w-full bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Основной компонент-скелет для всей страницы
const SalonRatingsPageSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="mb-8 space-y-2">
        <div className="h-9 w-3/4 bg-gray-300 rounded-lg"></div>
        <div className="h-5 w-1/2 bg-gray-200 rounded-md"></div>
      </div>

      {/* Stats Skeleton */}
      <RatingStatsSkeleton />

      {/* Filters Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 my-6">
        <div className="flex items-center gap-4">
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
          <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-32 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-28 bg-gray-200 rounded-full"></div>
        </div>
      </div>

      {/* Ratings List Skeleton */}
      <div className="space-y-6">
        <RatingCardSkeleton />
        <RatingCardSkeleton />
      </div>
    </div>
  </div>
);

// --- КОНЕЦ: НОВЫЕ КОМПОНЕНТЫ SKELETON ---

export default function SalonRatingsPage() {
  const params = useParams();
  const salonId = params.salonId as string;
  
  const { 
    getRatingsBySalon, 
    getRatingStats, 
    getResponsesByRating,
    approveRating,
    rejectRating,
    createRating,
    ratings,
    ratingStats,
    loading
  } = useSalonRating();
  
  const { currentUser } = useUser();
  
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (salonId) {
      loadRatings();
      loadStats();
    }
  }, [salonId]);

  const loadRatings = async () => {
    const salonRatings = await getRatingsBySalon(salonId);
    
    const responsesData: Record<string, any[]> = {};
    for (const rating of salonRatings) {
      const ratingResponses = await getResponsesByRating(rating.id);
      responsesData[rating.id] = ratingResponses;
    }
    setResponses(responsesData);
  };

  const loadStats = async () => {
    await getRatingStats(salonId);
  };


  const handleApproveRating = async (ratingId: string) => {
    try {
      await approveRating(ratingId);
      await loadRatings();
      await loadStats();
    } catch (error) {
      console.error('Ошибка при одобрении отзыва:', error);
    }
  };

  const handleRejectRating = async (ratingId: string) => {
    const reason = prompt('Укажите причину отклонения:');
    if (reason) {
      try {
        await rejectRating(ratingId, reason);
        await loadRatings();
        await loadStats();
      } catch (error) {
        console.error('Ошибка при отклонении отзыва:', error);
      }
    }
  };

  const filteredRatings = ratings[salonId]?.filter(rating => {
    if (filter === 'all') return true;
    return rating.status === filter;
  }) || [];

  const stats = ratingStats[salonId];

  const getFilterIcon = (filterType: string) => {
    switch (filterType) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Filter className="w-4 h-4" />;
    }
  };

  const getFilterColor = (filterType: string) => {
    switch (filterType) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // --- ИЗМЕНЕНИЕ: ЗАМЕНА СПИННЕРА НА SKELETON ---
  if (loading) {
    return <SalonRatingsPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Отзывы о салоне</h1>
          <p className="text-gray-600 mt-2">Управление отзывами и рейтингами</p>
        </div>

        {/* Статистика */}
        {stats && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Статистика отзывов</h2>
            <RatingStats stats={stats} showCategoryAverages />
          </div>
        )}

        {/* Фильтры */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Фильтр:</span>
            {(['all', 'pending', 'approved', 'rejected'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === filterType
                    ? getFilterColor(filterType)
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {getFilterIcon(filterType)}
                <span>
                  {filterType === 'all' && 'Все'}
                  {filterType === 'pending' && 'На модерации'}
                  {filterType === 'approved' && 'Одобренные'}
                  {filterType === 'rejected' && 'Отклоненные'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Список отзывов */}
        <div className="space-y-6">
          {filteredRatings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет отзывов</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'Пока нет отзывов для этого салона'
                  : `Нет отзывов со статусом "${filter}"`
                }
              </p>
            </div>
          ) : (
            filteredRatings.map((rating) => (
              <RatingCard
                key={rating.id}
                rating={rating}
                responses={responses[rating.id] || []}
                showResponseButton={true}
                onResponse={(ratingId) => setSelectedRating(ratingId)}
              />
            ))
          )}
        </div>
        {/* Панель модерации */}
        {selectedRating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Модерация отзыва</h3>
              <div className="space-y-4">
                <button
                  onClick={() => handleApproveRating(selectedRating)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Одобрить
                </button>
                <button
                  onClick={() => handleRejectRating(selectedRating)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Отклонить
                </button>
                <button
                  onClick={() => setSelectedRating(null)}
                  className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}