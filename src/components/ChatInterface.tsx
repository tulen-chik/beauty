"use client"

import { Check, CheckCheck, Clock, File, Image, MessageCircle, Paperclip, Send, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useRef, useState } from 'react';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@/contexts/UserContext';

import type { ChatMessageType } from '@/types/database';

interface ChatInterfaceProps {
  chatId: string;
  salonId: string;
  customerUserId: string;
  customerName: string;
  salonName?: string | null;
  appointmentId?: string;
  serviceId?: string;
}

export default function ChatInterface({
  chatId,
  salonId,
  customerUserId,
  customerName,
  salonName,
  appointmentId,
  serviceId
}: ChatInterfaceProps) {
  const { currentUser } = useUser();
  const { 
    sendMessage, 
    getMessages, 
    markMessagesAsRead, 
    currentChat, 
    chatMessages, 
    loading, 
    error 
  } = useChat();

  const t = useTranslations('chat');

  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = chatMessages[chatId] || [];
  const isCustomer = currentUser?.userId === customerUserId;

  const headerTitle = isCustomer 
    ? salonName || t('loadingName') 
    : customerName;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentUser && messages.length > 0) {
      const unreadMessages = messages.filter(msg => 
        msg.senderId !== currentUser.userId && 
        msg.status !== 'read'
      );
      
      if (unreadMessages.length > 0) {
        try {
          markMessagesAsRead(chatId, currentUser.userId);
        } catch (err) {
          console.error('Error marking messages as read:', err);
          setLoadError((err as any)?.message ?? t('errorMarkRead'));
        }
      }
    }
  }, [chatId, currentUser, messages, markMessagesAsRead, t]);

  useEffect(() => {
    if (!chatId) return;
    setLoadError(null);
    const load = async () => {
      try {
        await getMessages(chatId, 50);
        setLoadError(null);
      } catch (err: any) {
        console.error('Error loading messages:', err);
        setLoadError(err?.message ?? t('errorLoading'));
      }
    };
    load();
  }, [chatId, getMessages, t]);

  const handleSendMessage = async () => {
    setSendError(null);
    if (!messageText.trim() && attachments.length === 0) return;
    if (!currentUser) {
      setSendError(t('errorNoUser'));
      return;
    }

    setIsSending(true);
    setIsTyping(true);
    try {
      const messageType: ChatMessageType = attachments.length > 0 ? 'file' : 'text';
      let content = messageText;
      if (attachments.length > 0) {
        const fileNames = attachments.map(file => file.name).join(', ');
        content = t('filesSent', { count: attachments.length, names: fileNames });
      }

      await sendMessage(
        chatId,
        currentUser.userId,
        isCustomer ? 'customer' : 'salon',
        currentUser.displayName,
        content,
        messageType,
        attachments.length > 0 ? attachments.map(file => ({
          url: URL.createObjectURL(file),
          filename: file.name,
          size: file.size,
          type: file.type
        })) : undefined
      );

      setMessageText('');
      setAttachments([]);
      setSendError(null);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setSendError(err?.message ?? t('sendError'));
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_MIMES = [
    'image/',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) {
        setFileError(t('fileTooLarge', { name: f.name }));
        continue;
      }
      const ok = ALLOWED_MIMES.some(m => m.endsWith('/') ? f.type.startsWith(m) : f.type === m);
      if (!ok) {
        setFileError(t('unsupportedFileType', { name: f.name }));
        continue;
      }
      validFiles.push(f);
    }
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
      setFileError(null);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3.5 h-3.5 text-rose-200" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-rose-200" />;
      case 'read':
        return <CheckCheck className="w-3.5 h-3.5 text-white" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-rose-200" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const loadErrMsg = loadError ?? (error ? String(error) : null);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Ошибки загрузки */}
      {loadErrMsg && (
        <div className="p-3 bg-red-50 border-b border-red-100 text-red-700 text-sm flex items-center justify-between animate-in slide-in-from-top">
          <div>{loadErrMsg}</div>
          <button
            onClick={() => {
              setLoadError(null);
              if (chatId) getMessages(chatId, 50).catch(err => setLoadError(err?.message ?? t('errorLoading')));
            }}
            className="px-3 py-1 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 text-xs font-medium transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-rose-50 rounded-full flex items-center justify-center shadow-sm border border-rose-100">
              <MessageCircle className="w-6 h-6 text-rose-600" />
            </div>
            {currentChat?.status === 'active' && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{headerTitle}</h3>
            <p className="text-sm text-slate-500 font-medium">
              {appointmentId ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('chatByAppointment')}
                </span>
              ) : t('generalChat')}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2">
              <MessageCircle className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-medium">{t('startConversation')}</p>
            <p className="text-sm text-slate-400 max-w-xs text-center">Напишите первое сообщение, чтобы начать диалог</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUser?.userId;
            const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].senderId !== message.senderId);
            
            return (
              <div
                key={message.id}
                className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`flex max-w-[85%] sm:max-w-[75%] gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Аватар собеседника (плейсхолдер) */}
                  {!isOwnMessage && (
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-rose-700 bg-rose-100 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                      {message.senderName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div
                    className={`relative px-5 py-3 shadow-sm transition-all duration-200 ${
                      isOwnMessage
                        ? 'bg-rose-600 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-sm'
                    }`}
                  >
                    {!isOwnMessage && showAvatar && (
                      <div className="text-xs font-bold mb-1 text-rose-600/80">
                        {message.senderName}
                      </div>
                    )}
                    
                    <div className="mb-1.5 leading-relaxed">
                      {message.messageType === 'text' && (
                        <p className="text-[15px] whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                      
                      {message.messageType === 'file' && message.attachments && (
                        <div className="space-y-2">
                          {message.content && <p className="text-[15px] mb-2">{message.content}</p>}
                          {message.attachments.map((attachment, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border backdrop-blur-sm ${
                                isOwnMessage 
                                  ? 'bg-white/10 border-white/20 hover:bg-white/20' 
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              } transition-colors cursor-pointer`}
                            >
                              <div className={`p-2 rounded-lg ${isOwnMessage ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                                {attachment.type.startsWith('image/') ? (
                                  <Image className="w-5 h-5" />
                                ) : (
                                  <File className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{attachment.filename}</p>
                                <p className={`text-xs ${isOwnMessage ? 'text-rose-100' : 'text-slate-400'}`}>
                                  {(attachment.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex items-center justify-end gap-1.5 text-[11px] font-medium ${isOwnMessage ? 'text-rose-100' : 'text-slate-400'}`}>
                      <span>{formatTime(message.createdAt)}</span>
                      {isOwnMessage && getMessageStatusIcon(message.status)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm">
          <div className="flex flex-wrap gap-3">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="group flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
                  {file.type.startsWith('image/') ? (
                    <Image className="w-4 h-4" />
                  ) : (
                    <File className="w-4 h-4" />
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-white border-t border-slate-100">
        <div className="relative flex items-end gap-2 bg-slate-50 p-2 rounded-[28px] border border-slate-200 shadow-inner focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-100 transition-all duration-300">
          
          {/* Кнопка вложений */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white rounded-full transition-all duration-200 flex-shrink-0"
            title={t('attachFile')}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 py-2">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('placeholder')}
              className="w-full bg-transparent border-none p-0 text-slate-800 placeholder:text-slate-400 focus:ring-0 resize-none max-h-32 min-h-[24px] text-[15px] leading-relaxed"
              rows={1}
              style={{ height: 'auto', minHeight: '24px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
              disabled={isTyping || isSending}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={(!messageText.trim() && attachments.length === 0) || isTyping || isSending}
            className={`p-3 rounded-full flex-shrink-0 transition-all duration-200 shadow-sm ${
              (!messageText.trim() && attachments.length === 0) || isTyping || isSending
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-rose-600 text-white hover:bg-rose-700 hover:shadow-md hover:scale-105 active:scale-95'
            }`}
          >
            <Send className="w-5 h-5 ml-0.5" /> {/* ml-0.5 для визуального центрирования иконки Send */}
          </button>
        </div>
        
        {/* Ошибки отправки/файлов */}
        {(sendError || fileError) && (
          <div className="mt-2 px-4 text-xs font-medium text-red-600 flex items-center gap-1.5 animate-in slide-in-from-bottom-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            {sendError || fileError}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </div>
  );
}