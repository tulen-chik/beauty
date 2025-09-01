"use client"

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@/contexts/UserContext';
import { MessageCircle, ArrowLeft, Clock, CheckCircle, User } from 'lucide-react';
import Link from 'next/link';
import type { Chat } from '@/types/database';
import { useTranslations } from 'next-intl';

export default function SalonChatsPage() {
  const params = useParams();
  const salonId = params.salonId as string;
  const { currentUser } = useUser();
  const { getChatsBySalon, loading: ctxLoading, error: ctxError } = useChat();
  const [chats, setChats] = useState<Chat[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const t = useTranslations('salonChats');

  const loadChats = useCallback(async () => {
    setLocalError(null);
    if (!salonId) return;
    try {
      const salonChats = await getChatsBySalon(salonId);
      setChats(Array.isArray(salonChats) ? salonChats : []);
    } catch (err: any) {
      console.error('Error loading chats:', err);
      const msg = err?.message ?? t('errorDescription');
      setLocalError(msg);
    }
  }, [salonId, getChatsBySalon, t]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const isLoading = !!ctxLoading;
  const error = localError ?? (ctxError ? String(ctxError) : null);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">{t('needLogin')}</div>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 font-semibold mb-2">{t('error')}</div>
          <div className="text-gray-700 mb-4">{error}</div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={loadChats}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
            >
              {t('retry')}
            </button>
            <Link
              href={`/salons/${salonId}`}
              className="px-4 py-2 border rounded-lg text-rose-600 hover:bg-rose-50"
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
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t('title')}</h1>
            {/* <div className="text-sm text-gray-600">
              {t('subtitle')}
            </div> */}
          </div>
        </div>

        {/* Chats List */}
        <div className="bg-white rounded-lg shadow-sm">
          {(!chats || chats.length === 0) ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noChatsTitle')}</h3>
              <p className="text-gray-600 mb-4">
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
                        {chat.appointmentId && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            {t('chatByAppointment')}
                          </span>
                        )}
                        {chat.serviceId && (
                          <span className="inline-block mt-1 ml-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                            {t('linkedToService')}
                          </span>
                        )}

                        {/* 
                          Закомментированный блок: здесь мог бы быть UI для загрузки/прикрепления файлов в чате.
                          Комментарий оставлен намеренно, чтобы убрать все упоминания загрузки файлов.
                          Пример:
                          {/*
                            <div className="mt-2 text-xs text-gray-500">File upload UI (disabled)</div>
                          *\/}
                        */}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {formatDate(chat.lastMessageAt)}
                      </div>
                      {(chat.unreadCount?.salon > 0) && (
                        <div className="mt-1 w-5 h-5 bg-rose-600 text-white text-xs rounded-full flex items-center justify-center">
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
