import { Star } from 'lucide-react';
import React, { useState } from 'react';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export default function RatingInput({ 
  value, 
  onChange, 
  maxRating = 5, 
  size = 'md',
  disabled = false,
  className = '' 
}: RatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleMouseEnter = (rating: number) => {
    if (!disabled) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  const renderStars = () => {
    const stars = [];
    const displayRating = hoverRating || value;

    for (let i = 1; i <= maxRating; i++) {
      const isFilled = i <= displayRating;
      const isHovered = i <= hoverRating;

      stars.push(
        <Star
          key={i}
          className={`
            ${sizeClasses[size]} 
            cursor-pointer 
            transition-colors 
            duration-200
            ${isFilled 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300 hover:text-yellow-300'
            }
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          `}
          onMouseEnter={() => handleMouseEnter(i)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(i)}
        />
      );
    }

    return stars;
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {renderStars()}
    </div>
  );
}
