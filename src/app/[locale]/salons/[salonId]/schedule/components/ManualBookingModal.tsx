"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Calendar, Clock, User, Phone, Shield, ChevronLeft, ChevronRight, X, CheckCircle, Scissors } from "lucide-react"
import { getServiceImages } from "@/lib/firebase/database"
import { useUser } from "@/contexts/UserContext"
import { useSalon } from "@/contexts/SalonContext"
import { useAppointment } from "@/contexts/AppointmentContext"
import { useSalonSchedule } from "@/contexts/SalonScheduleContext"
import { useSalonService } from "@/contexts/SalonServiceContext"
import { useTranslations } from "next-intl"
import { ModalPortal } from '@/components/ui/ModalPortal'

// --- TYPE DEFINITIONS ---
type Service = {
  id: string
  salonId: string
  name: string
  description?: string
  price: number
  durationMinutes: number
}

type TimeSlot = {
  time: string
  available: boolean
  reason?: string
}

type DayAvailabilityStatus = 'loading' | 'available' | 'unavailable' | 'unchecked';

type ManualBookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  salonId: string;
  onBookingSuccess: () => void;
};

export default function ManualBookingModal({ isOpen, onClose, salonId, onBookingSuccess }: ManualBookingModalProps) {
  const params = useParams() as { locale: string };
  const { currentUser } = useUser()
  const t = useTranslations('bookingPage')
  
  // --- CONTEXTS ---
  const { fetchSalon } = useSalon()
  const { isTimeSlotAvailable, createAppointment } = useAppointment()
  const { getSchedule } = useSalonSchedule()
  const { getServicesBySalon } = useSalonService()
  const { getUserById } = useUser()

  // --- COMPONENT STATE ---
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<string | null>(null)

  // Data state
  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string>("")
  const [service, setService] = useState<Service | null>(null)
  const [salon, setSalon] = useState<any>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [salonSchedule, setSalonSchedule] = useState<any>(null)

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [employeeId, setEmployeeId] = useState<string>("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [notes, setNotes] = useState("")

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([])
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [dayAvailability, setDayAvailability] = useState<Record<string, DayAvailabilityStatus>>({});

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!isOpen || !salonId) return;

    let isCancelled = false;
    const loadInitialData = async () => {
      setLoading(true);
      setSubmissionError(null);
      setSuccess(null);
      setService(null);
      setSelectedServiceId("");

      try {
        const [salonData, scheduleData, serviceList] = await Promise.all([
          fetchSalon(salonId),
          getSchedule(salonId),
          getServicesBySalon(salonId)
        ]);

        if (isCancelled) return;

        setSalon(salonData);
        setSalonSchedule(scheduleData);
        setServices(serviceList as Service[]);

      } catch (e: any) {
        if (!isCancelled) {
          setSubmissionError(e.message || t('messages.errorLoading'));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadInitialData();
    return () => { isCancelled = true; };
  }, [isOpen, salonId, fetchSalon, getSchedule, getServicesBySalon, t]);

  useEffect(() => {
    if (!selectedServiceId) {
      setService(null);
      return;
    }

    let isCancelled = false;
    const loadServiceDetails = async () => {
      const selected = services.find(s => s.id === selectedServiceId);
      if (!selected) return;

      if (isCancelled) return;
      setService(selected);
      setPreviewUrl("");

      try {
        const imgs = await getServiceImages(selectedServiceId);
        if (!isCancelled && imgs && imgs.length > 0) {
          setPreviewUrl(imgs[0].url);
        }
      } catch (e) {
        console.warn('Failed to load service images', e);
      }
    };

    loadServiceDetails();
    return () => { isCancelled = true; };
  }, [selectedServiceId, services]);

  // --- CALENDAR & TIME SLOT LOGIC ---
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1))
    
    const days = []
    const currentDate = new Date(startDate)
    
    while (days.length < 42) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }, [currentMonth])

  const isDateWorkingDay = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return false
    if (!salonSchedule?.weeklySchedule) return true
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[date.getDay()]
    const daySchedule = salonSchedule.weeklySchedule.find((d: { day: string }) => d.day === dayName)
    return daySchedule?.isOpen || false
  }

  useEffect(() => {
    if (!salonSchedule || !service || !isTimeSlotAvailable) {
      setDayAvailability({});
      return;
    }

    let isCancelled = false;
    const checkDayHasSlots = async (date: Date): Promise<boolean> => {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[date.getDay()];
      const daySchedule = salonSchedule.weeklySchedule.find((d: { day: string }) => d.day === dayName);

      if (!daySchedule?.isOpen || !Array.isArray(daySchedule.times)) return false;

      for (const timeRange of daySchedule.times) {
        const [startHour] = timeRange.start.split(':').map(Number);
        const [endHour] = timeRange.end.split(':').map(Number);
        let currentHour = startHour;

        while (currentHour < endHour) {
          const slotDate = new Date(date);
          slotDate.setHours(currentHour, 0, 0, 0);

          if (slotDate > new Date()) {
            const isAvailable = await isTimeSlotAvailable(service.salonId, slotDate.toISOString(), service.durationMinutes);
            if (isAvailable) return true;
          }
          currentHour++;
        }
      }
      return false;
    };

    const checkMonthAvailability = async () => {
      const initialAvailability: Record<string, DayAvailabilityStatus> = {};
      const promises: Promise<void>[] = [];

      for (const date of calendarDays) {
        const dateKey = date.toISOString().split('T')[0];
        if (isDateWorkingDay(date)) {
          initialAvailability[dateKey] = 'loading';
          const promise = checkDayHasSlots(date).then(hasSlots => {
            if (!isCancelled) {
              setDayAvailability(prev => ({ ...prev, [dateKey]: hasSlots ? 'available' : 'unavailable' }));
            }
          });
          promises.push(promise);
        } else {
          initialAvailability[dateKey] = 'unavailable';
        }
      }
      
      if (!isCancelled) setDayAvailability(prev => ({ ...prev, ...initialAvailability }));
      await Promise.all(promises);
    };

    checkMonthAvailability();
    return () => { isCancelled = true; };
  }, [calendarDays, salonSchedule, service, isTimeSlotAvailable]);

  const generateTimeSlots = async () => {
    if (!selectedDate || !service || !salonSchedule || !isTimeSlotAvailable) {
      setAvailableTimeSlots([])
      return
    }

    setLoadingTimeSlots(true)
    try {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[selectedDate.getDay()]
      const daySchedule = salonSchedule.weeklySchedule.find((d: { day: string }) => d.day === dayName)
      
      if (!daySchedule?.isOpen || !Array.isArray(daySchedule.times)) {
        setAvailableTimeSlots([])
        return
      }

      const slots: TimeSlot[] = []
      for (const timeRange of daySchedule.times) {
        const [startHour] = timeRange.start.split(':').map(Number)
        const [endHour] = timeRange.end.split(':').map(Number)
        let currentHour = startHour
        
        while (currentHour < endHour) {
          const timeString = `${currentHour.toString().padStart(2, '0')}:00`
          const slotDate = new Date(selectedDate)
          slotDate.setHours(currentHour, 0, 0, 0)
          
          if (slotDate <= new Date()) {
            slots.push({ time: timeString, available: false, reason: 'Время прошло' })
          } else {
            const isAvailable = await isTimeSlotAvailable(service.salonId, slotDate.toISOString(), service.durationMinutes, employeeId || undefined)
            slots.push({ time: timeString, available: isAvailable, reason: isAvailable ? undefined : "Занято" })
          }
          currentHour++
        }
      }
      setAvailableTimeSlots(slots)
    } catch (error) {
      console.error('❌ Error generating time slots:', error)
      setAvailableTimeSlots([])
    } finally {
      setLoadingTimeSlots(false)
    }
  }

  useEffect(() => {
    generateTimeSlots()
  }, [selectedDate, service, salonSchedule, employeeId, isTimeSlotAvailable])

  // --- EMPLOYEE & FORM LOGIC ---
  const employees = useMemo(() => {
    if (!salon) return []
    return (salon.members || []).filter((m: { role: string }) => ["manager", "employee"].includes(m.role))
  }, [salon])

  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({})
  
  useEffect(() => {
    const loadEmployeeNames = async () => {
      if (!employees.length || !getUserById) return
      const names: Record<string, string> = {}
      for (const employee of employees) {
        try {
          const user = await getUserById(employee.userId)
          names[employee.userId] = user?.displayName || employee.userId
        } catch (err) {
          console.warn(`Failed to load user ${employee.userId}:`, err)
          names[employee.userId] = employee.userId
        }
      }
      setEmployeeNames(names)
    }
    loadEmployeeNames()
  }, [employees, getUserById])

  const combineDateTimeToIso = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const combined = new Date(date)
    combined.setHours(hours, minutes, 0, 0)
    return combined.toISOString()
  }

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!selectedServiceId) {
      errors.service = t('fields.serviceErrorRequired');
    }
    if (!customerName.trim()) {
      errors.customerName = t('fields.customerNameErrorRequired');
    }
    if (!customerPhone.trim()) {
      errors.customerPhone = t('fields.customerPhoneErrorRequired');
    } else if (!/^\+?[0-9\s-()]{7,}$/.test(customerPhone)) {
      errors.customerPhone = t('fields.customerPhoneErrorInvalid');
    }
    if (!selectedTime) {
      errors.selectedTime = t('messages.selectTimeRequired');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBook = async () => {
    if (!validateForm() || !service) return;
    
    setSubmitting(true)
    setSubmissionError(null)
    setSuccess(null)
    
    try {
      const startAt = combineDateTimeToIso(selectedDate, selectedTime)
      const ok = await isTimeSlotAvailable(service.salonId, startAt, service.durationMinutes, employeeId || undefined)
      
      if (!ok) {
        setSubmissionError(t('messages.errorSlotTaken'))
        setSubmitting(false)
        generateTimeSlots()
        return
      }

      const appointmentId = Date.now().toString()
      await createAppointment(service.salonId, appointmentId, {
        salonId: service.salonId,
        serviceId: service.id,
        employeeId: employeeId || undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerUserId: undefined,
        startAt,
        durationMinutes: service.durationMinutes,
        status: "confirmed",
        notes: notes || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      setSuccess(t('successMessage'))
      setTimeout(() => {
        onBookingSuccess();
      }, 1500);
    } catch (e: any) {
      setSubmissionError(e.message || t('messages.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  // --- HELPERS & RENDER ---
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString()
  const isSelected = (date: Date) => selectedDate.toDateString() === date.toDateString()

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl max-h-[90vh]"
    >
      {/* Modal Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('modalTitle')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
      </div>

      {/* Modal Content */}
      <div className="overflow-y-auto">
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          </div>
        ) : submissionError ? (
          <div className="p-6 text-center text-red-700">{submissionError}</div>
        ) : (
          <>
            {/* Service Selection */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.serviceLabel')} <span className="text-red-500">*</span></label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-rose-500 focus:border-rose-500 ${formErrors.service ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
              >
                <option value="" disabled>{t('fields.servicePlaceholder')}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} - {s.price} {t('header.currency')}</option>
                ))}
              </select>
              {formErrors.service && <p className="mt-1 text-xs text-red-600">{formErrors.service}</p>}
            </div>

            {/* Dynamic Content Area */}
            {service ? (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    <Image src={previewUrl || "/placeholder.svg"} alt={service.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{service.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{salon.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{service.durationMinutes} {t('header.minutes')}</span>
                    </div>
                  </div>
                  <div className="text-rose-600 font-bold">{service.price} {t('header.currency')}</div>
                </div>

                <div className="p-3 sm:p-4 space-y-6">
                  {success && (
                    <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <CheckCircle className="w-4 h-4" />
                      <span>{success}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calendar */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('calendar.title')} <span className="text-red-500">*</span></h3>
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="font-medium">{currentMonth.toLocaleDateString(params.locale, { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {t.raw('calendar.daysOfWeek').map((day: string) => <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">{day}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date) => {
                          const dateKey = date.toISOString().split('T')[0];
                          const status = dayAvailability[dateKey];
                          const isAvailableForBooking = status === 'available';
                          return (
                            <button
                              key={dateKey}
                              onClick={() => { if (isAvailableForBooking) setSelectedDate(date) }}
                              disabled={!isAvailableForBooking}
                              className={`p-2 text-sm rounded-lg transition-colors border ${date.getMonth() === currentMonth.getMonth() ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'} ${status === 'loading' ? 'opacity-50' : ''} ${isToday(date) ? 'border-blue-500' : 'border-transparent'} ${isSelected(date) ? 'bg-rose-600 text-white font-bold ring-2 ring-rose-300' : ''} ${isAvailableForBooking ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 font-semibold hover:bg-green-100 dark:hover:bg-green-900/40' : 'bg-gray-50 dark:bg-gray-800/50'} ${!isAvailableForBooking ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : ''} ${isSelected(date) && isAvailableForBooking ? 'bg-rose-600 text-white' : ''}`}
                            >
                              {date.getDate()}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Time Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('timeSelector.title')} <span className="text-red-500">*</span></h3>
                      {formErrors.selectedTime && <p className="mb-2 text-sm text-red-600">{formErrors.selectedTime}</p>}
                      {loadingTimeSlots ? (
                        <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600 mx-auto"></div></div>
                      ) : availableTimeSlots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-2">
                          {availableTimeSlots.map((slot, index) => (
                            <button
                              key={index}
                              onClick={() => { if (slot.available) setSelectedTime(slot.time) }}
                              disabled={!slot.available}
                              className={`p-3 text-sm rounded-lg border transition-colors ${slot.available ? (selectedTime === slot.time ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:border-rose-400') : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'}`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><p>{t('timeSelector.noSlots')}</p></div>
                      )}
                    </div>
                  </div>

                  {/* Other Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.staffLabel')}</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 focus:ring-rose-500 focus:border-rose-500">
                          <option value="">{t('fields.staffAny')}</option>
                          {employees.map((m: { userId: string }) => <option key={m.userId} value={m.userId}>{employeeNames[m.userId] || m.userId}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.customerNameLabel')} <span className="text-red-500">*</span></label>
                      <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${formErrors.customerName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} required />
                      {formErrors.customerName && <p className="mt-1 text-xs text-red-600">{formErrors.customerName}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.customerPhoneLabel')} <span className="text-red-500">*</span></label>
                      <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${formErrors.customerPhone ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} required />
                      {formErrors.customerPhone && <p className="mt-1 text-xs text-red-600">{formErrors.customerPhone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.notesLabel')}</label>
                      <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium" disabled={submitting}>{t('buttons.cancel')}</button>
                    <button onClick={handleBook} disabled={submitting} className="px-5 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50">{submitting ? t('buttons.submitting') : t('buttons.bookNow')}</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Scissors className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>{t('messages.selectServicePrompt')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </ModalPortal>
  )
}