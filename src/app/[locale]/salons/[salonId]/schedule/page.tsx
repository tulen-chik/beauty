"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Phone,
  Scissors,
  Settings,
  User,
  X,
  MessageCircle,
} from "lucide-react";

import { useAppointment } from "@/contexts/AppointmentContext";
import { useSalonSchedule } from "@/contexts/SalonScheduleContext";
import { useSalonService } from "@/contexts/SalonServiceContext";
import { useUser } from "@/contexts/UserContext";
import { useChat } from "@/contexts/ChatContext";
import ChatButton from "@/components/ChatButton";
import { SalonWorkDay, WeekDay } from "@/types/database";

// --- TYPE DEFINITIONS ---

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
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
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

type User = {
  userId: string;
  displayName: string;
  email: string;
};

// --- CONSTANTS ---

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

// --- CALENDAR GRID CONSTANTS ---
const SLOT_HEIGHT_IN_REM = 6; // Corresponds to h-24 in Tailwind
const MINUTES_PER_SLOT = 30;
const REM_IN_PX = 16; // Standard browser default
const SLOT_HEIGHT_PX = SLOT_HEIGHT_IN_REM * REM_IN_PX;
const PX_PER_MINUTE = SLOT_HEIGHT_PX / MINUTES_PER_SLOT;

// --- HELPER FUNCTIONS ---
const timeToMinutes = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const DAY_START_MINUTES = timeToMinutes(TIME_SLOTS[0]);


// --- MAIN COMPONENT ---

export default function SalonSchedulePage() {
  const params = useParams() as { salonId: string };
  const { salonId } = params;
  const t = useTranslations("salonSchedule");

  // --- HOOKS ---
  const { getSchedule, updateSchedule } = useSalonSchedule();
  const { listAppointmentsByDay, updateAppointment } = useAppointment();
  const { getServicesBySalon } = useSalonService();
  const { getUserById } = useUser();
  const { currentUser } = useUser();
  const { createOrGetChat } = useChat();

  // --- STATE MANAGEMENT ---
  const [weeks, setWeeks] = useState<SalonWorkDay[][]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [currentWeek, setCurrentWeek] = useState(0);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const maxWeeks = 3;

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  // --- DATA FETCHING ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const schedule = await getSchedule(salonId);
        if (schedule && schedule.weeks) {
          setWeeks(schedule.weeks);
        } else {
          setWeeks(
            Array.from({ length: maxWeeks + 1 }, () =>
              WEEKDAYS.map((d) => ({
                day: d.key as WeekDay,
                isOpen: false,
                times: [],
              }))
            )
          );
        }

        const svcs = await getServicesBySalon(salonId);
        setServices(svcs);

        const weekDates = getWeekDates(currentWeek);
        const allAppointments: Appointment[] = [];
        for (const date of weekDates) {
          const dayAppointments = await listAppointmentsByDay(salonId, date);
          allAppointments.push(...dayAppointments);
        }
        setAppointments(allAppointments);

        const userIds = new Set<string>();
        allAppointments.forEach((apt) => {
          if (apt.employeeId) userIds.add(apt.employeeId);
          if (apt.customerUserId) userIds.add(apt.customerUserId);
        });

        const userData: Record<string, User> = {};
        for (const userId of Array.from(userIds)) {
          try {
            const user = await getUserById(userId);
            if (user) userData[userId] = { userId, displayName: user.displayName, email: user.email };
          } catch (err) {
            console.warn(`Could not load user ${userId}`, err);
          }
        }
        setUsers(userData);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [salonId, currentWeek, getSchedule, getServicesBySalon, listAppointmentsByDay, getUserById]);

  // --- RESPONSIVE CHECK ---
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // --- FILTERING LOGIC ---
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (statusFilter !== "all" && apt.status !== statusFilter) return false;
      if (serviceFilter !== "all" && apt.serviceId !== serviceFilter) return false;
      return true;
    });
  }, [appointments, statusFilter, serviceFilter]);

  // --- HELPER & UTILITY FUNCTIONS ---
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

  const weekDates = getWeekDates(currentWeek);
  
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

  const isTimeInWorkingHours = (dayData: any, timeSlot: string) => {
    if (!dayData?.isOpen || !dayData.times) return false;
    return dayData.times.some((interval: any) => timeSlot >= interval.start && timeSlot < interval.end);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      confirmed: "bg-blue-100 text-blue-800 border-blue-300",
      completed: "bg-green-100 text-green-800 border-green-300",
      cancelled: "bg-red-100 text-red-800 border-red-300",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      no_show: "bg-orange-100 text-orange-800 border-orange-300",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getStatusText = (status: string) => t(`status.${status}`) || status;

  // --- EVENT HANDLERS ---
  const handleSaveSchedule = async () => {
    try {
      await updateSchedule(salonId, { salonId, weeks, updatedAt: new Date().toISOString() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      setIsScheduleModalOpen(false);
    } catch (e) {
      setError("Failed to save schedule");
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment["status"]) => {
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
      setError(err instanceof Error ? err.message : "Could not update status");
    }
  };

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

  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{t("error")}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  // --- SUB-COMPONENTS ---

  const PositionedAppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const service = services.find((s) => s.id === appointment.serviceId);
    const appointmentStart = new Date(appointment.startAt);
    const startTimeString = appointmentStart.toTimeString().substring(0, 5);
    const startMinutes = timeToMinutes(startTimeString);

    const top = (startMinutes - DAY_START_MINUTES) * PX_PER_MINUTE;
    const height = appointment.durationMinutes * PX_PER_MINUTE;

    return (
      <button
        onClick={() => setSelectedAppointment(appointment)}
        style={{ 
          top: `${top}px`, 
          height: `calc(${height}px - 2px)` // Subtract 2px for top/bottom borders
        }}
        className={`absolute left-1 right-1 p-1.5 rounded-lg border flex flex-col overflow-hidden text-left transition-all hover:shadow-md hover:border-rose-400 ${getStatusColor(appointment.status)}`}
      >
        <div className="font-semibold text-xs truncate">{service?.name || t("service")}</div>
        <div className="flex items-center gap-1 text-xs text-gray-700 mt-1">
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{appointment.customerName || t("client")}</span>
        </div>
        <div className="mt-auto pt-1 text-xs font-medium">
          {getStatusText(appointment.status)}
        </div>
      </button>
    );
  };

  const MobileAppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const service = services.find((s) => s.id === appointment.serviceId);
    return (
      <div className="w-full text-left p-3 rounded-lg border bg-white">
        <button 
          onClick={() => setSelectedAppointment(appointment)} 
          className={`w-full text-left ${getStatusColor(appointment.status)}`}
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
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{appointment.customerName || t("client")}</span>
              </div>
          </div>
        </button>
        {appointment.customerUserId && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <ChatButton
              salonId={salonId}
              customerUserId={appointment.customerUserId}
              customerName={appointment.customerName || "Клиент"}
              appointmentId={appointment.id}
              serviceId={appointment.serviceId}
              className="w-full py-2 text-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium text-sm"
              variant="button"
            />
          </div>
        )}
      </div>
    );
  };
  
  const MobileDayView = ({ date, dayIndex }: { date: Date, dayIndex: number }) => {
    const dayAppointments = getAppointmentsForDay(date);
    return (
        <div className="border-b last:border-b-0 py-4">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center ${isTodayDate(date) ? 'bg-rose-600 text-white' : 'bg-gray-100'}`}>
                    <span className="text-xs font-medium">{WEEKDAYS[dayIndex].shortLabel}</span>
                    <span className="text-lg font-bold">{date.getDate()}</span>
                </div>
                <div>
                    <div className="font-semibold">{WEEKDAYS[dayIndex].fullLabel}</div>
                    <div className="text-sm text-gray-500">{date.toLocaleDateString('ru-RU', { month: 'long' })}</div>
                </div>
            </div>
            {dayAppointments.length > 0 ? (
                <div className="space-y-3">
                    {dayAppointments.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()).map(apt => (
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
    );
  };

  const AppointmentDetailsModal = () => {
    if (!selectedAppointment) return null;

    const service = services.find((s) => s.id === selectedAppointment.serviceId);
    const employee = selectedAppointment.employeeId ? users[selectedAppointment.employeeId] : null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedAppointment(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{service?.name || t("appointmentDetails")}</h2>
            <button onClick={() => setSelectedAppointment(null)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
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
                    <User className="w-5 h-5 text-gray-400"/>
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
            <div>
                <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">{t("changeStatus")}</label>
                <select
                    id="status-select"
                    value={selectedAppointment.status}
                    onChange={(e) => handleStatusChange(selectedAppointment.id, e.target.value as Appointment["status"])}
                    className={`w-full px-3 py-2 border rounded-lg font-semibold transition-colors ${getStatusColor(selectedAppointment.status)}`}
                >
                    <option value="pending">{t("status.pending")}</option>
                    <option value="confirmed">{t("status.confirmed")}</option>
                    <option value="completed">{t("status.completed")}</option>
                    <option value="cancelled">{t("status.cancelled")}</option>
                    <option value="no_show">{t("status.no_show")}</option>
                </select>
            </div>
            {selectedAppointment.customerUserId && (
              <div className="pt-2">
                <ChatButton
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
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
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {t("setupSchedule")}
          </button>
        </div>
      </div>

      {/* Filters & Calendar Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentWeek((w) => Math.max(0, w - 1))}
              disabled={currentWeek === 0}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="font-semibold">
                {currentWeek === 0 ? t("currentWeek") : t("week", { weekNum: currentWeek + 1 })}
              </div>
              <div className="text-sm text-gray-500">
                {weekDates[0]?.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} -{" "}
                {weekDates[6]?.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
            <button
              onClick={() => setCurrentWeek((w) => Math.min(maxWeeks, w + 1))}
              disabled={currentWeek === maxWeeks}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
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
              <option value="confirmed">{t("status.confirmed")}</option>
              <option value="completed">{t("status.completed")}</option>
              <option value="cancelled">{t("status.cancelled")}</option>
              <option value="no_show">{t("status.no_show")}</option>
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
            {weekDates.map((date, index) => (
                <MobileDayView key={date.toISOString()} date={date} dayIndex={index} />
            ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
            <div className="grid grid-cols-8 min-w-[1200px]">
                <div className="text-sm text-center text-gray-500">
                    {TIME_SLOTS.map((time) => (
                    <div key={time} className="h-24 flex items-center justify-center">
                        {time}
                    </div>
                    ))}
                </div>
                {weekDates.map((date, dayIndex) => {
                    const dayKey = WEEKDAYS[dayIndex].key;
                    const dayData = weeks[currentWeek]?.find((d) => d.day === dayKey);
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
                            {TIME_SLOTS.map((time) => {
                                const isWorking = isTimeInWorkingHours(dayData, time);
                                return (
                                <div
                                    key={time}
                                    className={`h-24 border-b border-dashed ${
                                    isWorking ? "bg-blue-50/50" : "bg-gray-50/50"
                                    }`}
                                ></div>
                                );
                            })}
                            <div className="absolute inset-0">
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
      )}
      
      {/* Modals */}
      <AppointmentDetailsModal />
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
                <div className="space-y-6">
                  {weeks[currentWeek]?.map((d, i) => {
                    const safeDay = {
                      day: d?.day || WEEKDAYS[i]?.key,
                      isOpen: d?.isOpen || false,
                      times: (d?.times || []).map(time => ({
                        start: time.start || "09:00",
                        end: time.end || "18:00"
                      }))
                    };
                    return (
                      <div key={safeDay.day} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-4 mb-3">
                          <span className="font-semibold w-32">{WEEKDAYS.find(w => w.key === safeDay.day)?.fullLabel}</span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={safeDay.isOpen}
                              onChange={e => handleOpenToggle(i, e.target.checked)}
                            />
                            <span className="text-sm">{t("open")}</span>
                          </label>
                        </div>
                        {safeDay.isOpen && (
                          <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                            {safeDay.times.map((t, j) => (
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
                    );
                  })}
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