import type { ChatNotification } from '@/types/database';
import { chatNotificationSchema } from './schemas';
import { createOperation } from './crud';
import { db } from './init';
import { get, ref, update } from 'firebase/database';

export const chatNotificationOperations = {
  create: (notificationId: string, data: Omit<ChatNotification, 'id'>) =>
    createOperation(`chatNotifications/${notificationId}`, data, chatNotificationSchema),

  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      const now = new Date().toISOString();
      await update(ref(db, `chatNotifications/${notificationId}`), {
        isRead: true,
        readAt: now
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  getByUser: async (userId: string, limit = 50): Promise<ChatNotification[]> => {
    try {
      const snapshot = await get(ref(db, 'chatNotifications'));
      if (!snapshot.exists()) return [];
      const notifications = snapshot.val() as Record<string, ChatNotification>;
      return Object.entries(notifications)
        .map(([id, notification]) => ({ ...notification, id }))
        .filter(notification => notification.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (_) {
      return [];
    }
  },

  getUnreadByUser: async (userId: string): Promise<ChatNotification[]> => {
    try {
      const notifications = await chatNotificationOperations.getByUser(userId, 1000);
      return notifications.filter(notification => !notification.isRead);
    } catch (_) {
      return [];
    }
  }
};
