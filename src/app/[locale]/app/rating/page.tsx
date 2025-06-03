"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import EmptyState from "@/components/EmptyState";

const top3 = [
  {
    place: 2,
    name: "Zhliuk",
    avatar: "/images/cat.jpg",
    clips: 61,
    amount: "$ 55,000",
  },
  {
    place: 1,
    name: "Heilen",
    avatar: "/images/cat.jpg",
    clips: 65,
    amount: "$ 58,763",
  },
  {
    place: 3,
    name: "Марат",
    avatar: "/images/cat.jpg",
    clips: 59,
    amount: "$ 48,345",
  },
];

const user = {
  place: 345,
  name: "Неизвестный",
  avatar: "/images/cat.jpg",
  clips: 4,
  amount: "$ 13",
};

const others = [
  { place: 4, name: "Ehodae", avatar: "/images/cat.jpg", clips: 42, amount: "$ 44,050" },
  { place: 5, name: "Лиза Губич", avatar: "/images/cat.jpg", clips: 30, amount: "$ 40,876" },
  { place: 6, name: "Bonkers", avatar: "/images/cat.jpg", clips: 42, amount: "$ 38,980" },
  { place: 7, name: "Kutapatochka", avatar: "/images/cat.jpg", clips: 30, amount: "$ 30,000" },
  { place: 8, name: "Клипер", avatar: "/images/cat.jpg", clips: 30, amount: "$ 30,000" },
  { place: 9, name: "Клипер", avatar: "/images/cat.jpg", clips: 30, amount: "$ 30,000" },
  { place: 10, name: "Клипер", avatar: "/images/cat.jpg", clips: 30, amount: "$ 30,000" },
];

function PlaceBadge({ place }: { place: number }) {
  const colors = ["bg-[#FF883D]", "bg-[#FF4400]", "bg-[#FF883D]"];
  return (
    <div className={`absolute -top-4 left-4 w-12 h-12 flex items-center justify-center rounded-full text-3xl font-bold text-white z-10 ${colors[place-1]}`}>{place}</div>
  );
}

// Градиентный текст для суммы
function GradientAmount({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-[#FF4400] to-[#FF883D] bg-clip-text text-transparent">{children}</span>
  );
}

export default function RatingPage() {
  return (
    <div className="min-h-screen py-2 px-1 sm:py-8 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-white text-xl sm:text-4xl font-bold mb-1 sm:mb-2">Рейтинг</h1>
        <div className="text-orange-200 mb-3 sm:mb-8 text-sm sm:text-lg">Лучшие клиперы за этот месяц</div>
        {top3.length === 0 && others.length === 0 ? (
          <EmptyState text="Рейтинг пока недоступен!" />
        ) : (
          <>
            {/* Top 3 */}
            <div className="flex sm:flex-row flex-col gap-2 sm:gap-4 mb-4 sm:mb-8 justify-center items-end max-w-4xl mx-auto">
              {top3.map((user, idx) => (
                <motion.div
                  key={user.place}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
                  className={`relative bg-black-02 rounded-2xl sm:rounded-3xl flex flex-col items-center px-3 sm:px-6 pt-8 sm:pt-10 pb-4 sm:pb-6 w-full sm:w-1/3 shadow-xl ${user.place === 1 ? 'scale-105 sm:scale-110 z-10' : 'scale-100 sm:scale-95'}`}
                >
                  <PlaceBadge place={user.place} />
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-black-03 mb-2 bg-black-01">
                    <Image src={user.avatar} alt={user.name} width={96} height={96} className="object-cover w-full h-full" />
                  </div>
                  <div className="text-white text-base sm:text-xl font-bold mb-1">{user.name}</div>
                  <div className="text-orange-200 text-xs sm:text-base mb-1 sm:mb-2">{user.clips} клипов</div>
                  <div className="text-2xl sm:text-4xl font-extrabold mb-3 sm:mb-4">
                    <GradientAmount>{user.amount}</GradientAmount>
                  </div>
                  <button className="w-full bg-black-03 hover:bg-black-04 text-white font-semibold py-1.5 sm:py-2 rounded-xl transition text-xs sm:text-base">Перейти в профиль</button>
                </motion.div>
              ))}
            </div>
            {/* User row */}
            <div className="bg-black-02 rounded-xl sm:rounded-2xl flex items-center px-2 sm:px-4 py-2 sm:py-3 mb-2 gap-2 sm:gap-4 relative">
              <div className="text-base sm:text-xl font-bold text-orange-400 w-8 sm:w-12 text-center">{user.place}</div>
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-black-01 border-2 border-orange-400">
                <Image src={user.avatar} alt={user.name} width={40} height={40} className="object-cover w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm sm:text-base font-semibold truncate">{user.name}</div>
                <div className="text-orange-200 text-xs sm:text-sm">{user.clips} клипа</div>
              </div>
              <button className="bg-black-03 hover:bg-black-04 text-white font-semibold px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl transition text-xs sm:text-base whitespace-nowrap">Перейти в профиль</button>
              <div className="text-base sm:text-xl font-bold ml-1 sm:ml-4">
                <GradientAmount>{user.amount}</GradientAmount>
              </div>
            </div>
            {/* Table */}
            <div className="bg-black-02 rounded-xl sm:rounded-2xl divide-y divide-black-03 overflow-hidden mb-3 sm:mb-6">
              {others.map((u) => (
                <div key={u.place} className="flex items-center px-2 sm:px-4 py-2 sm:py-3 gap-2 sm:gap-4">
                  <div className="text-base sm:text-xl font-bold text-orange-400 w-8 sm:w-12 text-center">{u.place}</div>
                  <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-black-01 border-2 border-orange-400">
                    <Image src={u.avatar} alt={u.name} width={40} height={40} className="object-cover w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm sm:text-base font-semibold truncate">{u.name}</div>
                    <div className="text-orange-200 text-xs sm:text-sm">{u.clips} клипов</div>
                  </div>
                  <button className="bg-black-03 hover:bg-black-04 text-white font-semibold px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl transition text-xs sm:text-base whitespace-nowrap">Перейти в профиль</button>
                  <div className="text-base sm:text-xl font-bold ml-1 sm:ml-4">
                    <GradientAmount>{u.amount}</GradientAmount>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            <div className="flex justify-center gap-1 sm:gap-2 mt-2 sm:mt-4">
              <button className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black-03 text-white font-bold text-sm sm:text-base">&lt;</button>
              <button className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#FF4400] text-white font-bold text-sm sm:text-base">1</button>
              <button className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black-03 text-white font-bold text-sm sm:text-base">2</button>
              <button className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black-03 text-white font-bold text-sm sm:text-base">3</button>
              <button className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black-03 text-white font-bold text-sm sm:text-base">&gt;</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 