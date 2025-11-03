"use client"

import { Loader2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Импортируем useRouter для редиректа
import React, { useState } from 'react';

import { useChat } from '@/contexts/ChatContext';
import { useSalonService } from '@/contexts/SalonServiceContext';
import { useUser } from '@/contexts/UserContext';

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
  appointmentId, // <-- appointmentId уже доступен здесь
  serviceId,
  className = '',
  variant = 'button'
}: ChatButtonProps) {
  const { currentUser } = useUser();
  const { createOrGetChat, loading } = useChat();
  const { getService } = useSalonService();
  const [isCreating, setIsCreating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter(); // Инициализируем роутер

  const handleCreateChat = async () => {
    if (!currentUser) return;
    
    setLocalError(null);
    try {
      setIsCreating(true);

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

      // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
      // Передаем аргументы в правильном порядке: appointmentId, затем serviceId
      const chat = await createOrGetChat(sid, customerUserId, customerName, appointmentId, serviceId);
      
      if (!chat || !chat.id) {
        throw new Error('Invalid chat response');
      }
      
      // После создания чата сразу переходим на его страницу
      router.push(`/chat/${chat.id}`);

    } catch (err: any) {
      console.error('Error creating chat:', err);
      setLocalError(err?.message ?? 'Error creating chat');
    } finally {
      setIsCreating(false);
    }
  };

  // Я немного упростил логику отображения, чтобы она была более предсказуемой.
  // Кнопка всегда будет делать одно и то же - создавать/получать чат и переходить в него.
  const buttonText = variant === 'link' ? 'Открыть чат' : 'Создать чат';
  const buttonBaseClasses = variant === 'link' 
    ? 'inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium'
    : 'inline-flex items-center justify-center gap-2 px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

  return (
    <div>
      <button
        onClick={handleCreateChat}
        disabled={isCreating || loading}
        className={`${buttonBaseClasses} ${className}`}
      >
        {isCreating || loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MessageCircle className="w-4 h-4" />
        )}
        {buttonText}
      </button>
      {localError && <div className="text-xs text-red-500 mt-2">{localError}</div>}
    </div>
  );
}