"use client";

import React, { useState } from 'react';
import { Download, X, Image as ImageIcon, FileText } from 'lucide-react';
import type { SalonRatingAttachment } from '@/types/database';

interface RatingAttachmentProps {
  attachment: SalonRatingAttachment;
  isOwnRating?: boolean;
}

export default function RatingAttachment({ attachment, isOwnRating = false }: RatingAttachmentProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = attachment.type.startsWith('image/');

  if (isImage) {
    return (
      <>
        <div className={`relative group inline-block mt-2 ${isOwnRating ? 'ml-auto' : 'mr-auto'}`}>
          <img
            src={attachment.url}
            alt={attachment.filename}
            className="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer transition-transform hover:scale-105 object-cover"
            onClick={() => setIsImageModalOpen(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Image Modal */}
        {isImageModalOpen && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setIsImageModalOpen(false)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageModalOpen(false);
                }}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={attachment.url}
                alt={attachment.filename}
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Non-image file attachment
  return (
    <div className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 mt-2 ${isOwnRating ? 'ml-auto' : 'mr-auto'}`}>
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{attachment.filename}</p>
        <p className="text-xs text-gray-500">
          {(attachment.size / 1024).toFixed(1)} KB
        </p>
      </div>
      <button
        onClick={handleDownload}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
        title="Скачать файл"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}
