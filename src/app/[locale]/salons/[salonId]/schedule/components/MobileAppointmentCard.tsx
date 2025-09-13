import { User } from "lucide-react";
import { Appointment, SchedulePageProps } from "./types";
import ChatButton from "@/components/ChatButton";

export const MobileAppointmentCard = ({
  appointment,
  services,
  t,
  getStatusColor,
  getStatusText,
  setSelectedAppointment,
  setModalError,
  salonId,
}: Pick<
  SchedulePageProps,
  | 'services'
  | 't'
  | 'getStatusColor'
  | 'getStatusText'
  | 'setSelectedAppointment'
  | 'setModalError'
  | 'salonId'
> & { appointment: Appointment }) => {
  const service = services.find((s) => s.id === appointment.serviceId);
  
  return (
    <div className="w-full text-left p-3 rounded-lg border bg-white">
      <button 
        onClick={() => { setSelectedAppointment(appointment); setModalError(null); }}
        className="w-full text-left"
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
            customerName={appointment.customerName || t("client")}
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
