"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import EmptyState from "@/components/EmptyState";

const statsToday = [
  { icon: "bag", value: 2, label: "Кол-во предложений" },
  { icon: "eye", value: "15,456", label: "Кол-во просмотров ваших предложений" },
  { icon: "dollar", value: "150,4", label: "Кол-во задействованного бюджета" },
  { icon: "play", value: 1, label: "Кол-во клипов" },
  { icon: "eye", value: 578, label: "Кол-во просмотров ваших клипов" },
  { icon: "dollar", value: 0, label: "Кол-во заработанных денег" },
];

const StatIcons: Record<string, React.ReactNode> = {
  bag: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 16V28H27V16H13ZM20 12C21.1046 12 22 12.8954 22 14H18C18 12.8954 18.8954 12 20 12ZM28 16V28C28 29.1046 27.1046 30 26 30H14C12.8954 30 12 29.1046 12 28V16C12 14.8954 12.8954 14 14 14H16V14C16 11.7909 17.7909 10 20 10C22.2091 10 24 11.7909 24 14V14H26C27.1046 14 28 14.8954 28 16Z" fill="url(#bagGradient)"/>
      <defs>
        <linearGradient id="bagGradient" x1="12" y1="10" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF4400" />
          <stop offset="1" stopColor="#FF883D" />
        </linearGradient>
      </defs>
    </svg>
  ),
  eye: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="20" rx="10" ry="6" fill="url(#eyeGradient)" fillOpacity="0.15"/>
      <ellipse cx="20" cy="20" rx="5" ry="3" fill="url(#eyeGradient)"/>
      <circle cx="20" cy="20" r="2" fill="#FF4400"/>
      <defs>
        <linearGradient id="eyeGradient" x1="10" y1="14" x2="30" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF4400" />
          <stop offset="1" stopColor="#FF883D" />
        </linearGradient>
      </defs>
    </svg>
  ),
  dollar: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 8V32M15 12H25M15 28H25" stroke="url(#dollarGradient)" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="dollarGradient" x1="15" y1="8" x2="25" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF4400" />
          <stop offset="1" stopColor="#FF883D" />
        </linearGradient>
      </defs>
    </svg>
  ),
  play: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 13L28 20L16 27V13Z" fill="url(#playGradient)"/>
      <defs>
        <linearGradient id="playGradient" x1="16" y1="13" x2="28" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF4400" />
          <stop offset="1" stopColor="#FF883D" />
        </linearGradient>
      </defs>
    </svg>
  ),
};

function StatIcon({ type }: { type: string }) {
  return <span>{StatIcons[type]}</span>;
}

export default function StatsPage() {
  const [tab, setTab] = useState<"today" | "all">("today");

  return (
    <div className="min-h-screen bg-black py-8 px-2 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-4xl font-bold mb-6">Статистика</h1>
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            className={`flex-1 py-2 rounded-full text-lg font-semibold transition-all ${
              tab === "today"
                ? "bg-gradient-to-r from-[#FF4400] to-[#FF883D] text-white"
                : "bg-black-02 border border-orange-400 text-orange-200"
            }`}
            onClick={() => setTab("today")}
          >
            На сегодня
          </button>
          <button
            className={`flex-1 py-2 rounded-full text-lg font-semibold transition-all ${
              tab === "all"
                ? "bg-gradient-to-r from-[#FF4400] to-[#FF883D] text-white"
                : "bg-black-02 border border-orange-400 text-orange-200"
            }`}
            onClick={() => setTab("all")}
          >
            Общая статистика
          </button>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-black-02 rounded-3xl p-0 sm:p-8 flex flex-col items-center justify-center mb-8 min-h-[300px] relative"
        >
          {/* Круговой прогресс с аватаркой */}
          <div className="flex items-center justify-center w-full h-[220px]">
            <svg width="220" height="220" viewBox="0 0 220 220" className="absolute">
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#23232A"
                strokeWidth="24"
                fill="none"
              />
              <motion.circle
                cx="110"
                cy="110"
                r="90"
                stroke="#FF883D"
                strokeWidth="24"
                fill="none"
                strokeDasharray={565}
                strokeDashoffset={565 - 0.6 * 565} // 60% заполнения
                strokeLinecap="round"
                initial={{ strokeDashoffset: 565 }}
                animate={{ strokeDashoffset: 565 - 0.6 * 565 }}
                transition={{ duration: 1 }}
              />
            </svg>
            <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-8 border-black-02 z-10 flex items-center justify-center bg-black-01">
              <Image
                src="/images/cat.jpg"
                alt="avatar"
                width={120}
                height={120}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Статистика */}
        {statsToday.length === 0 ? (
          <EmptyState text="Нет данных для отображения!" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statsToday.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + idx * 0.07, ease: "easeOut" }}
                className="bg-black-02 rounded-2xl flex flex-col items-center justify-center p-6"
              >
                <div className="mb-2 flex">
                  <StatIcon type={stat.icon} />
                  <div className="text-white text-3xl font-bold mb-1">{stat.value}</div>
                </div>
                <div className="text-white text-base text-center">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}