import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";

// Импорт клиентского компонента
import SalonSchedulePageClient from "./components/SalonSchedulePageClient";

// Импорт серверных экшенов (предполагаемые пути, проверьте их)
import {  getSalonByIdAction } from "@/app/actions/salonActions"; // Или useSalon context logic перенесенная в server action
import { getServicesBySalonAction } from "@/app/actions/salonActions";
import { getSalonScheduleAction } from "@/app/actions/salonActions";
import { getUserByIdAction } from "@/app/actions/userActions";
import { getAppointmentsBySalonAction } from "@/app/actions/appointmentActions"; // Из вашего appointment.ts

// --- Кэширование статических данных (Салон, Услуги) ---
// Это предотвращает повторные запросы к БД при каждом обновлении страницы
const getCachedSalon = unstable_cache(
  async (id: string) => getSalonByIdAction(id),
  ['salon-data'],
  { revalidate: 3600, tags: ['salon'] } // Кэш на 1 час
);

const getCachedServices = unstable_cache(
  async (id: string) => getServicesBySalonAction(id),
  ['salon-services'],
  { revalidate: 3600, tags: ['services'] }
);

// Вспомогательная функция для получения дат недели
const getWeekRange = (date: Date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 7); // Конец недели (начало следующей)
  
  return { start, end };
};

export default async function SchedulePage({ 
  params 
}: { 
  params: { salonId: string; locale: string } 
}) {
  const { salonId } = params;

  // 1. Вычисляем диапазон дат для текущей недели
  const today = new Date();
  const { start: startOfWeek, end: endOfWeek } = getWeekRange(today);

  // 2. ПАРАЛЛЕЛЬНЫЙ ЗАПУСК ЗАПРОСОВ
  // Мы запускаем все промисы одновременно, не дожидаясь завершения предыдущего
  const salonPromise = getCachedSalon(salonId);
  const servicesPromise = getCachedServices(salonId);
  const schedulePromise = getSalonScheduleAction(salonId);
  
  // Загружаем записи сразу для текущей недели
  const appointmentsPromise = getAppointmentsBySalonAction(salonId, {
    startAt: startOfWeek.toISOString(),
    endAt: endOfWeek.toISOString()
  });

  // 3. Ожидание всех данных (время выполнения = время самого медленного запроса)
  const [salon, services, scheduleData, appointments] = await Promise.all([
    salonPromise,
    servicesPromise,
    schedulePromise,
    appointmentsPromise
  ]);

  if (!salon) {
    return notFound();
  }

  // 4. Загрузка пользователей (мастеров)
  // Делаем это на сервере, чтобы клиент получил готовый объект, а не делал N запросов
  const usersMap: Record<string, any> = {};
  if (salon.members && salon.members.length > 0) {
    // Получаем уникальные ID пользователей
    const userIds = Array.from(new Set(salon.members.map((m: any) => m.userId)));
    
    const usersData = await Promise.all(
      userIds.map((uid: string) => getUserByIdAction(uid))
    );

    usersData.forEach((user) => {
      if (user) {
        usersMap[user.id] = user;
      }
    });
  }

  // 5. Рендер клиентского компонента с готовыми данными
  return (
    <SalonSchedulePageClient
      salonId={salonId}
      initialSalon={salon}
      initialServices={services || []}
      initialSchedule={scheduleData?.weeklySchedule || []}
      initialAppointments={appointments || []}
      initialUsers={usersMap}
    />
  );
}