import { get, ref, update } from 'firebase/database';

import { chatOperations } from './chat';
import { createOperation, deleteOperation,readOperation, updateOperation } from './crud';
import { db } from './init';
import { chatMessageSchema } from './schemas';

import type { Chat, ChatMessage, ChatMessageType } from '@/types/database';

export const chatMessageOperations = {
  create: (chatId: string, messageId: string, data: Omit<ChatMessage, 'id'>) =>
    createOperation(`chatMessages/${chatId}/${messageId}`, data, chatMessageSchema),

  read: (chatId: string, messageId: string) =>
    readOperation<ChatMessage>(`chatMessages/${chatId}/${messageId}`),

  update: (chatId: string, messageId: string, data: Partial<ChatMessage>) =>
    updateOperation(`chatMessages/${chatId}/${messageId}`, data, chatMessageSchema),

  delete: (chatId: string, messageId: string) =>
    deleteOperation(`chatMessages/${chatId}/${messageId}`),

  getByChat: async (chatId: string, limit = 50, offset = 0): Promise<ChatMessage[]> => {
    try {
      const snapshot = await get(ref(db, `chatMessages/${chatId}`));
      if (!snapshot.exists()) return [];
      const messages = snapshot.val() as Record<string, ChatMessage>;
      const messageList = Object.entries(messages)
        .map(([id, message]) => ({ ...message, id }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return messageList.slice(offset, offset + limit);
    } catch (_) {
      return [];
    }
  },

  markAsRead: async (chatId: string, userId: string): Promise<void> => {
    try {
      const messages = await chatMessageOperations.getByChat(chatId, 1000);
      const unreadMessages = messages.filter(msg => 
        msg.senderId !== userId && 
        msg.status !== 'read'
      );

      const updates: Record<string, any> = {};
      const now = new Date().toISOString();

      unreadMessages.forEach(message => {
        updates[`chatMessages/${chatId}/${message.id}/status`] = 'read';
        updates[`chatMessages/${chatId}/${message.id}/readAt`] = now;
        updates[`chatMessages/${chatId}/${message.id}/updatedAt`] = now;
      });

      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  sendMessage: async (
    chatId: string,
    senderId: string,
    senderType: 'customer' | 'salon',
    senderName: string,
    content: string,
    messageType: ChatMessageType = 'text',
    attachments?: ChatMessage['attachments']
  ): Promise<ChatMessage> => {
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const messageData: Omit<ChatMessage, 'id'> = {
        chatId,
        senderId,
        senderType,
        senderName,
        messageType,
        content,
        status: 'sent',
        createdAt: now,
        updatedAt: now
      };

      if (attachments && attachments.length > 0) {
        (messageData as any).attachments = attachments;
      }

      await chatMessageOperations.create(chatId, messageId, messageData);

      const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
      await chatOperations.update(chatId, {
        lastMessageAt: now,
        lastMessagePreview: messagePreview,
        updatedAt: now
      } as Partial<Chat>);

      const chat = await chatOperations.read(chatId);
      if (chat) {
        const unreadCount = { ...chat.unreadCount } as Chat['unreadCount'];
        if (senderType === 'customer') {
          unreadCount.salon += 1;
        } else {
          unreadCount.customer += 1;
        }
        await chatOperations.update(chatId, {
          unreadCount,
          updatedAt: now
        });
      }

      return { ...messageData, id: messageId } as ChatMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
};
