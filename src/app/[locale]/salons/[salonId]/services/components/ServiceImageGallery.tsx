"use client"

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";

interface ServiceImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{ url: string; id: string }>;
  serviceName: string;
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
}

export default function ServiceImageGallery({
  isOpen,
  onClose,
  images,
  serviceName,
  currentIndex,
  onPrevious,
  onNext
}: ServiceImageGalleryProps) {
  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const galleryRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrevious();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onPrevious, onNext, onClose]);

  // Handle swipe gestures
  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    let startX = 0;
    let endX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      
      if (Math.abs(diff) > 50) { // Minimum swipe distance
        if (diff > 0) {
          onNext(); // Swipe left -> next image
        } else {
          onPrevious(); // Swipe right -> previous image
        }
      }
    };

    gallery.addEventListener('touchstart', handleTouchStart);
    gallery.addEventListener('touchend', handleTouchEnd);

    return () => {
      gallery.removeEventListener('touchstart', handleTouchStart);
      gallery.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onPrevious, onNext]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-2 sm:p-4">
      <div 
        ref={galleryRef}
        className="relative w-full h-full max-w-7xl bg-black rounded-lg overflow-hidden touch-pan-y"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/60 via-black/30 to-transparent">
          <div className="text-white text-xs sm:text-sm font-medium bg-black/40 px-2 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="p-1.5 sm:p-2 text-white hover:bg-white/20 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-white hover:bg-white/20 rounded-full transition-all active:scale-95"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={onNext}
              disabled={currentIndex === images.length - 1}
              className="p-1.5 sm:p-2 text-white hover:bg-white/20 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Main Image Container */}
        <div className="flex items-center justify-center h-full px-4 sm:px-8">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={currentImage.url}
              alt={`${serviceName} - Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
            
            {/* Side navigation areas for desktop */}
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="absolute left-0 top-0 bottom-0 w-1/4 sm:w-1/3 lg:w-1/4 text-transparent hover:bg-white/10 transition-colors disabled:cursor-default"
              aria-label="Previous image"
            />
            <button
              onClick={onNext}
              disabled={currentIndex === images.length - 1}
              className="absolute right-0 top-0 bottom-0 w-1/4 sm:w-1/3 lg:w-1/4 text-transparent hover:bg-white/10 transition-colors disabled:cursor-default"
              aria-label="Next image"
            />
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 sm:p-4">
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto justify-center pb-2 sm:pb-0">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => {
                    // Navigate to clicked thumbnail - this would need to be handled by parent
                    const diff = index - currentIndex;
                    if (diff > 0) {
                      for (let i = 0; i < diff; i++) onNext();
                    } else if (diff < 0) {
                      for (let i = 0; i < Math.abs(diff); i++) onPrevious();
                    }
                  }}
                  className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all active:scale-95 ${
                    index === currentIndex 
                      ? 'border-white ring-2 ring-white ring-offset-2 ring-offset-black' 
                      : 'border-white/30 hover:border-white/60 hover:scale-105'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`${serviceName} - Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
