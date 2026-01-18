"use client"

import { ArrowLeft, Calendar, CheckCircle, Clock } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { getServiceImages } from "@/lib/firebase/database"

import { SalonScheduleDisplay } from "@/components/SalonScheduleDisplay"

import { useAppointment } from "@/contexts/AppointmentContext"
import { useSalon } from "@/contexts/SalonContext"
import { useSalonSchedule } from "@/contexts/SalonScheduleContext"
import { useSalonService } from "@/contexts/SalonServiceContext"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/contexts"

import BookingHeader from "./components/BookingHeader"
import BookingCalendar from "./components/BookingCalendar"
import TimeSelector from "./components/TimeSelector"
import BookingForm from "./components/BookingForm"
import BookingActions from "./components/BookingActions"

// --- HELPER FUNCTION TO FIX TIMEZONE ISSUE ---
const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};


// --- SKELETON COMPONENT ---
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
  const { success, error: showError, dismissAll } = useToast()
  const t = useTranslations('bookingPage')
  
  const { fetchSalon } = useSalon()
  const { isTimeSlotAvailable, createAppointment } = useAppointment()
  const { getSchedule, getEffectiveSchedule } = useSalonSchedule()
  const { getService } = useSalonService()
  const { getUserById } = useUser()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

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
        
        if (!getService || !fetchSalon || !getSchedule) {
          showError(t('messages.errorContext'))
          setLoading(false)
          return
        }
        
        const svc = await getService(serviceId)
        if (!svc) {
          showError(t('messages.errorServiceNotFound'))
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
        if (!isCancelled) showError(e.message || t('messages.errorLoading'))
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

  const isDateWorkingDay = async (date: Date): Promise<boolean> => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return false
    
    if (!service) return false;
    
    const dateStr = toLocalDateString(date);
    const daySchedule = await getEffectiveSchedule(service.salonId, dateStr)
    return daySchedule?.isOpen || false
  }

  // --- ИЗМЕНЕНИЕ: Оптимизированный useEffect для проверки доступности дней ---
  useEffect(() => {
    if (!salonSchedule || !service || !isTimeSlotAvailable) {
      setDayAvailability({});
      return;
    }

    let isCancelled = false;

    const checkDayHasSlots = async (date: Date): Promise<boolean> => {
      const dateStr = toLocalDateString(date);
      const daySchedule = await getEffectiveSchedule(service.salonId, dateStr);

      if (!daySchedule?.isOpen || !Array.isArray(daySchedule.times)) {
        return false;
      }

      for (const timeRange of daySchedule.times) {
        const [startHour, startMinute] = timeRange.start.split(':').map(Number);
        const [endHour, endMinute] = timeRange.end.split(':').map(Number);
        
        const rangeStart = new Date(date);
        rangeStart.setHours(startHour, startMinute, 0, 0);
        
        const rangeEnd = new Date(date);
        rangeEnd.setHours(endHour, endMinute, 0, 0);

        let currentTime = new Date(rangeStart);

        while (currentTime.getTime() + service.durationMinutes * 60000 <= rangeEnd.getTime()) {
          if (currentTime > new Date()) {
            const isAvailable = await isTimeSlotAvailable(
              service.salonId,
              currentTime.toISOString(),
              service.durationMinutes
            );
            if (isAvailable) return true;
          }
          currentTime.setMinutes(currentTime.getMinutes() + 15);
        }
      }
      return false;
    };

    const checkMonthAvailability = () => {
      const initialStates: Record<string, DayAvailabilityStatus> = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      calendarDays.forEach(date => {
        const dateKey = toLocalDateString(date);
        if (date < today) {
          initialStates[dateKey] = 'unavailable';
        } else {
          initialStates[dateKey] = 'loading';
        }
      });
      if (!isCancelled) {
        setDayAvailability(initialStates);
      }

      calendarDays.forEach(async (date) => {
        const dateKey = toLocalDateString(date);
        if (date < today) return;

        const isWorking = await isDateWorkingDay(date);
        if (isCancelled) return;

        if (isWorking) {
          const hasSlots = await checkDayHasSlots(date);
          if (isCancelled) return;
          setDayAvailability(prev => ({ ...prev, [dateKey]: hasSlots ? 'available' : 'unavailable' }));
        } else {
          setDayAvailability(prev => ({ ...prev, [dateKey]: 'unavailable' }));
        }
      });
    };

    checkMonthAvailability();

    return () => {
      isCancelled = true;
    };
  }, [calendarDays, salonSchedule, service, isTimeSlotAvailable, getEffectiveSchedule]);

  const generateTimeSlots = async () => {
    if (!selectedDate || !service || !salonSchedule || !isTimeSlotAvailable) {
      setAvailableTimeSlots([])
      return
    }

    setLoadingTimeSlots(true)
    try {
      const dateStr = toLocalDateString(selectedDate);
      const daySchedule = await getEffectiveSchedule(service.salonId, dateStr)
      
      if (!daySchedule?.isOpen || !Array.isArray(daySchedule.times)) {
        setAvailableTimeSlots([])
        return
      }

      const slotPromises: Promise<TimeSlot>[] = [];
      const serviceDuration = service.durationMinutes;
      const now = new Date();
      
      for (const timeRange of daySchedule.times) {
        const [startHour, startMinute] = timeRange.start.split(':').map(Number);
        const [endHour, endMinute] = timeRange.end.split(':').map(Number);

        const rangeStart = new Date(selectedDate);
        rangeStart.setHours(startHour, startMinute, 0, 0);

        const rangeEnd = new Date(selectedDate);
        rangeEnd.setHours(endHour, endMinute, 0, 0);
        
        let currentTime = new Date(rangeStart);
        
        while (currentTime.getTime() + serviceDuration * 60000 <= rangeEnd.getTime()) {
          const slotTime = new Date(currentTime);
          
          if (slotTime > now) {
            const promise = isTimeSlotAvailable(
              service.salonId,
              slotTime.toISOString(),
              serviceDuration,
              employeeId || undefined
            ).then(isAvailable => {
              const endTime = new Date(slotTime.getTime() + serviceDuration * 60000);
              const startTimeString = formatTime(slotTime);
              const endTimeString = formatTime(endTime);
              const displayTimeString = `${startTimeString} - ${endTimeString}`;

              return {
                displayTime: displayTimeString,
                startTime: startTimeString,
                available: isAvailable,
                reason: isAvailable ? undefined : "Занято"
              };
            });
            slotPromises.push(promise);
          }
          
          currentTime.setMinutes(currentTime.getMinutes() + 15);
        }
      }
      
      const resolvedSlots = await Promise.all(slotPromises);
      const uniqueSlots = resolvedSlots.filter((slot, index, self) =>
          index === self.findIndex((s) => s.startTime === slot.startTime)
      ).sort((a, b) => a.startTime.localeCompare(b.startTime));

      setAvailableTimeSlots(uniqueSlots);

    } catch (error) {
      console.error('❌ Error generating time slots:', error)
      setAvailableTimeSlots([])
    } finally {
      setLoadingTimeSlots(false)
    }
  }

  useEffect(() => {
    generateTimeSlots()
  }, [selectedDate, service, salonSchedule, employeeId, isTimeSlotAvailable, getEffectiveSchedule])

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
    dismissAll()
    
    try {
      const startAt = combineDateTimeToIso(selectedDate, selectedTime)
      
      const ok = await isTimeSlotAvailable(
        service!.salonId,
        startAt,
        service!.durationMinutes,
        employeeId || undefined
      )
      
      if (!ok) {
        showError(t('messages.errorSlotTaken'))
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

      success(t('successMessage'))
      setTimeout(() => router.push('/profile'), 2000)
    } catch (e: any) {
      console.error(e)
      showError(e.message || t('messages.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  
  if (loading) {
    return <BookServicePageSkeleton />;
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <div className="text-red-600 font-semibold mb-2">{t('errorTitle')}</div>
          <div className="text-gray-700 mb-4">{t('messages.errorServiceNotFound')}</div>
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
          <BookingHeader 
            service={service}
            salon={salon}
            previewUrl={previewUrl}
            t={t}
          />

          <div className="p-3 sm:p-4 space-y-6">

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
              <div className="bg-gray-100 rounded-lg p-4 h-24 animate-pulse"></div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BookingCalendar
                currentMonth={currentMonth}
                calendarDays={calendarDays}
                selectedDate={selectedDate}
                dayAvailability={dayAvailability}
                locale={params.locale}
                t={t}
                onMonthChange={setCurrentMonth}
                onDateSelect={setSelectedDate}
              />

              <TimeSelector
                selectedDate={selectedDate}
                salon={salon}
                salonSchedule={salonSchedule}
                loadingTimeSlots={loadingTimeSlots}
                availableTimeSlots={availableTimeSlots}
                selectedTime={selectedTime}
                formErrors={formErrors}
                t={t}
                onTimeSelect={setSelectedTime}
                onClearError={(field) => setFormErrors(prev => ({ ...prev, [field]: '' }))}
              />
            </div>

            <BookingForm
              employeeId={employeeId}
              customerName={customerName}
              customerPhone={customerPhone}
              notes={notes}
              employees={employees}
              employeeNames={employeeNames}
              currentUser={currentUser}
              formErrors={formErrors}
              t={t}
              onEmployeeChange={setEmployeeId}
              onCustomerNameChange={setCustomerName}
              onCustomerPhoneChange={setCustomerPhone}
              onNotesChange={setNotes}
              onClearError={(field) => setFormErrors(prev => ({ ...prev, [field]: '' }))}
            />

            <BookingActions
              currentUser={currentUser}
              salon={salon}
              serviceId={serviceId}
              submitting={submitting}
              t={t}
              onCancel={() => router.back()}
              onSubmit={handleBook}
            />
          </div>
        </div>
      </div>
    </div>
  )
}