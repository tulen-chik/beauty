import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { SchedulePageProps } from "./types";

export const ScheduleControls = ({
  t,
  success,
  setIsScheduleModalOpen,
  setModalError,
  currentWeekOffset,
  setCurrentWeekOffset,
  weekDates,
  statusFilter,
  setStatusFilter,
  serviceFilter,
  setServiceFilter,
  services,
  filteredAppointments,
}: Pick<
  SchedulePageProps,
  | 't'
  | 'success'
  | 'setIsScheduleModalOpen'
  | 'setModalError'
  | 'currentWeekOffset'
  | 'setCurrentWeekOffset'
  | 'weekDates'
  | 'statusFilter'
  | 'setStatusFilter'
  | 'serviceFilter'
  | 'setServiceFilter'
  | 'services'
  | 'filteredAppointments'
>) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-600 mt-1">
            {t("showingAppointments", { count: filteredAppointments.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {success && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
              {t("scheduleSaved")}
            </div>
          )}
          <button
            onClick={() => { setIsScheduleModalOpen(true); setModalError(null); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {t("setupSchedule")}
          </button>
        </div>
      </div>

      {/* Filters & Calendar Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentWeekOffset((w) => Math.max(0, w - 1))}
              disabled={currentWeekOffset === 0}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="font-semibold">
                {currentWeekOffset === 0 ? t("currentWeek") : t("week", { weekNum: currentWeekOffset + 1 })}
              </div>
              <div className="text-sm text-gray-500">
                {weekDates[0]?.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} - {" "}
                {weekDates[6]?.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
            <button
              onClick={() => setCurrentWeekOffset((w) => w + 1)}
              disabled={currentWeekOffset === 3}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 h-px bg-gray-200 lg:h-auto lg:w-px"></div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">{t("filters.allStatuses")}</option>
              <option value="pending">{t("status.pending")}</option>
              <option value="confirmed">{t("status.confirmed")}</option>
              <option value="completed">{t("status.completed")}</option>
              <option value="cancelled">{t("status.cancelled")}</option>
              <option value="no_show">{t("status.no_show")}</option>
            </select>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg"
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
    </div>
  );
};
