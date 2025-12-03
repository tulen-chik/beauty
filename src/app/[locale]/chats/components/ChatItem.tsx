"use client"

import { useEffect, useState } from 'react';
import { useSalon } from '@/contexts/SalonContext';
import { useSalonService } from '@/contexts/SalonServiceContext';
import { useAppointment } from '@/contexts/AppointmentContext';
import { Chat, Salon, SalonService, Appointment } from '@/types/database';
import { InitialAvatar, formatDate } from '@/components/Chat/Helpers';

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}

export default function ChatItem({ chat, isActive, onClick }: ChatItemProps) {
  // 1. Достаем getSalonAvatar вместе с fetchSalon
  const { fetchSalon, getSalonAvatar } = useSalon();
  const { getService } = useSalonService();
  const { getAppointment } = useAppointment();

  const [salon, setSalon] = useState<Salon | null>(null);
  // 2. Добавляем состояния для аватара
  const [freshAvatarUrl, setFreshAvatarUrl] = useState<string | null>(null);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);

  const [service, setService] = useState<SalonService | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Эффект для загрузки основной информации (имя салона, услуга, запись)
  useEffect(() => {
    const loadDetails = async () => {
      setIsLoadingDetails(true);
      // Запускаем все запросы параллельно для скорости
      await Promise.all([
        fetchSalon(chat.salonId).then(setSalon).catch(console.error),
        chat.serviceId ? getService(chat.serviceId).then(setService).catch(() => setService(null)) : Promise.resolve(),
        (chat.appointmentId && chat.salonId) ? getAppointment(chat.salonId, chat.appointmentId).then(setAppointment).catch(() => setAppointment(null)) : Promise.resolve()
      ]);
      setIsLoadingDetails(false);
    };
    loadDetails();
  }, [chat.salonId, chat.serviceId, chat.appointmentId, fetchSalon, getService, getAppointment]);

  // 3. Отдельный, независимый эффект для загрузки свежего аватара
  useEffect(() => {
    let isMounted = true;
    const loadAvatar = async () => {
      setIsAvatarLoading(true);
      try {
        const avatarData = await getSalonAvatar(chat.salonId);
        if (isMounted && avatarData?.url) {
          setFreshAvatarUrl(avatarData.url);
        }
      } catch (error) {
        console.error(`Failed to load avatar for salon ${chat.salonId}:`, error);
      } finally {
        if (isMounted) {
          setIsAvatarLoading(false);
        }
      }
    };

    loadAvatar();

    return () => { isMounted = false; };
  }, [chat.salonId, getSalonAvatar]);


  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-4 p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 border border-transparent ${
        isActive 
          ? 'bg-rose-50 border-rose-100 shadow-sm' 
          : 'hover:bg-slate-50 hover:border-slate-100'
      }`}
    >
      {/* 4. Обновленный блок рендеринга аватара */}
      <div className="w-12 h-12 rounded-full flex-shrink-0 shadow-sm">
        {isAvatarLoading ? (
          <div className="w-full h-full bg-slate-200 rounded-full animate-pulse"></div>
        ) : freshAvatarUrl ? (
          <img
            src={freshAvatarUrl}
            alt={salon?.name || 'Аватар салона'}
            className="w-12 h-12 rounded-full object-cover bg-slate-200"
          />
        ) : (
          <InitialAvatar name={salon?.name || ''} className="w-12 h-12 rounded-full text-lg" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800 truncate text-sm sm:text-base">
            {salon?.name || 'Загрузка...'}
          </h3>
          <span className="text-xs text-slate-400 flex-shrink-0 ml-2 font-medium">
            {formatDate(chat.lastMessageAt)}
          </span>
        </div>
        
        <p className="text-sm text-slate-500 truncate mt-0.5">
          {chat.lastMessagePreview || 'Нет сообщений'}
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
                   Чат по записи
                 </span>
              ) : null}
            </div>
            
            {chat.unreadCount.customer > 0 && (
              <div className="w-5 h-5 bg-rose-600 text-white text-[10px] font-bold rounded-full flex-shrink-0 flex items-center justify-center shadow-sm shadow-rose-200">
                {chat.unreadCount.customer}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}