import { Calendar } from "lucide-react";
import { MobileAppointmentCard } from "./MobileAppointmentCard";
import { SchedulePageProps } from "./types";

const WEEKDAYS = [
  { key: "monday", label: "Пн", fullLabel: "Понедельник", shortLabel: "Пн" },
  { key: "tuesday", label: "Вт", fullLabel: "Вторник", shortLabel: "Вт" },
  { key: "wednesday", label: "Ср", fullLabel: "Среда", shortLabel: "Ср" },
  { key: "thursday", label: "Чт", fullLabel: "Четверг", shortLabel: "Чт" },
  { key: "friday", label: "Пт", fullLabel: "Пятница", shortLabel: "Пт" },
  { key: "saturday", label: "Сб", fullLabel: "Суббота", shortLabel: "Сб" },
  { key: "sunday", label: "Вс", fullLabel: "Воскресенье", shortLabel: "Вс" },
];

export const MobileDayView = ({
  date,
  dayIndex,
  getAppointmentsForDay,
  services,
  t,
  getStatusColor,
  getStatusText,
  setSelectedAppointment,
  setModalError,
  salonId,
}: Pick<
  SchedulePageProps,
  | 'getAppointmentsForDay'
  | 'services'
  | 't'
  | 'getStatusColor'
  | 'getStatusText'
  | 'setSelectedAppointment'
  | 'setModalError'
  | 'salonId'
> & { date: Date; dayIndex: number }) => {
  const dayAppointments = getAppointmentsForDay(date);
  const isTodayDate = (compareDate: Date) => {
    const today = new Date();
    return compareDate.toDateString() === today.toDateString();
  };

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
          {dayAppointments
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
            .map((apt) => (
              <MobileAppointmentCard
                key={apt.id}
                appointment={apt}
                services={services}
                t={t}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                setSelectedAppointment={setSelectedAppointment}
                setModalError={setModalError}
                salonId={salonId}
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
  );
};
