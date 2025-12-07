'use server';

import * as admin from 'firebase-admin';
import { Database, getDatabase } from 'firebase-admin/database';
import { revalidatePath } from 'next/cache';
import { ZodType } from 'zod';

// Импортируйте ваши схемы и типы
import { chatSchema, chatMessageSchema, chatParticipantSchema, chatNotificationSchema } from '@/lib/firebase/schemas';
import type { Chat, ChatMessage, ChatNotification, ChatParticipant } from '@/types/database';
import { sendEmail, resolveRecipientEmails } from './emailActions';
import { getEmailTemplate } from '@/lib/emailTemplates';

// --- Инициализация Firebase Admin SDK (выполняется один раз) ---
function getDb(): Database {
  if (!admin.apps.length) {
    try {
      // Собираем объект serviceAccount из переменных окружения
      const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        // Заменяем эскейп-последовательности \n на реальные переносы строк
        privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      };

      admin.initializeApp({
        // Передаем объект напрямую, а не путь к файлу
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
      console.log('Firebase Admin SDK initialized successfully from env vars.');
    } catch (error: any) {
      console.error('Firebase Admin initialization error:', error.message);
      throw new Error('Firebase Admin initialization failed.');
    }
  }
  return getDatabase();
}

// --- Универсальные CRUD операции на сервере ---
const readOperation = async <T>(path: string): Promise<T | null> => {
  const snapshot = await getDb().ref(path).once('value');
  return snapshot.exists() ? (snapshot.val() as T) : null;
};

// --- Действия для Чатов (Chat) ---

export const createOrGetChatAction = async (
  salonId: string,
  customerUserId: string,
  customerName: string,
  createdBy: 'salon' | 'customer',
  appointmentId?: string,
  serviceId?: string
): Promise<Chat> => {
  const chatsRef = getDb().ref('chats');
  const snapshot = await chatsRef.orderByChild('salonId').equalTo(salonId).once('value');

  if (snapshot.exists()) {
    const chats = snapshot.val() as Record<string, Chat>;
    const existingChatEntry = Object.entries(chats).find(
      ([_, chat]) => chat.customerUserId === customerUserId && chat.appointmentId === appointmentId
    );
    if (existingChatEntry) {
      const [id, chat] = existingChatEntry;
      return { ...chat, id };
    }
  }

  const chatId = `chat_${Date.now()}`;
  const chatData: Omit<Chat, 'id'> = {
    salonId,
    customerUserId,
    customerName,
    status: 'active',
    lastMessageAt: new Date().toISOString(),
    unreadCount: { customer: 0, salon: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...(appointmentId && { appointmentId }),
    ...(serviceId && { serviceId }),
  };

  const validatedData = chatSchema.parse(chatData);
  await getDb().ref(`chats/${chatId}`).set(validatedData);
  
  // Отправка email-уведомлений при создании нового чата
  try {
    if (createdBy === 'salon') {
      // Салон создал чат - отправляем уведомление пользователю
      const customerEmails = await resolveRecipientEmails(salonId, undefined, customerUserId);
      if (customerEmails.length > 0) {
        const emailTemplate = getEmailTemplate('chat_created_by_salon', {
          customerName
        });
        
        await sendEmail({ 
          to: customerEmails, 
          subject: emailTemplate.subject, 
          html: emailTemplate.html, 
          text: emailTemplate.text 
        });
      }
    } else {
      // Пользователь создал чат - отправляем уведомление всем членам салона
      const salonEmails = await resolveRecipientEmails(salonId);
      if (salonEmails.length > 0) {
        const emailTemplate = getEmailTemplate('chat_created_by_customer', {
          customerName,
          appointmentId,
          serviceId
        });
        
        await sendEmail({ 
          to: salonEmails, 
          subject: emailTemplate.subject, 
          html: emailTemplate.html, 
          text: emailTemplate.text 
        });
      }
    }
  } catch (emailError) {
    console.error('[chat] Failed to send email notification:', emailError);
    // Не прерываем создание чата из-за ошибки отправки email
  }
  
  return { ...validatedData, id: chatId };
};

export const getChatsBySalonAction = async (salonId: string): Promise<Chat[]> => {
  const snapshot = await getDb().ref('chats').orderByChild('salonId').equalTo(salonId).once('value');
  if (!snapshot.exists()) return [];
  const chats = snapshot.val() as Record<string, Chat>;
  return Object.entries(chats)
    .map(([id, chat]) => ({ ...chat, id }))
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
};

export const getChatsByCustomerAction = async (customerUserId: string): Promise<Chat[]> => {
  const snapshot = await getDb().ref('chats').orderByChild('customerUserId').equalTo(customerUserId).once('value');
  if (!snapshot.exists()) return [];
  const chats = snapshot.val() as Record<string, Chat>;
  return Object.entries(chats)
    .map(([id, chat]) => ({ ...chat, id }))
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
};

export const getChatByAppointmentAction = async (appointmentId: string): Promise<Chat | null> => {
    const snapshot = await getDb().ref('chats').orderByChild('appointmentId').equalTo(appointmentId).once('value');
    if (!snapshot.exists()) return null;
    const chats = snapshot.val() as Record<string, Chat>;
    const [id, chat] = Object.entries(chats)[0];
    return { ...chat, id };
};

export const getChatByIdAction = async (chatId: string): Promise<Chat | null> => {
    const chatData = await readOperation<Chat>(`chats/${chatId}`);
    return chatData ? { ...chatData, id: chatId } : null;
};

export const updateChatAction = async (chatId: string, data: Partial<Chat>): Promise<Chat> => {
  const current = await readOperation<Chat>(`chats/${chatId}`);
  
  if (!current) {
    throw new Error(`Chat with id ${chatId} not found.`);
  }

  const validatedData = chatSchema.partial().parse(data);
  const updatedData = { ...current, ...validatedData, updatedAt: new Date().toISOString() };
  
  await getDb().ref(`chats/${chatId}`).update(updatedData);
  revalidatePath('/chats');
  revalidatePath(`/chat/${chatId}`);
  
  return { ...updatedData, id: chatId };
};

// --- Действия для Сообщений (ChatMessage) ---

export const sendMessageAction = async (
  chatId: string,
  senderId: string,
  senderType: 'customer' | 'salon',
  senderName: string,
  content: string,
  // ИСПРАВЛЕНО: Поле в интерфейсе называется `messageType`, а не `type`.
  messageType: ChatMessage['messageType'] = 'text',
  attachments?: ChatMessage['attachments']
): Promise<ChatMessage> => {
  const messageId = `msg_${Date.now()}`;
  const now = new Date().toISOString();
  const messageData: Omit<ChatMessage, 'id'> = {
    chatId,
    senderId,
    senderType,
    senderName,
    content,
    // ИСПРАВЛЕНО: Поле переименовано в `messageType`.
    messageType: messageType,
    status: 'sent',
    createdAt: now,
    // ДОБАВЛЕНО: Поле `updatedAt` присутствует в интерфейсе.
    updatedAt: now,
    ...(attachments && { attachments }),
  };

  await getDb().ref(`messages/${chatId}/${messageId}`).set(messageData);

  const chatRef = getDb().ref(`chats/${chatId}`);
  const chat = await readOperation<Chat>(`chats/${chatId}`);
  if (chat) {
    const unreadKey = senderType === 'customer' ? 'salon' : 'customer';
    await chatRef.update({
      lastMessageAt: now,
      updatedAt: now,
      lastMessagePreview: content.substring(0, 50), // ДОБАВЛЕНО: Обновляем превью сообщения
      [`unreadCount/${unreadKey}`]: admin.database.ServerValue.increment(1),
    });
  }

  revalidatePath(`/chat/${chatId}`);
  return { ...messageData, id: messageId };
};

export const getMessagesAction = async (chatId: string, limit = 50): Promise<ChatMessage[]> => {
  const snapshot = await getDb().ref(`messages/${chatId}`).orderByChild('createdAt').limitToLast(limit).once('value');
  if (!snapshot.exists()) return [];
  const messages = snapshot.val() as Record<string, ChatMessage>;
  return Object.entries(messages).map(([id, msg]) => ({ ...msg, id }));
};

export const markMessagesAsReadAction = async (chatId: string, userId: string): Promise<void> => {
  const chat = await readOperation<Chat>(`chats/${chatId}`);
  if (!chat) return;

  const readKey = chat.customerUserId === userId ? 'customer' : 'salon';
  await getDb().ref(`chats/${chatId}/unreadCount/${readKey}`).set(0);
  
  revalidatePath(`/chat/${chatId}`);
};

export const deleteMessageAction = async (chatId: string, messageId: string): Promise<void> => {
  await getDb().ref(`messages/${chatId}/${messageId}`).remove();
  revalidatePath(`/chat/${chatId}`);
};

// --- Действия для Участников (ChatParticipant) ---

export const addParticipantAction = async (chatId: string, participantId: string, data: Omit<ChatParticipant, 'id'>): Promise<ChatParticipant> => {
  // const validatedData = chatParticipantSchema.parse(data);
  await getDb().ref(`participants/${chatId}/${participantId}`).set(data);
  return { ...data, id: participantId };
};

export const removeParticipantAction = async (chatId: string, participantId: string): Promise<void> => {
  await getDb().ref(`participants/${chatId}/${participantId}`).remove();
};

export const updateParticipantStatusAction = async (chatId: string, participantId: string, data: Partial<ChatParticipant>): Promise<ChatParticipant> => {
  await getDb().ref(`participants/${chatId}/${participantId}`).update(data);
  const updatedData = await readOperation<ChatParticipant>(`participants/${chatId}/${participantId}`);
  return { ...updatedData!, id: participantId };
};

export const getParticipantsAction = async (chatId: string): Promise<ChatParticipant[]> => {
  const snapshot = await getDb().ref(`participants/${chatId}`).once('value');
  if (!snapshot.exists()) return [];
  const participants = snapshot.val() as Record<string, ChatParticipant>;
  return Object.entries(participants).map(([id, p]) => ({ ...p, id }));
};

// --- Действия для Уведомлений (ChatNotification) ---

export const createNotificationAction = async (notificationId: string, data: Omit<ChatNotification, 'id'>): Promise<ChatNotification> => {
  // const validatedData = chatNotificationSchema.parse(data);
  await getDb().ref(`notifications/${notificationId}`).set(data);
  return { ...data, id: notificationId };
};

export const markNotificationAsReadAction = async (notificationId: string): Promise<void> => {
  await getDb().ref(`notifications/${notificationId}`).update({ read: true, readAt: new Date().toISOString() });
};

export const getNotificationsByUserAction = async (userId: string, limit = 50): Promise<ChatNotification[]> => {
  const snapshot = await getDb().ref('notifications').orderByChild('userId').equalTo(userId).limitToLast(limit).once('value');
  if (!snapshot.exists()) return [];
  const notifications = snapshot.val() as Record<string, ChatNotification>;
  return Object.entries(notifications).map(([id, n]) => ({ ...n, id }));
};

export const getUnreadNotificationsByUserAction = async (userId: string): Promise<ChatNotification[]> => {
    const snapshot = await getDb().ref('notifications')
        .orderByChild('userId')
        .equalTo(userId)
        .once('value');
    if (!snapshot.exists()) return [];
    const notifications = snapshot.val() as Record<string, ChatNotification>;
    return Object.entries(notifications)
        .map(([id, n]) => ({ ...n, id }))
        .filter(n => !n.isRead);
};