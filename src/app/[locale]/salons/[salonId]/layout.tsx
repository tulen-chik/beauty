"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { Menu, X, Building2, MessageCircle } from "lucide-react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const MENU = [
    { key: "appointments", label: t('menu.appointments'), path: "/appointments" },
    { key: "services", label: t('menu.services'), path: "/services" },
    { key: "schedule", label: t('menu.schedule'), path: "/schedule" },
    { key: "chats", label: "Чаты", path: "/chats" },
    { key: "ratings", label: "Отзывы", path: "/ratings" },
    { key: "staff", label: t('menu.staff'), path: "/staff" },
    { key: "settings", label: t('menu.settings'), path: "/settings" },
  ];

  const handleMenuClick = (path: string) => {
    router.push(`/${locale}/salons/${salonId}${path}`);
    setMobileMenuOpen(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-rose-600" />
                <span className="font-semibold text-gray-900">Салон #{salonId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
            <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-rose-600" />
                    <span className="font-semibold text-gray-900">Меню</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {MENU.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleMenuClick(item.path)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                      activePath === item.path 
                        ? "bg-rose-600 text-white" 
                        : "hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Layout */}
        <div className="hidden lg:flex lg:min-h-screen lg:py-12 lg:px-4 lg:items-center lg:justify-center">
          <div className="w-full max-w-7xl flex bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-h-[600px]">
            {/* Основной контент */}
            {/* THE FIX IS HERE: Added min-w-0 to allow this flex item to shrink */}
            <div className="flex-1 p-8 min-w-0">
              {children}
            </div>
            {/* Меню справа */}
            <aside className="w-64 border-l border-gray-100 bg-gray-50 p-8 flex flex-col gap-2 flex-shrink-0">
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

        {/* Mobile Content */}
        <div className="lg:hidden p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}