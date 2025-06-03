"use client";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/EmptyState";

const notifications = [
  {
    id: 1,
    user: "ROKY",
    avatar: "/images/cat.jpg",
    date: "04.05.25, 1 час назад",
    text: <>
      Ваш клип <a href="https://www.tiktok.com/@the.nick.pro/video/690427111778398065?lang=en" className="underline text-white" target="_blank">https://www.tiktok.com/@the.nick.pro/video/690427111778398065?lang=en</a> по предложению <b>"Нарезки из моего видео о путешествии в Японии"</b>, <span className="text-green-400 font-bold">был одобрен!</span>
    </>,
  },
  {
    id: 2,
    user: "ROKY",
    avatar: "/images/cat.jpg",
    date: "04.05.25, 1 час назад",
    text: <>
      Оплата на клип <a href="https://www.tiktok.com/@the.nick.pro/video/690427111778398065?lang=en" className="underline text-white" target="_blank">https://www.tiktok.com/@the.nick.pro/video/690427111778398065?lang=en</a> по предложению <b>"Нарезки из моего видео о путешествии в Японии"</b> пришла!
    </>,
  },
  {
    id: 3,
    user: "ROKY",
    avatar: "/images/cat.jpg",
    date: "04.05.25, 1 час назад",
    text: <>
      Ваш клип <a href="https://www.tiktok.com/@the.nick.pro/video/690427111778398065?lang=en" className="underline text-white" target="_blank">https://www.tiktok.com/@the.nick.pro/video/690427111778398065?lang=en</a> по предложению <b>"Зарабатывайте деньги, вырезая для SMM AI"</b>, <span className="text-red-400 font-bold">не был одобрен!</span>
    </>,
  },
  {
    id: 4,
    user: "Zhiluk",
    avatar: "/images/cat.jpg",
    date: "04.05.25, 1 час назад",
    text: <>
      Успешная оплата клипа пользователя <b>Zhiluk</b>!
    </>,
  },
];

function TrashIcon() {
  return (
    <svg width="74" height="77" viewBox="0 0 74 77" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M73.2402 28.1641C72.4923 28.1641 72.118 28.1638 71.8027 28.1914C68.2989 28.4981 65.5215 31.2764 65.2148 34.7803C65.1873 35.0955 65.1865 35.4699 65.1865 36.2178V54.7402C65.1865 64.9901 65.1869 70.1154 62.0029 73.2998C58.8186 76.4841 53.6926 76.4844 43.4424 76.4844H30.5576C20.3074 76.4844 15.1814 76.4841 11.9971 73.2998C8.81307 70.1154 8.81348 64.9901 8.81348 54.7402V36.2178C8.81348 35.4699 8.81274 35.0955 8.78516 34.7803C8.47854 31.2764 5.70106 28.4981 2.19727 28.1914C1.88199 28.1638 1.50767 28.1641 0.759766 28.1641V16.084H73.2402V28.1641ZM26.9326 32.5918C24.9312 32.5919 23.3086 34.2144 23.3086 36.2158V56.3496C23.3089 58.3507 24.9314 59.9735 26.9326 59.9736C28.9339 59.9736 30.5563 58.3508 30.5566 56.3496V36.2158C30.5566 34.2143 28.9341 32.5918 26.9326 32.5918ZM47.0664 32.5918C45.065 32.5919 43.4424 34.2144 43.4424 36.2158V56.3496C43.4427 58.3507 45.0652 59.9735 47.0664 59.9736C49.0675 59.9735 50.6901 58.3507 50.6904 56.3496V36.2158C50.6904 34.2144 49.0677 32.592 47.0664 32.5918Z" fill="url(#paint0_linear_125_35253)"/>
      <path d="M29.2204 5.49225C29.6792 5.06415 30.6903 4.68586 32.0968 4.41605C33.5032 4.14624 35.2265 4 36.9993 4C38.7722 4 40.4955 4.14624 41.9019 4.41605C43.3084 4.68586 44.3195 5.06415 44.7783 5.49225" stroke="url(#paint1_linear_125_35253)" strokeWidth="7.248" strokeLinecap="round"/>
      <defs>
        <linearGradient id="paint0_linear_125_35253" x1="11.7181" y1="47.0392" x2="65.4503" y2="32.5501" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF4400"/>
          <stop offset="1" stopColor="#FF883D"/>
        </linearGradient>
        <linearGradient id="paint1_linear_125_35253" x1="42.6175" y1="6.06368" x2="35.5328" y2="-0.304431" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF4400"/>
          <stop offset="1" stopColor="#FF883D"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function ConfirmModal({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-[#232323] rounded-3xl shadow-2xl px-6 py-8 flex flex-col items-center max-w-xs w-full mx-2"
      >
        <TrashIcon />
        <div className="text-white text-center text-lg font-bold mt-6 mb-8 leading-snug">Вы уверены, что хотите<br />очистить все?</div>
        <div className="flex gap-4 w-full justify-center">
          <button
            className="flex-1 bg-gradient-to-r from-[#FF4400] to-[#FF883D] text-white font-bold rounded-xl py-2 text-lg transition hover:opacity-90"
            onClick={onConfirm}
          >
            Да
          </button>
          <button
            className="flex-1 bg-[#585A68] text-white font-bold rounded-xl py-2 text-lg transition hover:opacity-80"
            onClick={onCancel}
          >
            Нет
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function NotificationsPage() {
  const [items, setItems] = useState(notifications);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full flex flex-col flex-1 px-1 sm:px-6 py-3 sm:py-8">
        <h1 className="text-white text-2xl sm:text-4xl font-bold mb-3 sm:mb-6 px-1 sm:px-0">Уведомления</h1>
        <div className="flex-1 flex flex-col bg-black-02 rounded-2xl sm:rounded-3xl p-2 sm:p-6 gap-2 sm:gap-4 shadow-xl border border-black-03 overflow-y-auto scrollbar-thin scrollbar-thumb-black-03">
          {items.length === 0 ? (
            <EmptyState text="Для вас пока нет уведомлений!" />
          ) : (
            items.map((n) => (
              <div key={n.id} className="flex gap-2 sm:gap-3 items-start bg-black-01 rounded-xl sm:rounded-2xl px-2 sm:px-4 py-2 sm:py-3 relative group">
                <div className="flex-shrink-0 mt-1">
                  <Image src={n.avatar} alt={n.user} width={32} height={32} className="rounded-full object-cover w-8 h-8 sm:w-9 sm:h-9" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-white font-bold text-sm sm:text-base">{n.user}</span>
                    <span className="text-gray-400 text-xs">{n.date}</span>
                  </div>
                  <div className="text-white text-xs sm:text-sm mt-1 break-words leading-snug">{n.text}</div>
                </div>
                <button
                  className="absolute top-2 sm:top-3 right-2 sm:right-3 text-gray-400 hover:text-red-500 transition text-lg sm:text-xl opacity-80 group-hover:opacity-100"
                  onClick={() => setItems(items.filter((x) => x.id !== n.id))}
                  title="Удалить"
                >
                  <svg width="22" height="22" fill="none" viewBox="0 0 22 22"><rect width="22" height="22" rx="6" fill="#23232A"/><path d="M7 7l8 8M15 7l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
            ))
          )}
          {items.length > 0 && (
            <button
              className="mt-2 ml-auto bg-gradient-to-r from-[#FF4400] to-[#FF883D] hover:opacity-90 text-white font-bold rounded-xl px-4 sm:px-6 py-2 text-sm sm:text-lg transition shadow"
              onClick={() => setConfirmClear(true)}
            >
              Очистить все
            </button>
          )}
        </div>
        <AnimatePresence>
          {confirmClear && (
            <ConfirmModal
              open={true}
              onConfirm={() => {
                setItems([]);
                setConfirmClear(false);
              }}
              onCancel={() => setConfirmClear(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 