"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

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
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
          const dateKey = date.toISOString().split('T')[0];
          const status = dayAvailability[dateKey];
          const isAvailableForBooking = status === 'available';

          return (
            <button
              key={dateKey}
              onClick={() => { if (isAvailableForBooking) onDateSelect(date) }}
              disabled={!isAvailableForBooking}
              className={`
                p-2 text-sm rounded-lg transition-colors border
                ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                ${status === 'loading' ? 'opacity-50' : ''}
                ${isToday(date) ? 'border-blue-500' : 'border-transparent'}
                ${isSelected(date) ? 'bg-rose-600 text-white font-bold ring-2 ring-rose-300' : ''}
                
                ${isAvailableForBooking 
                  ? 'bg-green-50 border-green-200 font-semibold hover:bg-green-100' 
                  : 'bg-gray-50'
                }
                
                ${!isAvailableForBooking ? 'text-gray-400 cursor-not-allowed' : ''}
                ${isSelected(date) && isAvailableForBooking ? 'bg-rose-600 text-white' : ''}
              `}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-100 border border-green-200"></div><span>- {t('calendar.legendAvailable')}</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-50"></div><span>- {t('calendar.legendUnavailable')}</span></div>
      </div>
    </div>
  )
}
