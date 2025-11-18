"use client";

import { useTranslations } from "next-intl";

interface AppointmentsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function AppointmentsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: AppointmentsPaginationProps) {
  const t = useTranslations("salonAppointments");

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 pt-4">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
      >
        {t("pagination.previous")}
      </button>

      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? "bg-rose-600 text-white shadow-sm shadow-rose-200"
                : "border border-slate-200 hover:bg-slate-50 text-slate-600"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
      >
        {t("pagination.next")}
      </button>
    </div>
  );
}