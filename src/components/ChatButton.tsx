"use client"

import React, { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@/contexts/UserContext';
import { useSalonService } from '@/contexts/SalonServiceContext';
import Link from 'next/link';

interface ChatButtonProps {
  salonId: string;
  customerUserId: string;
  customerName: string;
  appointmentId?: string;
  serviceId?: string;
  className?: string;
  variant?: 'button' | 'link';
}

export default function ChatButton({
  salonId,
  customerUserId,
  customerName,
  appointmentId,
  serviceId,
  className = '',
  variant = 'button'
}: ChatButtonProps) {
  const { currentUser } = useUser();
  const { createOrGetChat, loading } = useChat();
  const { getService } = useSalonService();
  const [isCreating, setIsCreating] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCreateChat = async () => {
    if (!currentUser) return;
    
    setLocalError(null);
    try {
      setIsCreating(true);

      // ensure we have salonId; if not - try to resolve from serviceId
      let sid = salonId;
      if (!sid && serviceId) {
        try {
          const svc = await getService(serviceId);
          sid = svc?.salonId ?? '';
        } catch (err) {
          console.error('Failed to fetch service to resolve salonId:', err);
        }
      }

      if (!sid) {
        const msg = 'Missing salonId for chat creation';
        console.error(msg);
        setLocalError(msg);
        return;
      }

      const chat = await createOrGetChat(sid, customerUserId, customerName, serviceId);
      if (!chat || !chat.id) {
        throw new Error('Invalid chat response');
      }
      setChatId(chat.id);
    } catch (err: any) {
      console.error('Error creating chat:', err);
      setLocalError(err?.message ?? 'Error creating chat');
    } finally {
      setIsCreating(false);
    }
  };

  if (variant === 'link') {
    return (
      <button
        onClick={handleCreateChat}
        disabled={isCreating || loading}
        className={`inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium ${className}`}
      >
        {isCreating || loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MessageCircle className="w-4 h-4" />
        )}
        Открыть чат
      </button>
    );
  }

  return (
    <div>
      {chatId ? (
        <Link
          href={`/chat/${chatId}`}
          className={`inline-flex items-center gap-2 px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors ${className}`}
        >
          <MessageCircle className="w-4 h-4" />
          Открыть чат
        </Link>
      ) : (
        <button
          onClick={handleCreateChat}
          disabled={isCreating || loading}
          className={`inline-flex items-center justify-center gap-2 px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        >
          {isCreating || loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          Создать чат
        </button>
      )}
      {localError && <div className="text-xs text-red-500 mt-2">{localError}</div>}
    </div>
  );
}
