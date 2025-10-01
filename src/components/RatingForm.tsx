import { Send, X } from 'lucide-react';
import React, { useState } from 'react';

import RatingInput from './RatingInput';

import type { SalonRatingCategories } from '@/types/database';

interface RatingFormProps {
  onSubmit: (data: {
    rating: number;
    review: string;
    categories?: SalonRatingCategories;
    isAnonymous: boolean;
  }) => void;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

export default function RatingForm({ 
  onSubmit, 
  onCancel,
  loading = false,
  className = '' 
}: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [categories, setCategories] = useState<SalonRatingCategories>({});
  const [showCategories, setShowCategories] = useState(false);

  // ИЗМЕНЕНИЕ: Состояние для хранения ошибок валидации
  const [errors, setErrors] = useState<{ rating?: string; review?: string }>({});
  // ИЗМЕНЕНИЕ: Состояние, чтобы отслеживать, пытался ли пользователь отправить форму
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const categoryLabels = {
    service: 'Качество услуг',
    cleanliness: 'Чистота',
    atmosphere: 'Атмосфера',
    staff: 'Персонал',
    value: 'Соотношение цена/качество'
  };

  // ИЗМЕНЕНИЕ: Функция валидации, которую можно будет переиспользовать
  const validateForm = () => {
    const newErrors: { rating?: string; review?: string } = {};

    if (rating === 0) {
      newErrors.rating = 'Пожалуйста, поставьте общую оценку.';
    }
    if (review.trim().length < 10) {
      newErrors.review = 'Отзыв должен содержать минимум 10 символов.';
    }
    if (review.length > 1000) {
      newErrors.review = 'Отзыв не должен превышать 1000 символов.';
    }

    setErrors(newErrors);
    // Возвращает true, если ошибок нет
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true); // Отмечаем, что была попытка отправки

    if (validateForm()) {
      const hasCategories = Object.keys(categories).length > 0;
      onSubmit({
        rating,
        review: review.trim(),
        categories: hasCategories ? categories : undefined,
        isAnonymous
      });
    }
  };

  const handleCategoryChange = (category: keyof SalonRatingCategories, value: number) => {
    setCategories(prev => ({
      ...prev,
      [category]: value
    }));
  };

  // Эта переменная все еще полезна для блокировки кнопки
  const isFormValid = rating > 0 && review.trim().length >= 10 && review.length <= 1000;

  return (
    <form onSubmit={handleSubmit} className={`bg-white rounded-lg border border-gray-200 p-6 space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Оставить отзыв</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Общая оценка */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Общая оценка *
        </label>
        <RatingInput
          value={rating}
          onChange={(newRating) => {
            setRating(newRating);
            // ИЗМЕНЕНИЕ: Сбрасываем ошибку при изменении поля, если была попытка отправки
            if (hasAttemptedSubmit) {
              setErrors(prev => ({ ...prev, rating: undefined }));
            }
          }}
          size="lg"
        />
        {/* ИЗМЕНЕНИЕ: Отображение ошибки для рейтинга */}
        {hasAttemptedSubmit && errors.rating && (
          <p className="text-sm text-red-600">{errors.rating}</p>
        )}
      </div>

      {/* Категориальные оценки (без изменений) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Детальные оценки
          </label>
          <button
            type="button"
            onClick={() => setShowCategories(!showCategories)}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showCategories ? 'Скрыть' : 'Показать'}
          </button>
        </div>
        
        {showCategories && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{label}</span>
                <RatingInput
                  value={categories[key as keyof SalonRatingCategories] || 0}
                  onChange={(value) => handleCategoryChange(key as keyof SalonRatingCategories, value)}
                  size="sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Текст отзыва */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Ваш отзыв *
        </label>
        <textarea
          value={review}
          onChange={(e) => {
            setReview(e.target.value);
            // ИЗМЕНЕНИЕ: Сбрасываем ошибку при изменении поля, если была попытка отправки
            if (hasAttemptedSubmit) {
              setErrors(prev => ({ ...prev, review: undefined }));
            }
          }}
          placeholder="Поделитесь своими впечатлениями о салоне..."
          // ИЗМЕНЕНИЕ: Динамические классы для подсветки ошибки
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none transition-colors ${
            hasAttemptedSubmit && errors.review 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
          }`}
          rows={4}
          maxLength={1000}
          required
        />
        {/* ИЗМЕНЕНИЕ: Динамический текст-подсказка/ошибка */}
        <div className={`flex justify-between text-sm ${hasAttemptedSubmit && errors.review ? 'text-red-600' : 'text-gray-500'}`}>
          <span>{hasAttemptedSubmit && errors.review ? errors.review : 'Минимум 10 символов'}</span>
          <span>{review.length}/1000</span>
        </div>
      </div>

      {/* Анонимность (без изменений) */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="anonymous"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
          Оставить анонимный отзыв
        </label>
      </div>

      {/* Кнопки (без изменений) */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
        )}
        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Отправить отзыв
            </>
          )}
        </button>
      </div>
    </form>
  );
}