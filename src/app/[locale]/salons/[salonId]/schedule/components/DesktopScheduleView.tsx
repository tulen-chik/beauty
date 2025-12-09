"use client"

import { User as UserIcon } from "lucide-react"

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

type DesktopScheduleViewProps = {
  weekDates: Date[]
  weekLoadingStates: Record<number, boolean>
  currentWeekOffset: number
  appointments: Appointment[]
  services: Service[]
  t: any
  onAppointmentClick: (appointment: Appointment) => void
  getAppointmentsForDay: (date: Date) => Appointment[]
  isTodayDate: (date: Date) => boolean
  getStatusColor: (status: string) => string
}

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

const PositionedAppointmentCard = ({ 
  appointment, 
  services, 
  t, 
  onClick, 
  getStatusColor 
}: {
  appointment: Appointment;
  services: Service[];
  t: any;
  onClick: () => void;
  getStatusColor: (status: string) => string;
}) => {
  const service = services.find((s) => s.id === appointment.serviceId);
  const appointmentStart = new Date(appointment.startAt);
  const startTimeString = appointmentStart.toTimeString().substring(0, 5);
  const startMinutes = timeToMinutes(startTimeString);

  const top = (startMinutes - DAY_START_MINUTES) * PX_PER_MINUTE;
  const height = appointment.durationMinutes * PX_PER_MINUTE;

  return (
    <button
      onClick={onClick}
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

export default function DesktopScheduleView({
  weekDates,
  weekLoadingStates,
  currentWeekOffset,
  appointments,
  services,
  t,
  onAppointmentClick,
  getAppointmentsForDay,
  isTodayDate,
  getStatusColor
}: DesktopScheduleViewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
      <div className="grid grid-cols-8 min-w-[600px] sm:min-w-[700px] md:min-w-[800px] lg:min-w-[900px] xl:min-w-[1000px]">
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
                      <PositionedAppointmentCard
                        key={apt.id}
                        appointment={apt}
                        services={services}
                        t={t}
                        onClick={() => onAppointmentClick(apt)}
                        getStatusColor={getStatusColor}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
