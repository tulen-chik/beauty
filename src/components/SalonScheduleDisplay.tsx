import React from 'react';
import { Clock, Calendar } from 'lucide-react';
import type { SalonSchedule } from '@/types/database';

interface SalonScheduleDisplayProps {
  schedule: SalonSchedule;
  className?: string;
}

const dayNames = {
  monday: 'Понедельник',
  tuesday: 'Вторник',
  wednesday: 'Среда',
  thursday: 'Четверг',
  friday: 'Пятница',
  saturday: 'Суббота',
  sunday: 'Воскресенье'
};

const shortDayNames = {
  monday: 'Пн',
  tuesday: 'Вт',
  wednesday: 'Ср',
  thursday: 'Чт',
  friday: 'Пт',
  saturday: 'Сб',
  sunday: 'Вс'
};

export const SalonScheduleDisplay: React.FC<SalonScheduleDisplayProps> = ({ 
  schedule, 
  className = "" 
}) => {
  if (!schedule || !schedule.weeks || schedule.weeks.length === 0) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p>Расписание не настроено</p>
      </div>
    );
  }

  // Use the first week as default schedule
  const weekSchedule = schedule.weeks[0];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Clock className="w-4 h-4" />
        <span>Режим работы</span>
      </div>
      
      <div className="space-y-2">
        {weekSchedule.map((day) => (
          <div key={day.day} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 w-24">
              {shortDayNames[day.day as keyof typeof shortDayNames] || day.day}
            </span>
            
            {day.isOpen ? (
              <div className="flex items-center gap-2">
                {day.times.map((time, index) => (
                  <span key={index} className="text-gray-800 font-medium">
                    {time.start} - {time.end}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400">Закрыто</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 