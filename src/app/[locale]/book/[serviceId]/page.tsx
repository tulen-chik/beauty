"use client"

import { ArrowLeft, Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, Shield, User } from "lucide-react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { getServiceImages } from "@/lib/firebase/database"

import ChatButton from "@/components/ChatButton"
import { SalonScheduleDisplay } from "@/components/SalonScheduleDisplay"
// --- ИЗМЕНЕНИЕ: УДАЛЕНЫ ИМПОРТЫ СПИННЕРОВ ---
// import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
// import { LoadingSpinnerSmall } from "@/components/ui/LoadingSpinnerSmall"

import { useAppointment } from "@/contexts/AppointmentContext"
import { useSalon } from "@/contexts/SalonContext"
import { useSalonSchedule } from "@/contexts/SalonScheduleContext"
import { useSalonService } from "@/contexts/SalonServiceContext"
import { useUser } from "@/contexts/UserContext"

// --- НАЧАЛО: НОВЫЙ КОМПОНЕНТ SKELETON ---

const BookServicePageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Header Skeleton */}
          <div className="p-4 border-b border-gray-200 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 w-3/4 bg-gray-300 rounded"></div>
              <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
            </div>
            <div className="h-6 w-16 bg-gray-300 rounded"></div>
          </div>

          {/* Form Skeleton */}
          <div className="p-3 sm:p-4 space-y-6">
            {/* Schedule Display Skeleton */}
            <div className="bg-gray-100 rounded-lg p-4 h-24"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar Skeleton */}
              <div>
                <div className="h-7 w-1/2 bg-gray-300 rounded-lg mb-4"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 h-8 w-8 bg-gray-200 rounded-lg"></div>
                  <div className="h-5 w-1/3 bg-gray-200 rounded"></div>
                  <div className="p-2 h-8 w-8 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {[...Array(42)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded-lg"></div>
                  ))}
                </div>
              </div>

              {/* Time Selection Skeleton */}
              <div>
                <div className="h-7 w-1/2 bg-gray-300 rounded-lg mb-4"></div>
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-3"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Other Form Fields Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>

            {/* Buttons Skeleton */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
              <div className="h-10 w-36 bg-gray-300 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- КОНЕЦ: НОВЫЕ КОМПОНЕНТЫ SKELETON ---

type Service = {
  id: string
  salonId: string
  name: string
  description?: string
  price: number
  durationMinutes: number
}

type TimeSlot = {
  displayTime: string
  startTime: string
  available: boolean
  reason?: string
}

type DayAvailabilityStatus = 'loading' | 'available' | 'unavailable' | 'unchecked';

const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};


export default function BookServicePage() {
  const params = useParams() as { serviceId: string; locale: string }
  const router = useRouter()
  const { serviceId } = params
  const { currentUser } = useUser()
  const t = useTranslations('bookingPage')
  
  const { fetchSalon } = useSalon()
  const { isTimeSlotAvailable, createAppointment } = useAppointment()
  const { getSchedule } = useSalonSchedule()
  const { getService } = useSalonService()
  const { getUserById } = useUser()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<string | null>(null)

  const [service, setService] = useState<Service | null>(null)
  const [salon, setSalon] = useState<any>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [salonSchedule, setSalonSchedule] = useState<any>(null)

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [employeeId, setEmployeeId] = useState<string>("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.displayName || "")
    }
  }, [currentUser])

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([])
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [dayAvailability, setDayAvailability] = useState<Record<string, DayAvailabilityStatus>>({});

  useEffect(() => {
    let isCancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setSubmissionError(null)
        
        if (!getService || !fetchSalon || !getSchedule) {
          setSubmissionError(t('messages.errorContext'))
          setLoading(false)
          return
        }
        
        const svc = await getService(serviceId)
        if (!svc) {
          setSubmissionError(t('messages.errorServiceNotFound'))
          setLoading(false)
          return
        }
        
        const s: Service = { id: serviceId, ...(svc as any) }
        if (isCancelled) return
        setService(s)

        try {
          const imgs = await getServiceImages(serviceId)
          if (!isCancelled && imgs && imgs.length > 0) setPreviewUrl(imgs[0].url)
        } catch (e) {
          console.warn('Failed to load service images', e)
        }

        const salonData = await fetchSalon(s.salonId)
        if (!isCancelled) setSalon(salonData)

        try {
          const schedule = await getSchedule(s.salonId)
          if (!isCancelled) setSalonSchedule(schedule)
        } catch (e) {
          console.error('❌ Error loading schedule:', e)
        }
        
      } catch (e: any) {
        if (!isCancelled) setSubmissionError(e.message || t('messages.errorLoading'))
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }
    load()
    return () => {
      isCancelled = true
    }
  }, [serviceId, getService, fetchSalon, getSchedule, t])

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
      return;
    }

    let isCancelled = false;

    const checkDayHasSlots = async (date: Date): Promise<boolean> => {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[date.getDay()];
      const daySchedule = salonSchedule.weeklySchedule.find((d: { day: string }) => d.day === dayName);

      if (!daySchedule?.isOpen || !Array.isArray(daySchedule.times)) {
        return false;
      }

      for (const timeRange of daySchedule.times) {
        const [startHour] = timeRange.start.split(':').map(Number);
        const [endHour] = timeRange.end.split(':').map(Number);
        let currentHour = startHour;

        while (currentHour < endHour) {
          const slotDate = new Date(date);
          slotDate.setHours(currentHour, 0, 0, 0);

          if (slotDate > new Date()) {
            const isAvailable = await isTimeSlotAvailable(
              service.salonId,
              slotDate.toISOString(),
              service.durationMinutes
            );
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
              setDayAvailability(prev => ({
                ...prev,
                [dateKey]: hasSlots ? 'available' : 'unavailable'
              }));
            }
          });
          promises.push(promise);
        } else {
          initialAvailability[dateKey] = 'unavailable';
        }
      }
      
      if (!isCancelled) {
        setDayAvailability(prev => ({ ...prev, ...initialAvailability }));
      }

      await Promise.all(promises);
    };

    checkMonthAvailability();

    return () => {
      isCancelled = true;
    };
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
      const serviceDuration = service.durationMinutes;
      
      for (const timeRange of daySchedule.times) {
        const [startHour] = timeRange.start.split(':').map(Number)
        const [endHour] = timeRange.end.split(':').map(Number)
        
        let currentHour = startHour
        
        while (currentHour < endHour) {
          const slotDate = new Date(selectedDate)
          slotDate.setHours(currentHour, 0, 0, 0)

          const endDate = new Date(slotDate.getTime() + serviceDuration * 60000);
          
          const startTimeString = formatTime(slotDate);
          const endTimeString = formatTime(endDate);
          const displayTimeString = `${startTimeString} - ${endTimeString}`;
          
          if (slotDate <= new Date()) {
            slots.push({ 
              displayTime: displayTimeString, 
              startTime: startTimeString, 
              available: false, 
              reason: 'Время прошло' 
            })
          } else {
            const isAvailable = await isTimeSlotAvailable(
              service.salonId,
              slotDate.toISOString(),
              serviceDuration,
              employeeId || undefined
            )
            
            slots.push({
              displayTime: displayTimeString,
              startTime: startTimeString,
              available: isAvailable,
              reason: isAvailable ? undefined : "Занято"
            })
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
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true)
    setSubmissionError(null)
    setSuccess(null)
    
    try {
      const startAt = combineDateTimeToIso(selectedDate, selectedTime)
      
      const ok = await isTimeSlotAvailable(
        service!.salonId,
        startAt,
        service!.durationMinutes,
        employeeId || undefined
      )
      
      if (!ok) {
        setSubmissionError(t('messages.errorSlotTaken'))
        setSubmitting(false)
        generateTimeSlots()
        return
      }

      const appointmentId = Date.now().toString()

      const appointmentData: any = {
        salonId: service!.salonId,
        serviceId: service!.id,
        startAt,
        durationMinutes: service!.durationMinutes,
        status: "confirmed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (employeeId) {
        appointmentData.employeeId = employeeId;
      }
      if (customerName) {
        appointmentData.customerName = customerName;
      }
      if (customerPhone) {
        appointmentData.customerPhone = customerPhone;
      }
      if (currentUser?.userId) {
        appointmentData.customerUserId = currentUser.userId;
      }
      if (notes) {
        appointmentData.notes = notes;
      }
      
      await createAppointment(service!.salonId, appointmentId, appointmentData)

      setSuccess(t('successMessage'))
    } catch (e: any) {
      console.error(e)
      setSubmissionError(e.message || t('messages.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(params.locale, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate.toDateString() === date.toDateString()
  }

  // --- ИЗМЕНЕНИЕ: ЗАМЕНА СПИННЕРА НА SKELETON ---
  if (loading) {
    return <BookServicePageSkeleton />;
  }

  if (submissionError && !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <div className="text-red-600 font-semibold mb-2">{t('errorTitle')}</div>
          <div className="text-gray-700 mb-4">{submissionError}</div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
          >
            {t('backButton')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              <Image src={previewUrl || "/placeholder.svg"} alt={service?.name || "service"} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-gray-900">{service?.name}</div>
              {salon && (
                <div className="text-sm text-gray-600">{salon.name}{salon.address ? ` • ${salon.address}` : ""}</div>
              )}
              {service?.durationMinutes && (
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{service.durationMinutes} {t('header.minutes')}</span>
                </div>
              )}
            </div>
            {service?.price !== undefined && (
              <div className="text-rose-600 font-bold">{service.price} {"Br"}</div>
            )}
          </div>

          {/* Form */}
          <div className="p-3 sm:p-4 space-y-6">
            {success && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-lg p-3">
                <CheckCircle className="w-4 h-4" />
                <span>{success}</span>
              </div>
            )}
            {submissionError && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3">{submissionError}</div>
            )}

            {salonSchedule && salonSchedule.weeklySchedule && salonSchedule.weeklySchedule.length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <SalonScheduleDisplay schedule={salonSchedule} />
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {t('scheduleInfo')}
                  </div>
                </div>
              </div>
            ) : !loading && (
              // --- ИЗМЕНЕНИЕ: ЗАМЕНА СПИННЕРА НА SKELETON ---
              <div className="bg-gray-100 rounded-lg p-4 h-24 animate-pulse"></div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('calendar.title')} <span className="text-red-500">*</span>
                </h3>
                
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-medium">
                    {currentMonth.toLocaleDateString(params.locale, { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
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
                        onClick={() => { if (isAvailableForBooking) setSelectedDate(date) }}
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

              {/* Time Selection */}
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
                      // --- ИЗМЕНЕНИЕ: ЗАМЕНА СПИННЕРА НА SKELETON ---
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
                                setSelectedTime(slot.startTime);
                                if (formErrors.selectedTime) {
                                  setFormErrors(prev => ({ ...prev, selectedTime: '' }));
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
            </div>

            {/* Other Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.staffLabel')}</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500"
                  >
                    <option value="">{t('fields.staffAny')}</option>
                    {employees.map((m: { userId: string }) => (
                      <option key={m.userId} value={m.userId}>
                        {employeeNames[m.userId] || m.userId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('fields.customerNameLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (formErrors.customerName) {
                      setFormErrors(prev => ({ ...prev, customerName: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500 ${formErrors.customerName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder={t('fields.customerNamePlaceholder')}
                  required
                />
                {formErrors.customerName ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.customerName}</p>
                ) : currentUser ? (
                  <p className="mt-1 text-xs text-green-600">{t('fields.autofillMessage')}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {"+375 (29) 123-45-67"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (formErrors.customerPhone) {
                      setFormErrors(prev => ({ ...prev, customerPhone: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500 ${formErrors.customerPhone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder={"+375 (29) 123-45-67"}
                  required
                />
                {formErrors.customerPhone && <p className="mt-1 text-xs text-red-600">{formErrors.customerPhone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.notesLabel')}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500"
                  placeholder={t('fields.notesPlaceholder')}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {currentUser && salon && (
                <ChatButton
                  salonId={salon.id}
                  customerUserId={currentUser.userId}
                  customerName={currentUser.displayName || ""}
                  serviceId={serviceId}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
                  variant="button"
                />
              )}
              <button
                onClick={() => router.back()}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
                disabled={submitting}
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={handleBook}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t('buttons.submitting') : t('buttons.bookNow')}
              </button>
            </div>

            <div className="pt-2 text-xs text-gray-500 flex items-center gap-2">
              <Shield className="w-3 h-3" />
              <span>{t('messages.privacyNotice')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}