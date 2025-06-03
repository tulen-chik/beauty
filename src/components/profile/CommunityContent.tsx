"use client";

import Image from "next/image";
import CommunityEmpty from "./CommunityEmpty";
import { motion } from "framer-motion";

export default function CommunityContent() {
  // Пример массива сообщений
  const messages = [
    {
      id: 1,
      user: "Zhliuk",
      avatar: "/images/cat.jpg",
      text: "В целом, дизайн почти готов, осталось только немного доработать разделы для загрузки контента и статистики. Хотел бы, чтобы ты посмотрел прототип и дал свои комментарии.",
      time: "14:31",
      isMe: false,
    },
    {
      id: 2,
      user: "Heilen",
      avatar: "/images/cat.jpg",
      text: "Как идет работа над интерфейсом?",
      time: "14:31",
      isMe: true,
    },
    {
      id: 3,
      user: "Heilen",
      avatar: "/images/cat.jpg",
      text: "Нужно ли что-то дополнительно уточнить по дизайну для удобства клиперов и авторов?",
      time: "14:31",
      isMe: true,
    },
    ...Array.from({ length: 6 }).map((_, i) => ({
      id: 4 + i,
      user: "Zhliuk",
      avatar: "/images/cat.jpg",
      text: `Тестовое сообщение ${i + 1}`,
      time: "14:3" + (i + 2),
      isMe: false,
    })),
  ];

  if (messages.length === 0) {
    return <CommunityEmpty />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col gap-2"
    >
      {/* Header */}
      <div className="bg-black-02 rounded-xl p-0 overflow-hidden flex flex-col min-h-[320px]">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-black-01">
          <div>
            <div className="text-base sm:text-lg font-bold text-white">ROKY PRODUCT</div>
          </div>
          <div className="flex items-center gap-2">
            {/* Avatars */}
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Image
                  key={n}
                  src="/images/cat.jpg"
                  alt="avatar"
                  width={28}
                  height={28}
                  loading="lazy"
                  className="rounded-full border-2 border-black-02 w-7 h-7 sm:w-8 sm:h-8"
                />
              ))}
            </div>
            <div className="ml-2 sm:ml-3 text-right">
              <div className="text-white text-xs sm:text-base font-semibold">23,657 участников</div>
              <div className="text-orange-400 text-xs">
                <span className="mr-1">●</span>10,986 онлайн
              </div>
            </div>
          </div>
        </div>

        

        <div
          className="
            px-6 py-6 bg-black-02 max-h-96 overflow-y-auto space-y-4
            /* Firefox */
            scrollbar-thin scrollbar-track-[#0F0F12] scrollbar-thumb-[#23232A]
            /* Другие браузеры */
            [scrollbar-color:#23232A_#0F0F12]
            /* WebKit */
            [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2
            [&::-webkit-scrollbar-track]:bg-[#0F0F12]
            [&::-webkit-scrollbar-thumb]:bg-[#23232A] [&::-webkit-scrollbar-thumb]:rounded-full
            hover:[&::-webkit-scrollbar-thumb]:bg-[#FF883D]
            transition-colors duration-200
          "
        >
          {messages.map((msg) =>
            msg.isMe ? (
              <div key={msg.id} className="flex flex-col items-end gap-1">
                <div className="bg-[#23232A] rounded-xl px-3 py-2 sm:px-4 sm:py-3 max-w-full sm:max-w-xl">
                  <div className="text-white font-semibold text-right text-sm sm:text-base">{msg.user}</div>
                  <div className="text-white text-right text-sm sm:text-base">{msg.text}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>{msg.time}</span>
                  <svg width="14" height="14" fill="none" className="inline" viewBox="0 0 16 16">
                    <path d="M3 8l3 3 7-7" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <svg width="14" height="14" fill="none" className="inline" viewBox="0 0 16 16">
                    <path d="M3 8l3 3 7-7" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex items-start gap-2 sm:gap-3">
                <Image
                  src="/images/cat.jpg"
                  alt={msg.user}
                  width={32}
                  height={32}
                  loading="lazy"
                  className="rounded-full w-8 h-8"
                />
                <div>
                  <div className="text-white font-semibold text-sm sm:text-base">{msg.user}</div>
                  <div className="text-gray-200 bg-black-01 rounded-xl px-3 py-2 sm:px-4 sm:py-3 mt-1 max-w-full sm:max-w-xl text-sm sm:text-base">
                    {msg.text}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{msg.time}</div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Typing indicator */}
        <div className="px-3 sm:px-6 pb-3 sm:pb-4 text-gray-400 text-xs sm:text-sm">
          Zhliuk и Лиза Губич печатают...
        </div>

        {/* Button */}
        <div className="flex justify-end px-3 sm:px-6 pb-4 sm:pb-6">
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-5 py-2 sm:px-8 sm:py-3 text-base sm:text-lg transition">
            Перейти в чат
          </button>
        </div>
      </div>
    </motion.div>
  );
}