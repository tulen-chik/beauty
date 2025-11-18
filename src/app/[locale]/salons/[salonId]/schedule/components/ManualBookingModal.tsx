"use client"

import { 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Scissors, 
  User, 
  X, 
  Calendar as CalendarIcon,
  Phone,
  FileText,
  AlertCircle,
  Loader2
} from "lucide-react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { getServiceImages } from "@/lib/firebase/database"
import { ModalPortal } from '@/components/ui/ModalPortal'

import { useAppointment } from "@/contexts/AppointmentContext"
import { useSalon } from "@/contexts/SalonContext"
import { useSalonSchedule } from "@/contexts/SalonScheduleContext"
import { useSalonService } from "@/contexts/SalonServiceContext"
import { useUser } from "@/contexts/UserContext"

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

      if (employeeId) appointmentData.employeeId = employeeId;
      if (customerName) appointmentData.customerName = customerName;
      if (customerPhone) appointmentData.customerPhone = customerPhone;
      if (currentUser?.userId) appointmentData.customerUserId = currentUser.userId;
      if (notes) appointmentData.notes = notes;
      
      await createAppointment(service!.salonId, appointmentId, appointmentData)

      setSuccess(t('successMessage'))
      if (onBookingSuccess) {
        setTimeout(() => {
          onBookingSuccess();
          onClose();
        }, 1500);
      }
    } catch (e: any) {
      console.error(e)
      setSubmissionError(e.message || t('messages.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  // --- HELPERS & RENDER ---
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString()
  const isSelected = (date: Date) => selectedDate.toDateString() === date.toDateString()

  // Safe access to days of week
  const daysOfWeek = (t.raw('calendar.daysOfWeek') as string[]) || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl max-h-[90vh] w-full"
    >
      {/* Modal Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-900">{t('modalTitle')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <X className="w-5 h-5" />
          </button>
      </div>

      {/* Modal Content */}
      <div className="overflow-y-auto p-6 bg-white">
        {loading ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-10 w-10 animate-spin mb-3 text-rose-600" />
            <p>Загрузка данных...</p>
          </div>
        ) : submissionError ? (
          <div className="p-6 text-center bg-red-50 rounded-xl border border-red-100">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium">{submissionError}</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* 1. Service Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">
                {t('fields.serviceLabel')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Scissors className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all cursor-pointer ${formErrors.service ? 'border-red-300 focus:ring-red-200' : 'border-slate-200'}`}
                >
                  <option value="" disabled>{t('fields.servicePlaceholder')}</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.price} Br</option>
                  ))}
                </select>
              </div>
              {formErrors.service && <p className="text-xs text-red-500 font-medium ml-1">{formErrors.service}</p>}
            </div>

            {/* Selected Service Card */}
            {service ? (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-rose-50 to-white border border-rose-100 rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{service.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-rose-500" />
                        <span>{service.durationMinutes} мин</span>
                      </div>
                      <div className="font-bold text-rose-600 text-base">
                        {service.price} Br
                      </div>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="mt-6 flex items-center gap-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 animate-in zoom-in-95">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium">{success}</span>
                  </div>
                )}
                
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Calendar */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-rose-500" />
                        {t('calendar.title')}
                      </h3>
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-white rounded-md shadow-sm transition-all text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="text-sm font-semibold text-slate-700 px-2 min-w-[100px] text-center">
                          {currentMonth.toLocaleDateString(params.locale, { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-white rounded-md shadow-sm transition-all text-slate-600"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {daysOfWeek.map((day: string) => (
                          <div key={day} className="text-center text-[10px] uppercase font-bold text-slate-400 py-1">{day}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date) => {
                          const dateKey = date.toISOString().split('T')[0];
                          const status = dayAvailability[dateKey];
                          const isAvailable = status === 'available';
                          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                          const isSelectedDay = isSelected(date);

                          return (
                            <button
                              key={dateKey}
                              onClick={() => { if (isAvailable) setSelectedDate(date) }}
                              disabled={!isAvailable}
                              className={`
                                relative h-10 w-full rounded-lg text-sm font-medium transition-all duration-200
                                flex items-center justify-center
                                ${!isCurrentMonth ? 'text-slate-300' : ''}
                                ${isSelectedDay ? 'bg-rose-600 text-white shadow-md shadow-rose-200 scale-105 z-10' : ''}
                                ${!isSelectedDay && isAvailable ? 'hover:bg-rose-50 text-slate-700 hover:text-rose-700' : ''}
                                ${!isSelectedDay && !isAvailable ? 'text-slate-300 cursor-not-allowed' : ''}
                                ${isToday(date) && !isSelectedDay ? 'ring-1 ring-rose-300 text-rose-600 font-bold' : ''}
                              `}
                            >
                              {date.getDate()}
                              {isAvailable && !isSelectedDay && (
                                <span className="absolute bottom-1.5 w-1 h-1 bg-emerald-400 rounded-full"></span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Time & Staff */}
                  <div className="space-y-6">
                    {/* Time Selection */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-rose-500" />
                        {t('timeSelector.title')}
                      </h3>
                      
                      {loadingTimeSlots ? (
                        <div className="h-32 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100">
                          <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
                        </div>
                      ) : availableTimeSlots.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                          {availableTimeSlots.map((slot, index) => (
                            <button
                              key={index}
                              onClick={() => { if (slot.available) setSelectedTime(slot.time) }}
                              disabled={!slot.available}
                              className={`
                                py-2 px-1 text-sm font-medium rounded-lg border transition-all
                                ${selectedTime === slot.time 
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-md' 
                                  : slot.available 
                                    ? 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600' 
                                    : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed decoration-slate-300'}
                              `}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-sm">{t('timeSelector.noSlots')}</p>
                        </div>
                      )}
                      {formErrors.selectedTime && <p className="text-xs text-red-500 font-medium mt-2">{formErrors.selectedTime}</p>}
                    </div>

                    {/* Staff Selection */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{t('fields.staffLabel')}</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select 
                          value={employeeId} 
                          onChange={(e) => setEmployeeId(e.target.value)} 
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all cursor-pointer"
                        >
                          <option value="">{t('fields.staffAny')}</option>
                          {employees.map((m: { userId: string }) => (
                            <option key={m.userId} value={m.userId}>{employeeNames[m.userId] || m.userId}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 w-full my-8"></div>

                {/* Customer Details Form */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900">Данные клиента</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        {t('fields.customerNameLabel')} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={customerName} 
                          onChange={(e) => setCustomerName(e.target.value)} 
                          className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all ${formErrors.customerName ? 'border-red-300 focus:ring-red-200' : 'border-slate-200'}`}
                          placeholder="Иван Иванов"
                        />
                      </div>
                      {formErrors.customerName && <p className="text-xs text-red-500 mt-1">{formErrors.customerName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        {t('fields.customerPhoneLabel')} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="tel" 
                          value={customerPhone} 
                          onChange={(e) => setCustomerPhone(e.target.value)} 
                          className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all ${formErrors.customerPhone ? 'border-red-300 focus:ring-red-200' : 'border-slate-200'}`}
                          placeholder="+375 (XX) XXX-XX-XX"
                        />
                      </div>
                      {formErrors.customerPhone && <p className="text-xs text-red-500 mt-1">{formErrors.customerPhone}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('fields.notesLabel')}</label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <textarea 
                          value={notes} 
                          onChange={(e) => setNotes(e.target.value)} 
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all min-h-[80px] resize-none"
                          placeholder="Дополнительные пожелания..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-8 mt-4">
                  <button 
                    onClick={onClose} 
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                    disabled={submitting}
                  >
                    {t('buttons.cancel')}
                  </button>
                  <button 
                    onClick={handleBook} 
                    disabled={submitting} 
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? t('buttons.submitting') : t('buttons.bookNow')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scissors className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">{t('messages.selectServicePrompt')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalPortal>
  )
}