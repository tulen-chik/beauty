"use client"

import { Calendar, User as UserIcon } from "lucide-react"

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

type MobileScheduleViewProps = {
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
  getStatusText: (status: string) => string
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

const MobileAppointmentCard = ({ 
  appointment, 
  services, 
  t, 
  onClick, 
  getStatusColor, 
  getStatusText 
}: {
  appointment: Appointment;
  services: Service[];
  t: any;
  onClick: () => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}) => {
  const service = services.find((s) => s.id === appointment.serviceId);
  return (
    <div className="w-full text-left p-3 rounded-lg border bg-white">
      <button onClick={onClick} className="w-full text-left">
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

export default function MobileScheduleView({
  weekDates,
  weekLoadingStates,
  currentWeekOffset,
  appointments,
  services,
  t,
  onAppointmentClick,
  getAppointmentsForDay,
  isTodayDate,
  getStatusColor,
  getStatusText
}: MobileScheduleViewProps) {
  return (
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
                  <MobileAppointmentCard
                    key={apt.id}
                    appointment={apt}
                    services={services}
                    t={t}
                    onClick={() => onAppointmentClick(apt)}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                  />
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
  )
}
