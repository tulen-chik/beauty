"use client"

import { useEffect } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useChat } from '@/contexts/ChatContext';
import SalonChatItem from './SalonChatItem';
import { ChatItemSkeleton } from '@/components/Chat/Skeletons';

interface SalonChatListPanelProps {
  salonId: string;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export default function SalonChatListPanel({ salonId, selectedChatId, onSelectChat }: SalonChatListPanelProps) {
  const { getChatsBySalon, activeChats, loading, error } = useChat();
  const t = useTranslations('salonChats');

  useEffect(() => {
    if (salonId) {
      getChatsBySalon(salonId)
        .catch(err => console.error("Failed to load chats:", err));
    }
  }, [salonId, getChatsBySalon]);

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full bg-white border-r border-slate-200 flex flex-col z-20">
      <div className="p-4 border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-800 mb-4">{t('title')}</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск клиента..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300 transition-all"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {loading && activeChats.length === 0 && (
          <div className="py-2">
            {[...Array(5)].map((_, i) => <ChatItemSkeleton key={i} />)}
          </div>
        )}
        
        {error && (
          <div className="p-6 text-center">
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{String(error)}</p>
          </div>
        )}
        
        {!loading && activeChats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 px-6 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-semibold text-slate-600 mb-1">{t('noChatsTitle')}</h3>
            <p className="text-sm">{t('noChatsDesc')}</p>
          </div>
        )}
        
        <div className="py-2">
          {activeChats.map(chat => (
            <SalonChatItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === selectedChatId}
              onClick={() => onSelectChat(chat.id)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}