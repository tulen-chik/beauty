"use client"

import { AlertCircle,ArrowLeft, CheckCircle, Clock, MessageCircle, User } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback,useEffect, useState } from 'react';

import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@/contexts/UserContext';

import type { Chat } from '@/types/database';

export default function SalonChatsPage() {
  const params = useParams();
  const salonId = params.salonId as string;
  const { currentUser } = useUser();
  const { getChatsBySalon, loading: ctxLoading, error: ctxError } = useChat();
  
  const [chats, setChats] = useState<Chat[]>([]);
  // Единое состояние для всех ошибок, связанных с загрузкой
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('salonChats');

  const loadChats = useCallback(async () => {
    // Сбрасываем ошибку перед каждой попыткой загрузки
    setError(null);
    if (!salonId) {
      setError(t('errorNoSalonId')); // Устанавливаем ошибку, если ID салона отсутствует
      return;
    }

    try {
      const salonChats = await getChatsBySalon(salonId);
      // Убедимся, что получили массив, прежде чем обновлять состояние
      setChats(Array.isArray(salonChats) ? salonChats : []);
    } catch (err: unknown) {
      // Логируем полную ошибку для отладки
      console.error('Не удалось загрузить чаты:', err);
      // Показываем пользователю понятное сообщение
      const msg = err instanceof Error ? err.message : t('errorDescription');
      setError(msg);
    }
  }, [salonId, getChatsBySalon, t]);

  useEffect(() => {
    // Сначала проверяем ошибку из контекста
    if (ctxError) {
      setError(String(ctxError));
      return;
    }
    // Если ошибок нет, загружаем чаты
    loadChats();
  }, [loadChats, ctxError]);

  const isLoading = !!ctxLoading;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 48) {
        return t('yesterday');
      } else {
        return date.toLocaleDateString();
      }
    } catch (e) {
      console.warn("Неверный формат даты:", dateString);
      return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'archived':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('authRequiredTitle')}</h3>
          <p className="text-gray-600 mb-4">{t('needLogin')}</p>
          <Link
            href="/login"
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            {t('login')}
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <div className="text-gray-600">{t('loadingChats')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">{t('error')}</h3>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={loadChats}
              className="px-5 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium"
            >
              {t('retry')}
            </button>
            <Link
              href={`/salons/${salonId}`}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
            >
              {t('backToSalon')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/salons/${salonId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToSalon')}
          </Link>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
          </div>
        </div>

        {/* Chats List */}
        <div className="bg-white rounded-lg shadow-sm">
          {chats.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noChatsTitle')}</h3>
              <p className="text-gray-600">
                {t('noChatsDesc')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {chats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-rose-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {chat.customerName}
                          </h3>
                          {getStatusIcon(chat.status)}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {chat.lastMessagePreview || t('noMessages')}
                        </p>

                        {/* Chat metadata tags */}
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {chat.appointmentId && (
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                              {t('chatByAppointment')}
                            </span>
                          )}
                          {chat.serviceId && (
                            <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              {t('linkedToService')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-sm text-gray-500 mb-1">
                        {formatDate(chat.lastMessageAt)}
                      </div>
                      {(chat.unreadCount?.salon > 0) && (
                        <div className="ml-auto w-6 h-6 bg-rose-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {chat.unreadCount.salon}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}