"use client"

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, CheckCheck, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useChat } from '@/contexts/ChatContext';
import { InitialAvatar, formatMessageTime } from '@/components/Chat/Helpers';
import { ChatViewSkeleton } from '@/components/Chat/Skeletons';

interface SalonChatViewPanelProps {
  selectedChatId: string | null;
  onBack: () => void;
}

export default function SalonChatViewPanel({ selectedChatId, onBack }: SalonChatViewPanelProps) {
  const { currentUser } = useUser();
  const { currentChat, sendMessage, markMessagesAsRead, chatMessages, loading: isContextLoading, deleteChat } = useChat();

  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = selectedChatId ? chatMessages[selectedChatId] || [] : [];

  useEffect(() => {
    // Логика салона: помечаем сообщения как прочитанные, если есть непрочитанные для салона
    if (currentChat && currentUser?.userId && currentChat.unreadCount.salon > 0) {
      markMessagesAsRead(currentChat.id, currentUser.userId);
    }
  }, [currentChat, currentUser, markMessagesAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChatId || !currentUser) return;
    setIsSending(true);
    try {
      const senderName = currentUser.displayName || 'Салон';
      // Логика салона: отправляем как 'salon'
      await sendMessage(selectedChatId, currentUser.userId, 'salon', senderName, messageText, 'text');
      setMessageText('');
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const getMessageStatusIcon = (status: string) => {
    if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-white/90" />;
    return <Check className="w-3.5 h-3.5 text-rose-100/80" />;
  };

  const handleDeleteChat = async () => {
    if (!selectedChatId || !currentChat) return;
    setIsDeleting(true);
    try {
      await deleteChat(selectedChatId);
      setShowDeleteConfirm(false);
      onBack();
    } catch (error) {
      console.error("Failed to delete chat:", error);
      alert("Не удалось удалить чат. Попробуйте еще раз.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!selectedChatId) {
    return (
      <main className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <MessageCircle className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-lg font-medium text-slate-600">Выберите чат для ответа</h2>
      </main>
    );
  }

  if (isContextLoading && !currentChat) {
    return <ChatViewSkeleton />;
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-500 hover:text-rose-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="relative">
          <InitialAvatar name={currentChat?.customerName || ''} className="w-10 h-10 rounded-full text-sm ring-2 ring-white shadow-sm" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
        </div>

        <div className="flex-1">
          <h2 className="font-bold text-slate-800 text-sm leading-tight">{currentChat?.customerName}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Клиент</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Удалить чат"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          {showDeleteConfirm && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-20 min-w-[200px]">
              <p className="text-sm text-slate-700 mb-3">Вы уверены, что хотите удалить этот чат?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteChat}
                  disabled={isDeleting}
                  className="flex-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? 'Удаление...' : 'Удалить'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth">
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUser?.userId;
          const showDateSeparator = index === 0 || new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();
          
          return (
            <React.Fragment key={message.id}>
              {showDateSeparator && (
                <div className="flex justify-center my-6">
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-100/80 px-3 py-1 rounded-full">
                    {new Date(message.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  </span>
                </div>
              )}
              
              <div className={`flex items-end gap-3 animate-pop-in group ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                {!isOwnMessage && (
                  <InitialAvatar name={currentChat?.customerName || ''} className="w-8 h-8 rounded-full self-end mb-1 text-[10px] shadow-sm" />
                )}
                
                <div
                  className={`max-w-[85%] sm:max-w-lg px-5 py-3 shadow-sm transition-all ${
                    isOwnMessage
                      ? 'bg-rose-600 text-white rounded-2xl rounded-tr-sm shadow-rose-100'
                      : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-sm'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <div className={`flex items-center gap-1.5 mt-1 ${isOwnMessage ? 'justify-end text-rose-100/90' : 'justify-start text-slate-400'}`}>
                    <span className="text-[10px] font-medium">
                      {formatMessageTime(message.createdAt)}
                    </span>
                    {isOwnMessage && getMessageStatusIcon(message.status)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Overlay для подтверждения удаления */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 md:hidden"
          onClick={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-50 transition-all duration-200">
            <textarea
              placeholder="Написать сообщение..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              rows={1}
              className="w-full px-4 py-3 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 resize-none min-h-[48px] max-h-32"
              style={{ height: 'auto', overflow: 'hidden' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            className={`p-3 rounded-full shadow-md transition-all duration-200 flex-shrink-0 mb-0.5 ${
                !messageText.trim() || isSending 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-rose-600 text-white hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200 active:scale-95'
            }`}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </main>
  );
}