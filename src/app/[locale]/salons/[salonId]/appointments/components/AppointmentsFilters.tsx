"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { SalonService } from "@/types/services";

interface AppointmentsFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  serviceFilter: string;
  setServiceFilter: (value: string) => void;
  services: SalonService[];
}

export default function AppointmentsFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  serviceFilter,
  setServiceFilter,
  services,
}: AppointmentsFiltersProps) {
  const t = useTranslations("salonAppointments");

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="lg:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all cursor-pointer"
          >
            <option value="all">{t("filters.allStatuses")}</option>
            <option value="pending">{t("status.pending")}</option>
            <option value="in_progress">{t("status.in_progress")}</option>
            <option value="completed">{t("status.completed")}</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="lg:w-48">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all cursor-pointer"
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
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all cursor-pointer"
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
  );
}