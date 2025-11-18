"use client";

import { Calendar, Clock, Phone, User } from "lucide-react";
import { useTranslations } from "next-intl";
import ChatButton from "@/components/ChatButton";
import { SalonService } from "@/types/services";
import { User as UserData } from "@/types/user";
import { Appointment, AppointmentStatus } from "@/types/appointment";

interface AppointmentCardProps {
  appointment: Appointment;
  service?: SalonService;
  employee?: UserData;
  customer?: UserData;
  salonId: string;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
}

export default function AppointmentCard({
  appointment,
  service,
  employee,
  customer,
  salonId,
  onStatusChange,
}: AppointmentCardProps) {
  const t = useTranslations("salonAppointments");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return t("status.completed");
      case "in_progress":
        return t("status.in_progress");
      case "pending":
        return t("status.pending");
      default:
        return status;
    }
  };

  return (
    <div className="p-5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Main Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-lg text-slate-900">
                  {service?.name || "Услуга"}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                    appointment.status
                  )}`}
                >
                  {getStatusText(appointment.status)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formatDate(appointment.startAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{formatTime(appointment.startAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{appointment.durationMinutes} мин</span>
                </div>
                <div className="font-bold text-rose-600 text-base ml-1">
                  {service?.price} Br
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm pt-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 rounded-full">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <span className="font-medium text-slate-900">
                {appointment.customerName || customer?.displayName || "Клиент"}
              </span>
            </div>
            {appointment.customerPhone && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 rounded-full">
                  <Phone className="w-4 h-4 text-slate-500" />
                </div>
                <span className="text-slate-700">{appointment.customerPhone}</span>
              </div>
            )}
            {employee && (
              <div className="flex items-center gap-2 sm:ml-auto sm:border-l sm:border-slate-200 sm:pl-4">
                <span className="text-slate-500">Мастер:</span>
                <span className="font-medium text-slate-900">
                  {employee.displayName}
                </span>
              </div>
            )}
          </div>

          {appointment.notes && (
            <div className="text-sm text-slate-600 bg-amber-50/50 border border-amber-100 p-3 rounded-lg mt-2">
              <span className="font-medium text-amber-800">Комментарий:</span>{" "}
              {appointment.notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-48 shrink-0">
          <select
            value={appointment.status}
            onChange={(e) =>
              onStatusChange(appointment.id, e.target.value as AppointmentStatus)
            }
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all cursor-pointer hover:border-slate-300"
          >
            <option value="pending">{t("status.pending")}</option>
            <option value="in_progress">{t("status.in_progress")}</option>
            <option value="completed">{t("status.completed")}</option>
          </select>
          
          {appointment.customerUserId && (
            <div className="w-full">
              <ChatButton
                salonId={salonId}
                customerUserId={appointment.customerUserId}
                customerName={appointment.customerName || "Клиент"}
                appointmentId={appointment.id}
                serviceId={appointment.serviceId}
                className="w-full justify-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-rose-600 transition-colors bg-white"
                variant="button"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}