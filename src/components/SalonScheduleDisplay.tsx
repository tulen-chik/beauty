import { Calendar,Clock } from 'lucide-react';
import React from 'react';

import type { SalonSchedule, WeekDay } from '@/types/database';

interface SalonScheduleDisplayProps {
  schedule: SalonSchedule;
  className?: string;
}

const dayNames: Record<WeekDay, string> = {
  monday: 'Понедельник',
  tuesday: 'Вторник',
  wednesday: 'Среда',
  thursday: 'Четверг',
  friday: 'Пятница',
  saturday: 'Суббота',
  sunday: 'Воскресенье'
};

const shortDayNames: Record<WeekDay, string> = {
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
  if (!schedule || !schedule.weeklySchedule || schedule.weeklySchedule.length === 0) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p>Расписание не настроено</p>
      </div>
    );
  }

  // Sort days according to the week order
  const weekOrder: WeekDay[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 
    'friday', 'saturday', 'sunday'
  ];
  
  const sortedSchedule = [...schedule.weeklySchedule].sort(
    (a, b) => weekOrder.indexOf(a.day) - weekOrder.indexOf(b.day)
  );

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Clock className="w-4 h-4" />
        <span>Режим работы</span>
      </div>
      
      <div className="space-y-2">
        {sortedSchedule.map((day) => (
          <div key={day.day} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 w-24">
              {shortDayNames[day.day]}
            </span>
            
            {day.isOpen && day.times && day.times.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {day.times.map((time, index) => (
                  <span key={index} className="text-gray-800 font-medium whitespace-nowrap">
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