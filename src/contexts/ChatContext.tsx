import React, { createContext, ReactNode, useCallback, useContext,useMemo, useState } from 'react';

import { 
  chatMessageOperations, 
  chatNotificationOperations, 
  chatOperations, 
  chatParticipantOperations} from '@/lib/firebase/database';

import type { 
  Chat, 
  ChatMessage, 
  ChatMessageType, 
  ChatNotification, 
  ChatParticipant} from '@/types/database';

interface ChatContextType {
  // Chat operations
  createOrGetChat: (
    salonId: string,
    customerUserId: string,
    customerName: string,
    appointmentId?: string,
    serviceId?: string
  ) => Promise<Chat>;
  getChatsBySalon: (salonId: string) => Promise<Chat[]>;
  getChatsByCustomer: (customerUserId: string) => Promise<Chat[]>;
  getChatByAppointment: (appointmentId: string) => Promise<Chat | null>;
  updateChat: (chatId: string, data: Partial<Chat>) => Promise<Chat>;
  archiveChat: (chatId: string) => Promise<void>;
  closeChat: (chatId: string) => Promise<void>;

  // Message operations
  sendMessage: (
    chatId: string,
    senderId: string,
    senderType: 'customer' | 'salon',
    senderName: string,
    content: string,
    messageType?: ChatMessageType,
    attachments?: ChatMessage['attachments']
  ) => Promise<ChatMessage>;
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

  // Chat operations
  const createOrGetChat = useCallback(async (
    salonId: string,
    customerUserId: string,
    customerName: string,
    appointmentId?: string,
    serviceId?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const chat = await chatOperations.createOrGet(salonId, customerUserId, customerName, appointmentId, serviceId);
      setLoading(false);
      return chat;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const getChatsBySalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const chats = await chatOperations.getBySalon(salonId);
      setActiveChats(chats);
      setLoading(false);
      return chats;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  const getChatsByCustomer = useCallback(async (customerUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const chats = await chatOperations.getByCustomer(customerUserId);
      setActiveChats(chats);
      setLoading(false);
      return chats;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  const getChatByAppointment = useCallback(async (appointmentId: string) => {
    setError(null);
    try {
      return await chatOperations.getByAppointment(appointmentId);
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  const updateChat = useCallback(async (chatId: string, data: Partial<Chat>) => {
    setError(null);
    try {
      const updated = await chatOperations.update(chatId, data);
      setActiveChats(prev => prev.map(chat => chat.id === chatId ? { ...chat, ...data } : chat));
      if (currentChat?.id === chatId) {
        setCurrentChat(prev => prev ? { ...prev, ...data } : null);
      }
      return updated;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, [currentChat]);

  const archiveChat = useCallback(async (chatId: string) => {
    setError(null);
    try {
      await updateChat(chatId, { 
        status: 'archived', 
        archivedAt: new Date().toISOString() 
      });
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, [updateChat]);

  const closeChat = useCallback(async (chatId: string) => {
    setError(null);
    try {
      await updateChat(chatId, { 
        status: 'closed', 
        closedAt: new Date().toISOString() 
      });
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, [updateChat]);

  // Message operations
  const sendMessage = useCallback(async (
    chatId: string,
    senderId: string,
    senderType: 'customer' | 'salon',
    senderName: string,
    content: string,
    messageType: ChatMessageType = 'text',
    attachments?: ChatMessage['attachments']
  ) => {
    setError(null);
    try {
      const message = await chatMessageOperations.sendMessage(
        chatId,
        senderId,
        senderType,
        senderName,
        content,
        messageType,
        attachments
      );

      // Update local state
      setChatMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), message]
      }));

      // Update unread counts
      setUnreadCounts(prev => {
        const current = prev[chatId] || { customer: 0, salon: 0 };
        const updated = { ...current };
        if (senderType === 'customer') {
          updated.salon += 1;
        } else {
          updated.customer += 1;
        }
        return { ...prev, [chatId]: updated };
      });

      return message;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const getMessages = useCallback(async (chatId: string, limit = 50, offset = 0) => {
    setError(null);
    try {
      const messages = await chatMessageOperations.getByChat(chatId, limit, offset);
      setChatMessages(prev => ({
        ...prev,
        [chatId]: messages
      }));
      return messages;
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, []);

  const markMessagesAsRead = useCallback(async (chatId: string, userId: string) => {
    setError(null);
    try {
      await chatMessageOperations.markAsRead(chatId, userId);
      
      // Update local state
      setChatMessages(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map(msg => 
          msg.senderId !== userId ? { ...msg, status: 'read' as const } : msg
        )
      }));

      // Reset unread count for the user
      setUnreadCounts(prev => {
        const current = prev[chatId] || { customer: 0, salon: 0 };
        const updated = { ...current };
        if (currentChat?.customerUserId === userId) {
          updated.customer = 0;
        } else {
          updated.salon = 0;
        }
        return { ...prev, [chatId]: updated };
      });
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, [currentChat]);

  const deleteMessage = useCallback(async (chatId: string, messageId: string) => {
    setError(null);
    try {
      await chatMessageOperations.delete(chatId, messageId);
      setChatMessages(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).filter(msg => msg.id !== messageId)
      }));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  // Participant operations
  const addParticipant = useCallback(async (chatId: string, participantId: string, data: Omit<ChatParticipant, 'id'>) => {
    setError(null);
    try {
      return await chatParticipantOperations.add(chatId, participantId, data);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const removeParticipant = useCallback(async (chatId: string, participantId: string) => {
    setError(null);
    try {
      await chatParticipantOperations.remove(chatId, participantId);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const updateParticipantStatus = useCallback(async (chatId: string, participantId: string, data: Partial<ChatParticipant>) => {
    setError(null);
    try {
      return await chatParticipantOperations.updateStatus(chatId, participantId, data);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const getParticipants = useCallback(async (chatId: string) => {
    setError(null);
    try {
      return await chatParticipantOperations.getByChat(chatId);
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, []);

  // Notification operations
  const createNotification = useCallback(async (notificationId: string, data: Omit<ChatNotification, 'id'>) => {
    setError(null);
    try {
      return await chatNotificationOperations.create(notificationId, data);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    setError(null);
    try {
      await chatNotificationOperations.markAsRead(notificationId);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const getNotificationsByUser = useCallback(async (userId: string, limit = 50) => {
    setError(null);
    try {
      return await chatNotificationOperations.getByUser(userId, limit);
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, []);

  const getUnreadNotificationsByUser = useCallback(async (userId: string) => {
    setError(null);
    try {
      return await chatNotificationOperations.getUnreadByUser(userId);
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, []);

  // Utility functions
  const refreshChats = useCallback(async () => {
    if (currentChat) {
      const updatedChat = await chatOperations.read(currentChat.id);
      if (updatedChat) {
        setCurrentChat({ ...updatedChat, id: currentChat.id });
      }
    }
  }, [currentChat]);

  const value: ChatContextType = useMemo(() => ({
    // Chat operations
    createOrGetChat,
    getChatsBySalon,
    getChatsByCustomer,
    getChatByAppointment,
    updateChat,
    archiveChat,
    closeChat,

    // Message operations
    sendMessage,
    getMessages,
    markMessagesAsRead,
    deleteMessage,

    // Participant operations
    addParticipant,
    removeParticipant,
    updateParticipantStatus,
    getParticipants,

    // Notification operations
    createNotification,
    markNotificationAsRead,
    getNotificationsByUser,
    getUnreadNotificationsByUser,

    // State
    activeChats,
    currentChat,
    chatMessages,
    unreadCounts,

    // UI state
    loading,
    error,
    setCurrentChat,
    refreshChats,
  }), [
    createOrGetChat,
    getChatsBySalon,
    getChatsByCustomer,
    getChatByAppointment,
    updateChat,
    archiveChat,
    closeChat,
    sendMessage,
    getMessages,
    markMessagesAsRead,
    deleteMessage,
    addParticipant,
    removeParticipant,
    updateParticipantStatus,
    getParticipants,
    createNotification,
    markNotificationAsRead,
    getNotificationsByUser,
    getUnreadNotificationsByUser,
    activeChats,
    currentChat,
    chatMessages,
    unreadCounts,
    loading,
    error,
    refreshChats,
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
