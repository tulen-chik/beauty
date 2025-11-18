"use client"

import Link from "next/link";
import { Building2, MessageCircle, Search, ArrowRight } from "lucide-react";

interface QuickActionsProps {
  t: (key: string) => string;
}

export default function QuickActions({ t }: QuickActionsProps) {
  const actions = [
    {
      href: "/salons",
      icon: Building2,
      title: t('quickActions.mySalons'),
      desc: t('quickActions.mySalonsDesc'),
      color: "text-rose-600",
      bg: "bg-rose-50 group-hover:bg-rose-100",
      border: "group-hover:border-rose-200"
    },
    {
      href: "/search",
      icon: Search,
      title: t('quickActions.findServices'),
      desc: t('quickActions.findServicesDesc'),
      color: "text-blue-600",
      bg: "bg-blue-50 group-hover:bg-blue-100",
      border: "group-hover:border-blue-200"
    },
    {
      href: "/chats",
      icon: MessageCircle,
      title: "Мои чаты",
      desc: "Общение с салонами",
      color: "text-emerald-600",
      bg: "bg-emerald-50 group-hover:bg-emerald-100",
      border: "group-hover:border-emerald-200"
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl mb-6 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800">{t('quickActions.title')}</h2>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Link 
              key={index}
              href={action.href} 
              className={`group relative flex items-start gap-4 p-5 border border-slate-200 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white ${action.border}`}
            >
              <div className={`p-3 rounded-xl transition-colors ${action.bg} ${action.color}`}>
                <action.icon className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                    {action.title}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {action.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}