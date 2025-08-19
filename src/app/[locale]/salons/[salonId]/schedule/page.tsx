"use client"

import { useEffect, useState } from "react"
import { useSalonSchedule } from "@/contexts/SalonScheduleContext"
import { useAppointment } from "@/contexts/AppointmentContext"
import { ChevronLeft, ChevronRight, Coffee, Palmtree, X, Settings, Calendar, Clock, User, Scissors } from "lucide-react"
import { SalonWorkDay, WeekDay, Appointment } from "@/types/database"

const WEEKDAYS = [
  { key: "monday", label: "Пн", fullLabel: "Понедельник", shortLabel: "Пн" },
  { key: "tuesday", label: "Вт", fullLabel: "Вторник", shortLabel: "Вт" },
  { key: "wednesday", label: "Ср", fullLabel: "Среда", shortLabel: "Ср" },
  { key: "thursday", label: "Чт", fullLabel: "Четверг", shortLabel: "Чт" },
  { key: "friday", label: "Пт", fullLabel: "Пятница", shortLabel: "Пт" },
  { key: "saturday", label: "Сб", fullLabel: "Суббота", shortLabel: "Сб" },
  { key: "sunday", label: "Вс", fullLabel: "Воскресенье", shortLabel: "Вс" },
]

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "19:00", "20:00", "21:00",
  "22:00", "23:00", "23:30", "00:00", "00:30", "01:00", "01:30", "02:00", "02:30",
]

export default function SalonSchedulePage({ params }: { params: { salonId: string } }) {
  const { salonId } = params
  const { getSchedule, updateSchedule, loading, error } = useSalonSchedule()
  const { listAppointmentsByDay } = useAppointment()
  const [weeks, setWeeks] = useState<SalonWorkDay[][]>([]);
  const [success, setSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const maxWeeks = 3;

  // Ensure currentWeek is within bounds when weeks change
  useEffect(() => {
    if (weeks.length > 0 && currentWeek >= weeks.length) {
      setCurrentWeek(Math.max(0, weeks.length - 1));
    }
  }, [weeks.length, currentWeek]);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const today = new Date()
  // const currentDayIndex = (today.getDay() + 6) % 7

  useEffect(() => {
    getSchedule(salonId).then((schedule) => {
      if (schedule && schedule.weeks) {
        const normalizedWeeks = schedule.weeks.map(week => 
          week.map(day => ({
            day: day.day,
            isOpen: day.isOpen || false,
            times: day.times || []
          }))
        );
        setWeeks(normalizedWeeks);
      } else {
        setWeeks(Array.from({ length: maxWeeks + 1 }, () => WEEKDAYS.map(d => ({ day: d.key as WeekDay, isOpen: false, times: [] }))));
      }
    });
  }, [salonId, getSchedule]);

  // Функция для проверки, является ли дата сегодняшней
  const isTodayDate = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Функция для получения индекса сегодняшнего дня в текущей неделе
  const getTodayIndex = () => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentWeekStart.setDate(today.getDate() - daysToMonday);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() + currentWeek * 7);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      if (isTodayDate(date)) {
        return i;
      }
    }
    return -1; // Сегодняшний день не в этой неделе
  };

  const currentDayIndex = getTodayIndex();

  // Функция для загрузки записей на выбранную неделю
  const loadWeekAppointments = async () => {
    if (!listAppointmentsByDay) return;
    
    setLoadingAppointments(true);
    try {
      const weekStart = getWeekDates(currentWeek)[0];
      const weekEnd = getWeekDates(currentWeek)[6];
      
      console.log(`📅 Loading appointments for week:`, {
        start: weekStart.toDateString(),
        end: weekEnd.toDateString()
      });
      
      const allAppointments: Appointment[] = [];
      
      // Загружаем записи для каждого дня недели
      for (let i = 0; i < 7; i++) {
        const date = getWeekDates(currentWeek)[i];
        const dayAppointments = await listAppointmentsByDay(salonId, date);
        allAppointments.push(...dayAppointments);
      }
      
      console.log(`📅 Loaded ${allAppointments.length} appointments for the week:`, allAppointments);
      setAppointments(allAppointments);
    } catch (error) {
      console.error(`❌ Error loading appointments:`, error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Загружаем записи при изменении недели
  useEffect(() => {
    loadWeekAppointments();
  }, [currentWeek, salonId, listAppointmentsByDay]);

  // Функция для получения записей на конкретный день и время
  const getAppointmentsForTimeSlot = (date: Date, timeSlot: string) => {
    const dayStart = new Date(date);
    const [hour, minute] = timeSlot.split(':').map(Number);
    dayStart.setHours(hour, minute, 0, 0);
    
    const slotStart = new Date(dayStart);
    const slotEnd = new Date(dayStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30); // 30-минутные слоты
    
    return appointments.filter(appointment => {
      const appointmentStart = new Date(appointment.startAt);
      const appointmentEnd = new Date(appointment.startAt);
      appointmentEnd.setMinutes(appointmentEnd.getMinutes() + appointment.durationMinutes);
      
      // Проверяем пересечение временных интервалов
      return appointmentStart < slotEnd && slotStart < appointmentEnd;
    });
  };

  // Функция для получения записей на конкретный день
  const getAppointmentsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startAt);
      return appointmentDate >= dayStart && appointmentDate < dayEnd;
    });
  };

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleOpenToggle = (dayIdx: number, isOpen: boolean) => {
    setWeeks(prev => prev.map((week, wIdx) =>
      wIdx === currentWeek ? week.map((d, i) =>
        i === dayIdx ? { 
          ...d, 
          isOpen, 
          times: isOpen && (!d.times || d.times.length === 0) ? [{ start: "09:00", end: "18:00" }] : isOpen ? (d.times || []) : [] 
        } : d
      ) : week
    ));
  };

  const handleTimeChange = (dayIdx: number, timeIdx: number, field: "start" | "end", value: string) => {
    setWeeks(prev => prev.map((week, wIdx) =>
      wIdx === currentWeek ? week.map((d, i) =>
        i === dayIdx ? {
          ...d,
          times: (d.times || []).map((t, j) => j === timeIdx ? { ...t, [field]: value } : t)
        } : d
      ) : week
    ));
  };

  const handleAddInterval = (dayIdx: number) => {
    setWeeks(prev => prev.map((week, wIdx) =>
      wIdx === currentWeek ? week.map((d, i) =>
        i === dayIdx ? { ...d, times: [...(d.times || []), { start: "09:00", end: "18:00" }] } : d
      ) : week
    ));
  };

  const handleRemoveInterval = (dayIdx: number, timeIdx: number) => {
    setWeeks(prev => prev.map((week, wIdx) =>
      wIdx === currentWeek ? week.map((d, i) =>
        i === dayIdx ? { ...d, times: (d.times || []).filter((_, j) => j !== timeIdx) } : d
      ) : week
    ));
  };

  const handleSave = async () => {
    try {
      await updateSchedule(salonId, {
        salonId,
        weeks,
        updatedAt: new Date().toISOString(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
    } catch (e) {
      console.error('Failed to save schedule', e)
    }
  };

  const isTimeInWorkingHours = (dayData: any, timeSlot: string) => {
    if (!dayData || !dayData.isOpen || !dayData.times) return false;
    return dayData.times.some((interval: any) => {
      const slotTime = timeSlot.replace(":", "");
      const startTime = interval.start.replace(":", "");
      const endTime = interval.end.replace(":", "");
      return slotTime >= startTime && slotTime < endTime;
    });
  }

  // Функция для получения дат недели с правильным расчетом
  const getWeekDates = (weekOffset: number) => {
    // Находим начало текущей недели (понедельник)
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 = воскресенье, 1 = понедельник
    currentWeekStart.setDate(today.getDate() - daysToMonday);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    // Добавляем смещение недель
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() + weekOffset * 7);
    
    // Генерируем даты для недели (понедельник - воскресенье)
    return WEEKDAYS.map((_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates(currentWeek);

  // Mobile-friendly week view component
  const MobileWeekView = () => {
    const days = weeks[currentWeek] || [];
    
    return (
      <div className="space-y-4">
        {WEEKDAYS.map((weekday, dayIndex) => {
          const dayData = days.find((d) => d && d.day && d.day === weekday.key) || { day: weekday.key, isOpen: false, times: [] };
          const safeDayData = {
            day: dayData.day || weekday.key,
            isOpen: dayData.isOpen || false,
            times: (dayData.times || []).filter(time => time && typeof time === 'object' && time.start && time.end).map(time => ({
              start: time.start || "09:00",
              end: time.end || "18:00"
            }))
          };
          const dateObj = weekDates[dayIndex];
          const dayNumber = dateObj.getDate();
          const monthName = dateObj.toLocaleDateString('ru-RU', { month: 'short' });
          const isCurrentMonth = dateObj.getMonth() === today.getMonth();
          const isToday = isTodayDate(dateObj);

          return (
            <div key={weekday.key} className={`bg-white rounded-lg border-2 ${isToday ? 'border-red-200 bg-red-50' : 'border-gray-200'} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isToday ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {dayNumber}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{weekday.fullLabel}</div>
                    <div className="text-sm text-gray-500">
                      {weekday.shortLabel} • {monthName}
                      {!isCurrentMonth && <span className="text-gray-400"> {dateObj.getFullYear()}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${safeDayData.isOpen ? 'text-green-600' : 'text-gray-500'}`}>
                    {safeDayData.isOpen ? 'Открыто' : 'Закрыто'}
                  </span>
                  <button
                    onClick={() => handleOpenToggle(dayIndex, !safeDayData.isOpen)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      safeDayData.isOpen 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {safeDayData.isOpen ? 'Изменить' : 'Открыть'}
                  </button>
                </div>
              </div>
              
              {safeDayData.isOpen && (
                <div className="space-y-3">
                  {safeDayData.times.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                      <p>Нет рабочих часов</p>
                    </div>
                  ) : (
                    safeDayData.times.map((time, timeIdx) => (
                      <div key={timeIdx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="time"
                            value={time?.start || ""}
                            onChange={e => handleTimeChange(dayIndex, timeIdx, "start", e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                            required
                          />
                          <span className="text-gray-500">—</span>
                          <input
                            type="time"
                            value={time?.end || ""}
                            onChange={e => handleTimeChange(dayIndex, timeIdx, "end", e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                            required
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveInterval(dayIndex, timeIdx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                  
                  {/* Показываем записи на этот день */}
                  {(() => {
                    const dayAppointments = getAppointmentsForDay(dateObj);
                    if (dayAppointments.length === 0) return null;
                    
                    return (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Scissors className="w-4 h-4" />
                          Записи на этот день ({dayAppointments.length})
                        </div>
                        <div className="space-y-2">
                          {dayAppointments.map((appointment) => (
                            <div key={appointment.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                  {appointment.customerName || 'Клиент'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(appointment.startAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                  appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {appointment.status === 'confirmed' ? 'Подтверждено' :
                                   appointment.status === 'pending' ? 'Ожидает' :
                                   appointment.status === 'completed' ? 'Завершено' :
                                   appointment.status === 'cancelled' ? 'Отменено' :
                                   appointment.status}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {appointment.durationMinutes} мин
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  
                  <button 
                    type="button" 
                    onClick={() => handleAddInterval(dayIndex)}
                    className="w-full py-2 text-blue-600 text-sm border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    + Добавить интервал
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Расписание салона</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {success && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Расписание сохранено!
              </div>
            )}
            {error && (
              <div className="text-red-500 bg-red-50 px-4 py-2 rounded-lg text-center">{error}</div>
            )}
            <div className="text-xs text-gray-500 text-center">
              Планирование на {maxWeeks + 1} недель вперед
            </div>
            <button
              onClick={loadWeekAppointments}
              disabled={loadingAppointments}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Обновить записи"
            >
              <Calendar className="w-4 h-4" />
              Обновить
            </button>
            <button
              onClick={openModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Настроить расписание</span>
              <span className="sm:hidden">Настроить</span>
            </button>
          </div>
        </div>

        {/* Calendar Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setCurrentWeek((w) => Math.max(0, w - 1))}
              disabled={currentWeek === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-lg font-semibold text-center flex-1">
              {currentWeek === 0 ? 'Текущая неделя' : `Неделя ${currentWeek + 1}`}
              <div className="text-sm font-normal text-gray-600 mt-1">
                {weekDates[0]?.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — {weekDates[6]?.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              {currentWeek === 0 && (
                <div className="text-xs text-blue-600 mt-1 font-medium">
                  ← Сегодня здесь
                </div>
              )}
              {loadingAppointments && (
                <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                  <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  Загрузка записей...
                </div>
              )}
              {!loadingAppointments && appointments.length > 0 && (
                <div className="text-xs text-green-600 mt-1 font-medium">
                  📅 {appointments.length} записей на неделю
                </div>
              )}
            </div>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setCurrentWeek((w) => Math.min(maxWeeks, w + 1))}
              disabled={currentWeek === maxWeeks}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Today Button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setCurrentWeek(0)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                currentWeek === 0
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Сегодня
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map((weekday, index) => {
              const dateObj = weekDates[index];
              const dayNumber = dateObj.getDate();
              const monthName = dateObj.toLocaleDateString('ru-RU', { month: 'short' });
              const isCurrentMonth = dateObj.getMonth() === today.getMonth();
              const isToday = isTodayDate(dateObj);

              return (
                <div key={weekday.key} className="text-center">
                  <div className={`text-xs sm:text-sm font-medium mb-1 ${isToday ? "text-red-500" : "text-gray-900"}`}>
                    {isMobileView ? weekday.shortLabel : weekday.label}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? "text-red-500" : "text-gray-700"}`}>
                    {dayNumber}
                  </div>
                  <div className={`text-xs ${isToday ? "text-red-400" : "text-gray-500"}`}>
                    {monthName}
                    {!isCurrentMonth && <span className="text-gray-400"> {dateObj.getFullYear()}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Schedule Content */}
        {isMobileView ? (
          <MobileWeekView />
        ) : (
          /* Desktop Schedule Grid */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
            {/* Legend */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Легенда статусов:</div>
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-200 rounded"></div>
                  <span>Подтверждено</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-200 rounded"></div>
                  <span>Ожидает</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 rounded"></div>
                  <span>Завершено</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 rounded"></div>
                  <span>Отменено</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <span>Другое</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-8 gap-2">
              {/* Time Column */}
              <div className="space-y-2 text-xs sm:text-sm">
                {TIME_SLOTS.map((time) => (
                  <div key={time} className="h-12 flex items-center text-sm text-gray-500 font-medium">
                    {time}
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {WEEKDAYS.map((weekday, dayIndex) => {
                const days = weeks[currentWeek] || [];
                const dayData = days.find((d) => d && d.day && d.day === weekday.key) || { day: weekday.key, isOpen: false, times: [] };
                const safeDayData = {
                  day: dayData.day || weekday.key,
                  isOpen: dayData.isOpen || false,
                  times: (dayData.times || []).filter(time => time && typeof time === 'object' && time.start && time.end).map(time => ({
                    start: time.start || "09:00",
                    end: time.end || "18:00"
                  }))
                };
                const dateObj = weekDates[dayIndex];
                const isToday = isTodayDate(dateObj)
                const dayAppointments = getAppointmentsForDay(dateObj);

                return (
                  <div key={weekday.key} className={`space-y-2 ${isToday ? "bg-red-50 rounded-lg p-2 -m-2" : ""}`}>
                    {TIME_SLOTS.map((timeSlot) => {
                      const isWorking = isTimeInWorkingHours(safeDayData, timeSlot)
                      const slotAppointments = getAppointmentsForTimeSlot(dateObj, timeSlot);

                      return (
                        <div
                          key={timeSlot}
                          className={`h-12 rounded border-2 border-dashed transition-colors cursor-pointer ${
                            isWorking
                              ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
                              : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          {/* Показываем записи */}
                          {slotAppointments.length > 0 && (
                            <div className="h-full p-1">
                              {slotAppointments.map((appointment, idx) => (
                                <div
                                  key={appointment.id}
                                  className={`h-full rounded text-xs flex items-center justify-center font-medium ${
                                    appointment.status === 'confirmed' ? 'bg-blue-200 text-blue-800' :
                                    appointment.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                    appointment.status === 'completed' ? 'bg-green-200 text-green-800' :
                                    appointment.status === 'cancelled' ? 'bg-red-200 text-red-800' :
                                    'bg-gray-200 text-gray-800'
                                  }`}
                                  title={`${appointment.customerName || 'Клиент'}: ${appointment.durationMinutes} мин (${appointment.status})`}
                                >
                                  <Scissors className="w-3 h-3 mr-1" />
                                  {appointment.durationMinutes}м
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Настройка расписания</h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-4 sm:space-y-6">
                  {weeks[currentWeek]?.map((d, i) => {
                    // Ensure day object has all required properties
                    const safeDay = {
                      day: d?.day || WEEKDAYS[i]?.key || `day-${i}`,
                      isOpen: d?.isOpen || false,
                      times: (d?.times || []).filter(time => time && typeof time === 'object' && time.start && time.end).map(time => ({
                        start: time.start || "09:00",
                        end: time.end || "18:00"
                      }))
                    };
                    
                    return (
                      <div key={safeDay.day} className="border rounded-xl p-4 flex flex-col gap-2 bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
                          <span className="font-semibold text-gray-800 w-full sm:w-32">{WEEKDAYS.find(w => w.key === safeDay.day)?.label || safeDay.day}</span>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={safeDay.isOpen}
                              onChange={e => handleOpenToggle(i, e.target.checked)}
                            />
                            <span className="text-sm">Открыто</span>
                          </label>
                        </div>
                        {safeDay.isOpen && (
                          <div className="flex flex-col gap-2">
                            {safeDay.times.map((t: any, j: number) => (
                              <div key={j} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="time"
                                    value={t?.start || ""}
                                    onChange={e => handleTimeChange(i, j, "start", e.target.value)}
                                    className="px-2 py-1 border rounded text-sm"
                                    required
                                  />
                                  <span className="text-gray-500">—</span>
                                  <input
                                    type="time"
                                    value={t?.end || ""}
                                    onChange={e => handleTimeChange(i, j, "end", e.target.value)}
                                    className="px-2 py-1 border rounded text-sm"
                                    required
                                  />
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveInterval(i, j)} 
                                  className="text-red-500 hover:text-red-700 px-2 py-1 rounded text-sm"
                                >
                                  Удалить
                                </button>
                              </div>
                            ))}
                            <button 
                              type="button" 
                              onClick={() => handleAddInterval(i)} 
                              className="text-rose-600 text-sm mt-1 text-left"
                            >
                              + Добавить интервал
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors font-medium order-2 sm:order-1"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                >
                  {loading ? "Сохранение..." : "Сохранить изменения"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
