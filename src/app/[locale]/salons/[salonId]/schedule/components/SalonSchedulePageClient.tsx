"use client";

import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Phone,
  Plus,
  Scissors,
  Settings,
  User as UserIcon,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic"; // Для ленивой загрузки

// --- COMPONENTS ---
import SalonChatButton from "@/components/SalonChatButton";

// Динамический импорт тяжелой модалки (код загрузится только при клике)
const ManualBookingModal = dynamic(() => import("./ManualBookingModal"), {
  loading: () => <div className="fixed inset-0 bg-black/20 z-50" />,
  ssr: false
});

// --- CONTEXT HOOKS ---
// Оставляем хуки только для ACTIONS (обновление данных), но не для начальной загрузки
import { useAppointment } from "@/contexts/AppointmentContext";
import { useSalonSchedule } from "@/contexts/SalonScheduleContext";
import { useUser } from "@/contexts/UserContext";

// --- TYPE DEFINITIONS ---
import { Salon, SalonWorkDay, WeekDay } from "@/types/database";
import type { User } from "@/types/user";

// Типы (дублируем или импортируем из общего файла)
type Appointment = {
  id: string;
  salonId: string;
  serviceId: string;
  employeeId?: string;
  customerName?: string;
  customerPhone?: string;
  customerUserId?: string;
  startAt: string;
  durationMinutes: number;
  status: "pending" | "in_progress" | "completed";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type Service = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
};

// Константы
const WEEKDAYS = [
  { key: "monday", label: "Пн", fullLabel: "Понедельник", shortLabel: "Пн" },
  { key: "tuesday", label: "Вт", fullLabel: "Вторник", shortLabel: "Вт" },
  { key: "wednesday", label: "Ср", fullLabel: "Среда", shortLabel: "Ср" },
  { key: "thursday", label: "Чт", fullLabel: "Четверг", shortLabel: "Чт" },
  { key: "friday", label: "Пт", fullLabel: "Пятница", shortLabel: "Пт" },
  { key: "saturday", label: "Сб", fullLabel: "Суббота", shortLabel: "Сб" },
  { key: "sunday", label: "Вс", fullLabel: "Воскресенье", shortLabel: "Вс" },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00",
];

const SLOT_HEIGHT_IN_REM = 6;
const MINUTES_PER_SLOT = 30;
const REM_IN_PX = 16;
const SLOT_HEIGHT_PX = SLOT_HEIGHT_IN_REM * REM_IN_PX;
const PX_PER_MINUTE = SLOT_HEIGHT_PX / MINUTES_PER_SLOT;

const timeToMinutes = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const DAY_START_MINUTES = timeToMinutes(TIME_SLOTS[0]);

// --- PROPS INTERFACE ---
interface SalonSchedulePageClientProps {
  salonId: string;
  initialSalon: Salon;
  initialServices: Service[];
  initialSchedule: SalonWorkDay[];
  initialAppointments: Appointment[];
  initialUsers: Record<string, User>;
}

export default function SalonSchedulePageClient({
  salonId,
  initialSalon,
  initialServices,
  initialSchedule,
  initialAppointments,
  initialUsers
}: SalonSchedulePageClientProps) {
  const t = useTranslations("salonSchedule");

  // --- STATE INITIALIZATION (INSTANT LOAD) ---
  const [salon, setSalon] = useState<Salon>(initialSalon);
  const [weeklySchedule, setWeeklySchedule] = useState<SalonWorkDay[]>(initialSchedule);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [users, setUsers] = useState<Record<string, User>>(initialUsers);
  
  // Loading false по умолчанию, так как данные пришли с сервера
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const maxWeeks = 3;

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  // Context hooks (используем только методы для обновления)
  const { updateSchedule } = useSalonSchedule();
  const { listAppointmentsByDay, updateAppointment } = useAppointment();
  const { currentUser } = useUser();

  // --- CACHING & REFS ---
  // Инициализируем кэш сразу текущей неделей, чтобы не грузить её повторно
  const appointmentsByWeekCache = useRef<Map<string, Appointment[]>>(new Map([
    [`${salonId}-0`, initialAppointments]
  ]));
  
  const [weekLoadingStates, setWeekLoadingStates] = useState<Record<number, boolean>>({});
  const [preloadedWeeks, setPreloadedWeeks] = useState<Set<number>>(new Set([0]));
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // --- DATA FETCHING LOGIC (ONLY FOR WEEK NAVIGATION) ---
  
  const getWeekDates = useCallback((weekOffset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, []);

  const loadWeekAppointments = useCallback(async (weekOffset: number, isBackground = false): Promise<Appointment[]> => {
    const cacheKey = `${salonId}-${weekOffset}`;
    
    if (appointmentsByWeekCache.current.has(cacheKey)) {
      return appointmentsByWeekCache.current.get(cacheKey)!;
    }

    if (!isBackground) {
      setWeekLoadingStates(prev => ({ ...prev, [weekOffset]: true }));
    }

    try {
      const weekDates = getWeekDates(weekOffset);
      
      // Используем Promise.all для параллельной загрузки дней
      const appointmentPromises = weekDates.map(async (date) => {
        try {
          return await listAppointmentsByDay(salonId, date);
        } catch (error) {
          console.error(`Error loading appointments for ${date.toISOString()}:`, error);
          return [];
        }
      });

      const weekResults = await Promise.all(appointmentPromises);
      const allAppointments = weekResults.flat();

      appointmentsByWeekCache.current.set(cacheKey, allAppointments);
      
      if (isBackground) {
        setPreloadedWeeks(prev => new Set(prev).add(weekOffset));
      }

      return allAppointments;
    } catch (err) {
      console.error(`Error loading week ${weekOffset}:`, err);
      return [];
    } finally {
      if (!isBackground) {
        setWeekLoadingStates(prev => ({ ...prev, [weekOffset]: false }));
      }
    }
  }, [salonId, listAppointmentsByDay, getWeekDates]);

  // Эффект для загрузки данных при смене недели (но не при первом рендере, если offset 0)
  useEffect(() => {
    // Если это текущая неделя и у нас уже есть данные (из пропсов), не грузим
    if (currentWeekOffset === 0 && appointmentsByWeekCache.current.has(`${salonId}-0`)) {
        // Просто убедимся, что стейт синхронизирован с кэшем (на случай возврата на 0 неделю)
        setAppointments(appointmentsByWeekCache.current.get(`${salonId}-0`)!);
        return;
    }

    loadWeekAppointments(currentWeekOffset).then(weekAppointments => {
      setAppointments(weekAppointments);
    });
  }, [currentWeekOffset, loadWeekAppointments, salonId]);

  // Предзагрузка соседних недель (оставляем как было)
  useEffect(() => {
    const preloadAdjacentWeeks = async () => {
      if (currentWeekOffset < maxWeeks) {
        const nextCacheKey = `${salonId}-${currentWeekOffset + 1}`;
        if (!appointmentsByWeekCache.current.has(nextCacheKey)) {
          loadWeekAppointments(currentWeekOffset + 1, true);
        }
      }
    };
    const timeoutId = setTimeout(preloadAdjacentWeeks, 1000); // Чуть увеличил задержку, чтобы дать браузеру "подышать"
    return () => clearTimeout(timeoutId);
  }, [currentWeekOffset, maxWeeks, loadWeekAppointments, salonId]);

  // --- HELPERS ---
  const getAppointmentsForDay = useCallback((date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return appointments.filter(apt => {
      const aptDate = new Date(apt.startAt);
      return aptDate >= dayStart && aptDate < dayEnd;
    });
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    if (serviceFilter !== "all") {
      filtered = filtered.filter(apt => apt.serviceId === serviceFilter);
    }
    return filtered;
  }, [appointments, statusFilter, serviceFilter]);

  const isSalonOwner = useMemo(() => 
    salon?.members?.some(
      member => member.userId === currentUser?.userId && member.role === 'owner'
    ), 
    [salon, currentUser]
  );
  const canManageAppointments = currentUser?.role === 'admin' || isSalonOwner;

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const today = new Date();
  const isTodayDate = (date: Date) => date.toDateString() === today.toDateString();
  const weekDates = getWeekDates(currentWeekOffset);

  const getStatusColor = (status: string) => {
    const colors = {
      completed: "bg-green-100 text-green-800 border-green-300",
      in_progress: "bg-blue-100 text-blue-800 border-blue-300",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getStatusText = (status: string) => t(`status.${status}`) || status;

  // --- HANDLERS ---
  const handleSaveSchedule = async () => {
    setModalError(null);
    try {
      const scheduleToSave = {
        salonId,
        updatedAt: new Date().toISOString(),
        weeklySchedule: weeklySchedule.map(day => ({
          ...day,
          times: day.isOpen ? (day.times || []).filter(t => t.start && t.end) : [],
        })),
      };

      await updateSchedule(salonId, scheduleToSave);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setTimeout(() => setIsScheduleModalOpen(false), 500);
    } catch (e: any) {
      setModalError(e.message || "Ошибка сохранения");
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment["status"]) => {
    setModalError(null);
    try {
      await updateAppointment(salonId, appointmentId, { status: newStatus });
      const updatedAppointments = appointments.map((apt) => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      );
      setAppointments(updatedAppointments);
      
      // Обновляем кэш
      const cacheKey = `${salonId}-${currentWeekOffset}`;
      if (appointmentsByWeekCache.current.has(cacheKey)) {
         const cached = appointmentsByWeekCache.current.get(cacheKey)!;
         const updatedCached = cached.map(apt => apt.id === appointmentId ? { ...apt, status: newStatus } : apt);
         appointmentsByWeekCache.current.set(cacheKey, updatedCached);
      }

      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      setModalError(err.message || "Ошибка обновления статуса");
    }
  };
  
  const handleBookingSuccess = useCallback(() => {
    setIsManualBookingOpen(false);
    // Инвалидируем кэш текущей недели и перезагружаем
    appointmentsByWeekCache.current.delete(`${salonId}-${currentWeekOffset}`);
    loadWeekAppointments(currentWeekOffset).then(weekAppointments => {
      setAppointments(weekAppointments);
    });
  }, [loadWeekAppointments, currentWeekOffset, salonId]);

  // Handlers for Schedule Modal
  const handleOpenToggle = (dayIdx: number, isOpen: boolean) => {
    setWeeklySchedule(prev => prev.map((d, i) =>
      i === dayIdx ? { 
        ...d, 
        isOpen, 
        times: isOpen && (!d.times || d.times.length === 0) ? [{ start: "09:00", end: "18:00" }] : isOpen ? (d.times || []) : [] 
      } : d
    ));
  };

  const handleTimeChange = (dayIdx: number, timeIdx: number, field: "start" | "end", value: string) => {
    setWeeklySchedule(prev => prev.map((d, i) =>
      i === dayIdx ? {
        ...d,
        times: (d.times || []).map((t, j) => j === timeIdx ? { ...t, [field]: value } : t)
      } : d
    ));
  };

  const handleAddInterval = (dayIdx: number) => {
    setWeeklySchedule(prev => prev.map((d, i) =>
      i === dayIdx ? { ...d, times: [...(d.times || []), { start: "09:00", end: "18:00" }] } : d
    ));
  };

  const handleRemoveInterval = (dayIdx: number, timeIdx: number) => {
    setWeeklySchedule(prev => prev.map((d, i) =>
      i === dayIdx ? { ...d, times: (d.times || []).filter((_, j) => j !== timeIdx) } : d
    ));
  };

  // --- RENDER COMPONENTS ---
  const PositionedAppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const service = services.find((s) => s.id === appointment.serviceId);
    const appointmentStart = new Date(appointment.startAt);
    const startTimeString = appointmentStart.toTimeString().substring(0, 5);
    const startMinutes = timeToMinutes(startTimeString);

    const top = (startMinutes - DAY_START_MINUTES) * PX_PER_MINUTE;
    const height = appointment.durationMinutes * PX_PER_MINUTE;

    return (
      <button
        onClick={() => { setSelectedAppointment(appointment); setModalError(null); }}
        style={{ 
          top: `${top}px`, 
          height: `calc(${height}px - 2px)`
        }}
        className={`absolute left-1 right-1 p-1.5 rounded-lg border flex flex-col overflow-hidden text-left transition-all hover:shadow-md hover:border-rose-400 ${getStatusColor(appointment.status)}`}
      >
        <div className="font-semibold text-xs truncate">{service?.name || t("service")}</div>
        <div className="flex items-center gap-1 text-xs text-gray-700 mt-1">
          <UserIcon className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{appointment.customerName || t("client")}</span>
        </div>
      </button>
    );
  };

  const MobileAppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const service = services.find((s) => s.id === appointment.serviceId);
    return (
      <div className="w-full text-left p-3 rounded-lg border bg-white">
        <button 
          onClick={() => { setSelectedAppointment(appointment); setModalError(null); }}
          className="w-full text-left"
        >
          <div className="flex justify-between items-start">
              <div>
                  <div className="font-bold">{service?.name || t("service")}</div>
                  <div className="text-sm text-gray-600">
                      {new Date(appointment.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appointment.durationMinutes} мин)
                  </div>
              </div>
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                  {getStatusText(appointment.status)}
              </div>
          </div>
          <div className="mt-2 pt-2 border-t border-current/20 text-sm">
              <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <span>{appointment.customerName || t("client")}</span>
              </div>
          </div>
        </button>
      </div>
    );
  };

  const AppointmentDetailsModal = () => {
    if (!selectedAppointment) return null;

    const service = services.find((s) => s.id === selectedAppointment.serviceId);
    const employee = selectedAppointment.employeeId ? users[selectedAppointment.employeeId] : null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedAppointment(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold">{service?.name || t("appointmentDetails")}</h2>
            <button onClick={() => setSelectedAppointment(null)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {modalError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{modalError}</span>
              </div>
            )}
            <div className="space-y-3 text-gray-700">
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400"/>
                    <span>{new Date(selectedAppointment.startAt).toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400"/>
                    <span>{new Date(selectedAppointment.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({selectedAppointment.durationMinutes} мин)</span>
                </div>
                <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-gray-400"/>
                    <span>{selectedAppointment.customerName || t("client")}</span>
                </div>
                {selectedAppointment.customerPhone && (
                    <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400"/>
                        <span>{selectedAppointment.customerPhone}</span>
                    </div>
                )}
                {employee && (
                    <div className="flex items-center gap-3">
                        <Scissors className="w-5 h-5 text-gray-400"/>
                        <span>{t("master")}: {employee.displayName}</span>
                    </div>
                )}
                {selectedAppointment.notes && (
                    <div className="flex items-start gap-3 pt-2">
                        <FileText className="w-5 h-5 text-gray-400 mt-1"/>
                        <div className="bg-gray-50 p-3 rounded-md border w-full">
                            <p className="font-medium text-sm text-gray-600">{t("comment")}:</p>
                            <p>{selectedAppointment.notes}</p>
                        </div>
                    </div>
                )}
            </div>
            {canManageAppointments && (
              <div>
                  <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">{t("changeStatus")}</label>
                  <select
                      id="status-select"
                      value={selectedAppointment.status}
                      onChange={(e) => handleStatusChange(selectedAppointment.id, e.target.value as Appointment["status"])}
                      className={`w-full px-3 py-2 border rounded-lg font-semibold transition-colors ${getStatusColor(selectedAppointment.status)}`}
                  >
                      <option value="pending">{t("status.pending")}</option>
                      <option value="in_progress">{t("status.in_progress")}</option>
                      <option value="completed">{t("status.completed")}</option>
                  </select>
              </div>
            )}
            {selectedAppointment.customerUserId && (
              <div className="pt-2">
                <SalonChatButton
                  salonId={salonId}
                  customerUserId={selectedAppointment.customerUserId}
                  customerName={selectedAppointment.customerName || t("client")}
                  appointmentId={selectedAppointment.id}
                  serviceId={selectedAppointment.serviceId}
                  className="w-full py-2.5 text-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
                  variant="button"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{salon?.name || t("title")}</h1>
          <p className="text-gray-600 mt-1">
            {t("showingAppointments", { count: filteredAppointments.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
           {success && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
                {t("scheduleSaved")}
              </div>
            )}
          {canManageAppointments && (
            <>
              <button
                onClick={() => setIsManualBookingOpen(true)}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <Plus size={18} />
                {t('createBooking') || 'Создать запись'}
              </button>
              <button
                onClick={() => { setIsScheduleModalOpen(true); setModalError(null); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {t("setupSchedule")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters & Calendar Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentWeekOffset((w) => Math.max(0, w - 1))}
              disabled={currentWeekOffset === 0 || weekLoadingStates[currentWeekOffset - 1]}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              {weekLoadingStates[currentWeekOffset - 1] ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
            <div className="text-center">
              <div className="font-semibold">
                {currentWeekOffset === 0 ? t("currentWeek") : t("week", { weekNum: currentWeekOffset + 1 })}
              </div>
              <div className="text-sm text-gray-500">
                {weekDates[0]?.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} -{" "}
                {weekDates[6]?.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
            <button
              onClick={() => setCurrentWeekOffset((w) => Math.min(maxWeeks, w + 1))}
              disabled={currentWeekOffset === maxWeeks || weekLoadingStates[currentWeekOffset + 1]}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              {weekLoadingStates[currentWeekOffset + 1] ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="flex-1 h-px bg-gray-200 lg:h-auto lg:w-px"></div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">{t("filters.allStatuses")}</option>
              <option value="pending">{t("status.pending")}</option>
              <option value="in_progress">{t("status.in_progress")}</option>
              <option value="completed">{t("status.completed")}</option>
            </select>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">{t("filters.allServices")}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schedule View */}
      {isMobileView ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            {weekLoadingStates[currentWeekOffset] && appointments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 mx-auto mb-2 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-500">{t("loading")}</p>
              </div>
            ) : (
              weekDates.map((date, index) => (
                  <div key={date.toISOString()} className="border-b last:border-b-0 py-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center ${isTodayDate(date) ? 'bg-rose-600 text-white' : 'bg-gray-100'}`}>
                            <span className="text-xs font-medium">{WEEKDAYS[index].shortLabel}</span>
                            <span className="text-lg font-bold">{date.getDate()}</span>
                        </div>
                        <div>
                            <div className="font-semibold">{WEEKDAYS[index].fullLabel}</div>
                            <div className="text-sm text-gray-500">{date.toLocaleDateString('ru-RU', { month: 'long' })}</div>
                        </div>
                    </div>
                    {getAppointmentsForDay(date).length > 0 ? (
                        <div className="space-y-3">
                          {getAppointmentsForDay(date).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()).map(apt => (
                              <MobileAppointmentCard key={apt.id} appointment={apt} />
                          ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>{t("noAppointments")}</p>
                        </div>
                    )}
                  </div>
              ))
            )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto max-w-full">
            <div className="grid grid-cols-8 min-w-[900px] lg:min-w-[1000px]">
                <div className="text-sm text-center text-gray-500">
                    {TIME_SLOTS.map((time) => (
                    <div key={time} className="h-24 flex items-center justify-center">
                        {time}
                    </div>
                    ))}
                </div>
                {weekDates.map((date, dayIndex) => {
                    const dayKey = WEEKDAYS[dayIndex].key;
                    const isToday = isTodayDate(date);
                    const dayAppointments = getAppointmentsForDay(date);

                    return (
                    <div key={dayKey} className="border-l border-gray-200">
                        <div className={`text-center py-2 border-b border-gray-200 ${isToday ? "bg-rose-50" : ""}`}>
                            <div className="font-semibold">{WEEKDAYS[dayIndex].label}</div>
                            <div className={`text-xl font-bold ${isToday ? "text-rose-600" : ""}`}>
                                {date.getDate()}
                            </div>
                        </div>
                        <div className="relative">
                            {TIME_SLOTS.map((time) => (
                                <div
                                    key={time}
                                    className="h-24 border-b border-gray-100 border-dashed"
                                ></div>
                            ))}
                            <div className="absolute inset-0">
                                {weekLoadingStates[currentWeekOffset] && dayAppointments.length === 0 ? (
                                  <div className="flex items-center justify-center h-full">
                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                  </div>
                                ) : (
                                  dayAppointments.map((apt) => (
                                      <PositionedAppointmentCard key={apt.id} appointment={apt} />
                                  ))
                                )}
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* Modals */}
      <AppointmentDetailsModal />

      {isManualBookingOpen && (
        <ManualBookingModal
          isOpen={isManualBookingOpen}
          onClose={() => setIsManualBookingOpen(false)}
          salonId={salonId}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {isScheduleModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">{t("scheduleSetup")}</h2>
                <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {modalError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{modalError}</span>
                  </div>
                )}
                <div className="space-y-6">
                  {weeklySchedule.map((d, i) => (
                      <div key={d.day} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-4 mb-3">
                          <span className="font-semibold w-32">{WEEKDAYS.find(w => w.key === d.day)?.fullLabel}</span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={d.isOpen}
                              onChange={e => handleOpenToggle(i, e.target.checked)}
                            />
                            <span className="text-sm">{t("open")}</span>
                          </label>
                        </div>
                        {d.isOpen && (
                          <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                            {(d.times || []).map((t, j) => (
                              <div key={j} className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={t.start}
                                  onChange={e => handleTimeChange(i, j, "start", e.target.value)}
                                  className="px-2 py-1 border rounded-md text-sm w-28"
                                />
                                <span>—</span>
                                <input
                                  type="time"
                                  value={t.end}
                                  onChange={e => handleTimeChange(i, j, "end", e.target.value)}
                                  className="px-2 py-1 border rounded-md text-sm w-28"
                                />
                                <button onClick={() => handleRemoveInterval(i, j)} className="text-red-500 hover:text-red-700 p-1">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => handleAddInterval(i)} className="text-blue-600 text-sm font-medium mt-2">
                              {t("addInterval")}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                <button onClick={() => setIsScheduleModalOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300">
                  {t("cancel")}
                </button>
                <button onClick={handleSaveSchedule} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                  {t("save")}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}