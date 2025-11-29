import { Send, X, Paperclip, Image as ImageIcon } from 'lucide-react';
import React, { useState, useRef } from 'react';

import RatingInput from './RatingInput';
import { uploadRatingFileAction } from '@/app/actions/storageActions';
import type { SalonRatingCategories, SalonRatingAttachment } from '@/types/database';

interface RatingFormProps {
  onSubmit: (data: {
    rating: number;
    review: string;
    categories?: SalonRatingCategories;
    isAnonymous: boolean;
    attachments?: SalonRatingAttachment[];
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
  const [uploadedFiles, setUploadedFiles] = useState<SalonRatingAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // ИЗМЕНЕНИЕ: Состояние для хранения ошибок валидации
  const [errors, setErrors] = useState<{ rating?: string; review?: string }>({});
  // ИЗМЕНЕНИЕ: Состояние, чтобы отслеживать, пытался ли пользователь отправить форму
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const hasAttachments = uploadedFiles.length > 0;
      onSubmit({
        rating,
        review: review.trim(),
        categories: hasCategories ? categories : undefined,
        attachments: hasAttachments ? uploadedFiles : undefined,
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      // Generate a temporary rating ID for file upload
      const tempRatingId = `temp_${Date.now()}`;
      
      // Convert File to base64 string for Server Action
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const base64String = btoa(binaryString);
      
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        base64: base64String
      };
      
      const uploadedFile = await uploadRatingFileAction(tempRatingId, fileData);
      const attachment: SalonRatingAttachment = {
        url: uploadedFile.url,
        filename: uploadedFile.filename,
        size: uploadedFile.size,
        type: uploadedFile.type
      };
      
      // Add to uploaded files list
      setUploadedFiles(prev => [...prev, attachment]);
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert("Не удалось загрузить файл. Попробуйте еще раз.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
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

      {/* Загрузка файлов */}
      {/* <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Фотографии и файлы
        </label>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={uploadingFile || loading}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile || loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Paperclip className="w-4 h-4" />
          {uploadingFile ? 'Загрузка...' : 'Прикрепить файл'}
        </button>
        
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Загруженные файлы:</p>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                  {file.type.startsWith('image/') ? (
                    <img src={file.url} alt={file.filename} className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <span className="text-xs text-gray-700 truncate max-w-24">{file.filename}</span>
                  <button
                    type="button"
                    onClick={() => removeUploadedFile(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div> */}

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