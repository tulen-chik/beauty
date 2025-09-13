import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'accent' | 'white' | 'dark';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const colorClasses = {
  primary: 'text-primary-500',
  accent: 'text-accent',
  white: 'text-white',
  dark: 'text-dark',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'accent',
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export const LoadingPage: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex h-screen w-full items-center justify-center ${className}`}>
    <LoadingSpinner size="lg" />
  </div>
);

export const LoadingOverlay: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm ${className}`}>
    <LoadingSpinner size="xl" color="white" />
  </div>
);

export default LoadingSpinner;
