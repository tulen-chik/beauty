"use client"

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import ChatInterface from '@/components/ChatInterface';
import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@/contexts/UserContext';
// Импортируем хук и провайдер для работы с салонами
import { useSalon, SalonProvider } from '@/contexts/SalonContext';
// Импортируем типы Chat и Salon
import type { Chat, Salon } from '@/types/database';

// --- SKELETON КОМПОНЕНТ (без изменений) ---
const ChatPageSkeleton = () => {
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
        <div className="mb-6">
          <div className="h-6 w-36 bg-gray-200 rounded-md mb-4"></div>
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
            <div className="h-7 w-1/2 bg-gray-300 rounded-lg"></div>
            <div className="h-5 w-1/3 bg-gray-200 rounded-md"></div>
          </div>
        </div>
        <div className="h-[600px] bg-white rounded-lg border border-gray-200 flex flex-col">
          <div className="flex-1 p-4 space-y-4 overflow-hidden">
            <MessageSkeleton align="left" />
            <MessageSkeleton align="right" />
            <MessageSkeleton align="left" />
          </div>
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


/**
 * Основной компонент страницы, который содержит всю логику и JSX.
 * Он использует хуки для получения данных и отображает интерфейс чата.
 */
function ChatPageContent() {
  const params = useParams();
  const chatId = params.chatId as string;
  const { currentUser } = useUser();
  const { 
    setCurrentChat,
    loading, 
    error,
    getChatById 
  } = useChat();
  
  // Используем хук для получения данных о салоне
  const { fetchSalon } = useSalon();

  const [chatData, setChatData] = useState<Chat | null>(null);
  const [salonData, setSalonData] = useState<Salon | null>(null);

  useEffect(() => {
    const loadChatAndSalon = async () => {
      if (!chatId) return;

      try {
        // Сначала загружаем данные самого чата
        const chat = await getChatById(chatId);
        
        if (chat) {
          setCurrentChat(chat);
          setChatData(chat);

          // После успешной загрузки чата, загружаем данные салона
          try {
            const salon = await fetchSalon(chat.salonId);
            setSalonData(salon);
          } catch (salonError) {
            console.error('Error loading salon:', salonError);
            setSalonData(null); // В случае ошибки сбрасываем данные салона
          }

        } else {
          console.error('Chat not found with id:', chatId);
          setChatData(null);
        }
      } catch (error) {
        console.error('Error loading chat:', error);
      }
    };

    loadChatAndSalon();
  }, [chatId, getChatById, setCurrentChat, fetchSalon]);

  // Показываем скелетон только при самой первой загрузке
  if (loading && !chatData) {
    return <ChatPageSkeleton />;
  }

  // Обработка ошибки загрузки чата
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 font-semibold mb-2">Ошибка</div>
          <div className="text-gray-700 mb-4">{error}</div>
          <Link
            href="/"
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  // Обработка случая, когда чат не найден
  if (!chatData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Чат не найден</div>
          <Link
            href="/"
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  // --- Динамическая логика для UI ---

  // Определяем, является ли текущий пользователь представителем салона
  const isSalonUser = currentUser?.userId !== chatData.customerUserId;

  // Определяем ссылку и текст для кнопки "Назад"
  const backLinkHref = isSalonUser 
    ? `/salons/${chatData.salonId}/chats` 
    : '/profile';
    
  const backLinkText = isSalonUser 
    ? 'Назад к чатам салона' 
    : 'Назад к профилю';

  // Динамически формируем заголовок страницы
  const headerTitle = isSalonUser
    ? `Чат с ${chatData.customerName}` // Салон видит имя клиента
    : salonData
      ? `Чат с ${salonData.name}` // Клиент видит название салона
      : 'Загрузка...'; // Заглушка, пока грузятся данные салона

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={backLinkHref}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLinkText}
          </Link>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {headerTitle}
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
              salonName={salonData?.name} // <-- ДОБАВЛЕННАЯ СТРОКА
              appointmentId={chatData.appointmentId}
              serviceId={chatData.serviceId}
            />
        </div>
      </div>
    </div>
  );
}


export default function ChatPage() {
  return (
      <ChatPageContent />
  );
}