"use client"

import { ArrowLeft, Check, CheckCheck, MessageCircle, Send, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Импортируем все необходимые хуки и провайдеры
import { useChat } from '@/contexts/ChatContext';
import { AppointmentProvider, useAppointment } from '@/contexts/AppointmentContext';
import { SalonProvider, useSalon } from '@/contexts/SalonContext';
import { SalonServiceProvider, useSalonService } from '@/contexts/SalonServiceContext';
import { useUser } from '@/contexts/UserContext';

// Импортируем типы
import type { Appointment, Chat, Salon, SalonService } from '@/types/database';

//=========== Вспомогательные функции ===========//

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = (now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24);

  if (diffInDays < 1) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (diffInDays < 2) return 'Вчера';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
};

//=========== Компонент: Красивый плейсхолдер для аватара ===========//

const InitialAvatar = ({ name, className }: { name: string; className?: string }) => {
  const getInitials = (nameStr: string) => {
    const words = nameStr.split(' ').filter(Boolean);
    if (words.length === 0) return <User className="w-1/2 h-1/2" />;
    const firstInitial = words[0][0];
    const secondInitial = words.length > 1 ? words[1][0] : '';
    return `${firstInitial}${secondInitial}`.toUpperCase();
  };

  const getColor = (nameStr: string) => {
    let hash = 0;
    for (let i = 0; i < nameStr.length; i++) {
      hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-indigo-500', 'bg-teal-500', 'bg-purple-500',
      'bg-amber-500', 'bg-sky-500', 'bg-rose-500', 'bg-emerald-500'
    ];
    return colors[Math.abs(hash % colors.length)];
  };

  const initials = getInitials(name || '');
  const bgColor = getColor(name || '');

  return (
    <div className={`flex items-center justify-center font-bold text-white ${bgColor} ${className}`}>
      <span>{initials}</span>
    </div>
  );
};

//=========== Компоненты-скелетоны (без изменений) ===========//

const ChatItemSkeleton = () => (
  <div className="flex items-start gap-4 p-3 mx-2 my-1 animate-pulse">
    <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0"></div>
    <div className="flex-1 min-w-0 mt-1">
      <div className="flex justify-between items-center">
        <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
        <div className="h-3 w-10 bg-gray-200 rounded"></div>
      </div>
      <div className="h-4 w-3/4 bg-gray-200 rounded mt-2"></div>
      <div className="h-5 w-1/3 bg-gray-200 rounded mt-2"></div>
    </div>
  </div>
);

const ChatViewSkeleton = () => {
  const MessageSkeleton = ({ align }: { align: 'left' | 'right' }) => (
    <div className={`flex items-end gap-2 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      {align === 'left' && <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0"></div>}
      <div className="w-2/5 h-12 bg-gray-200 rounded-2xl"></div>
    </div>
  );

  return (
    <main className="flex-1 flex flex-col h-full bg-rose-50 animate-pulse">
      <header className="flex items-center gap-3 p-3 bg-white border-b border-gray-200">
        <div className="w-11 h-11 rounded-full bg-gray-200"></div>
        <div>
          <div className="h-5 w-32 bg-gray-200 rounded"></div>
          <div className="h-3 w-48 bg-gray-200 rounded mt-1.5"></div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessageSkeleton align="left" /> <MessageSkeleton align="right" />
        <MessageSkeleton align="left" /> <MessageSkeleton align="right" />
      </div>
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-full h-11 bg-gray-200 rounded-lg"></div>
          <div className="w-11 h-11 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </main>
  );
};

//=========== Компонент: 1. Элемент в списке чатов (ChatItem) ===========//

function ChatItem({ chat, isActive, onClick }: { chat: Chat, isActive: boolean, onClick: () => void }) {
  const { fetchSalon } = useSalon();
  const { getService } = useSalonService();
  const { getAppointment } = useAppointment();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [service, setService] = useState<SalonService | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      setIsLoadingDetails(true);
      fetchSalon(chat.salonId).then(setSalon).catch(console.error);
      if (chat.serviceId) {
        try { setService(await getService(chat.serviceId)); } 
        catch (e) { console.error(e); setService(null); }
      }
      if (chat.appointmentId && chat.salonId) {
        try { setAppointment(await getAppointment(chat.salonId, chat.appointmentId)); } 
        catch (e) { console.error(e); setAppointment(null); }
      }
      setIsLoadingDetails(false);
    };
    loadDetails();
  }, [chat.salonId, chat.serviceId, chat.appointmentId, fetchSalon, getService, getAppointment]);

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-4 p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 ${
        isActive ? 'bg-rose-100' : 'hover:bg-gray-50'
      }`}
    >
      {salon?.avatarUrl ? (
        <img
          src={salon.avatarUrl}
          alt={salon.name}
          className="w-14 h-14 rounded-full object-cover flex-shrink-0 bg-gray-200"
        />
      ) : (
        <InitialAvatar name={salon?.name || ''} className="w-14 h-14 rounded-full flex-shrink-0 text-xl" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-800 truncate">
            {salon?.name || 'Загрузка...'}
          </h3>
          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
            {formatDate(chat.lastMessageAt)}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate mt-0.5">
          {chat.lastMessagePreview || 'Нет сообщений'}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
            <div className="flex-grow min-w-0">
              {isLoadingDetails ? (
                <div className="h-5 w-1/3 bg-gray-100 rounded-full animate-pulse"></div>
              ) : service ? (
                <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full truncate inline-block max-w-full">
                  Услуга: {service.name}
                </span>
              ) : appointment ? (
                <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full truncate inline-block max-w-full">
                  Запись на {new Date(appointment.startAt).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                </span>
              ) : chat.appointmentId ? (
                 <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Чат по записи</span>
              ) : null}
            </div>
            {chat.unreadCount.customer > 0 && (
              <div className="w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex-shrink-0 ml-2 flex items-center justify-center">
                {chat.unreadCount.customer}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

//=========== Компонент: 2. Панель со списком чатов (слева) ===========//

function ChatListPanel({ selectedChatId, onSelectChat }: { selectedChatId: string | null, onSelectChat: (chatId: string) => void }) {
  const { currentUser } = useUser();
  // ИСПРАВЛЕНО: Получаем activeChats напрямую из контекста, убираем локальное состояние
  const { getChatsByCustomer, activeChats, loading, error } = useChat();

  useEffect(() => {
    if (currentUser?.userId) {
      // ИСПРАВЛЕНО: Этот вызов теперь только инициирует загрузку и подписку в провайдере.
      // Нам не нужно обрабатывать .then() для установки локального состояния.
      getChatsByCustomer(currentUser.userId)
        .catch(err => console.error("Failed to load chats:", err));
    }
  }, [currentUser, getChatsByCustomer]);

  return (
    <aside className="w-full md:w-96 h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Чаты</h1>
        <input
          type="text"
          placeholder="Поиск"
          className="w-full px-4 py-2 bg-gray-100 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && activeChats.length === 0 && (
            <div>
                {[...Array(6)].map((_, i) => <ChatItemSkeleton key={i} />)}
            </div>
        )}
        {error && <p className="p-4 text-center text-red-500">Ошибка: {String(error)}</p>}
        {!loading && activeChats.length === 0 && (
          <div className="p-8 text-center text-gray-400 mt-16">
            <MessageCircle className="w-16 h-16 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Нет активных чатов</h3>
            <p className="text-sm">Начните диалог с салоном, чтобы он появился здесь.</p>
          </div>
        )}
        {/* ИСПРАВЛЕНО: Рендерим activeChats из контекста, а не локальное состояние `chats` */}
        {activeChats.map(chat => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === selectedChatId}
            onClick={() => onSelectChat(chat.id)}
          />
        ))}
      </div>
    </aside>
  );
}

//=========== Компонент: 3. Панель активного чата (справа) ===========//

function ChatViewPanel({ selectedChatId, onBack }: { selectedChatId: string | null, onBack: () => void }) {
  const { currentUser } = useUser();
  // ИСПРАВЛЕНО: Получаем currentChat и isContextLoading из провайдера
  const { currentChat, sendMessage, markMessagesAsRead, chatMessages, loading: isContextLoading } = useChat();
  const { fetchSalon } = useSalon();

  // ИСПРАВЛЕНО: Убираем локальное состояние chatData, используем currentChat
  const [salonData, setSalonData] = useState<Salon | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Эта строка идеальна, она реактивно получает сообщения из контекста. Оставляем как есть.
  const messages = selectedChatId ? chatMessages[selectedChatId] || [] : [];

  // ИСПРАВЛЕНО: Упрощаем useEffect. Его задача - загрузить данные о салоне и пометить сообщения как прочитанные.
  useEffect(() => {
    if (currentChat) {
      fetchSalon(currentChat.salonId).then(setSalonData);
      if (currentUser?.userId && currentChat.unreadCount.customer > 0) {
        markMessagesAsRead(currentChat.id, currentUser.userId);
      }
    } else {
      // Очищаем данные о салоне, если чат не выбран
      setSalonData(null);
    }
  }, [currentChat, fetchSalon, markMessagesAsRead, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChatId || !currentUser) return;
    setIsSending(true);
    try {
      await sendMessage(selectedChatId, currentUser.userId, 'customer', currentUser.displayName, messageText, 'text');
      setMessageText('');
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };
  
  const getMessageStatusIcon = (status: string) => {
    if (status === 'read') return <CheckCheck className="w-4 h-4 text-white" />;
    return <Check className="w-4 h-4 text-rose-200" />;
  };

  if (!selectedChatId) {
    return (
      <main className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50">
        <MessageCircle className="w-24 h-24 text-gray-300 mb-4" />
        <h2 className="text-xl text-gray-600">Выберите чат, чтобы начать общение</h2>
      </main>
    );
  }
  
  if (isContextLoading && !currentChat) {
      return <ChatViewSkeleton />;
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-rose-50">
      <header className="flex items-center gap-3 p-3 bg-white border-b border-gray-200 shadow-sm z-10">
        <button onClick={onBack} className="md:hidden p-2 -ml-2 text-gray-600 hover:text-rose-500">
            <ArrowLeft className="w-6 h-6" />
        </button>
        {salonData?.avatarUrl ? (
            <img src={salonData.avatarUrl} alt={salonData.name} className="w-11 h-11 rounded-full object-cover bg-gray-200" />
        ) : (
            <InitialAvatar name={salonData?.name || ''} className="w-11 h-11 rounded-full text-base" />
        )}
        <div>
          <h2 className="font-bold text-gray-900">{salonData?.name}</h2>
          <p className="text-xs text-gray-500 truncate">
            {salonData?.city}, {salonData?.address}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUser?.userId;
          const showDateSeparator = index === 0 || new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();
          
          return (
            <React.Fragment key={message.id}>
              {showDateSeparator && (
                <div className="text-center my-4">
                  <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                    {new Date(message.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  </span>
                </div>
              )}
              <div className={`flex items-end gap-2 animate-pop-in ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                {!isOwnMessage && (
                  salonData?.avatarUrl ? (
                    <img src={salonData.avatarUrl} alt="Salon Avatar" className="w-7 h-7 rounded-full self-start bg-gray-200" />
                  ) : (
                    <InitialAvatar name={salonData?.name || ''} className="w-7 h-7 rounded-full self-start text-xs" />
                  )
                )}
                <div
                  className={`max-w-lg px-4 py-2.5 rounded-3xl ${
                    isOwnMessage
                      ? 'bg-rose-500 text-white rounded-br-lg'
                      : 'bg-white text-gray-800 rounded-bl-lg shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className={`flex items-center gap-1.5 mt-1.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-xs ${isOwnMessage ? 'text-rose-200' : 'text-gray-400'}`}>
                      {formatMessageTime(message.createdAt)}
                    </span>
                    {isOwnMessage && getMessageStatusIcon(message.status)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Написать сообщение..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            className="w-full px-4 py-2.5 bg-gray-100 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            className="p-3 bg-rose-500 text-white rounded-full hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  );
}

//=========== Компонент: 4. Главный компонент-обертка страницы ===========//

function UnifiedChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Получаем доступ к activeChats и setCurrentChat из контекста
  const { activeChats, setCurrentChat } = useChat();

  // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Создаем новую функцию-обработчик для управления состоянием
  const handleSelectChat = (chatId: string | null) => {
    setSelectedChatId(chatId);
    if (chatId) {
      // Находим полный объект чата в real-time списке
      const chat = activeChats.find(c => c.id === chatId);
      // Сообщаем провайдеру, какой чат теперь активен
      setCurrentChat(chat || null);
    } else {
      // Сбрасываем активный чат в провайдере
      setCurrentChat(null);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes pop-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-pop-in {
          animation: pop-in 0.2s ease-out forwards;
        }
      `}</style>
      
      <div className="relative flex w-full h-[calc(100vh-64px)] overflow-hidden bg-white font-sans">
        <div className={`w-full md:w-auto md:flex transition-transform duration-300 ease-in-out ${selectedChatId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
          <ChatListPanel
            selectedChatId={selectedChatId}
            // ИСПРАВЛЕНО: Передаем новый обработчик
            onSelectChat={handleSelectChat}
          />
        </div>
        <div className="absolute top-0 left-0 w-full h-full md:static flex-1 transition-transform duration-300 ease-in-out md:translate-x-0"
             style={{ transform: selectedChatId ? 'translateX(0)' : 'translateX(100%)' }}>
          <ChatViewPanel 
            selectedChatId={selectedChatId} 
            // ИСПРАВЛЕНО: Передаем новый обработчик для кнопки "назад"
            onBack={() => handleSelectChat(null)} 
          />
        </div>
      </div>
    </>
  );
}

//=========== Экспорт: Финальный компонент со всеми провайдерами ===========//

export default function FullChatPage() {
  return (
          <UnifiedChatPage />
  );
}