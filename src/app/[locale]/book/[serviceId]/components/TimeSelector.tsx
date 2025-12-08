"use client"

import { Calendar } from "lucide-react"

type TimeSlot = {
  displayTime: string
  startTime: string
  available: boolean
  reason?: string
}

type TimeSelectorProps = {
  selectedDate: Date
  salon: any
  salonSchedule: any
  loadingTimeSlots: boolean
  availableTimeSlots: TimeSlot[]
  selectedTime: string
  formErrors: Record<string, string>
  t: any
  onTimeSelect: (time: string) => void
  onClearError: (field: string) => void
}

export default function TimeSelector({
  selectedDate,
  salon,
  salonSchedule,
  loadingTimeSlots,
  availableTimeSlots,
  selectedTime,
  formErrors,
  t,
  onTimeSelect,
  onClearError
}: TimeSelectorProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('timeSelector.title')} <span className="text-red-500">*</span>
      </h3>
      
      {formErrors.selectedTime && (
        <p className="mb-2 text-sm text-red-600">{formErrors.selectedTime}</p>
      )}

      {selectedDate && salonSchedule ? (
        <div>
          <div className="text-sm text-gray-600 mb-3">
            {formatDate(selectedDate)} • {salon?.name || ''}
          </div>
          
          {loadingTimeSlots ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : availableTimeSlots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-2">
              {availableTimeSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => { 
                    if (slot.available) {
                      onTimeSelect(slot.startTime);
                      if (formErrors.selectedTime) {
                        onClearError('selectedTime');
                      }
                    }
                  }}
                  disabled={!slot.available}
                  className={`
                    p-3 text-sm rounded-lg border transition-colors
                    ${slot.available 
                      ? selectedTime === slot.startTime
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-rose-400 hover:bg-rose-50'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }
                  `}
                  title={slot.reason || `${t('timeSelector.slotLabel')}: ${slot.displayTime}`}
                >
                  {slot.displayTime}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p>{t('timeSelector.noSlots')}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p>{t('timeSelector.selectDatePrompt')}</p>
        </div>
      )}
    </div>
  )
}
