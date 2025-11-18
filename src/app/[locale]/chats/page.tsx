"use client"

import { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import ChatListPanel from './components/ChatListPanel';
import ChatViewPanel from './components/ChatViewPanel';

export default function ChatsPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { activeChats, setCurrentChat } = useChat();

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
          <ChatListPanel
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
          />
        </div>
        <div className="absolute top-0 left-0 w-full h-full md:static flex-1 z-10"
             style={{ transform: selectedChatId ? 'translateX(0)' : 'translateX(100%)' }}>
          <ChatViewPanel 
            selectedChatId={selectedChatId} 
            onBack={() => handleSelectChat(null)} 
          />
        </div>
      </div>
    </>
  );
}