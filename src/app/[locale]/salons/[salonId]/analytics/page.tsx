"use client"
import { BarChart2, ChevronDown, DollarSign, FileDown, Loader2, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from 'xlsx';

import { useAppointment } from "@/contexts/AppointmentContext";
import { useSalonService } from "@/contexts/SalonServiceContext";

interface ServiceAnalyticsData {
    id: string;
    name: string;
    price: number;
    monthlyCounts: number[];
    totalYearlyCount: number;
    totalYearlyRevenue: number;
}

export default function SalonAnalyticsPage({ params }: { params: { salonId: string } }) {
    const t = useTranslations("SalonAnalyticsPage");
    const { salonId } = params;
    const { listAppointments, loading: appointmentsLoading } = useAppointment();
    const { getServicesBySalon, loading: servicesLoading } = useSalonService();

    const [tableData, setTableData] = useState<ServiceAnalyticsData[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(-1);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const monthLabels = useMemo(() => [
        t("months.full.jan"), t("months.full.feb"), t("months.full.mar"),
        t("months.full.apr"), t("months.full.may"), t("months.full.jun"),
        t("months.full.jul"), t("months.full.aug"), t("months.full.sep"),
        t("months.full.oct"), t("months.full.nov"), t("months.full.dec")
    ], [t]);
    
    const shortMonthLabels = useMemo(() => [
        t("months.short.jan"), t("months.short.feb"), t("months.short.mar"),
        t("months.short.apr"), t("months.short.may"), t("months.short.jun"),
        t("months.short.jul"), t("months.short.aug"), t("months.short.sep"),
        t("months.short.oct"), t("months.short.nov"), t("months.short.dec")
    ], [t]);

    useEffect(() => {
        const fetchAndProcessData = async () => {
            const startDate = new Date(year, 0, 1).toISOString();
            const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

            const [services, appointments] = await Promise.all([
                getServicesBySalon(salonId),
                listAppointments(salonId, { startAt: startDate, endAt: endDate, status: 'completed' })
            ]);

            const analyticsData = services.map(service => {
                const monthlyCounts = Array(12).fill(0);
                const serviceAppointments = appointments.filter(a => a.serviceId === service.id);

                serviceAppointments.forEach(appointment => {
                    const month = new Date(appointment.startAt).getMonth();
                    monthlyCounts[month]++;
                });

                const totalYearlyCount = monthlyCounts.reduce((sum, count) => sum + count, 0);
                const totalYearlyRevenue = totalYearlyCount * (service.price || 0);

                return { id: service.id, name: service.name, price: service.price || 0, monthlyCounts, totalYearlyCount, totalYearlyRevenue };
            });

            const grandTotal = analyticsData.reduce((sum, item) => sum + item.totalYearlyRevenue, 0);
            setTableData(analyticsData);
            setTotalRevenue(grandTotal);
        };

        fetchAndProcessData();
    }, [salonId, year, getServicesBySalon, listAppointments]);

    const topByQuantity = useMemo(() => {
        return [...tableData]
            .map(service => ({
                name: service.name,
                count: selectedMonth === -1 ? service.totalYearlyCount : service.monthlyCounts[selectedMonth],
            }))
            .filter(s => s.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [tableData, selectedMonth]);

    const topByProfit = useMemo(() => {
        return [...tableData]
            .filter(s => s.totalYearlyRevenue > 0)
            .sort((a, b) => b.totalYearlyRevenue - a.totalYearlyRevenue)
            .slice(0, 5)
            .map(service => ({
                name: service.name,
                revenue: service.totalYearlyRevenue,
            }));
    }, [tableData]);

    const handleToggleRow = (rowId: string) => {
        setExpandedRowId(prevId => (prevId === rowId ? null : rowId));
    };

    const handleExportToExcel = () => {
        if (loading || tableData.length === 0) return;

        const headers = [
            "№", t("table.serviceName"), t("table.servicePrice"), t("table.yearlyCount"),
            ...shortMonthLabels, t("table.yearlyTotal")
        ];

        const rows = tableData.map((item, index) => [
            index + 1, item.name, item.price, item.totalYearlyCount,
            ...item.monthlyCounts, item.totalYearlyRevenue
        ]);

        const footer = [
            ...Array(4 + 12).fill(""),
            t("table.grandTotal"), totalRevenue
        ];

        const dataToExport = [headers, ...rows, footer];

        const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Analytics");

        XLSX.writeFile(workbook, `analytics_${salonId}_${year}.xlsx`);
    };

    const loading = appointmentsLoading || servicesLoading;
    const availableYears = Array.from({ length: 1 }, (_, i) => new Date().getFullYear() - i);

    return (
        <div className="min-h-screen bg-gradient-soft py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">{t("header.title")}</h1>
                        <p className="text-muted-foreground">{t("header.subtitle")}</p>
                    </div>
                    {/* --- ИЗМЕНЕНИЕ ЗДЕСЬ: Добавлены классы flex-wrap и sm:justify-end --- */}
                    <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3">
                        <button
                            onClick={handleExportToExcel}
                            disabled={loading || tableData.length === 0}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-rose-300 h-10 px-4"
                        >
                            <FileDown className="h-4 w-4 mr-2" />
                            {t("exportButton")}
                        </button>
                        <select id="month-select" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="rounded-md border-gray-300 shadow-sm focus:border-rose-300 focus:ring focus:ring-rose-200 focus:ring-opacity-50">
                            <option value={-1}>{t("allYear")}</option>
                            {monthLabels.map((label, i) => <option key={i} value={i}>{label}</option>)}
                        </select>
                        <select id="year-select" value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border-gray-300 shadow-sm focus:border-rose-300 focus:ring focus:ring-rose-200 focus:ring-opacity-50">
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm mb-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-96">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <span className="ml-2">{t("loading")}</span>
                        </div>
                    ) : tableData.length === 0 ? (
                        <div className="text-center py-12">
                            <BarChart2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">{t("emptyState.title")}</h3>
                            <p className="text-muted-foreground">{t("emptyState.description", { year })}</p>
                        </div>
                    ) : (
                        <div>
                            <div className="md:hidden p-4 space-y-4">
                                {tableData.map((item) => (
                                    <div key={item.id} className="border rounded-lg p-4 bg-background shadow-soft">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 pr-2">
                                                <h3 className="font-bold text-lg">{item.name}</h3>
                                                <p className="text-sm text-muted-foreground">{t("table.servicePrice")}: {item.price.toFixed(2)} ₽</p>
                                                <p className="text-sm text-muted-foreground">{t("table.yearlyCount")}: {item.totalYearlyCount}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg text-rose-600">{item.totalYearlyRevenue.toFixed(2)} ₽</p>
                                                <p className="text-xs text-muted-foreground">{t("table.yearlyTotal")}</p>
                                            </div>
                                        </div>
                                        <div className="border-t pt-3">
                                            <h4 className="text-sm font-semibold mb-2">{t("table.monthlyPeriods")}</h4>
                                            <div className="grid grid-cols-4 gap-2 text-center">
                                                {item.monthlyCounts.map((count, i) => (
                                                    <div key={i} className="rounded-md bg-muted/50 p-1">
                                                        <div className="text-xs font-bold text-muted-foreground">{shortMonthLabels[i]}</div>
                                                        <div className="text-md font-semibold">{count}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center p-4 font-bold bg-muted/50 rounded-lg mt-4">
                                    <span>{t("table.grandTotal")}:</span>
                                    <span className="text-xl text-rose-600">{totalRevenue.toFixed(2)} Br</span>
                                </div>
                            </div>

                            <div className="hidden md:block">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="p-4 font-medium w-12">№</th>
                                            <th className="p-4 font-medium">{t("table.serviceName")}</th>
                                            <th className="p-4 font-medium">{t("table.servicePrice")}</th>
                                            <th className="p-4 font-medium">{t("table.yearlyCount")}</th>
                                            <th className="p-4 font-medium text-right">{t("table.yearlyTotal")}</th>
                                            <th className="p-4 font-medium w-16 text-center">{t("table.details")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.map((item, index) => (
                                            <>
                                                <tr key={item.id} className="border-t hover:bg-muted/50 cursor-pointer" onClick={() => handleToggleRow(item.id)}>
                                                    <td className="p-4">{index + 1}</td>
                                                    <td className="p-4 font-medium">{item.name}</td>
                                                    <td className="p-4">{item.price.toFixed(2)}</td>
                                                    <td className="p-4 font-bold">{item.totalYearlyCount}</td>
                                                    <td className="p-4 font-bold text-rose-600 text-right">{item.totalYearlyRevenue.toFixed(2)}</td>
                                                    <td className="p-4 text-center">
                                                        <ChevronDown className={`h-5 w-5 mx-auto transition-transform duration-200 ${expandedRowId === item.id ? 'rotate-180' : ''}`} />
                                                    </td>
                                                </tr>
                                                {expandedRowId === item.id && (
                                                    <tr className="bg-muted/30">
                                                        <td colSpan={6} className="p-4">
                                                            <h4 className="text-sm font-semibold mb-3">{t("table.monthlyPeriods")}</h4>
                                                            <div className="grid grid-cols-6 gap-4 text-center">
                                                                {item.monthlyCounts.map((count, i) => (
                                                                    <div key={i} className="rounded-md bg-background p-2 border">
                                                                        <div className="text-xs font-bold text-muted-foreground">{shortMonthLabels[i]}</div>
                                                                        <div className="text-lg font-semibold">{count}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 font-bold bg-muted/50">
                                            <td colSpan={4} className="p-4 text-right">{t("table.grandTotal")}:</td>
                                            <td className="p-4 text-lg text-rose-600 text-right">{totalRevenue.toFixed(2)}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {!loading && tableData.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="h-6 w-6 text-rose-500" />
                                <h3 className="text-lg font-semibold">
                                    {t("ratingByQuantityTitle")} ({selectedMonth === -1 ? t("allYear") : monthLabels[selectedMonth]})
                                </h3>
                            </div>
                            {topByQuantity.length > 0 ? (
                                <ol className="space-y-3 list-decimal list-inside">
                                    {topByQuantity.map((item, index) => (
                                        <li key={index} className="flex justify-between items-center text-sm p-2 rounded-md odd:bg-muted/50">
                                            <span>{item.name}</span>
                                            <span className="font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">{item.count} {t("pcs")}</span>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t("noDataForPeriod")}</p>
                            )}
                        </div>

                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <DollarSign className="h-6 w-6 text-green-500" />
                                <h3 className="text-lg font-semibold">{t("ratingByProfitTitle")} ({year})</h3>
                            </div>
                            {topByProfit.length > 0 ? (
                                <ol className="space-y-3 list-decimal list-inside">
                                    {topByProfit.map((item, index) => (
                                        <li key={index} className="flex justify-between items-center text-sm p-2 rounded-md odd:bg-muted/50">
                                            <span>{item.name}</span>
                                            <span className="font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{item.revenue.toFixed(2)} ₽</span>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t("noDataForPeriod")}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}