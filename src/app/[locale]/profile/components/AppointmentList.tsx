"use client"

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Calendar, Clock, MapPin, User as UserIcon, MessageSquare, Star } from "lucide-react";
import { Appointment, Salon, SalonRating, SalonService, User } from "@/types/database";
import { AppointmentListSkeleton } from "./Skeletons";

// Вспомогательный компонент для строки
const AppointmentRow = ({ icon: Icon, label, value, href, className = "" }: { icon?: any, label?: string, value?: string | null, href?: string, className?: string }) => {
  if (!value) return null;
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {Icon && <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        {label && <p className="text-xs text-slate-500 mb-0.5">{label}</p>}
        {href ? (
          <Link href={href} className="text-sm font-medium text-slate-900 hover:text-rose-600 transition-colors truncate block">
            {value}
          </Link>
        ) : (
          <p className="text-sm font-medium text-slate-900 break-words">{value}</p>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    confirmed: "bg-blue-50 text-blue-700 border-blue-100",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    cancelled: "bg-slate-50 text-slate-600 border-slate-100",
    in_progress: "bg-rose-50 text-rose-700 border-rose-100"
  };
  
  const labels = {
    pending: "Ожидает подтверждения",
    confirmed: "Подтверждено",
    completed: "Завершено",
    cancelled: "Отменено",
    in_progress: "В процессе"
  };

  const key = status as keyof typeof styles;
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[key] || styles.pending}`}>
      {labels[key] || status}
    </span>
  );
};

const AppointmentCard = ({
  appointment,
  salon,
  service,
  specialist,
  canReview,
  isCompleted,
  onShowRatingForm
}: {
  appointment: Appointment;
  salon: Salon | undefined;
  service: SalonService | undefined;
  specialist: User | null;
  canReview: boolean;
  isCompleted: boolean;
  onShowRatingForm: (appointmentId: string) => void;
}) => {
  const start = new Date(appointment.startAt);
  const end = new Date(start.getTime() + (service?.durationMinutes || 0) * 60000);
  const dateStr = start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = `${start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-lg text-slate-900 mb-1">{service?.name}</h3>
          <Link href={`/salons/${salon?.id}`} className="text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1">
            {salon?.name}
          </Link>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
        <div className="space-y-3">
          <AppointmentRow icon={Calendar} value={dateStr} />
          <AppointmentRow icon={Clock} value={timeStr} />
          <AppointmentRow icon={MapPin} value={salon?.address} />
        </div>
        <div className="space-y-3">
          <AppointmentRow icon={UserIcon} label="Специалист" value={specialist?.displayName || 'Любой специалист'} />
          {appointment.notes && (
            <AppointmentRow icon={MessageSquare} label="Комментарий" value={appointment.notes} />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {canReview && (
          <button
            onClick={() => onShowRatingForm(appointment.id)}
            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-sm shadow-rose-200 transition-all flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4" />
            Оставить отзыв
          </button>
        )}
        
        <Link
          href={`/book/${appointment.serviceId}`}
          className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center justify-center text-center ${
            canReview 
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
              : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100"
          }`}
        >
          Записаться снова
        </Link>

        {!isCompleted && (
          <p className="w-full text-xs text-slate-400 mt-2 text-center sm:text-left">
            *Отзыв можно оставить после завершения визита
          </p>
        )}
      </div>
    </div>
  );
};

interface AppointmentListProps {
  appointments: Appointment[];
  loading: boolean;
  salonsById: Record<string, Salon>;
  servicesById: Record<string, SalonService>;
  employees: Record<string, User>;
  userRatings: SalonRating[];
  onShowRatingForm: (appointmentId: string) => void;
  t: (key: string) => string;
}

export default function AppointmentList({
  appointments, loading, salonsById, servicesById, employees, userRatings, onShowRatingForm, t
}: AppointmentListProps) {
  const [expandedCompleted, setExpandedCompleted] = useState(false);

  const hasRatingForAppointment = (appointmentId: string) => {
    return userRatings.some(rating => rating.appointmentId === appointmentId);
  };

  const activeAppointments = appointments.filter(a => ['pending', 'confirmed', 'in_progress'].includes(a.status));
  const completedAppointments = appointments.filter(a => ['completed', 'cancelled'].includes(a.status));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-900">Мои записи</h2>
      </div>

      {loading ? (
        <div className="p-6"><AppointmentListSkeleton /></div>
      ) : appointments.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">{t('appointments.empty')}</p>
          <Link href="/search" className="inline-block mt-4 text-rose-600 font-medium hover:underline">
            Найти услугу
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {/* Active Appointments */}
          <div className="p-6 space-y-4">
            {activeAppointments.length > 0 ? (
              activeAppointments.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  salon={salonsById[a.salonId]}
                  service={servicesById[a.serviceId]}
                  specialist={a.employeeId ? employees[a.employeeId] : null}
                  canReview={false}
                  isCompleted={false}
                  onShowRatingForm={onShowRatingForm}
                />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Нет активных записей
              </div>
            )}
          </div>

          {/* Completed Appointments */}
          {completedAppointments.length > 0 && (
            <div className="bg-slate-50/30">
              <button
                onClick={() => setExpandedCompleted(!expandedCompleted)}
                className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">
                    История записей
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                    {completedAppointments.length}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedCompleted ? 'rotate-180' : ''}`}
                />
              </button>
              
              <div className={`grid transition-all duration-300 ease-in-out ${expandedCompleted ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="p-6 pt-0 space-y-4 border-t border-slate-100">
                    {completedAppointments.map((a) => (
                      <AppointmentCard
                        key={a.id}
                        appointment={a}
                        salon={salonsById[a.salonId]}
                        service={servicesById[a.serviceId]}
                        specialist={a.employeeId ? employees[a.employeeId] : null}
                        canReview={a.status === 'completed' && !hasRatingForAppointment(a.id)}
                        isCompleted={true}
                        onShowRatingForm={onShowRatingForm}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}