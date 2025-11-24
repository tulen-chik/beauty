'use client';

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { ref, onValue, off, query, orderByChild, equalTo } from 'firebase/database';

// 1. Импорт клиентского SDK для real-time подписок
import { db as clientDb } from '@/lib/firebase/init';

// 2. Импорт ваших клиентских операций
import { 
  chatOperations, 
  chatMessageOperations, 
  chatParticipantOperations, 
  chatNotificationOperations 
} from '@/lib/firebase/database';

// 3. Импорт типов
import type { Chat, ChatMessage, ChatMessageType, ChatNotification, ChatParticipant } from '@/types/database';

// Интерфейс контекста
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
  
  // Состояния данных
  const [activeChats, setActiveChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, { customer: number; salon: number }>>({});

  // Состояние подписки
  const [chatListSubscription, setChatListSubscription] = useState<{ type: 'salon' | 'customer'; id: string } | null>(null);

  // --- REAL-TIME СЛУШАТЕЛИ ---

  // 1. Слушатель списка чатов (activeChats + unreadCounts)
  useEffect(() => {
    if (!chatListSubscription) {
      setActiveChats([]);
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
      setLoading(false);
    });

    return () => off(chatQuery, 'value', unsubscribe);
  }, [chatListSubscription]);

  // 2. Слушатель сообщений активного чата (chatMessages)
  useEffect(() => {
    if (!currentChat) return;

    // Подписываемся на сообщения конкретного чата
    const messagesRef = ref(clientDb, `chatMessages/${currentChat.id}`);
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

  // Обертка для обработки ошибок и лоадинга
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

  // --- РЕАЛИЗАЦИЯ МЕТОДОВ ЧЕРЕЗ ВАШИ ОПЕРАЦИИ ---

  // 1. Chat Operations
  const createOrGetChat = useCallback((salonId: string, customerUserId: string, customerName: string, appointmentId?: string, serviceId?: string) => 
    handleRequest(() => chatOperations.createOrGet(salonId, customerUserId, customerName, appointmentId, serviceId)), 
  [handleRequest]);

  const getChatsBySalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setChatListSubscription({ type: 'salon', id: salonId });
    return chatOperations.getBySalon(salonId);
  }, []);

  const getChatsByCustomer = useCallback(async (customerUserId: string) => {
    setLoading(true);
    setChatListSubscription({ type: 'customer', id: customerUserId });
    return chatOperations.getByCustomer(customerUserId);
  }, []);

  const getChatByAppointment = useCallback((appointmentId: string) => 
    handleRequest(() => chatOperations.getByAppointment(appointmentId)), 
  [handleRequest]);

  const updateChat = useCallback((chatId: string, data: Partial<Chat>) => 
    handleRequest(async () => {
      await chatOperations.update(chatId, data);
      const updated = await chatOperations.read(chatId);
      if (!updated) throw new Error('Chat not found after update');
      return updated;
    }, false), 
  [handleRequest]);

  const archiveChat = useCallback((chatId: string) => 
    handleRequest(() => chatOperations.update(chatId, { status: 'archived', archivedAt: new Date().toISOString() }).then(() => {}), false), 
  [handleRequest]);

  const closeChat = useCallback((chatId: string) => 
    handleRequest(() => chatOperations.update(chatId, { status: 'closed', closedAt: new Date().toISOString() }).then(() => {}), false), 
  [handleRequest]);

  const getChatById = useCallback((chatId: string) => 
    handleRequest(() => chatOperations.read(chatId)), 
  [handleRequest]);

  // 2. Message Operations (используем chatMessageOperations)
  const sendMessage = useCallback((chatId: string, senderId: string, senderType: 'customer' | 'salon', senderName: string, content: string, messageType?: ChatMessageType, attachments?: ChatMessage['attachments']) => 
    handleRequest(() => {
      const effectiveChatId = chatId || currentChat?.id;
      if (!effectiveChatId) {
        throw new Error('No chat selected to send a message');
      }
      return chatMessageOperations.sendMessage(effectiveChatId, senderId, senderType, senderName, content, messageType, attachments);
    }, false), 
  [handleRequest, currentChat]);

  const getMessages = useCallback((chatId: string, limit = 50, offset = 0) => 
    handleRequest(() => chatMessageOperations.getByChat(chatId, limit, offset)), 
  [handleRequest]);

  const markMessagesAsRead = useCallback((chatId: string, userId: string) => 
    handleRequest(() => chatMessageOperations.markAsRead(chatId, userId), false), 
  [handleRequest]);

  const deleteMessage = useCallback((chatId: string, messageId: string) => 
    handleRequest(() => chatMessageOperations.delete(chatId, messageId), false), 
  [handleRequest]);

  // 3. Participant Operations (используем chatParticipantOperations)
  const addParticipant = useCallback((chatId: string, participantId: string, data: Omit<ChatParticipant, 'id'>) => 
    handleRequest(() => chatParticipantOperations.add(chatId, participantId, data)), 
  [handleRequest]);

  const removeParticipant = useCallback((chatId: string, participantId: string) => 
    handleRequest(() => chatParticipantOperations.remove(chatId, participantId)), 
  [handleRequest]);

  const updateParticipantStatus = useCallback((chatId: string, participantId: string, data: Partial<ChatParticipant>) => 
    handleRequest(() => chatParticipantOperations.updateStatus(chatId, participantId, data)), 
  [handleRequest]);

  const getParticipants = useCallback((chatId: string) => 
    handleRequest(() => chatParticipantOperations.getByChat(chatId)), 
  [handleRequest]);

  // 4. Notification Operations (используем chatNotificationOperations)
  const createNotification = useCallback((notificationId: string, data: Omit<ChatNotification, 'id'>) => 
    handleRequest(() => chatNotificationOperations.create(notificationId, data)), 
  [handleRequest]);

  const markNotificationAsRead = useCallback((notificationId: string) => 
    handleRequest(() => chatNotificationOperations.markAsRead(notificationId)), 
  [handleRequest]);

  const getNotificationsByUser = useCallback((userId: string, limit?: number) => 
    handleRequest(() => chatNotificationOperations.getByUser(userId, limit)), 
  [handleRequest]);

  const getUnreadNotificationsByUser = useCallback((userId: string) => 
    handleRequest(() => chatNotificationOperations.getUnreadByUser(userId)), 
  [handleRequest]);

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