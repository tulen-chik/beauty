"use client";

import { CalendarDays } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useAppointment } from "@/contexts/AppointmentContext";
import { useSalonService } from "@/contexts/SalonServiceContext";
import { useUser } from "@/contexts/UserContext";

import { SalonService } from "@/types/services";
import { User as UserData } from "@/types/user";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import { AppointmentsPageSkeleton } from "./components/Skeletons";
import AppointmentsFilters from "./components/AppointmentsFilters";
import AppointmentCard from "./components/AppointmentCard";
import AppointmentsPagination from "./components/AppointmentsPagination";

export default function SalonAppointmentsPage() {
  const params = useParams() as { salonId: string };
  const { salonId } = params;
  const t = useTranslations("salonAppointments");

  const { listAppointments, updateAppointment } = useAppointment();
  const { getServicesBySalon } = useSalonService();
  const { getUserById } = useUser();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<SalonService[]>([]);
  const [users, setUsers] = useState<Record<string, UserData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  // Pagination State
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

        const userData: Record<string, UserData> = {};
        for (const userId of Array.from(userIds)) {
          try {
            const user = await getUserById(userId);
            if (user) {
              userData[userId] = {
                id: userId,
                displayName: user.displayName,
                email: user.email,
                createdAt: user.createdAt,
                avatarUrl: user.avatarUrl,
                avatarStoragePath: user.avatarStoragePath,
                role: user.role,
                settings: user.settings,
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

  // Filter appointments logic
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

  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
  const startIndex = (currentPage - 1) * appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(
    startIndex,
    startIndex + appointmentsPerPage
  );

  const handleStatusChange = async (
    appointmentId: string,
    newStatus: AppointmentStatus
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
      console.error("Failed to update status", err);
      // Optional: Add toast notification here
    }
  };

  if (loading) {
    return <AppointmentsPageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="text-rose-600 font-medium mb-4">{t("error")}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 mt-1">
            {t("totalAppointments", { count: appointments.length })} •{" "}
            {t("showingAppointments", { count: filteredAppointments.length })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <AppointmentsFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        services={services}
      />

      {/* Appointments List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {currentAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {t("noAppointments")}
            </h3>
            <p className="text-slate-500 max-w-xs">
              Попробуйте изменить фильтры или добавьте новую запись
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {currentAppointments.map((appointment) => {
              const service = services.find((s) => s.id === appointment.serviceId);
              const employee = appointment.employeeId
                ? users[appointment.employeeId]
                : undefined;
              const customer = appointment.customerUserId
                ? users[appointment.customerUserId]
                : undefined;

              return (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  service={service}
                  employee={employee}
                  customer={customer}
                  salonId={salonId}
                  onStatusChange={handleStatusChange}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <AppointmentsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}