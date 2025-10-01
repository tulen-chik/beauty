import { Star } from 'lucide-react';
import React from 'react';

import type { SalonRatingStats } from '@/types/database';

interface RatingStatsProps {
  stats: SalonRatingStats;
  showCategoryAverages?: boolean;
  className?: string;
}

export default function RatingStats({ 
  stats, 
  showCategoryAverages = false,
  className = '' 
}: RatingStatsProps) {
  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5: return 'Отлично';
      case 4: return 'Хорошо';
      case 3: return 'Удовлетворительно';
      case 2: return 'Плохо';
      case 1: return 'Очень плохо';
      default: return '';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'service': return 'Качество услуг';
      case 'cleanliness': return 'Чистота';
      case 'atmosphere': return 'Атмосфера';
      case 'staff': return 'Персонал';
      case 'value': return 'Соотношение цена/качество';
      default: return category;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Основная статистика */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(stats.averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {stats.totalRatings} {stats.totalRatings === 1 ? 'отзыв' : 'отзывов'}
          </div>
        </div>

        {/* Распределение по звездам */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
            const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-8">
                  <span className="text-sm font-medium text-gray-700">{rating}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-12 text-right">
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Категориальные оценки */}
      {showCategoryAverages && stats.categoryAverages && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Оценки по категориям</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(stats.categoryAverages).map(([category, average]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  {getCategoryLabel(category)}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= Math.round(average)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {average.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
