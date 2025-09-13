import { X } from "lucide-react";
import { SalonWorkDay, WeekDay } from "@/types/database";
import { SchedulePageProps } from "./types";

const WEEKDAYS = [
  { key: "monday", label: "Пн", fullLabel: "Понедельник", shortLabel: "Пн" },
  { key: "tuesday", label: "Вт", fullLabel: "Вторник", shortLabel: "Вт" },
  { key: "wednesday", label: "Ср", fullLabel: "Среда", shortLabel: "Ср" },
  { key: "thursday", label: "Чт", fullLabel: "Четверг", shortLabel: "Чт" },
  { key: "friday", label: "Пт", fullLabel: "Пятница", shortLabel: "Пт" },
  { key: "saturday", label: "Сб", fullLabel: "Суббота", shortLabel: "Сб" },
  { key: "sunday", label: "Вс", fullLabel: "Воскресенье", shortLabel: "Вс" },
];

export const ScheduleModal = ({
  isScheduleModalOpen,
  setIsScheduleModalOpen,
  weeklySchedule,
  handleOpenToggle,
  handleTimeChange,
  handleAddInterval,
  handleRemoveInterval,
  handleSaveSchedule,
  modalError,
  t,
}: Pick<
  SchedulePageProps,
  | 'isScheduleModalOpen'
  | 'setIsScheduleModalOpen'
  | 'weeklySchedule'
  | 'handleOpenToggle'
  | 'handleTimeChange'
  | 'handleAddInterval'
  | 'handleRemoveInterval'
  | 'handleSaveSchedule'
  | 'modalError'
  | 't'
>) => {
  if (!isScheduleModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{t("scheduleSetup")}</h2>
          <button 
            onClick={() => setIsScheduleModalOpen(false)} 
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {modalError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
              <span>{modalError}</span>
            </div>
          )}
          <div className="space-y-6">
            {WEEKDAYS.map((day, dayIdx) => {
              const dayData = weeklySchedule[dayIdx] || { day: day.key as WeekDay, isOpen: false, times: [] };
              return (
                <div key={day.key} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`day-${day.key}`}
                        checked={dayData.isOpen}
                        onChange={(e) => handleOpenToggle(dayIdx, e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      />
                      <label htmlFor={`day-${day.key}`} className="font-medium">
                        {day.fullLabel}
                      </label>
                    </div>
                    <div className="text-sm text-gray-500">
                      {dayData.isOpen 
                        ? dayData.times?.length 
                          ? dayData.times.map(t => `${t.start} - ${t.end}`).join(', ')
                          : t("closed")
                        : t("closed")}
                    </div>
                  </div>
                  {dayData.isOpen && (
                    <div className="p-4 space-y-4">
                      {dayData.times?.map((time, timeIdx) => (
                        <div key={timeIdx} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={time.start}
                            onChange={(e) => handleTimeChange(dayIdx, timeIdx, "start", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <span>—</span>
                          <input
                            type="time"
                            value={time.end}
                            onChange={(e) => handleTimeChange(dayIdx, timeIdx, "end", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                            min={time.start}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveInterval(dayIdx, timeIdx)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddInterval(dayIdx)}
                        className="text-sm text-rose-600 hover:text-rose-800 font-medium mt-2"
                      >
                        + {t("addTimeInterval")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSaveSchedule}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700"
          >
            {t("saveSchedule")}
          </button>
        </div>
      </div>
    </div>
  );
};
