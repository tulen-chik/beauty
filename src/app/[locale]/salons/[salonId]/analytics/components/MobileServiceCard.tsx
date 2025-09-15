import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface MobileServiceCardProps {
  service: {
    id: string;
    name: string;
    price: number;
    monthlyCounts: number[];
    totalYearlyCount: number;
    totalYearlyRevenue: number;
  };
  monthLabels: string[];
  index: number;
}

export function MobileServiceCard({ service, monthLabels, index }: MobileServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations("SalonAnalyticsPage");

  return (
    <div key={service.id} className="border rounded-lg p-4 bg-background shadow-soft mb-4">
      <div 
        className="flex justify-between items-start"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground">#{index + 1}</span>
            <h3 className="font-bold text-lg">{service.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t("table.servicePrice")}: {service.price.toFixed(2)} ₽
          </p>
          <p className="text-sm text-muted-foreground">
            {t("table.yearlyCount")}: {service.totalYearlyCount}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-rose-600">
            {service.totalYearlyRevenue.toFixed(2)} ₽
          </p>
          <p className="text-xs text-muted-foreground">{t("table.yearlyTotal")}</p>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t">
          <h4 className="text-sm font-semibold mb-2">{t("table.monthlyPeriods")}</h4>
          <div className="grid grid-cols-3 gap-2">
            {service.monthlyCounts.map((count, i) => (
              <div key={i} className="bg-muted/30 p-2 rounded text-center">
                <div className="text-xs text-muted-foreground">
                  {monthLabels[i].substring(0, 3)}
                </div>
                <div className="font-semibold">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div 
        className="flex justify-center mt-2 text-muted-foreground cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </div>
    </div>
  );
}
