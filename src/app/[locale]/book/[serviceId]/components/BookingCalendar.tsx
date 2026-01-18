"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

// --- HELPER FUNCTION TO FIX TIMEZONE ISSUE ---
/**
 * Converts a Date object to a 'YYYY-MM-DD' string in the local timezone.
 * This avoids the UTC conversion issue from toISOString().
 */
const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type DayAvailabilityStatus = 'loading' | 'available' | 'unavailable' | 'unchecked';

type BookingCalendarProps = {
  currentMonth: Date
  calendarDays: Date[]
  selectedDate: Date
  dayAvailability: Record<string, DayAvailabilityStatus>
  locale: string
  t: any
  onMonthChange: (date: Date) => void
  onDateSelect: (date: Date) => void
}

export default function BookingCalendar({
  currentMonth,
  calendarDays,
  selectedDate,
  dayAvailability,
  locale,
  t,
  onMonthChange,
  onDateSelect
}: BookingCalendarProps) {
  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate.toDateString() === date.toDateString()
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('calendar.title')} <span className="text-red-500">*</span>
      </h3>
      
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-medium">
          {currentMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {t.raw('calendar.daysOfWeek').map((day: string) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          // FIX: Use timezone-safe date string for the key
          const dateKey = toLocalDateString(date);
          const status = dayAvailability[dateKey];
          const isAvailable = status === 'available';
          const isLoading = status === 'loading';
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const isSelectedDay = isSelected(date);
          const isTodayDay = isToday(date);

          return (
            <button
              key={dateKey}
              onClick={() => { if (isAvailable) onDateSelect(date) }}
              disabled={!isAvailable}
              className={`
                relative h-10 w-full rounded-lg text-sm font-medium transition-all duration-200
                flex items-center justify-center
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isSelectedDay ? 'bg-rose-600 text-white shadow-md shadow-rose-200 scale-105 z-10' : ''}
                ${!isSelectedDay && isAvailable ? 'hover:bg-rose-50 text-gray-700 hover:text-rose-700' : ''}
                ${!isSelectedDay && !isAvailable ? 'text-gray-400 cursor-not-allowed' : ''}
                ${isTodayDay && !isSelectedDay ? 'ring-1 ring-rose-300 text-rose-600 font-bold' : ''}
                ${isLoading ? 'animate-pulse bg-gray-100 cursor-wait' : ''}
              `}
            >
              {isLoading ? (
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              ) : (
                date.getDate()
              )}
              
              {isAvailable && !isSelectedDay && (
                <span className="absolute bottom-1.5 w-1 h-1 bg-emerald-400 rounded-full"></span>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-4 h-4 rounded-full bg-white ring-1 ring-gray-300">
             <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>
          </div>
          <span>- {t('calendar.legendAvailable')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[8px]">
            {new Date().getDate()}
          </div>
          <span>- {t('calendar.legendUnavailable')}</span>
        </div>
      </div>
    </div>
  )
}