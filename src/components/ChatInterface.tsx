"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Image, File, X, MessageCircle, Clock, Check, CheckCheck } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@/contexts/UserContext';
import type { ChatMessage, ChatMessageType } from '@/types/database';
import { useTranslations } from 'next-intl';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ChatInterfaceProps {
  chatId: string;
  salonId: string;
  customerUserId: string;
  customerName: string;
  appointmentId?: string;
  serviceId?: string;
}

export default function ChatInterface({
  chatId,
  salonId,
  customerUserId,
  customerName,
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

  const t = useTranslations('chat'); // new: translations

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when chat is opened
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
          // non-fatal - show local error optionally
          setLoadError((err as any)?.message ?? t('errorMarkRead'));
        }
      }
    }
  }, [chatId, currentUser, messages, markMessagesAsRead, t]);

  // Load messages when chat is opened
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
          url: URL.createObjectURL(file), // NOTE: real upload required in production
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

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_MIMES = [
    'image/', // any image
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
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <LoadingSpinner />
    );
  }

  // show load error banner but keep component visible so user can retry
  // error from context still shown, or local loadError
  const loadErrMsg = loadError ?? (error ? String(error) : null);

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg">
      {loadErrMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <div>{loadErrMsg}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLoadError(null);
                if (chatId) getMessages(chatId, 50).catch(err => setLoadError(err?.message ?? t('errorLoading')));
              }}
              className="px-3 py-1 bg-rose-600 text-white rounded"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      )}
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{customerName}</h3>
            <p className="text-sm text-gray-500">
              {appointmentId ? t('chatByAppointment') : t('generalChat')}
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {currentChat?.status === 'active' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {t('active')}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>{t('startConversation')}</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUser?.userId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-rose-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="text-xs font-medium mb-1 text-gray-600">
                      {message.senderName}
                    </div>
                  )}
                  
                  <div className="mb-1">
                    {message.messageType === 'text' && (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    
                    {message.messageType === 'file' && message.attachments && (
                      <div className="space-y-2">
                        <p className="text-sm">{message.content}</p>
                        {message.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-white/20 rounded"
                          >
                            {attachment.type.startsWith('image/') ? (
                              <Image className="w-4 h-4" />
                            ) : (
                              <File className="w-4 h-4" />
                            )}
                            <span className="text-xs truncate">{attachment.filename}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs opacity-75">
                    <span>{formatTime(message.createdAt)}</span>
                    {isOwnMessage && getMessageStatusIcon(message.status)}
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
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border"
              >
                {file.type.startsWith('image/') ? (
                  <Image className="w-4 h-4 text-gray-500" />
                ) : (
                  <File className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm text-gray-700 truncate max-w-32">
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('placeholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              rows={1}
              disabled={isTyping || isSending}
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isTyping}
            >
              <Paperclip className="w-5 h-5" />
            </button> */}
            
            <button
              onClick={handleSendMessage}
              disabled={(!messageText.trim() && attachments.length === 0) || isTyping || isSending}
              className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        
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
