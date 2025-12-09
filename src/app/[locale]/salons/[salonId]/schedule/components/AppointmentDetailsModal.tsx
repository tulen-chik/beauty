"use client"

import { AlertCircle, Calendar, Clock, FileText, Phone, Scissors, User as UserIcon, X, CheckCircle2, MessageCircle } from "lucide-react"

import SalonChatButton from "@/components/SalonChatButton"
import { ModalPortal } from "@/components/ui/ModalPortal"

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
    <ModalPortal isOpen={!!appointment} onClose={onClose}>
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{service?.name || t("appointmentDetails")}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(appointment.startAt).toLocaleDateString('ru-RU', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-full transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {modalError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm flex items-center gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{modalError}</span>
            </div>
          )}

          {/* Appointment Details Grid */}
          <div className="grid grid-cols-1 gap-4">
            {/* Date & Time Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">Дата и время</h3>
                  <p className="text-blue-700 text-sm">
                    {new Date(appointment.startAt).toLocaleDateString('ru-RU', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-blue-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {new Date(appointment.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                      <span className="ml-1 text-blue-500">({appointment.durationMinutes} мин)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-emerald-900 mb-1">Клиент</h3>
                  <p className="text-emerald-700 font-medium">{appointment.customerName || t("client")}</p>
                  {appointment.customerPhone && (
                    <div className="flex items-center gap-2 mt-2 text-emerald-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{appointment.customerPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Employee Info Card */}
            {employee && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Scissors className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-900 mb-1">Мастер</h3>
                    <p className="text-purple-700 font-medium">{employee.displayName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Card */}
            {appointment.notes && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-2">Примечания</h3>
                    <div className="bg-white/70 border border-amber-200 rounded-lg p-3">
                      <p className="text-amber-800 text-sm leading-relaxed">{appointment.notes}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Management */}
          {canManageAppointments && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <label htmlFor="status-select" className="block text-sm font-semibold text-gray-700 mb-3">
                Статус записи
              </label>
              <select
                id="status-select"
                value={appointment.status}
                onChange={(e) => onStatusChange(appointment.id, e.target.value as Appointment["status"])}
                className={`w-full px-4 py-3 border-2 rounded-xl font-semibold transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${getStatusColor(appointment.status)}`}
              >
                <option value="pending">{t("status.pending")}</option>
                <option value="in_progress">{t("status.in_progress")}</option>
                <option value="completed">{t("status.completed")}</option>
              </select>
            </div>
          )}

          {/* Chat Button */}
          {appointment.customerUserId && (
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <MessageCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-semibold text-rose-900">Связь с клиентом</h3>
              </div>
              <SalonChatButton
                salonId={salonId}
                customerUserId={appointment.customerUserId}
                customerName={appointment.customerName || t("client")}
                appointmentId={appointment.id}
                serviceId={appointment.serviceId}
                className="w-full py-3 text-center rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 font-medium shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                variant="button"
              />
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  )
}
