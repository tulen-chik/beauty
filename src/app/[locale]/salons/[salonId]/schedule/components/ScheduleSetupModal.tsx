"use client"

import { AlertCircle, X } from "lucide-react"

import { SalonWorkDay } from "@/types/database"

type ScheduleSetupModalProps = {
  isOpen: boolean
  weeklySchedule: SalonWorkDay[]
  modalError: string | null
  t: any
  onClose: () => void
  onSave: () => void
  onOpenToggle: (dayIdx: number, isOpen: boolean) => void
  onTimeChange: (dayIdx: number, timeIdx: number, field: "start" | "end", value: string) => void
  onAddInterval: (dayIdx: number) => void
  onRemoveInterval: (dayIdx: number, timeIdx: number) => void
}

const WEEKDAYS = [
  { key: "monday", label: "Пн", fullLabel: "Понедельник", shortLabel: "Пн" },
  { key: "tuesday", label: "Вт", fullLabel: "Вторник", shortLabel: "Вт" },
  { key: "wednesday", label: "Ср", fullLabel: "Среда", shortLabel: "Ср" },
  { key: "thursday", label: "Чт", fullLabel: "Четверг", shortLabel: "Чт" },
  { key: "friday", label: "Пт", fullLabel: "Пятница", shortLabel: "Пт" },
  { key: "saturday", label: "Сб", fullLabel: "Суббота", shortLabel: "Сб" },
  { key: "sunday", label: "Вс", fullLabel: "Воскресенье", shortLabel: "Вс" },
];

export default function ScheduleSetupModal({
  isOpen,
  weeklySchedule,
  modalError,
  t,
  onClose,
  onSave,
  onOpenToggle,
  onTimeChange,
  onAddInterval,
  onRemoveInterval
}: ScheduleSetupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{t("scheduleSetup")}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {modalError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}
          <div className="space-y-6">
            {weeklySchedule.map((d, i) => (
              <div key={d.day} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-4 mb-3">
                  <span className="font-semibold w-32">{WEEKDAYS.find(w => w.key === d.day)?.fullLabel}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={d.isOpen}
                      onChange={e => onOpenToggle(i, e.target.checked)}
                    />
                    <span className="text-sm">{t("open")}</span>
                  </label>
                </div>
                {d.isOpen && (
                  <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                    {(d.times || []).map((t, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={t.start}
                          onChange={e => onTimeChange(i, j, "start", e.target.value)}
                          className="px-2 py-1 border rounded-md text-sm w-28"
                        />
                        <span>—</span>
                        <input
                          type="time"
                          value={t.end}
                          onChange={e => onTimeChange(i, j, "end", e.target.value)}
                          className="px-2 py-1 border rounded-md text-sm w-28"
                        />
                        <button onClick={() => onRemoveInterval(i, j)} className="text-red-500 hover:text-red-700 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => onAddInterval(i)} className="text-blue-600 text-sm font-medium mt-2">
                      {t("addInterval")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300">
            {t("cancel")}
          </button>
          <button onClick={onSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  )
}
