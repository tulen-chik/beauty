"use client"

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import ChatInterface from '@/components/ChatInterface';
// --- ИЗМЕНЕНИЕ: УДАЛЕН ИМПОРТ СПИННЕРА ---
// import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@/contexts/UserContext';

// --- НАЧАЛО: НОВЫЙ КОМПОНЕНТ SKELETON ---

const ChatPageSkeleton = () => {
  // Скелет для одного сообщения в чате
  const MessageSkeleton = ({ align = 'left' }: { align?: 'left' | 'right' }) => (
    <div className={`flex items-end gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
      {align === 'left' && <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>}
      <div className={`p-3 rounded-lg max-w-xs space-y-2 ${align === 'left' ? 'bg-gray-200' : 'bg-gray-300'}`}>
        <div className="h-4 bg-gray-300/50 rounded w-48"></div>
        <div className="h-4 bg-gray-300/50 rounded w-32"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-6 w-36 bg-gray-200 rounded-md mb-4"></div>
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
            <div className="h-7 w-1/2 bg-gray-300 rounded-lg"></div>
            <div className="h-5 w-1/3 bg-gray-200 rounded-md"></div>
          </div>
        </div>

        {/* Chat Interface Skeleton */}
        <div className="h-[600px] bg-white rounded-lg border border-gray-200 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 p-4 space-y-4 overflow-hidden">
            <MessageSkeleton align="left" />
            <MessageSkeleton align="right" />
            <MessageSkeleton align="left" />
          </div>
          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
              <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- КОНЕЦ: НОВЫЕ КОМПОНЕНТЫ SKELETON ---

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

  // --- ИЗМЕНЕНИЕ: ЗАМЕНА СПИННЕРА НА SKELETON ---
  if (loading) {
    return <ChatPageSkeleton />;
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