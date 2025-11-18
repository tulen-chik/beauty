"use client"

import { User } from 'lucide-react';

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = (now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24);

  if (diffInDays < 1) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (diffInDays < 2) return 'Вчера';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

export const formatMessageTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const InitialAvatar = ({ name, className }: { name: string; className?: string }) => {
  const getInitials = (nameStr: string) => {
    const words = nameStr.split(' ').filter(Boolean);
    if (words.length === 0) return <User className="w-1/2 h-1/2" />;
    const firstInitial = words[0][0];
    const secondInitial = words.length > 1 ? words[1][0] : '';
    return `${firstInitial}${secondInitial}`.toUpperCase();
  };

  const getColor = (nameStr: string) => {
    let hash = 0;
    for (let i = 0; i < nameStr.length; i++) {
      hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-indigo-500', 'bg-teal-500', 'bg-purple-500',
      'bg-amber-500', 'bg-sky-500', 'bg-rose-500', 'bg-emerald-500'
    ];
    return colors[Math.abs(hash % colors.length)];
  };

  const initials = getInitials(name || '');
  const bgColor = getColor(name || '');

  return (
    <div className={`flex items-center justify-center font-bold text-white ${bgColor} ${className}`}>
      <span>{initials}</span>
    </div>
  );
};