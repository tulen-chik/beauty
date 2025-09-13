import { AlertCircle, Calendar, Clock, FileText, Phone, Scissors, User, X } from "lucide-react";
import { Appointment, SchedulePageProps } from "./types";
import ChatButton from "@/components/ChatButton";

export const AppointmentDetailsModal = ({
  selectedAppointment,
  services,
  users,
  t,
  modalError,
  handleStatusChange,
  setSelectedAppointment,
  salonId,
}: Pick<
  SchedulePageProps,
  | 'selectedAppointment'
  | 'services'
  | 'users'
  | 't'
  | 'modalError'
  | 'handleStatusChange'
  | 'setSelectedAppointment'
  | 'salonId'
>) => {
  if (!selectedAppointment) return null;

  const service = services.find((s) => s.id === selectedAppointment.serviceId);
  const employee = selectedAppointment.employeeId ? users[selectedAppointment.employeeId] : null;
  const getStatusColor = (status: string) => {
    const colors = {
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      no_show: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusText = (status: string) => t(`status.${status}`) || status;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedAppointment(null)}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{service?.name || t("appointmentDetails")}</h2>
          <button onClick={() => setSelectedAppointment(null)} className="p-2 hover:bg-gray-100 rounded-full">
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
              <span>{new Date(selectedAppointment.startAt).toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400"/>
              <span>{new Date(selectedAppointment.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({selectedAppointment.durationMinutes} мин)</span>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400"/>
              <span>{selectedAppointment.customerName || t("client")}</span>
            </div>
            {selectedAppointment.customerPhone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400"/>
                <span>{selectedAppointment.customerPhone}</span>
              </div>
            )}
            {employee && (
              <div className="flex items-center gap-3">
                <Scissors className="w-5 h-5 text-gray-400"/>
                <span>{t("master")}: {employee.displayName}</span>
              </div>
            )}
            {selectedAppointment.notes && (
              <div className="flex items-start gap-3 pt-2">
                <FileText className="w-5 h-5 text-gray-400 mt-1"/>
                <div className="bg-gray-50 p-3 rounded-md border w-full">
                  <p className="font-medium text-sm text-gray-600">{t("comment")}:</p>
                  <p>{selectedAppointment.notes}</p>
                </div>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">{t("changeStatus")}</label>
            <select
              id="status-select"
              value={selectedAppointment.status}
              onChange={(e) => handleStatusChange(selectedAppointment.id, e.target.value as Appointment["status"])}
              className={`w-full px-3 py-2 border rounded-lg font-semibold transition-colors ${getStatusColor(selectedAppointment.status)}`}
            >
              <option value="pending">{t("status.pending")}</option>
              <option value="confirmed">{t("status.confirmed")}</option>
              <option value="completed">{t("status.completed")}</option>
              <option value="cancelled">{t("status.cancelled")}</option>
              <option value="no_show">{t("status.no_show")}</option>
            </select>
          </div>
          {selectedAppointment.customerUserId && (
            <div className="pt-2">
              <ChatButton
                salonId={salonId}
                customerUserId={selectedAppointment.customerUserId}
                customerName={selectedAppointment.customerName || t("client")}
                appointmentId={selectedAppointment.id}
                serviceId={selectedAppointment.serviceId}
                className="w-full py-2.5 text-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
                variant="button"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
