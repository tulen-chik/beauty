import { SalonWorkDay, WeekDay } from "@/types/database";

export type Appointment = {
  id: string;
  salonId: string;
  serviceId: string;
  employeeId?: string;
  customerName?: string;
  customerPhone?: string;
  customerUserId?: string;
  startAt: string;
  durationMinutes: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Service = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
};

export type UserInfo = {
  userId: string;
  displayName: string;
  email: string;
};

export interface SchedulePageProps {
  salonId: string;
  t: (key: string, values?: Record<string, any>) => string;
  weeklySchedule: SalonWorkDay[];
  appointments: Appointment[];
  services: Service[];
  users: Record<string, UserInfo>;
  loading: boolean;
  error: string | null;
  modalError: string | null;
  success: boolean;
  currentWeekOffset: number;
  isScheduleModalOpen: boolean;
  selectedAppointment: Appointment | null;
  statusFilter: string;
  serviceFilter: string;
  isMobileView: boolean;
  weekDates: Date[];
  filteredAppointments: Appointment[];
  getAppointmentsForDay: (date: Date) => Appointment[];
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  handleSaveSchedule: () => Promise<void>;
  handleStatusChange: (appointmentId: string, newStatus: Appointment["status"]) => Promise<void>;
  handleOpenToggle: (dayIdx: number, isOpen: boolean) => void;
  handleTimeChange: (dayIdx: number, timeIdx: number, field: "start" | "end", value: string) => void;
  handleAddInterval: (dayIdx: number) => void;
  handleRemoveInterval: (dayIdx: number, timeIdx: number) => void;
  setCurrentWeekOffset: (offset: number | ((prev: number) => number)) => void;
  setStatusFilter: (filter: string) => void;
  setServiceFilter: (filter: string) => void;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  setIsScheduleModalOpen: (isOpen: boolean) => void;
  setModalError: (error: string | null) => void;
}
