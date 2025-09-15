import { TrendingUp, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";

interface TopService {
  name: string;
  count?: number;
  revenue?: number;
}

interface TopServicesListProps {
  services: TopService[];
  type: 'quantity' | 'revenue';
  className?: string;
}

export function TopServicesList({ services, type, className = "" }: TopServicesListProps) {
  const t = useTranslations("SalonAnalyticsPage");
  
  if (services.length === 0) {
    return (
      <div className={`rounded-lg border bg-card p-6 ${className}`}>
        <p className="text-muted-foreground text-sm">
          {type === 'quantity' 
            ? t("topServices.noQuantityData")
            : t("topServices.noRevenueData")}
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border bg-card p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        {type === 'quantity' ? (
          <>
            <TrendingUp className="h-5 w-5 text-rose-600" />
            <h3 className="font-semibold">{t("topServices.byQuantity")}</h3>
          </>
        ) : (
          <>
            <DollarSign className="h-5 w-5 text-rose-600" />
            <h3 className="font-semibold">{t("topServices.byRevenue")}</h3>
          </>
        )}
      </div>
      <div className="space-y-4">
        {services.map((service, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{service.name}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <span className="font-semibold">
                {type === 'quantity' 
                  ? service.count
                  : `${service.revenue?.toFixed(2)} ₽`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
