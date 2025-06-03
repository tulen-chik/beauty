"use client";

import { useEffect,useState } from "react";

import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { useTranslations } from 'next-intl';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-black-01 flex relative">
      <AppSidebar isMobile={isMobile} />
      <div className="flex-1 flex flex-col min-h-screen w-full">
        <AppHeader isMobile={isMobile} />
        <main className={`flex-1 flex flex-col transition-all duration-300
          ${isMobile ? 'pt-[100px]' : 'pt-[130px] lg:pl-[160px] lg:pr-8 pl-[120px] md:pr-4 pr-4'}`}>
          {children}
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
} 