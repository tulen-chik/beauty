'use client';

import { MessageCircle, Send, Star } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Рекомендую добавить uuid для генерации ID

import RatingCard from '@/components/RatingCard';
import RatingStats from '@/components/RatingStats';
import { useSalonRating } from '@/contexts';
import { useUser } from '@/contexts';

// --- КОМПОНЕНТЫ SKELETON (Оставлены без изменений) ---
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

const SalonRatingsPageSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="h-9 w-3/4 bg-gray-300 rounded-lg"></div>
        <div className="h-5 w-1/2 bg-gray-200 rounded-md"></div>
      </div>
      <RatingStatsSkeleton />
      <div className="space-y-6 mt-8">
        <RatingCardSkeleton />
        <RatingCardSkeleton />
      </div>
    </div>
  </div>
);

export default function SalonRatingsPage() {
  const params = useParams();
  const salonId = params.salonId as string;
  
  const { 
    getRatingsBySalon, 
    getRatingStats, 
    getResponsesByRating,
    createResponse, // Используем метод создания ответа
    ratings,
    ratingStats,
    loading
  } = useSalonRating();
  
  const { currentUser } = useUser();
  
  // Состояние для модального окна ответа
  const [selectedRatingId, setSelectedRatingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Локальное хранилище ответов для быстрого отображения
  const [responses, setResponses] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (salonId) {
      loadData();
    }
  }, [salonId]);

  const loadData = async () => {
    await Promise.all([
      loadRatingsAndResponses(),
      getRatingStats(salonId)
    ]);
  };

  const loadRatingsAndResponses = async () => {
    const salonRatings = await getRatingsBySalon(salonId);
    
    const responsesData: Record<string, any[]> = {};
    // Загружаем ответы для каждого рейтинга
    await Promise.all(salonRatings.map(async (rating) => {
      const ratingResponses = await getResponsesByRating(rating.id);
      responsesData[rating.id] = ratingResponses;
    }));
    
    setResponses(responsesData);
  };

  const handleOpenResponseModal = (ratingId: string) => {
    setSelectedRatingId(ratingId);
    setResponseText('');
  };

  const handleCloseResponseModal = () => {
    setSelectedRatingId(null);
    setResponseText('');
  };

  const handleSubmitResponse = async () => {
    if (!selectedRatingId || !responseText.trim()) return;

    setIsSubmitting(true);
    try {
      // Генерируем ID для ответа (лучше использовать uuid, но можно и так)
      const responseId = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Имя отвечающего (название салона или имя менеджера)
      const responderName = currentUser?.displayName || 'Администратор салона';

      await createResponse(
        responseId,
        selectedRatingId,
        salonId,
        responseText,
        responderName
      );

      // Обновляем данные
      await loadRatingsAndResponses();
      handleCloseResponseModal();
    } catch (error) {
      console.error('Ошибка при отправке ответа:', error);
      alert('Не удалось отправить ответ. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const salonRatings = ratings[salonId] || [];
  const stats = ratingStats[salonId];

  if (loading) {
    return <SalonRatingsPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Отзывы клиентов</h1>
          <p className="text-gray-600 mt-2">Просматривайте отзывы и отвечайте на них</p>
        </div>

        {/* Статистика */}
        {stats && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Общий рейтинг</h2>
            <RatingStats stats={stats} showCategoryAverages />
          </div>
        )}

        {/* Список отзывов */}
        <div className="space-y-6">
          {salonRatings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Отзывов пока нет</h3>
              <p className="text-gray-500">
                Как только клиенты оставят отзывы, они появятся здесь.
              </p>
            </div>
          ) : (
            salonRatings.map((rating) => {
              const ratingResponses = responses[rating.id] || [];
              const hasResponse = ratingResponses.length > 0;

              return (
                <div key={rating.id} className="relative">
                  <RatingCard
                    rating={rating}
                    responses={ratingResponses}
                    showResponseButton={!hasResponse} 
                    onResponse={() => handleOpenResponseModal(rating.id)}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Модальное окно ответа */}
        {selectedRatingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    Ответ на отзыв
                  </h3>
                  <button 
                    onClick={handleCloseResponseModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ваш ответ
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Поблагодарите клиента или прокомментируйте ситуацию..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCloseResponseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                    disabled={isSubmitting}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSubmitResponse}
                    disabled={!responseText.trim() || isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    {isSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Отправить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}