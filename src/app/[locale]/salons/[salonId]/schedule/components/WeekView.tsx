import { PositionedAppointmentCard } from "./PositionedAppointmentCard";
import { SchedulePageProps } from "./types";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00",
];

const WEEKDAYS = [
  { key: "monday", label: "Пн", fullLabel: "Понедельник", shortLabel: "Пн" },
  { key: "tuesday", label: "Вт", fullLabel: "Вторник", shortLabel: "Вт" },
  { key: "wednesday", label: "Ср", fullLabel: "Среда", shortLabel: "Ср" },
  { key: "thursday", label: "Чт", fullLabel: "Четверг", shortLabel: "Чт" },
  { key: "friday", label: "Пт", fullLabel: "Пятница", shortLabel: "Пт" },
  { key: "saturday", label: "Сб", fullLabel: "Суббота", shortLabel: "Сб" },
  { key: "sunday", label: "Вс", fullLabel: "Воскресенье", shortLabel: "Вс" },
];

export const WeekView = ({
  weekDates,
  weeklySchedule,
  getAppointmentsForDay,
  getStatusColor,
  setSelectedAppointment,
  setModalError,
  services,
  t,
}: Pick<
  SchedulePageProps,
  | 'weekDates'
  | 'weeklySchedule'
  | 'getAppointmentsForDay'
  | 'getStatusColor'
  | 'setSelectedAppointment'
  | 'setModalError'
  | 'services'
  | 't'
>) => {
  const isTodayDate = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTimeInWorkingHours = (dayData: any, timeSlot: string) => {
    if (!dayData?.isOpen || !dayData.times) return false;
    return dayData.times.some((interval: any) => timeSlot >= interval.start && timeSlot < interval.end);
  };

  return (
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
          const dayData = weeklySchedule.find((d) => d.day === dayKey);
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
                    <PositionedAppointmentCard
                      key={apt.id}
                      appointment={apt}
                      services={services}
                      t={t}
                      getStatusColor={getStatusColor}
                      setSelectedAppointment={setSelectedAppointment}
                      setModalError={setModalError}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
