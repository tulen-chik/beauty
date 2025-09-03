import { db } from './init';
import { equalTo, get, orderByChild, query, ref, remove, set, update, startAt as fbStartAt, endAt as fbEndAt } from 'firebase/database';
import { salonSchema, userSchema, userSalonsSchema, salonInvitationSchema, serviceCategorySchema, salonServiceSchema, salonScheduleSchema, appointmentSchema, chatSchema, chatNotificationSchema, chatMessageSchema, chatParticipantSchema, salonRatingSchema, salonRatingResponseSchema, salonRatingHelpfulSchema, blogAuthorSchema, blogCategorySchema, blogPostSchema } from './schemas';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

import type { Salon, User, UserSalons, SalonInvitation, ServiceCategory, SalonService, SalonSchedule, Appointment, AppointmentStatus, Chat, ChatNotification, ChatMessage, ChatMessageType, ChatParticipant, SalonRating, SalonRatingResponse, SalonRatingHelpful, SalonRatingStats, BlogAuthor, BlogCategory, BlogPost } from '@/types/database';

// Базовые операции CRUD
const createOperation = async <T>(
  path: string,
  data: Omit<T, 'id'>,
  schema: any
) => {
  const validatedData = schema.parse(data);
  const newRef = ref(db, path);
  await set(newRef, validatedData);
  return validatedData;
};

const readOperation = async <T>(path: string): Promise<T | null> => {
  const snapshot = await get(ref(db, path));
  return snapshot.exists() ? (snapshot.val() as T) : null;
};

const updateOperation = async <T>(path: string, data: Partial<T>, schema: any) => {
  const validatedData = schema.parse({ ...(await readOperation<T>(path)), ...data });
  await update(ref(db, path), validatedData);
  return validatedData;
};

const deleteOperation = async (path: string) => {
  await remove(ref(db, path));
};

// Операции с пользователями
export const userOperations = {
  create: (userId: string, data: Omit<User, 'id'>) =>
    createOperation(`users/${userId}`, data, userSchema),
  read: (userId: string) => readOperation<User>(`users/${userId}`),
  update: (userId: string, data: Partial<User>) =>
    updateOperation(`users/${userId}`, data, userSchema),
  delete: (userId: string) => deleteOperation(`users/${userId}`),
  list: async (): Promise<(User & { id: string })[]> => {
    const snapshot = await get(ref(db, 'users'));
    if (!snapshot.exists()) return [];
    const raw = snapshot.val() as Record<string, Omit<User, 'id'>>;
    return Object.entries(raw).map(([id, u]) => ({ id, ...(u as any) }));
  },
  getByEmail: async (email: string) => {
    const usersRef = query(ref(db, 'users'), orderByChild('email'), equalTo(email));
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return null;
    const [userId, userData] = Object.entries(snapshot.val())[0];
    return { userId, ...(userData as User) };
  },
  getById: async (userId: string) => {
    const snapshot = await get(ref(db, `users/${userId}`));
    return snapshot.exists() ? (snapshot.val() as User) : null;
  }
};

export const salonOperations = {
  create: (salonId: string, data: Omit<Salon, 'id'>) =>
    createOperation(`salons/${salonId}`, data, salonSchema),
  read: (salonId: string) => readOperation<Salon>(`salons/${salonId}`),
  update: (salonId: string, data: Partial<Salon>) =>
    updateOperation(`salons/${salonId}`, data, salonSchema),
  delete: (salonId: string) => deleteOperation(`salons/${salonId}`),
};

export const userSalonsOperations = {
  create: (userId: string, data: Omit<UserSalons, 'id'>) =>
    createOperation(`userSalons/${userId}`, data, userSalonsSchema),
  read: (userId: string) => readOperation<UserSalons>(`userSalons/${userId}`),
  update: (userId: string, data: Partial<UserSalons>) =>
    updateOperation(`userSalons/${userId}`, data, userSalonsSchema),
  delete: (userId: string) => deleteOperation(`userSalons/${userId}`),
};

export const salonInvitationOperations = {
  create: (invitationId: string, data: Omit<SalonInvitation, 'id'>) =>
    createOperation(`salonInvitations/${invitationId}`, data, salonInvitationSchema),
  read: (invitationId: string) => readOperation<SalonInvitation>(`salonInvitations/${invitationId}`),
  update: (invitationId: string, data: Partial<SalonInvitation>) =>
    updateOperation(`salonInvitations/${invitationId}`, data, salonInvitationSchema),
  delete: (invitationId: string) => deleteOperation(`salonInvitations/${invitationId}`),
};

export const serviceCategoryOperations = {
  create: (categoryId: string, data: Omit<ServiceCategory, 'id'>) =>
    createOperation(`serviceCategories/${categoryId}`, data, serviceCategorySchema),
  read: (categoryId: string) => readOperation<ServiceCategory>(`serviceCategories/${categoryId}`),
  update: (categoryId: string, data: Partial<ServiceCategory>) =>
    updateOperation(`serviceCategories/${categoryId}`, data, serviceCategorySchema),
  delete: (categoryId: string) => deleteOperation(`serviceCategories/${categoryId}`),
};

export const salonServiceOperations = {
  create: (serviceId: string, data: Omit<SalonService, 'id'>) =>
    createOperation(`salonServices/${serviceId}`, data, salonServiceSchema),
  read: (serviceId: string) => readOperation<SalonService>(`salonServices/${serviceId}`),
  update: (serviceId: string, data: Partial<SalonService>) =>
    updateOperation(`salonServices/${serviceId}`, data, salonServiceSchema),
  delete: (serviceId: string) => deleteOperation(`salonServices/${serviceId}`),
};

export const salonScheduleOperations = {
  create: (salonId: string, data: SalonSchedule) =>
    createOperation(`salonSchedules/${salonId}`, data, salonScheduleSchema),
  read: (salonId: string) => readOperation<SalonSchedule>(`salonSchedules/${salonId}`),
  update: (salonId: string, data: Partial<SalonSchedule>) =>
    updateOperation(`salonSchedules/${salonId}`, data, salonScheduleSchema),
  delete: (salonId: string) => deleteOperation(`salonSchedules/${salonId}`),
};

// Appointments operations
export const appointmentOperations = {
  // Create appointment under a salon namespace: appointments/{salonId}/{appointmentId}
  create: (salonId: string, appointmentId: string, data: Omit<Appointment, 'id'>) =>
    createOperation(`appointments/${salonId}/${appointmentId}`, data, appointmentSchema),

  read: (salonId: string, appointmentId: string) =>
    readOperation<Appointment>(`appointments/${salonId}/${appointmentId}`),

  update: (salonId: string, appointmentId: string, data: Partial<Appointment>) =>
    updateOperation(`appointments/${salonId}/${appointmentId}`, data, appointmentSchema),

  delete: (salonId: string, appointmentId: string) =>
    deleteOperation(`appointments/${salonId}/${appointmentId}`),

  listBySalon: async (
    salonId: string,
    opts?: {
      startAt?: string;
      endAt?: string;
      status?: AppointmentStatus;
      employeeId?: string;
      serviceId?: string;
      customerUserId?: string;
    }
  ): Promise<Appointment[]> => {
    try {
      console.log(`📊 listBySalon called:`, { salonId, opts });
      
      const baseRef = ref(db, `appointments/${salonId}`);
      let snapshot;
      if (opts?.startAt || opts?.endAt) {
        let q = query(baseRef, orderByChild('startAt'));
        if (opts?.startAt) q = query(q, fbStartAt(opts.startAt));
        if (opts?.endAt) q = query(q, fbEndAt(opts.endAt));
        snapshot = await get(q);
      } else {
        snapshot = await get(baseRef);
      }
      
      if (!snapshot.exists()) {
        console.log(`📊 No appointments found for salon ${salonId}`);
        return [];
      }

      const raw = snapshot.val() as Record<string, Omit<Appointment, 'id'> | Appointment>;
      console.log(`📊 Raw appointments data:`, raw);
      
      const list: Appointment[] = Object.entries(raw).map(([id, appt]) => {
        const { id: _ignored, ...rest } = (appt as any) ?? {};
        return { id, ...(rest as Omit<Appointment, 'id'>) } as Appointment;
      });

      console.log(`📊 Initial appointments list:`, list);

      const filtered = list.filter((a) => {
        if (opts?.status && a.status !== opts.status) {
          console.log(`🚫 Filtering out appointment ${a.id} (status mismatch: ${a.status} vs ${opts.status})`);
          return false;
        }
        if (opts?.employeeId && a.employeeId !== opts.employeeId) {
          console.log(`🚫 Filtering out appointment ${a.id} (employee mismatch: ${a.employeeId} vs ${opts.employeeId})`);
          return false;
        }
        if (opts?.serviceId && a.serviceId !== opts.serviceId) {
          console.log(`🚫 Filtering out appointment ${a.id} (service mismatch: ${a.serviceId} vs ${opts.serviceId})`);
          return false;
        }
        if (opts?.customerUserId && a.customerUserId !== opts.customerUserId) {
          console.log(`🚫 Filtering out appointment ${a.id} (customer mismatch: ${a.customerUserId} vs ${opts.customerUserId})`);
          return false;
        }
        console.log(`✅ Keeping appointment ${a.id}`);
        return true;
      });

      console.log(`📊 Final filtered appointments: ${filtered.length}`, filtered);
      return filtered;
    } catch (error) {
      console.error(`❌ Error in listBySalon:`, error);
      return [];
    }
  },

  listByDay: async (salonId: string, date: Date): Promise<Appointment[]> => {
    try {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const startIso = dayStart.toISOString();
      const endIso = dayEnd.toISOString();

      console.log(`📅 listByDay called:`, {
        salonId,
        date: date.toISOString(),
        dayStart: startIso,
        dayEnd: endIso
      });

      const appointments = await appointmentOperations.listBySalon(salonId, { startAt: startIso, endAt: endIso });
      console.log(`📅 listByDay result: ${appointments.length} appointments`, appointments);

      return appointments;
    } catch (error) {
      console.error(`❌ Error in listByDay:`, error);
      return [];
    }
  },

  // Check if a time slot is available (no overlapping appointments). Optional employee scope
  isTimeSlotAvailable: async (
    salonId: string,
    startAtIso: string,
    durationMinutes: number,
    employeeId?: string,
    excludeAppointmentId?: string
  ): Promise<boolean> => {
    try {
      const start = new Date(startAtIso);
      const end = new Date(startAtIso);
      end.setMinutes(end.getMinutes() + durationMinutes);

      console.log(`🔍 Checking availability for slot:`, {
        salonId,
        startAtIso,
        start: start.toISOString(),
        end: end.toISOString(),
        durationMinutes,
        employeeId,
        excludeAppointmentId
      });

      // Fetch the day's appointments and check overlaps client-side
      const appts = await appointmentOperations.listByDay(salonId, start);
      console.log(`📅 Found ${appts.length} appointments for the day:`, appts);

      const relevant = appts.filter((a) => {
        if (excludeAppointmentId && a.id === excludeAppointmentId) {
          console.log(`🚫 Excluding appointment ${a.id} (excludeAppointmentId)`);
          return false;
        }
        if (employeeId && a.employeeId !== employeeId) {
          console.log(`🚫 Excluding appointment ${a.id} (employee mismatch: ${a.employeeId} vs ${employeeId})`);
          return false;
        }
        // Only consider active bookings
        if (a.status === 'cancelled' || a.status === 'no_show') {
          console.log(`🚫 Excluding appointment ${a.id} (status: ${a.status})`);
          return false;
        }
        console.log(`✅ Including appointment ${a.id} (employee: ${a.employeeId}, status: ${a.status})`);
        return true;
      });

      console.log(`📊 Relevant appointments after filtering: ${relevant.length}`, relevant);

      const overlaps = relevant.some((a) => {
        const aStart = new Date(a.startAt);
        const aEnd = new Date(a.startAt);
        aEnd.setMinutes(aEnd.getMinutes() + a.durationMinutes);
        
        const hasOverlap = aStart < end && start < aEnd;
        
        console.log(`🔍 Checking overlap with appointment ${a.id}:`, {
          appointmentStart: aStart.toISOString(),
          appointmentEnd: aEnd.toISOString(),
          requestedStart: start.toISOString(),
          requestedEnd: end.toISOString(),
          hasOverlap
        });
        
        return hasOverlap;
      });

      const isAvailable = !overlaps;
      console.log(`✅ Time slot availability result: ${isAvailable} (overlaps: ${overlaps})`);
      
      return isAvailable;
    } catch (error) {
      console.error(`❌ Error checking time slot availability:`, error);
      // В случае ошибки считаем слот доступным, чтобы не блокировать пользователя
      return true;
    }
  },
};

// Загрузка изображения для сервиса
export const uploadServiceImage = async (serviceId: string, file: File) => {
  const storage = getStorage();
  const id = `${Date.now()}-${file.name}`;
  const path = `serviceImages/${serviceId}/${id}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  const url = await getDownloadURL(ref);
  return {
    id,
    serviceId,
    url,
    storagePath: path,
    uploadedAt: new Date().toISOString(),
  };
};

// Удаление изображения сервиса
export const deleteServiceImage = async (storagePath: string) => {
  const storage = getStorage();
  const ref = storageRef(storage, storagePath);
  await deleteObject(ref);
};

// Получить все изображения сервиса
export const getServiceImages = async (serviceId: string) => {
  const storage = getStorage();
  const dirRef = storageRef(storage, `serviceImages/${serviceId}`);
  const res = await listAll(dirRef);
  const images = await Promise.all(
    res.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        id: itemRef.name,
        serviceId,
        url,
        storagePath: itemRef.fullPath,
        uploadedAt: '', // Можно хранить дату в БД, если нужно
      };
    })
  );
  return images;
};

// Получить все приглашения в салоны (raw)
export const getAllSalonInvitations = async () => {
  const snapshot = await get(ref(db, 'salonInvitations'));
  return snapshot.exists() ? snapshot.val() : {};
};

export const getAllServiceCategories = async () => {
  const snapshot = await get(ref(db, 'serviceCategories'));
  return snapshot.exists() ? snapshot.val() : {};
};

export const getAllSalonServices = async () => {
  const snapshot = await get(ref(db, 'salonServices'));
  return snapshot.exists() ? snapshot.val() : {};
};

export const getAllSalons = async () => {
  const snapshot = await get(ref(db, 'salons'));
  return snapshot.exists() ? snapshot.val() : {};
};

// Blog operations
export const blogAuthorOperations = {
  create: (authorId: string, data: Omit<BlogAuthor, 'id'>) =>
    createOperation(`blog/authors/${authorId}`, data, blogAuthorSchema),
  read: (authorId: string) => readOperation<BlogAuthor>(`blog/authors/${authorId}`),
  update: (authorId: string, data: Partial<BlogAuthor>) =>
    updateOperation(`blog/authors/${authorId}`, data, blogAuthorSchema),
  delete: (authorId: string) => deleteOperation(`blog/authors/${authorId}`),
  list: async (): Promise<BlogAuthor[]> => {
    const snapshot = await get(ref(db, 'blog/authors'));
    if (!snapshot.exists()) return [];
    const raw = snapshot.val() as Record<string, Omit<BlogAuthor, 'id'>>;
    return Object.entries(raw).map(([id, a]) => ({ id, ...(a as any) }));
  }
};

export const blogCategoryOperations = {
  create: (categoryId: string, data: Omit<BlogCategory, 'id'>) =>
    createOperation(`blog/categories/${categoryId}`, data, blogCategorySchema),
  read: (categoryId: string) => readOperation<BlogCategory>(`blog/categories/${categoryId}`),
  update: (categoryId: string, data: Partial<BlogCategory>) =>
    updateOperation(`blog/categories/${categoryId}`, data, blogCategorySchema),
  delete: (categoryId: string) => deleteOperation(`blog/categories/${categoryId}`),
  list: async (): Promise<BlogCategory[]> => {
    const snapshot = await get(ref(db, 'blog/categories'));
    if (!snapshot.exists()) return [];
    const raw = snapshot.val() as Record<string, Omit<BlogCategory, 'id'>>;
    return Object.entries(raw).map(([id, c]) => ({ id, ...(c as any) }));
  }
};

export const blogPostOperations = {
  create: (postId: string, data: Omit<BlogPost, 'id'>) =>
    createOperation(`blog/posts/${postId}`, data, blogPostSchema),
  read: (postId: string) => readOperation<BlogPost>(`blog/posts/${postId}`),
  update: (postId: string, data: Partial<BlogPost>) =>
    updateOperation(`blog/posts/${postId}`, data, blogPostSchema),
  delete: (postId: string) => deleteOperation(`blog/posts/${postId}`),
  list: async (): Promise<BlogPost[]> => {
    const snapshot = await get(ref(db, 'blog/posts'));
    if (!snapshot.exists()) return [];
    const raw = snapshot.val() as Record<string, Omit<BlogPost, 'id'>>;
    return Object.entries(raw)
      .map(([id, p]) => ({ id, ...(p as any) }))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }
};

// Blog images (storage)
export const uploadBlogImage = async (postId: string, file: File) => {
  const storage = getStorage();
  const id = `${Date.now()}-${file.name}`;
  const path = `blog/images/${postId}/${id}`;
  const sref = storageRef(storage, path);
  await uploadBytes(sref, file);
  const url = await getDownloadURL(sref);
  return { id, postId, url, storagePath: path, uploadedAt: new Date().toISOString() };
};

export const deleteBlogImage = async (storagePath: string) => {
  const storage = getStorage();
  const sref = storageRef(storage, storagePath);
  await deleteObject(sref);
};

// Chat operations
export const chatOperations = {
  // Create chat
  create: (chatId: string, data: Omit<Chat, 'id'>) =>
    createOperation(`chats/${chatId}`, data, chatSchema),

  // Read chat
  read: (chatId: string) => readOperation<Chat>(`chats/${chatId}`),

  // Update chat
  update: (chatId: string, data: Partial<Chat>) =>
    updateOperation(`chats/${chatId}`, data, chatSchema),

  // Delete chat
  delete: (chatId: string) => deleteOperation(`chats/${chatId}`),

  // Get chats by salon
  getBySalon: async (salonId: string): Promise<Chat[]> => {
    try {
      const snapshot = await get(ref(db, 'chats'));
      if (!snapshot.exists()) return [];
      
      const chats = snapshot.val() as Record<string, Chat>;
      return Object.entries(chats)
        .map(([id, chat]) => ({ ...chat, id }))
        .filter(chat => chat.salonId === salonId)
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    } catch (error) {
      console.error('Error getting chats by salon:', error);
      return [];
    }
  },

  // Get chats by customer
  getByCustomer: async (customerUserId: string): Promise<Chat[]> => {
    try {
      const snapshot = await get(ref(db, 'chats'));
      if (!snapshot.exists()) return [];
      
      const chats = snapshot.val() as Record<string, Chat>;
      return Object.entries(chats)
        .map(([id, chat]) => ({ ...chat, id }))
        .filter(chat => chat.customerUserId === customerUserId)
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    } catch (error) {
      console.error('Error getting chats by customer:', error);
      return [];
    }
  },

  // Get chat by appointment
  getByAppointment: async (appointmentId: string): Promise<Chat | null> => {
    try {
      const snapshot = await get(ref(db, 'chats'));
      if (!snapshot.exists()) return null;
      
      const chats = snapshot.val() as Record<string, Chat>;
      const chat = Object.entries(chats)
        .map(([id, chat]) => ({ ...chat, id }))
        .find(chat => chat.appointmentId === appointmentId);
      
      return chat || null;
    } catch (error) {
      console.error('Error getting chat by appointment:', error);
      return null;
    }
  },

  // Create or get existing chat
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
        chatData.appointmentId = appointmentId;
      }
      if (serviceId) {
        chatData.serviceId = serviceId;
      }

      await chatOperations.create(chatId, chatData);
      return { ...chatData, id: chatId };
    } catch (error) {
      console.error('Error creating or getting chat:', error);
      throw error;
    }
  }
};

// Chat message operations
export const chatMessageOperations = {
  // Create message
  create: (chatId: string, messageId: string, data: Omit<ChatMessage, 'id'>) =>
    createOperation(`chatMessages/${chatId}/${messageId}`, data, chatMessageSchema),

  // Read message
  read: (chatId: string, messageId: string) =>
    readOperation<ChatMessage>(`chatMessages/${chatId}/${messageId}`),

  // Update message
  update: (chatId: string, messageId: string, data: Partial<ChatMessage>) =>
    updateOperation(`chatMessages/${chatId}/${messageId}`, data, chatMessageSchema),

  // Delete message
  delete: (chatId: string, messageId: string) =>
    deleteOperation(`chatMessages/${chatId}/${messageId}`),

  // Get messages by chat
  getByChat: async (chatId: string, limit = 50, offset = 0): Promise<ChatMessage[]> => {
    try {
      const snapshot = await get(ref(db, `chatMessages/${chatId}`));
      if (!snapshot.exists()) return [];
      
      const messages = snapshot.val() as Record<string, ChatMessage>;
      const messageList = Object.entries(messages)
        .map(([id, message]) => ({ ...message, id }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      return messageList.slice(offset, offset + limit);
    } catch (error) {
      console.error('Error getting messages by chat:', error);
      return [];
    }
  },

  // Mark messages as read
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

  // Send message
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

      // Only add attachments if they exist and are not empty
      if (attachments && attachments.length > 0) {
        messageData.attachments = attachments;
      }

      // Create message
      await chatMessageOperations.create(chatId, messageId, messageData);

      // Update chat's last message info
      const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
      await chatOperations.update(chatId, {
        lastMessageAt: now,
        lastMessagePreview: messagePreview,
        updatedAt: now
      });

      // Update unread count for the other party
      const chat = await chatOperations.read(chatId);
      if (chat) {
        const unreadCount = { ...chat.unreadCount };
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

      return { ...messageData, id: messageId };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
};

// Chat participant operations
export const chatParticipantOperations = {
  // Add participant
  add: (chatId: string, participantId: string, data: Omit<ChatParticipant, 'id'>) =>
    createOperation(`chatParticipants/${chatId}/${participantId}`, data, chatParticipantSchema),

  // Remove participant
  remove: (chatId: string, participantId: string) =>
    deleteOperation(`chatParticipants/${chatId}/${participantId}`),

  // Update participant status
  updateStatus: (chatId: string, participantId: string, data: Partial<ChatParticipant>) =>
    updateOperation(`chatParticipants/${chatId}/${participantId}`, data, chatParticipantSchema),

  // Get participants by chat
  getByChat: async (chatId: string): Promise<ChatParticipant[]> => {
    try {
      const snapshot = await get(ref(db, `chatParticipants/${chatId}`));
      if (!snapshot.exists()) return [];
      
      const participants = snapshot.val() as Record<string, ChatParticipant>;
      return Object.entries(participants)
        .map(([id, participant]) => ({ ...participant, id }));
    } catch (error) {
      console.error('Error getting participants by chat:', error);
      return [];
    }
  }
};

// Chat notification operations
export const chatNotificationOperations = {
  // Create notification
  create: (notificationId: string, data: Omit<ChatNotification, 'id'>) =>
    createOperation(`chatNotifications/${notificationId}`, data, chatNotificationSchema),

  // Mark notification as read
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

  // Get notifications by user
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
    } catch (error) {
      console.error('Error getting notifications by user:', error);
      return [];
    }
  },

  // Get unread notifications by user
  getUnreadByUser: async (userId: string): Promise<ChatNotification[]> => {
    try {
      const notifications = await chatNotificationOperations.getByUser(userId, 1000);
      return notifications.filter(notification => !notification.isRead);
    } catch (error) {
      console.error('Error getting unread notifications by user:', error);
      return [];
    }
  }
};

// Salon rating operations
export const salonRatingOperations = {
  // Create rating
  create: (ratingId: string, data: Omit<SalonRating, 'id'>) =>
    createOperation(`salonRatings/${ratingId}`, data, salonRatingSchema),

  // Read rating
  read: (ratingId: string) => readOperation<SalonRating>(`salonRatings/${ratingId}`),

  // Update rating
  update: (ratingId: string, data: Partial<SalonRating>) =>
    updateOperation(`salonRatings/${ratingId}`, data, salonRatingSchema),

  // Delete rating
  delete: (ratingId: string) => deleteOperation(`salonRatings/${ratingId}`),

  // Get ratings by salon
  getBySalon: async (salonId: string): Promise<SalonRating[]> => {
    try {
      const snapshot = await get(ref(db, `salonRatings`));
      if (!snapshot.exists()) return [];
      
      const ratings = snapshot.val() as Record<string, SalonRating>;
      return Object.entries(ratings)
        .map(([id, rating]) => ({ ...rating, id }))
        .filter(rating => rating.salonId === salonId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting ratings by salon:', error);
      return [];
    }
  },

  // Get average rating for a salon
  getAverageRating: async (salonId: string): Promise<number> => {
    try {
      const ratings = await salonRatingOperations.getBySalon(salonId);
      if (ratings.length === 0) return 0;

      const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
      return totalRating / ratings.length;
    } catch (error) {
      console.error('Error calculating average rating:', error);
      return 0;
    }
  },

  // Get rating stats for a salon
  getRatingStats: async (salonId: string): Promise<SalonRatingStats> => {
    try {
      const ratings = await salonRatingOperations.getBySalon(salonId);
      const approvedRatings = ratings.filter(r => r.status === 'approved');
      const totalRatings = approvedRatings.length;
      const averageRating = totalRatings > 0 ? approvedRatings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings : 0;

      // Calculate rating distribution
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      approvedRatings.forEach(rating => {
        if (rating.rating >= 1 && rating.rating <= 5) {
          ratingDistribution[rating.rating as keyof typeof ratingDistribution]++;
        }
      });

      // Calculate category averages if categories exist
      const categoryAverages: SalonRatingStats['categoryAverages'] = {};
      if (approvedRatings.some(r => r.categories)) {
        const categories = ['service', 'cleanliness', 'atmosphere', 'staff', 'value'] as const;
        categories.forEach(category => {
          const categoryRatings = approvedRatings
            .filter(r => r.categories && r.categories[category])
            .map(r => r.categories![category]!);
          
          if (categoryRatings.length > 0) {
            categoryAverages[category] = categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length;
          }
        });
      }

      return {
        averageRating,
        totalRatings,
        ratingDistribution,
        categoryAverages: Object.keys(categoryAverages).length > 0 ? categoryAverages : undefined,
      };
    } catch (error) {
      console.error('Error getting rating stats:', error);
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }
  },

  // Get ratings by customer
  getByCustomer: async (customerUserId: string): Promise<SalonRating[]> => {
    try {
      const snapshot = await get(ref(db, 'salonRatings'));
      if (!snapshot.exists()) return [];
      
      const ratings = snapshot.val() as Record<string, SalonRating>;
      return Object.entries(ratings)
        .map(([id, rating]) => ({ ...rating, id }))
        .filter(rating => rating.customerUserId === customerUserId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting ratings by customer:', error);
      return [];
    }
  },

  // Get ratings by appointment
  getByAppointment: async (appointmentId: string): Promise<SalonRating | null> => {
    try {
      const snapshot = await get(ref(db, 'salonRatings'));
      if (!snapshot.exists()) return null;
      
      const ratings = snapshot.val() as Record<string, SalonRating>;
      const rating = Object.entries(ratings)
        .map(([id, rating]) => ({ ...rating, id }))
        .find(rating => rating.appointmentId === appointmentId);
      
      return rating || null;
    } catch (error) {
      console.error('Error getting rating by appointment:', error);
      return null;
    }
  },

  // Approve rating
  approveRating: async (ratingId: string): Promise<void> => {
    try {
      const now = new Date().toISOString();
      await salonRatingOperations.update(ratingId, {
        status: 'approved',
        approvedAt: now,
        updatedAt: now
      });
    } catch (error) {
      console.error('Error approving rating:', error);
      throw error;
    }
  },

  // Reject rating
  rejectRating: async (ratingId: string, reason: string): Promise<void> => {
    try {
      const now = new Date().toISOString();
      await salonRatingOperations.update(ratingId, {
        status: 'rejected',
        rejectedAt: now,
        rejectedReason: reason,
        updatedAt: now
      });
    } catch (error) {
      console.error('Error rejecting rating:', error);
      throw error;
    }
  },

  // Mark rating as verified (for customers who actually visited)
  markAsVerified: async (ratingId: string): Promise<void> => {
    try {
      const now = new Date().toISOString();
      await salonRatingOperations.update(ratingId, {
        isVerified: true,
        updatedAt: now
      });
    } catch (error) {
      console.error('Error marking rating as verified:', error);
      throw error;
    }
  },
};

// Salon rating response operations
export const salonRatingResponseOperations = {
  // Create response
  create: (responseId: string, data: Omit<SalonRatingResponse, 'id'>) =>
    createOperation(`salonRatingResponses/${responseId}`, data, salonRatingResponseSchema),

  // Read response
  read: (responseId: string) => readOperation<SalonRatingResponse>(`salonRatingResponses/${responseId}`),

  // Update response
  update: (responseId: string, data: Partial<SalonRatingResponse>) =>
    updateOperation(`salonRatingResponses/${responseId}`, data, salonRatingResponseSchema),

  // Delete response
  delete: (responseId: string) => deleteOperation(`salonRatingResponses/${responseId}`),

  // Get responses by rating
  getByRating: async (ratingId: string): Promise<SalonRatingResponse[]> => {
    try {
      const snapshot = await get(ref(db, `salonRatingResponses`));
      if (!snapshot.exists()) return [];
      
      const responses = snapshot.val() as Record<string, SalonRatingResponse>;
      return Object.entries(responses)
        .map(([id, response]) => ({ ...response, id }))
        .filter(response => response.ratingId === ratingId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting responses by rating:', error);
      return [];
    }
  },
};

// Salon rating helpful operations
export const salonRatingHelpfulOperations = {
  // Add helpful vote
  add: (ratingId: string, userId: string, isHelpful: boolean) => {
    const helpfulId = `${ratingId}_${userId}`;
    const data: Omit<SalonRatingHelpful, 'id'> = {
      ratingId,
      userId,
      isHelpful,
      createdAt: new Date().toISOString()
    };
    return createOperation(`salonRatingHelpfuls/${helpfulId}`, data, salonRatingHelpfulSchema);
  },

  // Remove helpful vote
  remove: (ratingId: string, userId: string) => {
    const helpfulId = `${ratingId}_${userId}`;
    return deleteOperation(`salonRatingHelpfuls/${helpfulId}`);
  },

  // Update helpful vote
  update: (ratingId: string, userId: string, isHelpful: boolean) => {
    const helpfulId = `${ratingId}_${userId}`;
    const data: Partial<SalonRatingHelpful> = {
      isHelpful,
      createdAt: new Date().toISOString()
    };
    return updateOperation(`salonRatingHelpfuls/${helpfulId}`, data, salonRatingHelpfulSchema);
  },

  // Get helpfuls by rating
  getByRating: async (ratingId: string): Promise<SalonRatingHelpful[]> => {
    try {
      const snapshot = await get(ref(db, `salonRatingHelpfuls`));
      if (!snapshot.exists()) return [];
      
      const helpfuls = snapshot.val() as Record<string, SalonRatingHelpful>;
      return Object.entries(helpfuls)
        .map(([id, helpful]) => ({ ...helpful, id }))
        .filter(helpful => helpful.ratingId === ratingId);
    } catch (error) {
      console.error('Error getting helpfuls by rating:', error);
      return [];
    }
  },

  // Get helpful stats for a rating
  getHelpfulStats: async (ratingId: string): Promise<{ helpful: number; notHelpful: number }> => {
    try {
      const helpfuls = await salonRatingHelpfulOperations.getByRating(ratingId);
      const helpful = helpfuls.filter(h => h.isHelpful).length;
      const notHelpful = helpfuls.filter(h => !h.isHelpful).length;
      
      return { helpful, notHelpful };
    } catch (error) {
      console.error('Error getting helpful stats:', error);
      return { helpful: 0, notHelpful: 0 };
    }
  },

  // Check if user has voted on a rating
  hasUserVoted: async (ratingId: string, userId: string): Promise<SalonRatingHelpful | null> => {
    try {
      const helpfulId = `${ratingId}_${userId}`;
      const snapshot = await get(ref(db, `salonRatingHelpfuls/${helpfulId}`));
      return snapshot.exists() ? { ...snapshot.val(), id: helpfulId } : null;
    } catch (error) {
      console.error('Error checking user vote:', error);
      return null;
    }
  },

  // Toggle helpful vote
  toggleHelpful: async (ratingId: string, userId: string, isHelpful: boolean): Promise<void> => {
    try {
      const existingVote = await salonRatingHelpfulOperations.hasUserVoted(ratingId, userId);
      
      if (existingVote) {
        if (existingVote.isHelpful === isHelpful) {
          // Remove vote if clicking the same option
          await salonRatingHelpfulOperations.remove(ratingId, userId);
        } else {
          // Update vote if changing from helpful to not helpful or vice versa
          await salonRatingHelpfulOperations.update(ratingId, userId, isHelpful);
        }
      } else {
        // Add new vote
        await salonRatingHelpfulOperations.add(ratingId, userId, isHelpful);
      }
    } catch (error) {
      console.error('Error toggling helpful vote:', error);
      throw error;
    }
  },
};
