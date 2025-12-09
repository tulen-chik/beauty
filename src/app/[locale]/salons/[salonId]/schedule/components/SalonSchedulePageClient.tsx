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
import dynamic from "next/dynamic";

// Динамический импорт тяжелой модалки (код загрузится только при клике)
const ManualBookingModal = dynamic(() => import("./ManualBookingModal"), {
  loading: () => <div className="fixed inset-0 bg-black/20 z-50" />,
  ssr: false
});

// --- CONTEXT HOOKS ---
import { useAppointment } from "@/contexts/AppointmentContext";
import { useSalonSchedule } from "@/contexts/SalonScheduleContext";
import { useUser } from "@/contexts/UserContext";

// --- TYPE DEFINITIONS ---
import { Salon, SalonWorkDay, WeekDay } from "@/types/database";
import type { User } from "@/types/user";

// --- NEW COMPONENTS ---
import ScheduleHeader from "./ScheduleHeader";
import ScheduleFilters from "./ScheduleFilters";
import MobileScheduleView from "./MobileScheduleView";
import DesktopScheduleView from "./DesktopScheduleView";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import ScheduleSetupModal from "./ScheduleSetupModal";

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
  // Removed inline components as they are now in separate files

  // --- MAIN RENDER ---
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <ScheduleHeader
        salon={salon}
        filteredAppointmentsCount={filteredAppointments.length}
        success={success}
        canManageAppointments={canManageAppointments}
        t={t}
        onCreateBooking={() => setIsManualBookingOpen(true)}
        onSetupSchedule={() => { setIsScheduleModalOpen(true); setModalError(null); }}
      />

      <ScheduleFilters
        currentWeekOffset={currentWeekOffset}
        maxWeeks={maxWeeks}
        weekLoadingStates={weekLoadingStates}
        weekDates={weekDates}
        statusFilter={statusFilter}
        serviceFilter={serviceFilter}
        services={services}
        t={t}
        onWeekChange={setCurrentWeekOffset}
        onStatusFilterChange={setStatusFilter}
        onServiceFilterChange={setServiceFilter}
      />

      {isMobileView ? (
        <MobileScheduleView
          weekDates={weekDates}
          weekLoadingStates={weekLoadingStates}
          currentWeekOffset={currentWeekOffset}
          appointments={appointments}
          services={services}
          t={t}
          onAppointmentClick={(appointment) => { setSelectedAppointment(appointment); setModalError(null); }}
          getAppointmentsForDay={getAppointmentsForDay}
          isTodayDate={isTodayDate}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      ) : (
        <DesktopScheduleView
          weekDates={weekDates}
          weekLoadingStates={weekLoadingStates}
          currentWeekOffset={currentWeekOffset}
          appointments={appointments}
          services={services}
          t={t}
          onAppointmentClick={(appointment) => { setSelectedAppointment(appointment); setModalError(null); }}
          getAppointmentsForDay={getAppointmentsForDay}
          isTodayDate={isTodayDate}
          getStatusColor={getStatusColor}
        />
      )}

      <AppointmentDetailsModal
        appointment={selectedAppointment}
        services={services}
        users={users}
        modalError={modalError}
        canManageAppointments={canManageAppointments}
        salonId={salonId}
        t={t}
        onClose={() => setSelectedAppointment(null)}
        onStatusChange={handleStatusChange}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
      />

      {isManualBookingOpen && (
        <ManualBookingModal
          isOpen={isManualBookingOpen}
          onClose={() => setIsManualBookingOpen(false)}
          salonId={salonId}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      <ScheduleSetupModal
        isOpen={isScheduleModalOpen}
        weeklySchedule={weeklySchedule}
        modalError={modalError}
        t={t}
        onClose={() => setIsScheduleModalOpen(false)}
        onSave={handleSaveSchedule}
        onOpenToggle={handleOpenToggle}
        onTimeChange={handleTimeChange}
        onAddInterval={handleAddInterval}
        onRemoveInterval={handleRemoveInterval}
      />
    </div>
  );
}