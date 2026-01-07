"use client"

import { Plus, Settings } from "lucide-react"

type ScheduleHeaderProps = {
  salon: any
  filteredAppointmentsCount: number
  canManageAppointments: boolean
  t: any
  onCreateBooking: () => void
  onSetupSchedule: () => void
}

export default function ScheduleHeader({
  salon,
  filteredAppointmentsCount,
  canManageAppointments,
  t,
  onCreateBooking,
  onSetupSchedule
}: ScheduleHeaderProps) {
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{salon?.name || t("title")}</h1>
        <p className="text-gray-600 mt-1">
          {t("showingAppointments", { count: filteredAppointmentsCount })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {canManageAppointments && (
          <>
            <button
              onClick={onCreateBooking}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              {t("createBooking")}
            </button>
            <button
              onClick={onSetupSchedule}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              <Settings className="w-4 h-4" />
              {t("setupSchedule")}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
