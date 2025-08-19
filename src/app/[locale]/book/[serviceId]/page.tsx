"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Calendar, Clock, User, Shield, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { getServiceImages } from "@/lib/firebase/database"
import { useUser } from "@/contexts/UserContext"
import { useSalon } from "@/contexts/SalonContext"
import { useAppointment } from "@/contexts/AppointmentContext"
import { useSalonSchedule } from "@/contexts/SalonScheduleContext"
import { useSalonService } from "@/contexts/SalonServiceContext"
import { SalonScheduleDisplay } from "@/components/SalonScheduleDisplay"

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

export default function BookServicePage() {
  const params = useParams() as { serviceId: string; locale: string }
  const router = useRouter()
  const { serviceId } = params
  const { currentUser } = useUser()
  
  // Contexts
  const { fetchSalon } = useSalon()
  const { isTimeSlotAvailable, createAppointment } = useAppointment()
  const { getSchedule } = useSalonSchedule()
  const { getService } = useSalonService()

  // Debug: Log when context functions change
  useEffect(() => {
    console.log(`🔧 Context functions changed:`, {
      hasFetchSalon: !!fetchSalon,
      hasIsTimeSlotAvailable: !!isTimeSlotAvailable,
      hasGetSchedule: !!getSchedule,
      hasGetService: !!getService,
      hasCreateAppointment: !!createAppointment
    })
    
    // Проверяем, что функции действительно работают
    if (isTimeSlotAvailable) {
      console.log(`🔧 isTimeSlotAvailable function details:`, {
        name: isTimeSlotAvailable.name,
        toString: isTimeSlotAvailable.toString().substring(0, 100) + '...'
      })
    }
  }, [fetchSalon, isTimeSlotAvailable, getSchedule, getService, createAppointment])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [service, setService] = useState<Service | null>(null)

  // Debug: Log when service changes
  useEffect(() => {
    console.log(`🔧 Service changed:`, service)
    if (service) {
      console.log(`🔧 Service details:`, {
        id: service.id,
        name: service.name,
        salonId: service.salonId,
        durationMinutes: service.durationMinutes,
        price: service.price
      })
    } else {
      console.log(`❌ No service available`)
    }
  }, [service])
  const [salon, setSalon] = useState<any>(null)

  // Debug: Log when salon changes
  useEffect(() => {
    console.log(`🏢 Salon changed:`, salon)
  }, [salon])
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [salonSchedule, setSalonSchedule] = useState<any>(null)

  // Debug: Log when salonSchedule changes
  useEffect(() => {
    console.log(`📅 Salon schedule changed:`, salonSchedule)
    if (salonSchedule) {
      console.log(`📊 Schedule structure:`, {
        hasWeeks: !!salonSchedule.weeks,
        weeksLength: salonSchedule.weeks?.length || 0,
        firstWeek: salonSchedule.weeks?.[0] || null,
        firstWeekDays: salonSchedule.weeks?.[0]?.map((d: any) => d.day) || []
      })
      
      if (salonSchedule.weeks && salonSchedule.weeks.length > 0) {
        const firstWeek = salonSchedule.weeks[0]
        console.log(`📊 First week details:`, firstWeek)
        firstWeek.forEach((day: any, index: number) => {
          console.log(`📊 Day ${index}: ${day.day} - ${day.isOpen ? 'Open' : 'Closed'} - Times: ${day.times?.map((t: any) => `${t.start}-${t.end}`).join(', ') || 'None'}`)
        })
      }
    } else {
      console.log(`❌ No salon schedule available`)
    }
  }, [salonSchedule])

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
  const [timeInterval, setTimeInterval] = useState(30) // 30 minutes default

  // Debug: Log when selectedTime changes
  useEffect(() => {
    console.log(`🕐 Selected time changed to:`, selectedTime)
    if (selectedTime) {
      console.log(`🕐 Selected time is set to: ${selectedTime}`)
      console.log(`🕐 Available time slots:`, availableTimeSlots)
      console.log(`🕐 Matching slot:`, availableTimeSlots.find(s => s.time === selectedTime))
    } else {
      console.log(`🕐 Selected time cleared`)
    }
  }, [selectedTime, availableTimeSlots])

  // Debug: Log when employeeId changes
  useEffect(() => {
    console.log(`👤 Employee ID changed:`, employeeId)
  }, [employeeId])

  // Test function to check time slot availability
  const testTimeSlotAvailability = async () => {
    if (!service || !isTimeSlotAvailable) {
      console.log(`❌ Cannot test: service=${!!service}, isTimeSlotAvailable=${!!isTimeSlotAvailable}`)
      return
    }
    
    console.log(`🧪 Testing time slot availability...`)
    
    // Test with current time + 1 hour
    const testTime = new Date()
    testTime.setHours(testTime.getHours() + 1, 0, 0, 0)
    
    try {
      const result = await isTimeSlotAvailable(
        service.salonId,
        testTime.toISOString(),
        service.durationMinutes
      )
      console.log(`🧪 Test result for ${testTime.toISOString()}: ${result}`)
    } catch (error) {
      console.error(`🧪 Test error:`, error)
    }
  }

  // Debug: Log when availableTimeSlots changes
  useEffect(() => {
    console.log(`🕐 Available time slots changed:`, availableTimeSlots)
    console.log(`🕐 Total slots: ${availableTimeSlots.length}`)
    console.log(`🕐 Available slots: ${availableTimeSlots.filter(s => s.available).length}`)
    console.log(`🕐 Unavailable slots: ${availableTimeSlots.filter(s => !s.available).length}`)
    if (availableTimeSlots.length > 0) {
      console.log(`🕐 First slot:`, availableTimeSlots[0])
      console.log(`🕐 Last slot:`, availableTimeSlots[availableTimeSlots.length - 1])
    }
  }, [availableTimeSlots])

  // Debug: Log when loadingTimeSlots changes
  useEffect(() => {
    console.log(`🔄 Loading time slots changed:`, loadingTimeSlots)
  }, [loadingTimeSlots])

  // Debug: Log when currentMonth changes
  useEffect(() => {
    console.log(`📅 Current month changed to: ${currentMonth.toDateString()}`)
  }, [currentMonth])

  // Debug: Log when timeInterval changes
  useEffect(() => {
    console.log(`⏰ Time interval changed:`, timeInterval)
  }, [timeInterval])

  // Debug: Log when selectedDate changes
  useEffect(() => {
    console.log(`📅 Selected date changed to: ${selectedDate.toDateString()}`)
    console.log(`📅 Selected date day of week: ${selectedDate.getDay()}`)
    console.log(`📅 Selected date is today: ${isToday(selectedDate)}`)
    console.log(`📅 Selected date is available: ${isDateAvailable(selectedDate)}`)
    console.log(`📅 Salon schedule available: ${!!salonSchedule}`)
    if (salonSchedule) {
      console.log(`📅 Salon schedule weeks: ${salonSchedule.weeks?.length || 0}`)
    }
  }, [selectedDate, salonSchedule])

  useEffect(() => {
    let isCancelled = false
    const load = async () => {
      try {
        console.log('🔍 Starting to load data...')
        setLoading(true)
        setError(null)
        
        // Check if context functions exist
        if (!getService || !fetchSalon || !getSchedule) {
          console.error('❌ Context functions not available:', { getService: !!getService, fetchSalon: !!fetchSalon, getSchedule: !!getSchedule })
          setError("Ошибка инициализации контекстов")
          setLoading(false)
          return
        }
        
        console.log('✅ Context functions available, loading service...')
        
        // Load service using context
        const svc = await getService(serviceId)
        if (!svc) {
          console.error('❌ Service not found')
          setError("Услуга не найдена")
          setLoading(false)
          return
        }
        console.log('✅ Service loaded:', svc)
        const s: Service = { id: serviceId, ...(svc as any) }
        if (isCancelled) return
        setService(s)

        // Load preview image
        try {
          const imgs = await getServiceImages(serviceId)
          if (!isCancelled && imgs && imgs.length > 0) setPreviewUrl(imgs[0].url)
        } catch (e) {
          console.warn('Failed to load service images', e)
        }

        console.log('🔄 Loading salon...')
        // Load salon using context
        const salonData = await fetchSalon(s.salonId)
        if (!isCancelled) {
          console.log('✅ Salon loaded:', salonData)
          setSalon(salonData)
        }

        console.log('🔄 Loading schedule...')
        // Load salon schedule using context
        try {
          const schedule = await getSchedule(s.salonId)
          if (!isCancelled) {
            console.log('✅ Schedule loaded:', schedule)
            console.log('📊 Schedule structure:', {
              hasSchedule: !!schedule,
              hasWeeks: !!(schedule && schedule.weeks),
              weeksLength: schedule?.weeks?.length || 0,
              firstWeek: schedule?.weeks?.[0] || null,
              firstDay: schedule?.weeks?.[0]?.[0] || null
            })
            setSalonSchedule(schedule)
          }
        } catch (e) {
          console.error('❌ Error loading schedule:', e)
        }
        
        console.log('✅ All data loaded successfully')
      } catch (e: any) {
        console.error('❌ Error in load function:', e)
        if (!isCancelled) setError(e.message || "Ошибка загрузки")
      } finally {
        if (!isCancelled) {
          console.log('🏁 Setting loading to false')
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      console.log('🧹 Cleanup: cancelling load')
      isCancelled = true
    }
  }, [serviceId, getService, fetchSalon, getSchedule])

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= lastDay || days.length < 42) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }, [currentMonth])

  // Check if date is available (not in past and salon is open)
  const isDateAvailable = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (date < today) {
      console.log(`❌ Date ${date.toDateString()} is in the past`)
      return false
    }
    
    // Check if we can book for today (need at least 2 hours advance)
    if (date.toDateString() === today.toDateString()) {
      const now = new Date()
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      if (date < twoHoursFromNow) {
        console.log(`❌ Date ${date.toDateString()} is too soon (need 2 hours advance)`)
        return false
      }
    }
    
    if (!salonSchedule) {
      console.log(`⚠️ No salon schedule available, allowing date ${date.toDateString()}`)
      return true
    }
    
    if (!salonSchedule.weeks || salonSchedule.weeks.length === 0) {
      console.log(`⚠️ Salon schedule has no weeks, allowing date ${date.toDateString()}`)
      return true
    }
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[date.getDay()]
    
    console.log(`🔍 Checking availability for ${date.toDateString()} (${dayName})`)
    console.log(`📅 Salon schedule weeks:`, salonSchedule.weeks)
    console.log(`📅 Available days in first week:`, salonSchedule.weeks[0]?.map((d: any) => d.day) || [])
    
    // Check if salon is open on this day
    const weekIndex = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) % salonSchedule.weeks.length
    const week = salonSchedule.weeks[weekIndex]
    
    if (!week) {
      console.log(`❌ No week found for index ${weekIndex}`)
      return false
    }
    
    console.log(`📅 Week ${weekIndex}:`, week)
    
    const daySchedule = week.find((d: { day: string }) => d.day === dayName)
    
    if (!daySchedule) {
      console.log(`❌ No day schedule found for ${dayName}`)
      console.log(`❌ Available days in this week:`, week.map((d: any) => d.day))
      return false
    }
    
    console.log(`📅 Day schedule for ${dayName}:`, daySchedule)
    
    const isOpen = daySchedule.isOpen
    console.log(`✅ Date ${date.toDateString()} is ${isOpen ? 'available' : 'not available'} (salon ${isOpen ? 'open' : 'closed'})`)
    
    return isOpen
  }

  // Generate time slots for selected date
  const generateTimeSlots = async () => {
    console.log(`🕐 Generating time slots for date: ${selectedDate?.toDateString()}`)
    console.log(`🕐 Service:`, service)
    console.log(`🕐 Salon Schedule:`, salonSchedule)
    console.log(`🕐 isTimeSlotAvailable function:`, !!isTimeSlotAvailable)
    
    if (!selectedDate || !service || !salonSchedule || !isTimeSlotAvailable) {
      console.log(`❌ Cannot generate time slots:`, {
        hasSelectedDate: !!selectedDate,
        hasService: !!service,
        hasSalonSchedule: !!salonSchedule,
        hasIsTimeSlotAvailable: !!isTimeSlotAvailable
      })
      setAvailableTimeSlots([])
      return
    }

    setLoadingTimeSlots(true)
    try {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[selectedDate.getDay()]
      
      console.log(`🕐 Day name: ${dayName}`)
      console.log(`🕐 Selected date day of week: ${selectedDate.getDay()}`)
      
      // Get schedule for this day
      const weekIndex = Math.floor((selectedDate.getTime() - new Date(selectedDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) % salonSchedule.weeks.length
      const week = salonSchedule.weeks[weekIndex]
      const daySchedule = week.find((d: { day: string }) => d.day === dayName)
      
      console.log(`🕐 Week index: ${weekIndex}`)
      console.log(`🕐 Week:`, week)
      console.log(`🕐 Day schedule:`, daySchedule)
      console.log(`🕐 Looking for day: ${dayName}`)
      console.log(`🕐 Available days in week:`, week.map((d: any) => d.day))
      
      if (!daySchedule?.isOpen) {
        console.log(`❌ Day is not open or no schedule found`)
        console.log(`❌ Day schedule:`, daySchedule)
        setAvailableTimeSlots([])
        return
      }

      console.log(`🕐 Day is open, generating slots...`)
      console.log(`🕐 Day schedule times:`, daySchedule.times)
      const slots: TimeSlot[] = []
      
      // Generate slots for each time range with 30-minute intervals
      for (const timeRange of daySchedule.times) {
        console.log(`🕐 Processing time range: ${timeRange.start} - ${timeRange.end}`)
        
        const [startHour, startMinute] = timeRange.start.split(':').map(Number)
        const [endHour, endMinute] = timeRange.end.split(':').map(Number)
        
        console.log(`🕐 Start: ${startHour}:${startMinute}, End: ${endHour}:${endMinute}`)
        
        let currentHour = startHour
        let currentMinute = startMinute
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
          const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
          
          console.log(`🕐 Generating slot for: ${timeString}`)
          
          // Check if this slot is available
          const slotDate = new Date(selectedDate)
          slotDate.setHours(currentHour, currentMinute, 0, 0)
          
          // Check if slot is in the past
          const now = new Date()
          if (slotDate <= now) {
            console.log(`🕐 Slot ${timeString} is in the past`)
            slots.push({
              time: timeString,
              available: false,
              reason: 'Время прошло'
            })
          } else {
            console.log(`🕐 Checking availability for slot ${timeString} at ${slotDate.toISOString()}`)
            // Check availability using appointment context
            const availableCheck = await isTimeSlotAvailable(
              service.salonId,
              slotDate.toISOString(),
              service.durationMinutes,
              employeeId || undefined // Pass employeeId if selected
            )
            
            console.log(`🕐 Slot ${timeString} availability check result:`, availableCheck)
            
            // Если слот недоступен, попробуем понять почему
            if (!availableCheck) {
              console.log(`🕐 Slot ${timeString} is not available, checking why...`)
              try {
                // Попробуем получить записи на этот день для отладки
                // const dayAppointments = await appointmentOperations.listByDay(service.salonId, selectedDate)
                // console.log(`🕐 Day appointments for debugging:`, dayAppointments)
              } catch (e) {
                console.log(`🕐 Could not fetch day appointments for debugging:`, e)
              }
            }
            
            const isAvailable = availableCheck
            let reason = "Время занято"
            if (!isAvailable) reason = "Занято"
            
            slots.push({
              time: timeString,
              available: isAvailable,
              reason: reason
            })
          }
          
          // Move to next slot (30-minute intervals)
          currentMinute += timeInterval
          if (currentMinute >= 60) {
            currentMinute = 0
            currentHour++
          }
        }
      }
      
      console.log(`✅ Generated ${slots.length} time slots:`, slots)
      console.log(`✅ Available slots:`, slots.filter(s => s.available))
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
  }, [selectedDate, service, salonSchedule, employeeId, timeInterval, isTimeSlotAvailable])

  const employees = useMemo(() => {
    if (!salon) return [] as Array<{ userId: string; role: string }>
    return (salon.members || []).filter((m: { role: string }) => ["owner", "manager", "employee"].includes(m.role))
  }, [salon])

  const combineDateTimeToIso = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const combined = new Date(date)
    combined.setHours(hours, minutes, 0, 0)
    return combined.toISOString()
  }

  const handleBook = async () => {
    if (!service || !selectedDate || !selectedTime || !isTimeSlotAvailable || !createAppointment) return
    
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      const startAt = combineDateTimeToIso(selectedDate, selectedTime)
      
      // Check availability using appointment context
      const ok = await isTimeSlotAvailable(
        service.salonId,
        startAt,
        service.durationMinutes,
        employeeId || undefined
      )
      
      if (!ok) {
        setError("Выбранное время недоступно. Выберите другое время.")
        setSubmitting(false)
        return
      }

      const appointmentId = Date.now().toString()
      
      // Create appointment using appointment context
      await createAppointment(service.salonId, appointmentId, {
        salonId: service.salonId,
        serviceId: service.id,
        employeeId: employeeId || undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerUserId: currentUser?.userId || undefined,
        startAt,
        durationMinutes: service.durationMinutes,
        status: "confirmed",
        notes: notes || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      setSuccess("Запись успешно создана!")
      setSubmitting(false)
    } catch (e: any) {
      setError(e.message || "Не удалось создать запись")
      setSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate.toDateString() === date.toDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Загрузка...</div>
          {salonSchedule && (
            <div className="text-xs text-gray-500 border-t pt-2">
              <div>Salon Schedule: ✅</div>
              <div>Weeks: {salonSchedule.weeks?.length || 0}</div>
              <div>First Week: {salonSchedule.weeks?.[0]?.length || 0} days</div>
              <div>First Day: {salonSchedule.weeks?.[0]?.[0]?.day || 'N/A'}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (error && !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <div className="text-red-600 font-semibold mb-2">Ошибка</div>
          <div className="text-gray-700 mb-4">{error}</div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
          >
            Назад
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
                  <span>{service.durationMinutes} мин</span>
                </div>
              )}
            </div>
            {service?.price !== undefined && (
              <div className="text-rose-600 font-bold">{service.price} ₽</div>
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
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3">{error}</div>
            )}

            {/* Salon Schedule Info */}
            {salonSchedule && (
              <div className="bg-gray-50 rounded-lg p-4">
                <SalonScheduleDisplay schedule={salonSchedule} />
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Запись возможна минимум за 2 часа до начала процедуры
                  </div>
                </div>
              </div>
            )}

            {/* Calendar and Time Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Выберите дату</h3>
                
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-medium">
                    {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Today Button */}
                <div className="mb-4">
                  <button
                    onClick={() => {
                      const today = new Date()
                      setCurrentMonth(today)
                      setSelectedDate(today)
                    }}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Сегодня
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, index) => {
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                    const available = isDateAvailable(date)
                    
                    // Debug info for first few dates
                    if (index < 7) {
                      console.log(`📅 Calendar date ${date.toDateString()}: available=${available}, isCurrentMonth=${isCurrentMonth}`)
                    }
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (available) {
                            console.log(`✅ Date selected: ${date.toDateString()}`)
                            setSelectedDate(date)
                          } else {
                            console.log(`❌ Cannot select date: ${date.toDateString()} (not available)`)
                          }
                        }}
                        disabled={!available}
                        className={`
                          p-2 text-sm rounded-lg transition-colors
                          ${isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}
                          ${isToday(date) ? 'bg-blue-100 text-blue-700' : ''}
                          ${isSelected(date) ? 'bg-rose-100 text-rose-700' : ''}
                          ${available && !isToday(date) && !isSelected(date) ? 'hover:bg-gray-100' : ''}
                          ${!available ? 'text-gray-300 cursor-not-allowed' : ''}
                        `}
                        title={available ? `Выбрать ${date.toDateString()}` : `Недоступно: ${date.toDateString()}`}
                      >
                        {date.getDate()}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Выберите время</h3>
                
                {/* Time Interval Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Интервал времени</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTimeInterval(30)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                        timeInterval === 30
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-rose-300'
                      }`}
                    >
                      30 мин
                    </button>
                    <button
                      onClick={() => setTimeInterval(60)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                        timeInterval === 60
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-rose-300'
                      }`}
                    >
                      1 час
                    </button>
                    <button
                      onClick={testTimeSlotAvailability}
                      className="px-3 py-1 text-sm rounded-lg border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                      title="Тест доступности временного слота"
                    >
                      🧪 Тест
                    </button>
                  </div>
                </div>
                
                {selectedDate && salonSchedule ? (
                  <div>
                    <div className="text-sm text-gray-600 mb-3">
                      {formatDate(selectedDate)} • {salon?.name || ''}
                    </div>
                    
                    {/* Selected Time Display */}
                    {selectedTime && (
                      <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <div className="flex items-center gap-2 text-rose-700">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">Выбрано время: {selectedTime}</span>
                        </div>
                        {service && (
                          <div className="text-xs text-rose-600 mt-1">
                            Продолжительность: {service.durationMinutes} мин
                          </div>
                        )}
                      </div>
                    )}
                    
                    {loadingTimeSlots ? (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Загрузка доступного времени...</p>
                      </div>
                    ) : availableTimeSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                        {availableTimeSlots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              console.log(`🕐 Clicked on time slot: ${slot.time}`)
                              console.log(`🕐 Slot available: ${slot.available}`)
                              console.log(`🕐 Slot reason: ${slot.reason}`)
                              if (slot.available) {
                                console.log(`✅ Setting selected time to: ${slot.time}`)
                                setSelectedTime(slot.time)
                              } else {
                                console.log(`❌ Cannot select unavailable slot: ${slot.time}`)
                              }
                            }}
                            disabled={!slot.available}
                            className={`
                              p-3 text-sm rounded-lg border transition-colors
                              ${slot.available 
                                ? selectedTime === slot.time
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-rose-300 hover:bg-rose-50'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              }
                            `}
                            title={slot.reason || `Время: ${slot.time}`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Нет доступного времени на выбранную дату</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Выберите дату для просмотра доступного времени</p>
                  </div>
                )}
              </div>
            </div>

            {/* Other Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Специалист (по желанию)</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500"
                  >
                    <option value="">Любой</option>
                    {employees.map((m: { userId: string }) => (
                      <option key={m.userId} value={m.userId}>{m.userId}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  При выборе специалиста доступное время будет пересчитано
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ваше имя (по желанию)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон (по желанию)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Пожелания к записи"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => router.back()}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
                disabled={submitting}
              >
                Отмена
              </button>
              <button
                onClick={handleBook}
                disabled={submitting || !selectedDate || !selectedTime}
                className="px-5 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting ? "Создание..." : "Записаться"}
              </button>
            </div>

            <div className="pt-2 text-xs text-gray-500 flex items-center gap-2">
              <Shield className="w-3 h-3" />
              <span>Данные защищены и не передаются третьим лицам</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

