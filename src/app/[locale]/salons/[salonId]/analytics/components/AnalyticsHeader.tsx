import { useTranslations } from "next-intl";
import { FileDown } from "lucide-react";

interface AnalyticsHeaderProps {
  year: number;
  selectedMonth: number;
  monthLabels: string[];
  availableYears: number[];
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onExport: () => void;
  isLoading: boolean;
  hasData: boolean;
}

export function AnalyticsHeader({
  year,
  selectedMonth,
  monthLabels,
  availableYears,
  onYearChange,
  onMonthChange,
  onExport,
  isLoading,
  hasData,
}: AnalyticsHeaderProps) {
  const t = useTranslations("SalonAnalyticsPage");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t("header.title")}</h1>
        <p className="text-muted-foreground">{t("header.subtitle")}</p>
      </div>
      <div className="flex items-center gap-3 self-start sm:self-center">
        <button
          onClick={onExport}
          disabled={isLoading || !hasData}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent h-10 px-4"
        >
          <FileDown className="h-4 w-4 mr-2" />
          {t("exportButton")}
        </button>
        <select 
          id="month-select" 
          value={selectedMonth} 
          onChange={(e) => onMonthChange(Number(e.target.value))} 
          className="rounded-md border-gray-300 shadow-sm focus:border-rose-300 focus:ring focus:ring-rose-200 focus:ring-opacity-50"
        >
          <option value={-1}>{t("allYear")}</option>
          {monthLabels.map((label, i) => (
            <option key={i} value={i}>
              {label}
            </option>
          ))}
        </select>
        <select 
          id="year-select" 
          value={year} 
          onChange={(e) => onYearChange(Number(e.target.value))} 
          className="rounded-md border-gray-300 shadow-sm focus:border-rose-300 focus:ring focus:ring-rose-200 focus:ring-opacity-50"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
