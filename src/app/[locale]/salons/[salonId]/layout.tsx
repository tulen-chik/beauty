"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import React from "react";

export default function SalonCrmLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode, 
  params: { salonId: string, locale: string } 
}) {
  const { salonId, locale } = params;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('salonCrm');
  const activePath = pathname.split(`/salons/${salonId}`)[1] || "";

  const MENU = [
    { key: "dashboard", label: t('menu.dashboard'), path: "" },
    { key: "services", label: t('menu.services'), path: "/services" },
    { key: "categories", label: t('menu.categories'), path: "/categories" },
    { key: "schedule", label: t('menu.schedule'), path: "/schedule" },
    { key: "staff", label: t('menu.staff'), path: "/staff" },
    { key: "analytics", label: t('menu.analytics'), path: "/analytics" },
    { key: "settings", label: t('menu.settings'), path: "/settings" },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-5xl flex bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-h-[600px]">
          {/* Основной контент */}
          <div className="flex-1 p-8">
            {children}
          </div>
          {/* Меню справа */}
          <aside className="w-64 border-l border-gray-100 bg-gray-50 p-8 flex flex-col gap-2">
            <div className="text-lg font-bold text-gray-800 mb-4">{t('menu.title')}</div>
            {MENU.map((item) => (
              <button
                key={item.key}
                onClick={() => router.push(`/${locale}/salons/${salonId}${item.path}`)}
                className={`text-left px-4 py-2 rounded-xl font-medium transition-all ${
                  activePath === item.path 
                    ? "bg-rose-600 text-white" 
                    : "hover:bg-rose-100 text-gray-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </aside>
        </div>
      </div>
    </ProtectedRoute>
  );
} 