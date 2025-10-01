import { Calendar, CheckCircle,MessageCircle, ThumbsDown, ThumbsUp, User } from 'lucide-react';
import React, { useState } from 'react';

import RatingDisplay from './RatingDisplay';

import type { SalonRating, SalonRatingResponse } from '@/types/database';

interface RatingCardProps {
  rating: SalonRating;
  responses?: SalonRatingResponse[];
  onHelpfulVote?: (ratingId: string, isHelpful: boolean) => void;
  onResponse?: (ratingId: string) => void;
  showResponseButton?: boolean;
  className?: string;
}

export default function RatingCard({ 
  rating, 
  responses = [],
  onHelpfulVote,
  onResponse,
  showResponseButton = false,
  className = '' 
}: RatingCardProps) {
  const [showResponses, setShowResponses] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Одобрен';
      case 'pending': return 'На модерации';
      case 'rejected': return 'Отклонен';
      default: return status;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 space-y-4 ${className}`}>
      {/* Заголовок отзыва */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-900">
              {rating.isAnonymous ? 'Анонимный пользователь' : rating.customerName}
            </span>
            {rating.isVerified && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rating.status)}`}>
            {getStatusText(rating.status)}
          </span>
        </div>
      </div>

      {/* Рейтинг и дата */}
      <div className="flex items-center justify-between">
        <RatingDisplay rating={rating.rating} showValue size="md" />
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(rating.createdAt)}</span>
        </div>
      </div>

      {/* Категориальные оценки */}
      {rating.categories && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(rating.categories).map(([category, score]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="text-gray-600">
                {category === 'service' && 'Сервис'}
                {category === 'cleanliness' && 'Чистота'}
                {category === 'atmosphere' && 'Атмосфера'}
                {category === 'staff' && 'Персонал'}
                {category === 'value' && 'Цена/качество'}
              </span>
              <RatingDisplay rating={score} size="sm" />
            </div>
          ))}
        </div>
      )}

      {/* Текст отзыва */}
      <div className="text-gray-700 leading-relaxed">
        {rating.review}
      </div>

      {/* Действия */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-4">
          {onHelpfulVote && (
            <>
              <button
                onClick={() => onHelpfulVote(rating.id, true)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-green-600 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Полезно</span>
              </button>
              <button
                onClick={() => onHelpfulVote(rating.id, false)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>Не полезно</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {responses.length > 0 && (
            <button
              onClick={() => setShowResponses(!showResponses)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{responses.length} ответ{responses.length === 1 ? '' : responses.length < 5 ? 'а' : 'ов'}</span>
            </button>
          )}
          {showResponseButton && onResponse && (
            <button
              onClick={() => onResponse(rating.id)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ответить</span>
            </button>
          )}
        </div>
      </div>

      {/* Ответы салона */}
      {showResponses && responses.length > 0 && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h4 className="font-medium text-gray-900">Ответы салона</h4>
          {responses.map((response) => (
            <div key={response.id} className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-900">Ответ салона</span>
                <span className="text-sm text-gray-500">
                  {formatDate(response.respondedAt)}
                </span>
              </div>
              <p className="text-blue-800">{response.responseText}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
