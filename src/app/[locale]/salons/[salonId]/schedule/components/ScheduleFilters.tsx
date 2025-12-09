"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

type Service = {
  id: string
  name: string
  price: number
  durationMinutes: number
}

type ScheduleFiltersProps = {
  currentWeekOffset: number
  maxWeeks: number
  weekLoadingStates: Record<number, boolean>
  weekDates: Date[]
  statusFilter: string
  serviceFilter: string
  services: Service[]
  t: any
  onWeekChange: (offset: number) => void
  onStatusFilterChange: (value: string) => void
  onServiceFilterChange: (value: string) => void
}

export default function ScheduleFilters({
  currentWeekOffset,
  maxWeeks,
  weekLoadingStates,
  weekDates,
  statusFilter,
  serviceFilter,
  services,
  t,
  onWeekChange,
  onStatusFilterChange,
  onServiceFilterChange
}: ScheduleFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-hidden">
      <div className="flex flex-col lg:flex-row gap-4 items-center min-w-0">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onWeekChange(Math.max(0, currentWeekOffset - 1))}
            disabled={currentWeekOffset === 0 || weekLoadingStates[currentWeekOffset - 1]}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
            {weekLoadingStates[currentWeekOffset - 1] ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
          <div className="text-center">
            <div className="font-semibold">
              {currentWeekOffset === 0 ? t("currentWeek") : t("week", { weekNum: currentWeekOffset + 1 })}
            </div>
            <div className="text-sm text-gray-500">
              {weekDates[0]?.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} -{" "}
              {weekDates[6]?.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
          <button
            onClick={() => onWeekChange(Math.min(maxWeeks, currentWeekOffset + 1))}
            disabled={currentWeekOffset === maxWeeks || weekLoadingStates[currentWeekOffset + 1]}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
            {weekLoadingStates[currentWeekOffset + 1] ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="flex-1 h-px bg-gray-200 lg:h-auto lg:w-px"></div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">{t("filters.allStatuses")}</option>
            <option value="pending">{t("status.pending")}</option>
            <option value="in_progress">{t("status.in_progress")}</option>
            <option value="completed">{t("status.completed")}</option>
          </select>
          <select
            value={serviceFilter}
            onChange={(e) => onServiceFilterChange(e.target.value)}
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
  )
}
