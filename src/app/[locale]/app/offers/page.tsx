"use client";

import OfferCard from "@/components/profile/OfferCard";
import { useState } from "react";
import { FaPlus } from "react-icons/fa6";
import ModalOffer from "@/components/profile/ModalOffer";
import EmptyState from "@/components/EmptyState";

const myOffers = [
  {
    logo: "/images/cat.jpg",
    background: "background: linear-gradient(180deg, #191919 0%, #FF4400 100%)",
    avatar: "/images/cat.jpg",
    user: "Heilen",
    deadline: "до 10.05.25",
    rating: 5.0,
    title: "Зарабатывайте деньги, вырезая для ROKY",
    percent: 88,
    current: "$31,757.88",
    total: "$80,850.80",
    price: "$10",
    minViews: "20K",
    socials: ["instagram", "tiktok"] as const
  },
  {
    logo: "/images/cat.jpg",
    background: "background: linear-gradient(90deg, #6B3AF7 0%, #A259FF 100%)",
    avatar: "/images/cat.jpg",
    user: "Heilen",
    deadline: "до 29.05.25",
    rating: 5.0,
    title: "Зарабатывайте деньги, вырезая для SMM AI",
    percent: 88,
    current: "$78,645.55",
    total: "$120,000.00",
    price: "$1",
    minViews: "20K",
    socials: ["instagram", "tiktok"] as const
  }
];

const feedOffers = [
  {
    logo: "/images/cat.jpg",
    background: "",
    avatar: "/images/cat.jpg",
    user: "Zhiluk",
    deadline: "до 06.06.25",
    rating: 4.7,
    title: "Создание эффективной маркетинговой стратегии для малого бизнеса: пошаговое руководство",
    percent: 20,
    current: "$5,606.00",
    total: "$30,000.00",
    price: "$10",
    minViews: "20K",
    socials: ["instagram", "tiktok"] as const
  },
  {
    logo: "/images/cat.jpg",
    background: "",
    avatar: "/images/cat.jpg",
    user: "Ehodae",
    deadline: "до 21.05.25",
    rating: 4.8,
    title: "Новый альбом — лучшие моменты и идеи для контента под мои песни",
    percent: 98,
    current: "$9,100",
    total: "$10,000",
    price: "$5",
    minViews: "20K",
    socials: ["instagram", "tiktok"] as const
  },
  {
    logo: "/images/cat.jpg",
    background: "",
    avatar: "/images/cat.jpg",
    user: "Марат",
    deadline: "до 08.07.25",
    rating: 5.0,
    title: "Создание нарезок и видеоконтента для продвижения моих соцсетей",
    percent: 90,
    current: "$19,500",
    total: "$20,500",
    price: "$1",
    minViews: "20K",
    socials: ["instagram", "tiktok"] as const
  },
  {
    logo: "/images/cat.jpg",
    background: "",
    avatar: "/images/cat.jpg",
    user: "Kutapatochka",
    deadline: "до 10.05.25",
    rating: 5.0,
    title: "Нарезки из моего видео о путешествии по Японии",
    percent: 42,
    current: "$31,757.88",
    total: "$80,850.80",
    price: "$10",
    minViews: "20K",
    socials: ["instagram", "tiktok"] as const
  }
];

export default function OffersPage() {
  const [platform, setPlatform] = useState("all");
  const [sort, setSort] = useState("best");
  const [modalOffer, setModalOffer] = useState(null);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6 flex flex-col gap-8">
      {/* Мои предложения */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-3xl sm:text-4xl font-bold">Мои предложения</h1>
          <button className="flex items-center gap-2 bg-gradient-to-r from-[#FF4400] to-[#FF883D] text-white font-semibold px-4 py-2 rounded-xl text-base shadow hover:opacity-90 transition">
            <FaPlus />
            Создать новое предложение
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {myOffers.map((offer, i) => (
            <OfferCard key={i} {...offer} onChatToggle={() => setModalOffer(offer as any)} />
          ))}
        </div>
      </div>
      {/* Лента предложений */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
          <h2 className="text-white text-3xl sm:text-4xl font-bold">Лента предложений</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="bg-black-02 text-white h-[40px] px-3 py-1 rounded-xl border border-black-03 w-full sm:w-auto">
              <option>Все платформы</option>
            </select>
            <select className="bg-black-02 text-white h-[40px] px-3 py-1 rounded-xl border border-black-03 w-full sm:w-auto">
              <option>Сначала лучшие</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {feedOffers.map((offer, i) => (
              <OfferCard key={i} {...offer} onChatToggle={() => setModalOffer(offer as any)} />
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-4 py-2 sm:px-8 sm:py-3 text-base sm:text-lg transition">
            Показать больше
          </button>
        </div>
      </div>
      {modalOffer && (
        <ModalOffer open={!!modalOffer} offer={modalOffer} onClose={() => setModalOffer(null)} />
      )}
      {myOffers.length === 0 && feedOffers.length === 0 ? (
        <EmptyState text="Нет доступных предложений!" />
      ) : (
        <></>
      )}
    </div>
  );
} 