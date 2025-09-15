"use client"

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@/contexts/UserContext';
import ChatInterface from '@/components/ChatInterface';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const { currentUser } = useUser();
  const { 
    getChatsBySalon, 
    getChatsByCustomer, 
    currentChat, 
    setCurrentChat,
    loading, 
    error 
  } = useChat();

  const [chatData, setChatData] = useState<any>(null);

  useEffect(() => {
    const loadChat = async () => {
      if (!chatId || !currentUser) return;

      try {
        // Загружаем чаты в зависимости от роли пользователя
        // В реальном приложении нужно определить роль пользователя в салоне
        const chats = await getChatsByCustomer(currentUser.userId);
        const chat = chats.find(c => c.id === chatId);
        
        if (chat) {
          setCurrentChat(chat);
          setChatData(chat);
        }
      } catch (error) {
        console.error('Error loading chat:', error);
      }
    };

    loadChat();
  }, [chatId, currentUser, getChatsByCustomer, setCurrentChat]);

  if (loading) {
    return (
      <LoadingSpinner />
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

  if (!chatData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Чат не найден</div>
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
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Чат с {chatData.customerName}
            </h1>
            <div className="text-sm text-gray-600">
              {chatData.appointmentId ? 'Чат по записи' : 'Общий чат'}
              {chatData.serviceId && ' • Связан с услугой'}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="h-[600px]">
          <ChatInterface
            chatId={chatData.id}
            salonId={chatData.salonId}
            customerUserId={chatData.customerUserId}
            customerName={chatData.customerName}
            appointmentId={chatData.appointmentId}
            serviceId={chatData.serviceId}
          />
        </div>
      </div>
    </div>
  );
}
