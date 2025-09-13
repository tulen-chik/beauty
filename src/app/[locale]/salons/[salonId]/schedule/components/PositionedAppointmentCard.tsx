import { User } from "lucide-react";
import { Appointment, SchedulePageProps } from "./types";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00",
];

const timeToMinutes = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const DAY_START_MINUTES = timeToMinutes(TIME_SLOTS[0]);
const SLOT_HEIGHT_IN_REM = 6;
const MINUTES_PER_SLOT = 30;
const REM_IN_PX = 16;
const SLOT_HEIGHT_PX = SLOT_HEIGHT_IN_REM * REM_IN_PX;
const PX_PER_MINUTE = SLOT_HEIGHT_PX / MINUTES_PER_SLOT;

export const PositionedAppointmentCard = ({
  appointment,
  services,
  t,
  getStatusColor,
  setSelectedAppointment,
  setModalError,
}: Pick<
  SchedulePageProps,
  | 'services'
  | 't'
  | 'getStatusColor'
  | 'setSelectedAppointment'
  | 'setModalError'
> & { appointment: Appointment }) => {
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
        <User className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{appointment.customerName || t("client")}</span>
      </div>
      <div className="mt-auto pt-1 text-xs font-medium">
        {appointment.status}
      </div>
    </button>
  );
};
