import { get, ref, remove, update, query, orderByChild, limitToLast } from 'firebase/database';

import { chatOperations } from './chat';
import { createOperation, deleteOperation,readOperation, updateOperation } from './crud';
import { db } from './init';
import { chatMessageSchema } from './schemas';

import type { Chat, ChatMessage, ChatMessageType } from '@/types/database';

const assertString = (value: string | undefined | null, fieldName: string) => {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
};

const clampLimit = (value: number | undefined, defaultValue: number, max: number) => {
  if (!value || value <= 0) return defaultValue;
  return Math.min(value, max);
};

const sanitizeContent = (content: string, maxLength = 2000) => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('content is required');
  }
  if (trimmed.length > maxLength) {
    throw new Error('content is too long');
  }
  return trimmed;
};

export const chatMessageOperations = {
  create: (chatId: string, messageId: string, data: Omit<ChatMessage, 'id'>) => {
    assertString(chatId, 'chatId');
    assertString(messageId, 'messageId');
    return createOperation(`chatMessages/${chatId}/${messageId}`, data, chatMessageSchema);
  },

  read: (chatId: string, messageId: string) => {
    assertString(chatId, 'chatId');
    assertString(messageId, 'messageId');
    return readOperation<ChatMessage>(`chatMessages/${chatId}/${messageId}`);
  },

  update: (chatId: string, messageId: string, data: Partial<ChatMessage>) => {
    assertString(chatId, 'chatId');
    assertString(messageId, 'messageId');
    return updateOperation(`chatMessages/${chatId}/${messageId}`, data, chatMessageSchema);
  },

  delete: (chatId: string, messageId: string) => {
    assertString(chatId, 'chatId');
    assertString(messageId, 'messageId');
    return deleteOperation(`chatMessages/${chatId}/${messageId}`);
  },

  getByChat: async (chatId: string, limit = 50, offset = 0): Promise<ChatMessage[]> => {
    try {
      assertString(chatId, 'chatId');
      const safeLimit = clampLimit(limit, 50, 500);
      const safeOffset = Math.max(offset, 0);
      const fetchCount = safeLimit + safeOffset;
      const messagesRef = query(
        ref(db, `chatMessages/${chatId}`),
        orderByChild('createdAt'),
        limitToLast(fetchCount)
      );
      const snapshot = await get(messagesRef);
      if (!snapshot.exists()) return [];
      const messages = snapshot.val() as Record<string, ChatMessage>;
      const messageList = Object.entries(messages)
        .map(([id, message]) => ({ ...message, id }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return messageList.slice(offset, offset + limit);
    } catch (error) {
      console.error('[chatMessageOperations.getByChat] error:', error);
      return [];
    }
  },

  markAsRead: async (chatId: string, userId: string): Promise<void> => {
    try {
      assertString(chatId, 'chatId');
      assertString(userId, 'userId');
      const messages = await chatMessageOperations.getByChat(chatId, 500);
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
      assertString(chatId, 'chatId');
      assertString(senderId, 'senderId');
      assertString(senderType, 'senderType');
      assertString(senderName, 'senderName');
      const safeContent = sanitizeContent(content);
      
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const messageData: Omit<ChatMessage, 'id'> = {
        chatId,
        senderId,
        senderType,
        senderName,
        messageType,
        content: safeContent,
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
  },

  deleteChatWithMessages: async (chatId: string): Promise<void> => {
    try {
      if (!chatId) throw new Error('chatId is required');

      // Get all messages for the chat
      const messages = await chatMessageOperations.getByChat(chatId, 1000);
      
      // Delete all messages first
      const messageDeletePromises = messages.map(message => 
        chatMessageOperations.delete(chatId, message.id)
      );
      
      await Promise.all(messageDeletePromises);

      // Delete the entire messages node for this chat
      await remove(ref(db, `chatMessages/${chatId}`));

      // Delete the chat itself
      await chatOperations.delete(chatId);
      
    } catch (error) {
      console.error('Error deleting chat with messages:', error);
      throw error;
    }
  }
};
