"use client"

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSalonService } from '@/contexts/SalonServiceContext';
import { useAppointment } from '@/contexts/AppointmentContext';
import { Chat, SalonService, Appointment } from '@/types/database';
import { InitialAvatar, formatDate } from '@/components/Chat/Helpers';

interface SalonChatItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}

export default function SalonChatItem({ chat, isActive, onClick }: SalonChatItemProps) {
  const { getService } = useSalonService();
  const { getAppointment } = useAppointment();
  const [service, setService] = useState<SalonService | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const t = useTranslations('salonChats');

  useEffect(() => {
    const loadDetails = async () => {
      setIsLoadingDetails(true);
      if (chat.serviceId) {
        try { setService(await getService(chat.serviceId)); }
        catch (e) { console.error(e); setService(null); }
      }
      if (chat.appointmentId && chat.salonId) {
        try { setAppointment(await getAppointment(chat.salonId, chat.appointmentId)); }
        catch (e) { console.error(e); setAppointment(null); }
      }
      setIsLoadingDetails(false);
    };
    loadDetails();
  }, [chat.serviceId, chat.appointmentId, chat.salonId, getService, getAppointment]);

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-4 p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 border border-transparent ${
        isActive 
          ? 'bg-rose-50 border-rose-100 shadow-sm' 
          : 'hover:bg-slate-50 hover:border-slate-100'
      }`}
    >
      <InitialAvatar name={chat.customerName || ''} className="w-12 h-12 rounded-full flex-shrink-0 text-lg shadow-sm" />
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800 truncate text-sm sm:text-base">
            {chat.customerName}
          </h3>
          <span className="text-xs text-slate-400 flex-shrink-0 ml-2 font-medium">
            {formatDate(chat.lastMessageAt)}
          </span>
        </div>
        
        <p className="text-sm text-slate-500 truncate mt-0.5">
          {chat.lastMessagePreview || t('noMessages')}
        </p>
        
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex-grow min-w-0">
            {isLoadingDetails ? (
              <div className="h-4 w-1/3 bg-slate-100 rounded-full animate-pulse"></div>
            ) : service ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-full">
                {service.name}
              </span>
            ) : appointment ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 truncate max-w-full">
                {new Date(appointment.startAt).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
              </span>
            ) : chat.appointmentId ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                {t('chatByAppointment')}
              </span>
            ) : null}
          </div>
          
          {chat.unreadCount.salon > 0 && (
            <div className="w-5 h-5 bg-rose-600 text-white text-[10px] font-bold rounded-full flex-shrink-0 flex items-center justify-center shadow-sm shadow-rose-200">
              {chat.unreadCount.salon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}