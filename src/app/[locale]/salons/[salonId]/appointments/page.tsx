"use client";

import {
  Calendar,
  CalendarDays,
  Clock,
  Phone,
  Search,
  User,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import ChatButton from "@/components/ChatButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

import { useAppointment } from "@/contexts/AppointmentContext";
import { useChat } from "@/contexts/ChatContext";
import { useSalonService } from "@/contexts/SalonServiceContext";
import { useUser } from "@/contexts/UserContext";

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
  userId: string;
  displayName: string;
  email: string;
};

export default function SalonAppointmentsPage() {
  const params = useParams() as { salonId: string };
  const { salonId } = params;
  const t = useTranslations("salonAppointments");

  const { listAppointments, updateAppointment } = useAppointment();
  const { getServicesBySalon } = useSalonService();
  const { getUserById } = useUser();
  const { currentUser } = useUser();
  const { createOrGetChat } = useChat();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 10;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load appointments
        const appts = await listAppointments(salonId);
        setAppointments(appts as Appointment[]);

        // Load services
        const svcs = await getServicesBySalon(salonId);
        setServices(svcs);

        // Load user data for employees and customers
        const userIds = new Set<string>();
        appts.forEach((apt) => {
          if (apt.employeeId) userIds.add(apt.employeeId);
          if (apt.customerUserId) userIds.add(apt.customerUserId);
        });

        const userData: Record<string, User> = {};
        for (const userId of Array.from(userIds)) {
          try {
            const user = await getUserById(userId);
            if (user) {
              userData[userId] = {
                userId,
                displayName: user.displayName,
                email: user.email,
              };
            }
          } catch (err: unknown) {
            // Silently fail for individual user loads
          }
        }
        setUsers(userData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Ошибка загрузки данных");
        } else {
          setError("Произошла неизвестная ошибка");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [salonId, listAppointments, getServicesBySalon, getUserById]);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const customerName = apt.customerName?.toLowerCase() || "";
        const customerPhone = apt.customerPhone?.toLowerCase() || "";
        const serviceName =
          services.find((s) => s.id === apt.serviceId)?.name.toLowerCase() ||
          "";

        if (
          !customerName.includes(query) &&
          !customerPhone.includes(query) &&
          !serviceName.includes(query)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && apt.status !== statusFilter) {
        return false;
      }

      // Service filter
      if (serviceFilter !== "all" && apt.serviceId !== serviceFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== "all") {
        const appointmentDate = new Date(apt.startAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case "today":
            return appointmentDate.toDateString() === today.toDateString();
          case "tomorrow": {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return appointmentDate.toDateString() === tomorrow.toDateString();
          }
          case "week": {
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return appointmentDate >= today && appointmentDate <= weekFromNow;
          }
          case "past":
            return appointmentDate < today;
          default:
            return true;
        }
      }

      return true;
    });
  }, [appointments, searchQuery, statusFilter, dateFilter, serviceFilter, services]);

  // Pagination
  const totalPages = Math.ceil(
    filteredAppointments.length / appointmentsPerPage
  );
  const startIndex = (currentPage - 1) * appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(
    startIndex,
    startIndex + appointmentsPerPage
  );

  const handleStatusChange = async (
    appointmentId: string,
    newStatus: Appointment["status"]
  ) => {
    try {
      await updateAppointment(salonId, appointmentId, { status: newStatus });

      // Update local state
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Ошибка обновления статуса");
      } else {
        setError("Произошла неизвестная ошибка");
      }
    }
  };

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
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  if (loading) {
    return (
      <LoadingSpinner/>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{t("error")}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-600 mt-1">
            {t("totalAppointments", { count: appointments.length })} •{" "}
            {t("showingAppointments", { count: filteredAppointments.length })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="all">{t("filters.allStatuses")}</option>
              <option value="pending">{t("filters.pending")}</option>
              <option value="in_progress">{t("filters.in_progress")}</option>
              <option value="completed">{t("filters.completed")}</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="lg:w-48">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="all">{t("filters.allDates")}</option>
              <option value="today">{t("filters.today")}</option>
              <option value="tomorrow">{t("filters.tomorrow")}</option>
              <option value="week">{t("filters.week")}</option>
              <option value="past">{t("filters.past")}</option>
            </select>
          </div>

          {/* Service Filter */}
          <div className="lg:w-48">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="all">{t("filters.allServices")}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {currentAppointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t("noAppointments")}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {currentAppointments.map((appointment) => {
              const service = services.find(
                (s) => s.id === appointment.serviceId
              );
              const employee = appointment.employeeId
                ? users[appointment.employeeId]
                : null;
              const customer = appointment.customerUserId
                ? users[appointment.customerUserId]
                : null;

              return (
                <div
                  key={appointment.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Main Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {service?.name || "Услуга"}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                appointment.status
                              )}`}
                            >
                              {getStatusText(appointment.status)}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(appointment.startAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(appointment.startAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{appointment.durationMinutes} мин</span>
                            </div>
                            <div className="font-semibold text-rose-600">
                              {service?.price} Br
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            {appointment.customerName ||
                              customer?.displayName ||
                              "Клиент"}
                          </span>
                        </div>
                        {appointment.customerPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{appointment.customerPhone}</span>
                          </div>
                        )}
                        {employee && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Мастер:</span>
                            <span className="font-medium">
                              {employee.displayName}
                            </span>
                          </div>
                        )}
                      </div>

                      {appointment.notes && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                          <span className="font-medium">Комментарий:</span>{" "}
                          {appointment.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                      <select
                        value={appointment.status}
                        onChange={(e) =>
                          handleStatusChange(
                            appointment.id,
                            e.target.value as Appointment["status"]
                          )
                        }
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      >
                        <option value="pending">{t("status.pending")}</option>
                        <option value="in_progress">
                          {t("status.in_progress")}
                        </option>
                        <option value="completed">
                          {t("status.completed")}
                        </option>
                      </select>
                      {appointment.customerUserId && (
                        <ChatButton
                          salonId={salonId}
                          customerUserId={appointment.customerUserId}
                          customerName={appointment.customerName || "Клиент"}
                          appointmentId={appointment.id}
                          serviceId={appointment.serviceId}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                          variant="button"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("pagination.previous")}
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 rounded-lg ${
                currentPage === page
                  ? "bg-rose-600 text-white"
                  : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("pagination.next")}
          </button>
        </div>
      )}
    </div>
  );
}