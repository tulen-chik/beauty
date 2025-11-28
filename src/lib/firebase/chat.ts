import { get, ref, query, orderByChild, equalTo } from 'firebase/database';

import { createOperation, deleteOperation,readOperation, updateOperation } from './crud';
import { db } from './init';
import { chatSchema } from './schemas';

import type { Chat } from '@/types/database';

const assertString = (value: string | undefined | null, field: string) => {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
};

const normalizeChat = (id: string, chat: Chat): Chat => ({ ...chat, id });

export const chatOperations = {
  create: (chatId: string, data: Omit<Chat, 'id'>) => {
    assertString(chatId, 'chatId');
    return createOperation(`chats/${chatId}`, data, chatSchema);
  },

  read: (chatId: string) => {
    assertString(chatId, 'chatId');
    return readOperation<Chat>(`chats/${chatId}`);
  },

  update: (chatId: string, data: Partial<Chat>) => {
    assertString(chatId, 'chatId');
    return updateOperation(`chats/${chatId}`, data, chatSchema);
  },

  delete: (chatId: string) => {
    assertString(chatId, 'chatId');
    return deleteOperation(`chats/${chatId}`);
  },
  

getBySalon: async (salonId: string): Promise<Chat[]> => {
    try {
      assertString(salonId, 'salonId');
      // Создаем запрос, который будет выполнен на сервере Firebase
      const chatsRef = ref(db, 'chats');
      const salonQuery = query(chatsRef, orderByChild('salonId'), equalTo(salonId));

      const snapshot = await get(salonQuery); // Выполняем запрос

      if (!snapshot.exists()) return [];

      const chats = snapshot.val() as Record<string, Chat>;
      return Object.entries(chats)
        .map(([id, chat]) => normalizeChat(id, chat))
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    } catch (error) {
      console.error("Error fetching chats by salon:", error);
      return [];
    }
},

  getByCustomer: async (customerUserId: string): Promise<Chat[]> => {
    try {
      assertString(customerUserId, 'customerUserId');
      const chatsRef = ref(db, 'chats');
      const customerQuery = query(chatsRef, orderByChild('customerUserId'), equalTo(customerUserId));
      const snapshot = await get(customerQuery);
      if (!snapshot.exists()) return [];
      const chats = snapshot.val() as Record<string, Chat>;
      return Object.entries(chats)
        .map(([id, chat]) => normalizeChat(id, chat))
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    } catch (_) {
      return [];
    }
  },

  getByAppointment: async (appointmentId: string): Promise<Chat | null> => {
    try {
      assertString(appointmentId, 'appointmentId');
      const chatsRef = ref(db, 'chats');
      const appointmentQuery = query(chatsRef, orderByChild('appointmentId'), equalTo(appointmentId));
      const snapshot = await get(appointmentQuery);
      if (!snapshot.exists()) return null;
      const chats = snapshot.val() as Record<string, Chat>;
      const entry = Object.entries(chats)[0];
      if (!entry) return null;
      const [id, chat] = entry;
      return normalizeChat(id, chat);
    } catch (error) {
      console.error('Error fetching chat by appointment:', error);
      return null;
    }
  },

  createOrGet: async (salonId: string, customerUserId: string, customerName: string, appointmentId?: string, serviceId?: string): Promise<Chat> => {
    try {
      assertString(salonId, 'salonId');
      assertString(customerUserId, 'customerUserId');
      assertString(customerName, 'customerName');

      // Check if chat already exists
      let existingChat: Chat | undefined;
      if (appointmentId) {
        existingChat = await chatOperations.getByAppointment(appointmentId) || undefined;
      } else {
        const customerChats = await chatOperations.getByCustomer(customerUserId);
        existingChat = customerChats.find(
          (chat) => chat.salonId === salonId && chat.status === 'active'
        );
      }

      if (existingChat) {
        return existingChat;
      }

      // Create new chat
      const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const chatData: Omit<Chat, 'id'> = {
        salonId,
        customerUserId,
        customerName,
        status: 'active',
        lastMessageAt: now,
        unreadCount: {
          customer: 0,
          salon: 0
        },
        createdAt: now,
        updatedAt: now
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
