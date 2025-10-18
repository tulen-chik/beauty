"use client"

import { X, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useEffect } from "react"

type ImageCarouselModalProps = {
  images: Array<{ id: string; url: string }>
  startIndex: number
  onClose: () => void
  setCurrentSlide: (index: number) => void
}

export default function ImageCarouselModal({
  images,
  startIndex,
  onClose,
  setCurrentSlide,
}: ImageCarouselModalProps) {
  const handleNext = () => {
    setCurrentSlide((startIndex + 1) % images.length)
  }

  const handlePrev = () => {
    setCurrentSlide((startIndex - 1 + images.length) % images.length)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [startIndex])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl h-full max-h-[80vh] bg-white rounded-2xl flex flex-col items-center justify-center shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Image Display */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-full h-full">
            <Image
              src={images[startIndex].url}
              alt={`service image ${startIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
        </div>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 rounded-full hover:bg-white transition-colors shadow-md"
              aria-label="Предыдущее изображение"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 rounded-full hover:bg-white transition-colors shadow-md"
              aria-label="Следующее изображение"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
          {startIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  )
}