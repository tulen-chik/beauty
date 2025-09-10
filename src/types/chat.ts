export type ChatMessageType = 'text' | 'image' | 'file' | 'system';

export type ChatMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderType: 'customer' | 'salon';
  senderName: string;
  messageType: ChatMessageType;
  content: string;
  attachments?: {
    url: string;
    filename: string;
    size: number;
    type: string;
  }[];
  status: ChatMessageStatus;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
}

export interface Chat {
  id: string;
  salonId: string;
  customerUserId: string;
  customerName: string;
  customerPhone?: string;
  appointmentId?: string;
  serviceId?: string;
  status: 'active' | 'archived' | 'closed';
  lastMessageAt: string;
  lastMessagePreview?: string;
  unreadCount: {
    customer: number;
    salon: number;
  };
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  closedAt?: string;
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  userType: 'customer' | 'salon';
  displayName: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeenAt: string;
  joinedAt: string;
  leftAt?: string;
}

export interface ChatNotification {
  id: string;
  chatId: string;
  userId: string;
  messageId: string;
  type: 'new_message' | 'message_read' | 'chat_archived' | 'chat_closed';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}
