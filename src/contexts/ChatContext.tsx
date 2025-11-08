'use client';

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { ref, onValue, off, query, orderByChild, equalTo } from 'firebase/database';

// 1. Импорт клиентского SDK для real-time подписок
import { db as clientDb } from '@/lib/firebase/init';

// 2. Импорт ВСЕХ серверных действий
import * as chatActions from '@/app/actions/chatActions';

// 3. Импорт типов
import type { Chat, ChatMessage, ChatMessageType, ChatNotification, ChatParticipant } from '@/types/database';

// Интерфейс контекста остается БЕЗ ИЗМЕНЕНИЙ, чтобы не ломать другие компоненты
interface ChatContextType {
  // Chat operations
  createOrGetChat: (salonId: string, customerUserId: string, customerName: string, appointmentId?: string, serviceId?: string) => Promise<Chat>;
  getChatsBySalon: (salonId: string) => Promise<Chat[]>;
  getChatsByCustomer: (customerUserId: string) => Promise<Chat[]>;
  getChatByAppointment: (appointmentId: string) => Promise<Chat | null>;
  updateChat: (chatId: string, data: Partial<Chat>) => Promise<Chat>;
  archiveChat: (chatId: string) => Promise<void>;
  closeChat: (chatId: string) => Promise<void>;
  getChatById: (chatId: string) => Promise<Chat | null>;

  // Message operations
  sendMessage: (chatId: string, senderId: string, senderType: 'customer' | 'salon', senderName: string, content: string, messageType?: ChatMessageType, attachments?: ChatMessage['attachments']) => Promise<ChatMessage>;
  getMessages: (chatId: string, limit?: number, offset?: number) => Promise<ChatMessage[]>;
  markMessagesAsRead: (chatId: string, userId: string) => Promise<void>;
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;

  // Participant operations
  addParticipant: (chatId: string, participantId: string, data: Omit<ChatParticipant, 'id'>) => Promise<ChatParticipant>;
  removeParticipant: (chatId: string, participantId: string) => Promise<void>;
  updateParticipantStatus: (chatId: string, participantId: string, data: Partial<ChatParticipant>) => Promise<ChatParticipant>;
  getParticipants: (chatId: string) => Promise<ChatParticipant[]>;

  // Notification operations
  createNotification: (notificationId: string, data: Omit<ChatNotification, 'id'>) => Promise<ChatNotification>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  getNotificationsByUser: (userId: string, limit?: number) => Promise<ChatNotification[]>;
  getUnreadNotificationsByUser: (userId: string) => Promise<ChatNotification[]>;

  // Real-time state
  activeChats: Chat[];
  currentChat: Chat | null;
  chatMessages: Record<string, ChatMessage[]>;
  unreadCounts: Record<string, { customer: number; salon: number }>;

  // UI state
  loading: boolean;
  error: string | null;
  setCurrentChat: (chat: Chat | null) => void;
  refreshChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChats, setActiveChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, { customer: number; salon: number }>>({});

  // ИСПРАВЛЕНО: Заменяем useRef на useState для управления подпиской.
  // Это гарантирует, что useEffect будет перезапускаться при смене подписки.
  const [chatListSubscription, setChatListSubscription] = useState<{ type: 'salon' | 'customer'; id: string } | null>(null);

  // --- REAL-TIME СЛУШАТЕЛИ ---

  // Слушатель для списка чатов (activeChats)
  useEffect(() => {
    if (!chatListSubscription) {
      setActiveChats([]); // Очищаем чаты, если подписка сброшена
      return;
    }

    const { type, id } = chatListSubscription;
    const chatsRef = ref(clientDb, 'chats');
    const chatQuery = query(chatsRef, orderByChild(type === 'salon' ? 'salonId' : 'customerUserId'), equalTo(id));

    const unsubscribe = onValue(chatQuery, (snapshot) => {
      if (snapshot.exists()) {
        const chatsData = snapshot.val() as Record<string, Chat>;
        const chatsArray = Object.entries(chatsData)
          .map(([chatId, chat]) => ({ ...chat, id: chatId }))
          .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        
        setActiveChats(chatsArray);
        
        const newUnreadCounts: Record<string, { customer: number; salon: number }> = {};
        chatsArray.forEach(chat => {
          newUnreadCounts[chat.id] = chat.unreadCount;
        });
        setUnreadCounts(newUnreadCounts);
      } else {
        setActiveChats([]);
        setUnreadCounts({});
      }
      setLoading(false); // Завершаем загрузку после получения данных
    });

    return () => off(chatQuery, 'value', unsubscribe);
  }, [chatListSubscription]); // Этот useEffect теперь будет правильно реагировать на изменения

  // Слушатель для сообщений (chatMessages) в активном чате
  useEffect(() => {
    if (!currentChat) return;

    const messagesRef = ref(clientDb, `messages/${currentChat.id}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val() as Record<string, Omit<ChatMessage, 'id'>>;
        const messagesArray = Object.entries(messagesData)
          .map(([id, msg]) => ({ ...msg, id }))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setChatMessages(prev => ({ ...prev, [currentChat.id]: messagesArray }));
      } else {
        setChatMessages(prev => ({ ...prev, [currentChat.id]: [] }));
      }
    });

    return () => off(messagesRef, 'value', unsubscribe);
  }, [currentChat]);

  // Обертка для вызова серверных действий
  const handleRequest = useCallback(async <T,>(request: () => Promise<T>, showLoading = true): Promise<T> => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await request();
      if (showLoading) setLoading(false);
      return result;
    } catch (e: any) {
      setError(e.message);
      if (showLoading) setLoading(false);
      throw e;
    }
  }, []);

  // --- РЕАЛИЗАЦИЯ МЕТОДОВ КОНТЕКСТА ---

  // Chat operations
  const createOrGetChat = useCallback((...args: Parameters<typeof chatActions.createOrGetChatAction>) => handleRequest(() => chatActions.createOrGetChatAction(...args)), [handleRequest]);

  // ИСПРАВЛЕНО: Эти функции теперь устанавливают состояние подписки, запуская real-time слушатель
  const getChatsBySalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setChatListSubscription({ type: 'salon', id: salonId });
    // Мы можем вернуть промис от серверного действия, но основной источник данных - слушатель
    return chatActions.getChatsBySalonAction(salonId);
  }, []);

  const getChatsByCustomer = useCallback(async (customerUserId: string) => {
    setLoading(true);
    setChatListSubscription({ type: 'customer', id: customerUserId });
    return chatActions.getChatsByCustomerAction(customerUserId);
  }, []);

  const getChatByAppointment = useCallback((...args: Parameters<typeof chatActions.getChatByAppointmentAction>) => handleRequest(() => chatActions.getChatByAppointmentAction(...args)), [handleRequest]);

  const updateChat = useCallback((...args: Parameters<typeof chatActions.updateChatAction>) => handleRequest(() => chatActions.updateChatAction(...args), false), [handleRequest]);

  const archiveChat = useCallback((chatId: string) => updateChat(chatId, { status: 'archived', archivedAt: new Date().toISOString() }).then(() => {}), [updateChat]);

  const closeChat = useCallback((chatId: string) => updateChat(chatId, { status: 'closed', closedAt: new Date().toISOString() }).then(() => {}), [updateChat]);

  const getChatById = useCallback((...args: Parameters<typeof chatActions.getChatByIdAction>) => handleRequest(() => chatActions.getChatByIdAction(...args)), [handleRequest]);

  // Message operations
  const sendMessage = useCallback((...args: Parameters<typeof chatActions.sendMessageAction>) => handleRequest(() => chatActions.sendMessageAction(...args), false), [handleRequest]);

  const getMessages = useCallback(async (chatId: string, limit = 50, offset = 0) => {
    return await handleRequest(() => chatActions.getMessagesAction(chatId, limit));
  }, [handleRequest]);

  const markMessagesAsRead = useCallback((...args: Parameters<typeof chatActions.markMessagesAsReadAction>) => handleRequest(() => chatActions.markMessagesAsReadAction(...args), false), [handleRequest]);

  const deleteMessage = useCallback((...args: Parameters<typeof chatActions.deleteMessageAction>) => handleRequest(() => chatActions.deleteMessageAction(...args), false), [handleRequest]);

  // Participant operations
  const addParticipant = useCallback((...args: Parameters<typeof chatActions.addParticipantAction>) => handleRequest(() => chatActions.addParticipantAction(...args)), [handleRequest]);
  const removeParticipant = useCallback((...args: Parameters<typeof chatActions.removeParticipantAction>) => handleRequest(() => chatActions.removeParticipantAction(...args)), [handleRequest]);
  const updateParticipantStatus = useCallback((...args: Parameters<typeof chatActions.updateParticipantStatusAction>) => handleRequest(() => chatActions.updateParticipantStatusAction(...args)), [handleRequest]);
  const getParticipants = useCallback((...args: Parameters<typeof chatActions.getParticipantsAction>) => handleRequest(() => chatActions.getParticipantsAction(...args)), [handleRequest]);

  // Notification operations
  const createNotification = useCallback((...args: Parameters<typeof chatActions.createNotificationAction>) => handleRequest(() => chatActions.createNotificationAction(...args)), [handleRequest]);
  const markNotificationAsRead = useCallback((...args: Parameters<typeof chatActions.markNotificationAsReadAction>) => handleRequest(() => chatActions.markNotificationAsReadAction(...args)), [handleRequest]);
  const getNotificationsByUser = useCallback((...args: Parameters<typeof chatActions.getNotificationsByUserAction>) => handleRequest(() => chatActions.getNotificationsByUserAction(...args)), [handleRequest]);
  const getUnreadNotificationsByUser = useCallback((...args: Parameters<typeof chatActions.getUnreadNotificationsByUserAction>) => handleRequest(() => chatActions.getUnreadNotificationsByUserAction(...args)), [handleRequest]);

  // Utility functions
  const refreshChats = useCallback(async () => {
    if (chatListSubscription) {
      const { type, id } = chatListSubscription;
      if (type === 'salon') {
        await getChatsBySalon(id);
      } else {
        await getChatsByCustomer(id);
      }
    }
  }, [chatListSubscription, getChatsBySalon, getChatsByCustomer]);

  const value: ChatContextType = useMemo(() => ({
    createOrGetChat, getChatsBySalon, getChatsByCustomer, getChatByAppointment, updateChat, getChatById, archiveChat, closeChat,
    sendMessage, getMessages, markMessagesAsRead, deleteMessage,
    addParticipant, removeParticipant, updateParticipantStatus, getParticipants,
    createNotification, markNotificationAsRead, getNotificationsByUser, getUnreadNotificationsByUser,
    activeChats, currentChat, chatMessages, unreadCounts,
    loading, error, setCurrentChat, refreshChats,
  }), [
    createOrGetChat, getChatsBySalon, getChatsByCustomer, getChatByAppointment, updateChat, getChatById, archiveChat, closeChat,
    sendMessage, getMessages, markMessagesAsRead, deleteMessage,
    addParticipant, removeParticipant, updateParticipantStatus, getParticipants,
    createNotification, markNotificationAsRead, getNotificationsByUser, getUnreadNotificationsByUser,
    activeChats, currentChat, chatMessages, unreadCounts,
    loading, error, refreshChats,
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};