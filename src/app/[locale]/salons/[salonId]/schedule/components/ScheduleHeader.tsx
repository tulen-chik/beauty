"use client"

import { Plus, Settings } from "lucide-react"

type ScheduleHeaderProps = {
  salon: any
  filteredAppointmentsCount: number
  success: boolean
  canManageAppointments: boolean
  t: any
  onCreateBooking: () => void
  onSetupSchedule: () => void
}

export default function ScheduleHeader({
  salon,
  filteredAppointmentsCount,
  success,
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
        {success && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
            {t("scheduleSaved")}
          </div>
        )}
        {canManageAppointments && (
          <>
            <button
              onClick={onCreateBooking}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <Plus size={18} />
              {t('createBooking') || 'Создать запись'}
            </button>
            <button
              onClick={onSetupSchedule}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {t("setupSchedule")}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
