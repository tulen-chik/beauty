"use client"

import { AlertCircle, Calendar, Clock, FileText, Phone, Scissors, User as UserIcon, X } from "lucide-react"

import SalonChatButton from "@/components/SalonChatButton"

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

type User = {
  displayName: string;
};

type AppointmentDetailsModalProps = {
  appointment: Appointment | null
  services: Service[]
  users: Record<string, User>
  modalError: string | null
  canManageAppointments: boolean
  salonId: string
  t: any
  onClose: () => void
  onStatusChange: (appointmentId: string, newStatus: Appointment["status"]) => void
  getStatusColor: (status: string) => string
  getStatusText: (status: string) => string
}

export default function AppointmentDetailsModal({
  appointment,
  services,
  users,
  modalError,
  canManageAppointments,
  salonId,
  t,
  onClose,
  onStatusChange,
  getStatusColor,
  getStatusText
}: AppointmentDetailsModalProps) {
  if (!appointment) return null;

  const service = services.find((s) => s.id === appointment.serviceId);
  const employee = appointment.employeeId ? users[appointment.employeeId] : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">{service?.name || t("appointmentDetails")}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {modalError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}
          <div className="space-y-3 text-gray-700">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400"/>
              <span>{new Date(appointment.startAt).toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400"/>
              <span>{new Date(appointment.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appointment.durationMinutes} мин)</span>
            </div>
            <div className="flex items-center gap-3">
              <UserIcon className="w-5 h-5 text-gray-400"/>
              <span>{appointment.customerName || t("client")}</span>
            </div>
            {appointment.customerPhone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400"/>
                <span>{appointment.customerPhone}</span>
              </div>
            )}
            {employee && (
              <div className="flex items-center gap-3">
                <Scissors className="w-5 h-5 text-gray-400"/>
                <span>{t("master")}: {employee.displayName}</span>
              </div>
            )}
            {appointment.notes && (
              <div className="flex items-start gap-3 pt-2">
                <FileText className="w-5 h-5 text-gray-400 mt-1"/>
                <div className="bg-gray-50 p-3 rounded-md border w-full">
                  <p className="font-medium text-sm text-gray-600">{t("comment")}:</p>
                  <p>{appointment.notes}</p>
                </div>
              </div>
            )}
          </div>
          {canManageAppointments && (
            <div>
              <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">{t("changeStatus")}</label>
              <select
                id="status-select"
                value={appointment.status}
                onChange={(e) => onStatusChange(appointment.id, e.target.value as Appointment["status"])}
                className={`w-full px-3 py-2 border rounded-lg font-semibold transition-colors ${getStatusColor(appointment.status)}`}
              >
                <option value="pending">{t("status.pending")}</option>
                <option value="in_progress">{t("status.in_progress")}</option>
                <option value="completed">{t("status.completed")}</option>
              </select>
            </div>
          )}
          {appointment.customerUserId && (
            <div className="pt-2">
              <SalonChatButton
                salonId={salonId}
                customerUserId={appointment.customerUserId}
                customerName={appointment.customerName || t("client")}
                appointmentId={appointment.id}
                serviceId={appointment.serviceId}
                className="w-full py-2.5 text-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
                variant="button"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
