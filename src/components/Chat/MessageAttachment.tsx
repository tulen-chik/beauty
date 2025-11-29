"use client";

import React, { useState } from 'react';
import { Download, File, Image as ImageIcon, X } from 'lucide-react';
import type { ChatMessage } from '@/types/database';

interface MessageAttachmentProps {
  attachment: NonNullable<ChatMessage['attachments']>[0];
  isOwnMessage: boolean;
}

export default function MessageAttachment({ attachment, isOwnMessage }: MessageAttachmentProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const isImage = attachment.type.startsWith('image/');
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isImage) {
    return (
      <>
        <div className="mt-2">
          <div 
            className="relative cursor-pointer group"
            onClick={() => setShowImageModal(true)}
          >
            <img 
              src={attachment.url} 
              alt={attachment.filename}
              className="max-w-full h-auto rounded-lg shadow-sm transition-transform group-hover:scale-[1.02]"
              style={{ maxHeight: '200px' }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
            <span>{attachment.filename}</span>
            <span>•</span>
            <span>{formatFileSize(attachment.size)}</span>
          </div>
        </div>

        {showImageModal && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageModal(false);
                }}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img 
                src={attachment.url} 
                alt={attachment.filename}
                className="max-w-full max-h-full rounded-lg shadow-xl"
              />
              <div className="text-center mt-4 text-white">
                <p className="text-sm font-medium">{attachment.filename}</p>
                <p className="text-xs opacity-80">{formatFileSize(attachment.size)}</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="mt-2">
      <div 
        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-opacity-80 ${
          isOwnMessage 
            ? 'bg-white/10 border-white/20 hover:bg-white/20' 
            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
        }`}
        onClick={handleDownload}
      >
        <div className={`flex-shrink-0 p-2 rounded-md ${
          isOwnMessage ? 'bg-white/20' : 'bg-slate-200'
        }`}>
          <File className={`w-5 h-5 ${isOwnMessage ? 'text-white' : 'text-slate-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${
            isOwnMessage ? 'text-white' : 'text-slate-700'
          }`}>
            {attachment.filename}
          </p>
          <p className={`text-xs opacity-70 ${
            isOwnMessage ? 'text-white/80' : 'text-slate-500'
          }`}>
            {formatFileSize(attachment.size)}
          </p>
        </div>
        <Download className={`w-4 h-4 flex-shrink-0 ${
          isOwnMessage ? 'text-white/80' : 'text-slate-400'
        }`} />
      </div>
    </div>
  );
}
