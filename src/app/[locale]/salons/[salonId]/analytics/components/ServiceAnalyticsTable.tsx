import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface ServiceAnalyticsData {
  id: string;
  name: string;
  price: number;
  monthlyCounts: number[];
  totalYearlyCount: number;
  totalYearlyRevenue: number;
}

interface ServiceAnalyticsTableProps {
  data: ServiceAnalyticsData[];
  monthLabels: string[];
  expandedRowId: string | null;
  onRowToggle: (id: string) => void;
  selectedMonth: number;
}

export function ServiceAnalyticsTable({
  data,
  monthLabels,
  expandedRowId,
  onRowToggle,
  selectedMonth
}: ServiceAnalyticsTableProps) {
  const t = useTranslations("SalonAnalyticsPage");
  
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("emptyState.noData")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3">#</th>
            <th className="text-left p-3">{t("table.serviceName")}</th>
            <th className="text-right p-3">{t("table.servicePrice")}</th>
            <th className="text-right p-3">{t("table.yearlyCount")}</th>
            <th className="text-right p-3">{t("table.yearlyTotal")}</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <>
              <tr 
                key={item.id} 
                className="border-b hover:bg-accent/50 cursor-pointer"
                onClick={() => onRowToggle(item.id)}
              >
                <td className="p-3">{index + 1}</td>
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3 text-right">{item.price.toFixed(2)} руб.</td>
                <td className="p-3 text-right">{item.totalYearlyCount}</td>
                <td className="p-3 text-right font-semibold text-rose-600">
                  {item.totalYearlyRevenue.toFixed(2)} руб.
                </td>
                <td className="p-3 text-right">
                  {expandedRowId === item.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </td>
              </tr>
              {expandedRowId === item.id && (
                <tr className="bg-muted/20">
                  <td colSpan={6} className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {monthLabels.map((month, i) => (
                        <div key={i} className={`p-2 rounded ${
                          selectedMonth === i ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-muted/30'
                        }`}>
                          <div className="text-sm font-medium">{month}</div>
                          <div className="text-right font-semibold">{item.monthlyCounts[i]}</div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
