"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import EmptyState from "@/components/EmptyState";

const chats = [
  {
    id: 1,
    name: "ROKY PRODUCT",
    avatar: "/images/cat.jpg",
    lastMessage: "Как по дизайну я пройдусь, дум...",
    lastTime: "Пн",
    unread: false,
    isGroup: true,
    isOnline: false,
  },
  {
    id: 2,
    name: "Zhliuk",
    avatar: "/images/cat.jpg",
    lastMessage: "Как идет работа над интерфейс...",
    lastTime: "16:35",
    unread: false,
    isGroup: false,
    isOnline: true,
  },
  {
    id: 3,
    name: "Марат",
    avatar: "/images/cat.jpg",
    lastMessage: "Привет! Уже настроил метатеги...",
    lastTime: "Пн",
    unread: false,
    isGroup: false,
    isOnline: false,
  },
  {
    id: 4,
    name: "Ehodae",
    avatar: "/images/cat.jpg",
    lastMessage: "Мы хотели +- сегодня/завтра с...",
    lastTime: "Вс",
    unread: false,
    isGroup: false,
    isOnline: false,
  },
  {
    id: 5,
    name: "Kutapatochka",
    avatar: "/images/cat.jpg",
    lastMessage: "Проверил текущие позиции — е...",
    lastTime: "Вс",
    unread: false,
    isGroup: false,
    isOnline: false,
  },
  {
    id: 6,
    name: "Лиза Губич",
    avatar: "/images/cat.jpg",
    lastMessage: "осталось только заняться внеш...",
    lastTime: "Вс",
    unread: false,
    isGroup: false,
    isOnline: false,
  },
];

const chatMessages: Record<number, any[]> = {
  1: [
    {
      id: 1,
      fromMe: false,
      avatar: "/images/cat.jpg",
      name: "ROKY PRODUCT",
      time: "13:00",
      text: "Как по дизайну я пройдусь, думаю всё ок!",
      status: "read",
    },
    {
      id: 2,
      fromMe: true,
      avatar: "/images/cat.jpg",
      name: "Heilen",
      time: "13:01",
      text: "Спасибо! Жду фидбек по статистике.",
      status: "read",
    },
  ],
  2: [
    {
      id: 1,
      fromMe: false,
      avatar: "/images/cat.jpg",
      name: "Zhliuk",
      time: "14:31",
      text: "Как идет работа над интерфейсом? Нужно ли что-то дополнительно уточнить по дизайну для удобства клиперов и авторов?",
      status: "read",
    },
    {
      id: 2,
      fromMe: true,
      avatar: "/images/cat.jpg",
      name: "Heilen",
      time: "14:31",
      text: "В целом, дизайн почти готов, осталось только немного доработать разделы для загрузки контента и статистики",
      status: "read",
      sticker: {
        emoji: "👍",
        avatar: "/images/cat.jpg",
      },
    },
    {
      id: 3,
      fromMe: true,
      avatar: "/images/cat.jpg",
      name: "Heilen",
      time: "14:31",
      text: "Хотел бы, чтобы ты посмотрел прототип и дал свои комментарии",
      status: "read",
    },
    {
      id: 4,
      fromMe: false,
      avatar: "/images/cat.jpg",
      name: "Zhliuk",
      time: "14:31",
      text: "Как идет работа над интерфейсом? Нужно ли что-то дополнительно уточнить по дизайну для удобства клиперов и авторов?",
      status: "read",
    },
  ],
  3: [
    {
      id: 1,
      fromMe: false,
      avatar: "/images/cat.jpg",
      name: "Марат",
      time: "12:00",
      text: "Привет! Уже настроил метатеги и фавикон.",
      status: "read",
    },
    {
      id: 2,
      fromMe: true,
      avatar: "/images/cat.jpg",
      name: "Heilen",
      time: "12:01",
      text: "Супер, спасибо!",
      status: "read",
    },
  ],
  4: [
    {
      id: 1,
      fromMe: false,
      avatar: "/images/cat.jpg",
      name: "Ehodae",
      time: "10:00",
      text: "Мы хотели +- сегодня/завтра созвониться по API.",
      status: "read",
    },
    {
      id: 2,
      fromMe: true,
      avatar: "/images/cat.jpg",
      name: "Heilen",
      time: "10:01",
      text: "Давайте, пишите когда удобно!",
      status: "read",
    },
  ],
  5: [
    {
      id: 1,
      fromMe: false,
      avatar: "/images/cat.jpg",
      name: "Kutapatochka",
      time: "09:00",
      text: "Проверил текущие позиции — всё ок!",
      status: "read",
    },
  ],
  6: [
    {
      id: 1,
      fromMe: false,
      avatar: "/images/cat.jpg",
      name: "Лиза Губич",
      time: "08:00",
      text: "осталось только заняться внешкой",
      status: "read",
    },
  ],
};

export default function ChatPage() {
  const [selected, setSelected] = useState(2);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected, chatMessages[selected]?.length]);

  const currentChat = chats.find((c) => c.id === selected);
  const messages = chatMessages[selected] || [];

  return (
    <div className="flex flex-col h-[100dvh] bg-black-01">
      <header className="flex-shrink-0 w-full bg-black-02 border-b border-black-03 px-4 py-3 flex items-center gap-4 z-20">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="sm:hidden text-white"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <span className="text-white text-xl font-bold">ROKY</span>
      </header>
      <div className="flex flex-1 min-h-0 relative">
        <aside className={`absolute sm:relative w-full sm:w-[340px] bg-black-02 border-r border-black-03 flex flex-col p-2 sm:p-4 gap-2 min-h-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
          <input
            className="w-full rounded-xl bg-black-03 px-4 py-2 text-white placeholder:text-gray-400 outline-none mb-2"
            placeholder="Поиск..."
          />
          <button className="flex items-center gap-2 w-full bg-black-03 hover:bg-black-04 text-white font-semibold px-4 py-2 rounded-xl transition text-base mb-2">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#23232A"/><path d="M7 8h10M7 12h10M7 16h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
            Все чаты
          </button>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-black-03 flex flex-col gap-1 min-h-0">
            {chats.length === 0 ? (
              <EmptyState text="У вас пока нет сообщений!" />
            ) : chats.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center gap-3 rounded-xl px-2 py-2 cursor-pointer transition-all ${selected === chat.id ? "bg-black-03" : "hover:bg-black-03"}`}
                onClick={() => {
                  setSelected(chat.id);
                  setIsSidebarOpen(false);
                }}
              >
                <div className="relative">
                  <Image src={chat.avatar} alt={chat.name} width={44} height={44} className="rounded-full object-cover w-11 h-11" />
                  {chat.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-gradient-to-r from-[#FF4400] to-[#FF883D] rounded-full border-2 border-black-02" />}
                  {chat.isGroup && <span className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center bg-black-02 rounded-full border border-black-03 text-[#FF4400] text-lg">🧑‍🤝‍🧑</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-white font-semibold truncate">{chat.name}</span>
                    {chat.isOnline && <span className="w-2 h-2 bg-gradient-to-r from-[#FF4400] to-[#FF883D] rounded-full ml-1" />}
                  </div>
                  <div className="text-gray-400 text-sm truncate">{chat.lastMessage}</div>
                </div>
                <div className="flex flex-col items-end gap-1 min-w-[40px]">
                  <span className="text-gray-400 text-xs">{chat.lastTime}</span>
                  {chat.unread && <span className="w-2 h-2 bg-[#FF4400] rounded-full" />}
                </div>
              </div>
            ))}
          </div>
        </aside>
        <main className="flex-1 flex flex-col bg-black-01 min-h-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-black-03 bg-black-02 rounded-t-3xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <Image src={currentChat?.avatar || ""} alt={currentChat?.name || ""} width={40} height={40} className="rounded-full object-cover w-10 h-10" />
              <div>
                <div className="text-white font-semibold">{currentChat?.name}</div>
                <div className="text-gray-400 text-xs">{currentChat?.isOnline ? "Онлайн" : "Оффлайн"}</div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-sm font-semibold">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect width="20" height="20" rx="6" fill="#23232A"/><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Удалить чат
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 sm:px-8 py-4 flex flex-col gap-2 bg-black-01 min-h-0">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-end gap-2 max-w-[80%] ${msg.fromMe ? "flex-row-reverse" : ""}`}>
                  <Image src={msg.avatar} alt={msg.name} width={32} height={32} className="rounded-full object-cover w-8 h-8" />
                  <div>
                    <div className={`rounded-2xl px-4 py-2 mb-1 ${msg.fromMe ? "bg-black-03 text-white" : "bg-black-02 text-white"}`}>{msg.text}</div>
                    {msg.sticker && (
                      <div className="flex items-center gap-1 bg-gradient-to-r from-[#FF4400] to-[#FF883D] rounded-xl px-3 py-1 w-fit">
                        <span className="text-2xl">{msg.sticker.emoji}</span>
                        <Image src={msg.sticker.avatar} alt="sticker" width={24} height={24} className="rounded-full object-cover w-6 h-6 border-2 border-white" />
                      </div>
                    )}
                    <div className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                      {msg.fromMe && <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M4 8l3 3 5-5" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round"/></svg>}
                      {msg.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className="flex items-center gap-2 px-2 sm:px-4 py-3 border-t border-black-03 bg-black-02 rounded-b-3xl flex-shrink-0">
            <button type="button" className="text-gray-400 hover:text-white">
              <svg width="28" height="28" fill="none" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="#23232A"/><path d="M9 14h10M14 9v10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <input
              className="flex-1 rounded-xl bg-black-03 px-4 py-2 text-white placeholder:text-gray-400 outline-none"
              placeholder="Введите ваше сообщение"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button type="button" className="text-gray-400 hover:text-white">
              <svg width="28" height="28" fill="none" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="#23232A"/><text x="8" y="20" fontSize="12" fill="#fff">GIF</text></svg>
            </button>
            <button type="submit" className="bg-gradient-to-r from-[#FF4400] to-[#FF883D] rounded-full p-2 shadow-md hover:scale-105 transition-transform">
              <svg width="28" height="28" fill="none" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="url(#sendGradient)"/><path d="M9 14h10M14 9v10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              <svg width="0" height="0">
                <defs>
                  <linearGradient id="sendGradient" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF4400" />
                    <stop offset="1" stopColor="#FF883D" />
                  </linearGradient>
                </defs>
              </svg>
            </button>
          </form>
        </main>
      </div>
    </div>
  );
} 