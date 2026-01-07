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
  User,
  X,
  Check,
  Filter
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

// --- COMPONENTS ---
import ChatButton from "@/components/ChatButton";

import { useAppointment } from "@/contexts/AppointmentContext";
import { useSalon } from "@/contexts/SalonContext";
import { useSalonSchedule } from "@/contexts/SalonScheduleContext";
import { useSalonService } from "@/contexts/SalonServiceContext";
// --- CONTEXT HOOKS ---
import { useUser } from "@/contexts/UserContext";

import ManualBookingModal from "./components/ManualBookingModal";

// --- TYPE DEFINITIONS ---
import { Salon, SalonWorkDay, WeekDay } from "@/types/database";

// --- SKELETONS ---
const MobileViewSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-6">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="border-b border-slate-100 last:border-0 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-3">
           <div className="h-20 w-full bg-slate-50 rounded-xl animate-pulse"></div>
           <div className="h-20 w-full bg-slate-50 rounded-xl animate-pulse"></div>
        </div>
      </div>
    ))}
  </div>
);

const DesktopViewSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="grid grid-cols-8 min-w-[1000px]">
      <div className="border-r border-slate-100">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-24 flex items-center justify-center border-b border-slate-50">
            <div className="h-4 w-8 bg-slate-100 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
      {[...Array(7)].map((_, i) => (
        <div key={i} className="border-r border-slate-100 last:border-0">
          <div className="h-14 border-b border-slate-200 bg-slate-50/50"></div>
          <div className="relative">
            {[...Array(10)].map((_, j) => (
              <div key={j} className="h-24 border-b border-slate-50"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SalonSchedulePageSkeleton = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="h-10 w-64 bg-slate-200 rounded-xl animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
      <div className="h-20 w-full bg-slate-100 rounded-2xl animate-pulse"></div>
      {isMobile ? <MobileViewSkeleton /> : <DesktopViewSkeleton />}
    </div>
  );
};

// --- TYPES ---
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

type UserInfo = {
  userId: string;
  displayName: string;
  email: string;
};

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

const SLOT_HEIGHT_PX = 80; // Increased for better readability
const MINUTES_PER_SLOT = 30;
const PX_PER_MINUTE = SLOT_HEIGHT_PX / MINUTES_PER_SLOT;

const timeToMinutes = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const DAY_START_MINUTES = timeToMinutes(TIME_SLOTS[0]);

export default function SalonSchedulePage() {
  const params = useParams() as { salonId: string; locale: string };
  const { salonId } = params;
  const t = useTranslations("salonSchedule");

  const [salon, setSalon] = useState<Salon | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<SalonWorkDay[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const maxWeeks = 3;

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  const { getSchedule, updateSchedule } = useSalonSchedule();
  const { listAppointmentsByDay, updateAppointment } = useAppointment();
  const { currentUser, getUserById } = useUser();
  const { fetchSalon } = useSalon();
  const { getServicesBySalon } = useSalonService();

  useEffect(() => {
    const loadSalonData = async () => {
      try {
        const salonData = await fetchSalon(salonId);
        setSalon(salonData);
      } catch (error) {
        console.error('Error loading salon data:', error);
      }
    };
    loadSalonData();
  }, [salonId, fetchSalon]);

  useEffect(() => {
    const loadScheduleData = async () => {
      setLoading(true);
      setError(null);
      try {
        const schedule = await getSchedule(salonId);
        setWeeklySchedule(
          schedule?.weeklySchedule ||
          WEEKDAYS.map((d) => ({
            day: d.key as WeekDay,
            isOpen: false,
            times: [],
          }))
        );

        const svcs = await getServicesBySalon(salonId);
        setServices(svcs);

        const weekDates = getWeekDates(currentWeekOffset);
        const allAppointments = (
          await Promise.all(
            weekDates.map(date => listAppointmentsByDay(salonId, date))
          )
        ).flat();
        setAppointments(allAppointments);

        const userIds = new Set<string>();
        allAppointments.forEach((apt) => {
          if (apt.employeeId) userIds.add(apt.employeeId);
          if (apt.customerUserId) userIds.add(apt.customerUserId);
        });

        const userData: Record<string, UserInfo> = {};
        await Promise.all(
          Array.from(userIds).map(async (userId) => {
            try {
              const user = await getUserById(userId);
              if (user) userData[userId] = { userId, displayName: user.displayName, email: user.email };
            } catch (err) {
              console.warn(`Could not load user ${userId}`, err);
            }
          })
        );
        setUsers(userData);
      } catch (err: unknown) {
        console.error("Ошибка загрузки данных расписания:", err);
        const errorMessage = err instanceof Error ? err.message : "Произошла неизвестная ошибка";
        setError(`Не удалось загрузить данные: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    loadScheduleData();
  }, [salonId, currentWeekOffset, getSchedule, getServicesBySalon, listAppointmentsByDay, getUserById]);

  const isSalonOwner = useMemo(() => 
    salon?.members?.some(
      member => member.userId === currentUser?.userId && member.role === 'owner'
    ), 
    [salon, currentUser]
  );
  const canManageAppointments = currentUser?.role === 'admin' || isSalonOwner;

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (statusFilter !== "all" && apt.status !== statusFilter) return false;
      if (serviceFilter !== "all" && apt.serviceId !== serviceFilter) return false;
      return true;
    });
  }, [appointments, statusFilter, serviceFilter]);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const today = new Date();
  const isTodayDate = (date: Date) => date.toDateString() === today.toDateString();

  const getWeekDates = (weekOffset: number) => {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates(currentWeekOffset);
  
  const getAppointmentsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    return filteredAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startAt);
      return appointmentDate >= dayStart && appointmentDate < dayEnd;
    });
  };

  const getStatusStyles = (status: string) => {
    const styles = {
      completed: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", indicator: "bg-emerald-500" },
      in_progress: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", indicator: "bg-blue-500" },
      pending: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", indicator: "bg-amber-500" },
    };
    return styles[status as keyof typeof styles] || { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", indicator: "bg-slate-400" };
  };

  const getStatusText = (status: string) => t(`status.${status}`) || status;

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
    } catch (e: unknown) {
      console.error("Ошибка сохранения расписания:", e);
      const errorMessage = e instanceof Error ? e.message : "Не удалось сохранить расписание.";
      setModalError(errorMessage);
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
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error("Ошибка обновления статуса записи:", err);
      const errorMessage = err instanceof Error ? err.message : "Не удалось обновить статус.";
      setModalError(errorMessage);
    }
  };
  
  const handleBookingSuccess = () => {
    setIsManualBookingOpen(false);
    setCurrentWeekOffset(prev => prev); 
  };

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

  if (loading) {
    return <SalonSchedulePageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{t("error")}</h3>
        <p className="text-slate-500 mb-6 max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-medium"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  const PositionedAppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const service = services.find((s) => s.id === appointment.serviceId);
    const appointmentStart = new Date(appointment.startAt);
    const startTimeString = appointmentStart.toTimeString().substring(0, 5);
    const startMinutes = timeToMinutes(startTimeString);

    const top = (startMinutes - DAY_START_MINUTES) * PX_PER_MINUTE;
    const height = appointment.durationMinutes * PX_PER_MINUTE;
    const styles = getStatusStyles(appointment.status);

    return (
      <button
        onClick={() => { setSelectedAppointment(appointment); setModalError(null); }}
        style={{ 
          top: `${top}px`, 
          height: `calc(${height}px - 2px)`
        }}
        className={`absolute left-1 right-1 rounded-lg border-l-4 flex flex-col overflow-hidden text-left transition-all hover:shadow-lg hover:z-10 group ${styles.bg} ${styles.border} border-t border-r border-b`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.indicator}`}></div>
        <div className="p-2 h-full flex flex-col">
          <div className="font-bold text-xs text-slate-900 truncate leading-tight mb-0.5">
            {service?.name || t("service")}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-600">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{appointment.customerName || t("client")}</span>
          </div>
          {height > 40 && (
             <div className={`mt-auto pt-1 text-[10px] font-medium ${styles.text}`}>
              {getStatusText(appointment.status)}
            </div>
          )}
        </div>
      </button>
    );
  };

  const MobileAppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const service = services.find((s) => s.id === appointment.serviceId);
    const styles = getStatusStyles(appointment.status);

    return (
      <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button 
          onClick={() => { setSelectedAppointment(appointment); setModalError(null); }}
          className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex justify-between items-start gap-3 mb-2">
              <div>
                  <div className="font-bold text-slate-900 text-base">{service?.name || t("service")}</div>
                  <div className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(appointment.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                      <span className="text-slate-300">•</span>
                      {appointment.durationMinutes} мин
                  </div>
              </div>
              <div className={`text-xs font-bold px-2.5 py-1 rounded-full border ${styles.bg} ${styles.text} ${styles.border}`}>
                  {getStatusText(appointment.status)}
              </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
              <div className="p-1.5 bg-slate-100 rounded-full">
                <User className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <span>{appointment.customerName || t("client")}</span>
          </div>
        </button>
        {appointment.customerUserId && (
          <div className="px-4 pb-4">
            <ChatButton
              salonId={salonId}
              customerUserId={appointment.customerUserId}
              customerName={appointment.customerName || "Клиент"}
              appointmentId={appointment.id}
              serviceId={appointment.serviceId}
              className="w-full py-2.5 text-center rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-sm transition-colors"
              variant="button"
            />
          </div>
        )}
      </div>
    );
  };
  
  const MobileDayView = ({ date, dayIndex }: { date: Date, dayIndex: number }) => {
    const dayAppointments = getAppointmentsForDay(date);
    const isToday = isTodayDate(date);

    return (
        <div className="border-b border-slate-100 last:border-0 py-6">
            <div className="flex items-center gap-4 mb-5 px-2">
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm border ${isToday ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200'}`}>
                    <span className="text-xs font-medium uppercase tracking-wide opacity-80">{WEEKDAYS[dayIndex].shortLabel}</span>
                    <span className="text-xl font-bold leading-none mt-0.5">{date.getDate()}</span>
                </div>
                <div>
                    <div className={`font-bold text-lg ${isToday ? 'text-rose-600' : 'text-slate-900'}`}>
                      {WEEKDAYS[dayIndex].fullLabel}
                    </div>
                    <div className="text-sm text-slate-500 font-medium">
                      {date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>
            {dayAppointments.length > 0 ? (
                <div className="space-y-3 pl-2">
                    {dayAppointments.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()).map(apt => (
                        <MobileAppointmentCard key={apt.id} appointment={apt} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 mx-2">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-slate-500 text-sm font-medium">{t("noAppointments")}</p>
                </div>
            )}
        </div>
    );
  };

  const AppointmentDetailsModal = () => {
    if (!selectedAppointment) return null;

    const service = services.find((s) => s.id === selectedAppointment.serviceId);
    const employee = selectedAppointment.employeeId ? users[selectedAppointment.employeeId] : null;
    const styles = getStatusStyles(selectedAppointment.status);

    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedAppointment(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">{service?.name || t("appointmentDetails")}</h2>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles.bg} ${styles.text} ${styles.border}`}>
                {getStatusText(selectedAppointment.status)}
              </div>
            </div>
            <button onClick={() => setSelectedAppointment(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-5">
            {modalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{modalError}</span>
              </div>
            )}
            
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-700">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                      <Calendar className="w-5 h-5"/>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Дата</p>
                      <p className="font-semibold">{new Date(selectedAppointment.startAt).toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                      <Clock className="w-5 h-5"/>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Время</p>
                      <p className="font-semibold">{new Date(selectedAppointment.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} <span className="text-slate-400 font-normal">({selectedAppointment.durationMinutes} мин)</span></p>
                    </div>
                </div>
                
                <div className="h-px bg-slate-100 w-full my-2"></div>

                <div className="flex items-center gap-3 text-slate-700">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                      <User className="w-5 h-5"/>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Клиент</p>
                      <p className="font-semibold">{selectedAppointment.customerName || t("client")}</p>
                    </div>
                </div>
                {selectedAppointment.customerPhone && (
                    <div className="flex items-center gap-3 text-slate-700">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                          <Phone className="w-5 h-5"/>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Телефон</p>
                          <p className="font-semibold">{selectedAppointment.customerPhone}</p>
                        </div>
                    </div>
                )}
                {employee && (
                    <div className="flex items-center gap-3 text-slate-700">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                          <Scissors className="w-5 h-5"/>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">{t("master")}</p>
                          <p className="font-semibold">{employee.displayName}</p>
                        </div>
                    </div>
                )}
                {selectedAppointment.notes && (
                    <div className="mt-2 bg-amber-50 border border-amber-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-amber-800 font-medium mb-1 text-sm">
                          <FileText className="w-4 h-4"/>
                          {t("comment")}
                        </div>
                        <p className="text-sm text-amber-900/80">{selectedAppointment.notes}</p>
                    </div>
                )}
            </div>

            {canManageAppointments && (
              <div className="pt-2">
                  <label htmlFor="status-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("changeStatus")}</label>
                  <div className="relative">
                    <select
                        id="status-select"
                        value={selectedAppointment.status}
                        onChange={(e) => handleStatusChange(selectedAppointment.id, e.target.value as Appointment["status"])}
                        className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all cursor-pointer"
                    >
                        <option value="pending">{t("status.pending")}</option>
                        <option value="in_progress">{t("status.in_progress")}</option>
                        <option value="completed">{t("status.completed")}</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
              </div>
            )}
            
            {selectedAppointment.customerUserId && (
              <div className="pt-2">
                <ChatButton
                  salonId={salonId}
                  customerUserId={selectedAppointment.customerUserId}
                  customerName={selectedAppointment.customerName || t("client")}
                  appointmentId={selectedAppointment.id}
                  serviceId={selectedAppointment.serviceId}
                  className="w-full py-3 text-center rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-semibold shadow-lg shadow-rose-200 transition-all active:scale-95"
                  variant="button"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{salon?.name || t("title")}</h1>
            <p className="text-slate-500 mt-1 font-medium">
              {t("showingAppointments", { count: filteredAppointments.length })}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             {success && (
                <div className="bg-emerald-100 text-emerald-800 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <Check className="w-4 h-4" />
                  {t("scheduleSaved")}
                </div>
              )}
            {canManageAppointments && (
              <>
                <button
                  onClick={() => setIsManualBookingOpen(true)}
                  className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-200 font-semibold active:scale-95"
                >
                  <Plus size={18} />
                  {t('createBooking') || 'Создать запись'}
                </button>
                <button
                  onClick={() => { setIsScheduleModalOpen(true); setModalError(null); }}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Settings className="h-4 w-4" />
                  {t("setupSchedule")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          {/* Week Navigation */}
          <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
            <button
              onClick={() => setCurrentWeekOffset((w) => Math.max(0, w - 1))}
              disabled={currentWeekOffset === 0}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-slate-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 text-center min-w-[180px]">
              <div className="font-bold text-slate-800 text-sm">
                {currentWeekOffset === 0 ? t("currentWeek") : t("week", { weekNum: currentWeekOffset + 1 })}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {weekDates[0]?.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} -{" "}
                {weekDates[6]?.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
            <button
              onClick={() => setCurrentWeekOffset((w) => Math.min(maxWeeks, w + 1))}
              disabled={currentWeekOffset === maxWeeks}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-slate-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto px-2 lg:px-0">
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent appearance-none cursor-pointer hover:border-slate-300 transition-colors"
              >
                <option value="all">{t("filters.allStatuses")}</option>
                <option value="pending">{t("status.pending")}</option>
                <option value="in_progress">{t("status.in_progress")}</option>
                <option value="completed">{t("status.completed")}</option>
              </select>
            </div>
            <div className="relative w-full sm:w-48">
              <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent appearance-none cursor-pointer hover:border-slate-300 transition-colors"
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
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              {weekDates.map((date, index) => (
                  <MobileDayView key={date.toISOString()} date={date} dayIndex={index} />
              ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 min-w-[1200px]">
                    {/* Time Column */}
                    <div className="bg-slate-50/50 border-r border-slate-100">
                        <div className="h-16 border-b border-slate-200"></div> {/* Header spacer */}
                        {TIME_SLOTS.map((time) => (
                        <div key={time} className="flex items-center justify-center text-xs font-medium text-slate-400 border-b border-slate-100 border-dashed" style={{ height: `${SLOT_HEIGHT_PX}px` }}>
                            {time}
                        </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    {weekDates.map((date, dayIndex) => {
                        const dayKey = WEEKDAYS[dayIndex].key;
                        const isToday = isTodayDate(date);
                        const dayAppointments = getAppointmentsForDay(date);

                        return (
                        <div key={dayKey} className="border-r border-slate-100 last:border-0 relative group">
                            {/* Day Header */}
                            <div className={`sticky top-0 z-20 text-center py-3 border-b border-slate-200 transition-colors ${isToday ? "bg-rose-50/80 backdrop-blur-sm" : "bg-white group-hover:bg-slate-50/50"}`}>
                                <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isToday ? "text-rose-600" : "text-slate-500"}`}>
                                  {WEEKDAYS[dayIndex].label}
                                </div>
                                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold ${isToday ? "bg-rose-600 text-white shadow-md shadow-rose-200" : "text-slate-900"}`}>
                                    {date.getDate()}
                                </div>
                            </div>

                            {/* Grid & Appointments */}
                            <div className="relative bg-white">
                                {TIME_SLOTS.map((time) => (
                                    <div
                                        key={time}
                                        className="border-b border-slate-100 border-dashed w-full"
                                        style={{ height: `${SLOT_HEIGHT_PX}px` }}
                                    ></div>
                                ))}
                                
                                {/* Current Time Indicator (if today) */}
                                {isToday && (
                                  <div 
                                    className="absolute left-0 right-0 border-t-2 border-rose-500 z-10 pointer-events-none opacity-50"
                                    style={{ top: `${(timeToMinutes(new Date().toTimeString().substring(0, 5)) - DAY_START_MINUTES) * PX_PER_MINUTE}px` }}
                                  >
                                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-rose-500 rounded-full"></div>
                                  </div>
                                )}

                                <div className="absolute inset-0 mx-1">
                                    {dayAppointments.map((apt) => (
                                        <PositionedAppointmentCard key={apt.id} appointment={apt} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
              </div>
          </div>
        )}
        
        {/* Modals */}
        <AppointmentDetailsModal />

        <ManualBookingModal
          isOpen={isManualBookingOpen}
          onClose={() => setIsManualBookingOpen(false)}
          salonId={params.salonId}
          onBookingSuccess={handleBookingSuccess}
        />

        {isScheduleModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{t("scheduleSetup")}</h2>
                    <p className="text-sm text-slate-500 mt-1">Настройте рабочие дни и часы приема</p>
                  </div>
                  <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto bg-slate-50/30">
                  {modalError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3 mb-6">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{modalError}</span>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {weeklySchedule.map((d, i) => (
                        <div key={d.day} className={`border rounded-xl p-5 transition-all ${d.isOpen ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                            <div className="flex items-center gap-3 min-w-[180px]">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${d.isOpen ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                                {WEEKDAYS.find(w => w.key === d.day)?.shortLabel}
                              </div>
                              <span className={`font-semibold ${d.isOpen ? 'text-slate-900' : 'text-slate-500'}`}>
                                {WEEKDAYS.find(w => w.key === d.day)?.fullLabel}
                              </span>
                            </div>
                            
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={d.isOpen}
                                  onChange={e => handleOpenToggle(i, e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </div>
                              <span className="text-sm font-medium text-slate-600">{d.isOpen ? t("open") : "Выходной"}</span>
                            </label>
                          </div>

                          {d.isOpen && (
                            <div className="pl-0 sm:pl-[52px] space-y-3">
                              {(d.times || []).map((t, j) => (
                                <div key={j} className="flex items-center gap-3 animate-in slide-in-from-left-2">
                                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                    <input
                                      type="time"
                                      value={t.start}
                                      onChange={e => handleTimeChange(i, j, "start", e.target.value)}
                                      className="px-2 py-1 bg-white border border-slate-200 rounded-md text-sm w-24 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <span className="text-slate-400 font-medium">—</span>
                                    <input
                                      type="time"
                                      value={t.end}
                                      onChange={e => handleTimeChange(i, j, "end", e.target.value)}
                                      className="px-2 py-1 bg-white border border-slate-200 rounded-md text-sm w-24 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                  </div>
                                  <button 
                                    onClick={() => handleRemoveInterval(i, j)} 
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Удалить интервал"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={() => handleAddInterval(i)} 
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                <Plus className="w-4 h-4" />
                                {t("addInterval")}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-white">
                  <button 
                    onClick={() => setIsScheduleModalOpen(false)} 
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                  >
                    {t("cancel")}
                  </button>
                  <button 
                    onClick={handleSaveSchedule} 
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                  >
                    {t("save")}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}