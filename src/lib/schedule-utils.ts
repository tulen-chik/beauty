import { SalonSchedule, SalonWorkDay, SalonExceptionDay, WeekDay } from '@/types/database';

/**
 * Проверяет, пересекаются ли два временных интервала
 */
export const isTimeOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  return s1 < e2 && s2 < e1;
};

/**
 * Валидирует временной интервал
 */
export const validateTimeRange = (start: string, end: string): boolean => {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  return toMinutes(start) < toMinutes(end);
};

/**
 * Получает день недели из даты
 */
export const getDayOfWeek = (date: string): WeekDay => {
  const dateObj = new Date(date + 'T00:00:00');
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  return dayName.toLowerCase() as WeekDay;
};

/**
 * Проверяет, является ли дата выходным днем (суббота или воскресенье)
 */
export const isWeekend = (date: string): boolean => {
  const dayOfWeek = getDayOfWeek(date);
  return dayOfWeek === 'saturday' || dayOfWeek === 'sunday';
};

/**
 * Форматирует дату в формат YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Добавляет дни к дате
 */
export const addDays = (date: string, days: number): string => {
  const dateObj = new Date(date + 'T00:00:00');
  dateObj.setDate(dateObj.getDate() + days);
  return formatDate(dateObj);
};

/**
 * Получает эффективное расписание на дату с учетом исключений
 */
export const getEffectiveScheduleForDate = (
  schedule: SalonSchedule,
  date: string
): SalonWorkDay | null => {
  // Сначала проверяем исключения
  const exception = schedule.exceptions?.find(ex => ex.date === date);
  if (exception) {
    const dayOfWeek = getDayOfWeek(date);
    return {
      day: dayOfWeek,
      isOpen: exception.isOpen,
      times: exception.times || []
    };
  }

  // Если нет исключения, используем еженедельное расписание
  const dayOfWeek = getDayOfWeek(date);
  const weeklyDay = schedule.weeklySchedule.find(day => day.day === dayOfWeek);
  
  return weeklyDay || null;
};

/**
 * Получает расписание на диапазон дат
 */
export const getScheduleForDateRange = (
  schedule: SalonSchedule,
  startDate: string,
  endDate: string
): Array<{ date: string; schedule: SalonWorkDay | null }> => {
  const result: Array<{ date: string; schedule: SalonWorkDay | null }> = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const daySchedule = getEffectiveScheduleForDate(schedule, currentDate);
    result.push({ date: currentDate, schedule: daySchedule });
    currentDate = addDays(currentDate, 1);
  }

  return result;
};

/**
 * Проверяет, открыто ли заведение в указанную дату и время
 */
export const isSalonOpen = (
  schedule: SalonSchedule,
  date: string,
  time: string
): boolean => {
  const daySchedule = getEffectiveScheduleForDate(schedule, date);
  
  if (!daySchedule || !daySchedule.isOpen) {
    return false;
  }

  return daySchedule.times.some(workTime => 
    time >= workTime.start && time <= workTime.end
  );
};

/**
 * Создает шаблон еженедельного расписания по умолчанию
 */
export const createDefaultWeeklySchedule = (): SalonWorkDay[] => {
  const days: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  return days.map(day => ({
    day,
    isOpen: day !== 'sunday', // Воскресенье - выходной
    times: day !== 'sunday' ? [{ start: '09:00', end: '18:00' }] : []
  }));
};

/**
 * Создает исключение для праздничного дня
 */
export const createHolidayException = (
  date: string
): SalonExceptionDay => {
  return {
    date,
    isOpen: false,
  };
};

/**
 * Создает исключение для специального рабочего дня
 */
export const createSpecialWorkDayException = (
  date: string,
  times: { start: string; end: string }[]
): SalonExceptionDay => {
  return {
    date,
    isOpen: true,
    times,

  };
};
