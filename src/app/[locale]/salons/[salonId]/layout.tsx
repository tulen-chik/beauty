"use client";
import { 
  Building2, 
  Menu, 
  X, 
  LayoutGrid, 
  ClipboardList, 
  Calendar, 
  MessageSquare, 
  Star, 
  Users, 
  Settings, 
  Megaphone, 
  BarChart3 
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useSalon, useUser } from "@/contexts";

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
  const { userSalons, fetchUserSalons } = useSalon();
  const { currentUser } = useUser();

  useEffect(() => {
    if (!userSalons && currentUser?.userId) {
      fetchUserSalons(currentUser.userId).catch(() => {});
    }
  }, [userSalons, currentUser?.userId, fetchUserSalons]);

  const currentRole = useMemo(() => {
    const entry = userSalons?.salons?.find((s) => s.salonId === salonId);
    return entry?.role || null;
  }, [userSalons, salonId]);

  const MENU_ITEMS = useMemo(() => [
    // { key: "appointments", label: t('menu.appointments'), path: "/appointments", icon: ClipboardList },
    { key: "services", label: t('menu.services'), path: "/services", icon: LayoutGrid },
    { key: "schedule", label: t('menu.schedule'), path: "/schedule", icon: Calendar },
    { key: "chats", label: t('menu.chats'), path: "/chats", icon: MessageSquare },
    { key: "ratings", label: t('menu.ratings'), path: "/ratings", icon: Star },
    { key: "staff", label: t('menu.staff'), path: "/staff", icon: Users },
    { key: "settings", label: t('menu.settings'), path: "/settings", icon: Settings },
    { key: "promotion", label: t('menu.promotion'), path: "/promotion", icon: Megaphone },
    { key: "analytics", label: t('menu.analytics'), path: "/analytics", icon: BarChart3 },
  ], [t]);

  const FILTERED_MENU = useMemo(() => {
    if (currentRole === 'employee') {
      return MENU_ITEMS.filter((i) => i.key !== 'settings' && i.key !== 'promotion');
    }
    return MENU_ITEMS;
  }, [MENU_ITEMS, currentRole]);

  const handleMenuClick = (path: string) => {
    router.push(`/${locale}/salons/${salonId}${path}`);
    setMobileMenuOpen(false);
  };

  const NavMenu = () => (
    <nav className="flex flex-col gap-2">
      {FILTERED_MENU.map((item) => (
        <button
          key={item.key}
          onClick={() => handleMenuClick(item.path)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm ${
            activePath === item.path 
              ? "bg-rose-600 text-white shadow-md shadow-rose-200" 
              : "hover:bg-slate-200/60 text-slate-700"
          }`}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <div className="lg:flex">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex flex-col w-64 h-screen p-4 bg-slate-100/70 border-r border-slate-200/80 sticky top-0">
            <div className="flex items-center gap-3 px-3 py-2 mb-8">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                <Building2 className="w-6 h-6 text-rose-600" />
              </div>
              <span className="text-lg font-bold text-slate-800">{t('menu.title')}</span>
            </div>
            <NavMenu />
          </aside>

          {/* Mobile Header */}
          <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200/80">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                  <Building2 className="w-5 h-5 text-rose-600" />
                </div>
                <span className="font-bold text-slate-800">{t('menu.title')}</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </header>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)}>
              <div 
                className="fixed top-0 left-0 w-72 h-full bg-white shadow-2xl p-4 flex flex-col" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                      <Building2 className="w-6 h-6 text-rose-600" />
                    </div>
                    <span className="text-lg font-bold text-slate-800">{t('menu.title')}</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <NavMenu />
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}