"use client"

import { ArrowLeft, CheckCircle,Clock, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@/contexts/UserContext';

import type { Chat } from '@/types/database';

export default function ChatsPage() {
  const { currentUser } = useUser();
  const { getChatsByCustomer, loading, error } = useChat();
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    const loadChats = async () => {
      if (!currentUser) return;
      
      try {
        const userChats = await getChatsByCustomer(currentUser.userId);
        setChats(userChats);
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    };

    loadChats();
  }, [currentUser, getChatsByCustomer]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
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
          <div className="text-gray-600 mb-4">Необходимо войти в систему</div>
          <Link
            href="/login"
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <div className="text-gray-600">Загрузка чатов...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 font-semibold mb-2">Ошибка</div>
          <div className="text-gray-700 mb-4">{error}</div>
          <Link
            href="/profile"
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            Вернуться в профиль
          </Link>
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
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к профилю
          </Link>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Мои чаты</h1>
            <div className="text-sm text-gray-600">
              Общение с салонами красоты
            </div>
          </div>
        </div>

        {/* Chats List */}
        <div className="bg-white rounded-lg shadow-sm">
          {chats.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет активных чатов</h3>
              <p className="text-gray-600 mb-4">
                У вас пока нет чатов с салонами. Забронируйте услугу, чтобы начать общение.
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Найти услуги
              </Link>
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
                        <MessageCircle className="w-6 h-6 text-rose-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {chat.customerName}
                          </h3>
                          {getStatusIcon(chat.status)}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {chat.lastMessagePreview || 'Нет сообщений'}
                        </p>
                        {chat.appointmentId && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            Чат по записи
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {formatDate(chat.lastMessageAt)}
                      </div>
                      {(chat.unreadCount.customer > 0) && (
                        <div className="mt-1 w-5 h-5 bg-rose-600 text-white text-xs rounded-full flex items-center justify-center">
                          {chat.unreadCount.customer}
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
