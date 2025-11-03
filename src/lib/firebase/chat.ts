import { get, ref, query, orderByChild, equalTo } from 'firebase/database';

import { createOperation, deleteOperation,readOperation, updateOperation } from './crud';
import { db } from './init';
import { chatSchema } from './schemas';

import type { Chat } from '@/types/database';

export const chatOperations = {
  create: (chatId: string, data: Omit<Chat, 'id'>) =>
    createOperation(`chats/${chatId}`, data, chatSchema),

  read: (chatId: string) => readOperation<Chat>(`chats/${chatId}`),

  update: (chatId: string, data: Partial<Chat>) =>
    updateOperation(`chats/${chatId}`, data, chatSchema),

  delete: (chatId: string) => deleteOperation(`chats/${chatId}`),
  

getBySalon: async (salonId: string): Promise<Chat[]> => {
    try {
      // Создаем запрос, который будет выполнен на сервере Firebase
      const chatsRef = ref(db, 'chats');
      const salonQuery = query(chatsRef, orderByChild('salonId'), equalTo(salonId));

      const snapshot = await get(salonQuery); // Выполняем запрос

      if (!snapshot.exists()) return [];

      const chats = snapshot.val() as Record<string, Chat>;
      return Object.entries(chats)
        .map(([id, chat]) => ({ ...chat, id }))
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    } catch (error) {
      console.error("Error fetching chats by salon:", error);
      return [];
    }
},

  getByCustomer: async (customerUserId: string): Promise<Chat[]> => {
    try {
      const snapshot = await get(ref(db, 'chats'));
      if (!snapshot.exists()) return [];
      const chats = snapshot.val() as Record<string, Chat>;
      return Object.entries(chats)
        .map(([id, chat]) => ({ ...chat, id }))
        .filter(chat => chat.customerUserId === customerUserId)
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    } catch (_) {
      return [];
    }
  },

  getByAppointment: async (appointmentId: string): Promise<Chat | null> => {
    try {
      const snapshot = await get(ref(db, 'chats'));
      if (!snapshot.exists()) return null;
      const chats = snapshot.val() as Record<string, Chat>;
      const chat = Object.entries(chats)
        .map(([id, chat]) => ({ ...chat, id }))
        .find(chat => chat.appointmentId === appointmentId);
      return chat || null;
    } catch (_) {
      return null;
    }
  },

  createOrGet: async (salonId: string, customerUserId: string, customerName: string, appointmentId?: string, serviceId?: string): Promise<Chat> => {
    try {
      // Check if chat already exists
      const existingChats = await chatOperations.getBySalon(salonId);
      const existingChat = existingChats.find(chat => 
        chat.customerUserId === customerUserId && 
        chat.appointmentId === appointmentId
      );

      if (existingChat) {
        return existingChat;
      }

      // Create new chat
      const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const chatData: Omit<Chat, 'id'> = {
        salonId,
        customerUserId,
        customerName,
        status: 'active',
        lastMessageAt: new Date().toISOString(),
        unreadCount: {
          customer: 0,
          salon: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Only add optional fields if they exist
      if (appointmentId) {
        (chatData as any).appointmentId = appointmentId;
      }
      if (serviceId) {
        (chatData as any).serviceId = serviceId;
      }

      await chatOperations.create(chatId, chatData);
      return { ...chatData, id: chatId } as Chat;
    } catch (error) {
      console.error('Error creating or getting chat:', error);
      throw error;
    }
  }
};
