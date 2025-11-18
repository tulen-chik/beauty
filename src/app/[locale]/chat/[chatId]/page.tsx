"use client"

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import ChatInterface from '@/components/ChatInterface';
import { useChat, useUser, useSalon } from '@/contexts';
import type { Chat, Salon } from '@/types/database';

const ChatPageSkeleton = () => {
  const MessageSkeleton = ({ align = 'left' }: { align?: 'left' | 'right' }) => (
    <div className={`flex items-end gap-3 ${align === 'right' ? 'justify-end' : ''}`}>
      {align === 'left' && <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 animate-pulse"></div>}
      <div className={`p-4 rounded-2xl max-w-xs space-y-2 ${align === 'left' ? 'bg-white' : 'bg-gray-200'} shadow-sm`}>
        <div className="h-4 bg-gray-300/50 rounded w-48 animate-pulse"></div>
        <div className="h-4 bg-gray-300/50 rounded w-32 animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-5xl mx-auto p-4 md:p-6 h-screen flex flex-col">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
          <div className="flex-1 p-6 space-y-6 overflow-hidden">
            <MessageSkeleton align="left" />
            <MessageSkeleton align="right" />
            <MessageSkeleton align="left" />
          </div>
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="h-14 bg-gray-100 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  
  const { fetchSalon } = useSalon();

  const [chatData, setChatData] = useState<Chat | null>(null);
  const [salonData, setSalonData] = useState<Salon | null>(null);

  useEffect(() => {
    const loadChatAndSalon = async () => {
      if (!chatId) return;

      try {
        const chat = await getChatById(chatId);
        
        if (chat) {
          setCurrentChat(chat);
          setChatData(chat);

          try {
            const salon = await fetchSalon(chat.salonId);
            setSalonData(salon);
          } catch (salonError) {
            console.error('Error loading salon:', salonError);
            setSalonData(null);
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

  if (loading && !chatData) {
    return <ChatPageSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
          <div className="text-rose-600 font-semibold mb-2 text-lg">Ошибка</div>
          <div className="text-slate-600 mb-6">{error}</div>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-medium"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  if (!chatData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
          <div className="text-slate-800 font-semibold mb-4 text-lg">Чат не найден</div>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-medium"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const isSalonUser = currentUser?.userId !== chatData.customerUserId;
  const backLinkHref = isSalonUser ? `/salons/${chatData.salonId}/chats` : '/profile';
  const backLinkText = isSalonUser ? 'К чатам' : 'Назад';

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <div className="max-w-5xl mx-auto w-full p-2 sm:p-4 md:p-6 flex-1 flex flex-col h-[100dvh]"> {/* 100dvh для мобильных */}
        
        {/* Верхняя навигация */}
        <div className="mb-4 flex items-center">
          <Link
            href={backLinkHref}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{backLinkText}</span>
          </Link>
        </div>

        {/* Контейнер чата */}
        <div className="flex-1 bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative">
            <ChatInterface
              chatId={chatData.id}
              salonId={chatData.salonId}
              customerUserId={chatData.customerUserId}
              customerName={chatData.customerName}
              salonName={salonData?.name} 
              appointmentId={chatData.appointmentId}
              serviceId={chatData.serviceId}
            />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return <ChatPageContent />;
}