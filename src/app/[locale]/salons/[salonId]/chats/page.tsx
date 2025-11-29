"use client"

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useChat } from '@/contexts/ChatContext';
import SalonChatListPanel from './components/SalonChatListPanel';
import SalonChatViewPanel from './components/SalonChatViewPanel';

export default function SalonChatsPage() {
  const params = useParams();
  const salonId = params.salonId as string;
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const t = useTranslations('salonChats');

  const { activeChats, setCurrentChat } = useChat();

  if (!salonId) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500">
        {t('errorNoSalonId')}
      </div>
    );
  }

  const handleSelectChat = (chatId: string | null) => {
    setSelectedChatId(chatId);
    if (chatId) {
      const chat = activeChats.find(c => c.id === chatId);
      setCurrentChat(chat || null);
    } else {
      setCurrentChat(null);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes pop-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-pop-in {
          animation: pop-in 0.2s ease-out forwards;
        }
      `}</style>
      
      <div className="relative flex w-full h-[calc(100vh-64px)] overflow-hidden bg-white font-sans">
        <div className={`w-full md:w-auto md:flex`}>
          <SalonChatListPanel
            salonId={salonId}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
          />
        </div>
        <div className="absolute top-0 left-0 w-full h-full md:static flex-1 z-10">
          <SalonChatViewPanel 
            selectedChatId={selectedChatId} 
            salonId={salonId}
            onBack={() => handleSelectChat(null)} 
          />
        </div>
      </div>
    </>
  );
}