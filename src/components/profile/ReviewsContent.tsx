// Component for Reviews content
"use client";

import { motion } from "framer-motion";

const reviews = [
  {
    id: 1,
    name: "Zhliuk",
    avatar: "/images/cat.jpg",
    rating: 5,
    text: "Отличная работа! Очень доволен результатом.",
    date: "04.05.25",
  },
  {
    id: 2,
    name: "Ehodae",
    avatar: "/images/cat.jpg",
    rating: 4,
    text: "Хороший клип, но можно было бы лучше.",
    date: "03.05.25",
  },
  {
    id: 3,
    name: "Марат",
    avatar: "/images/cat.jpg",
    rating: 5,
    text: "Супер! Всё сделано качественно и в срок.",
    date: "02.05.25",
  },
  {
    id: 4,
    name: 'Kutapatochka',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 5,
    text: 'Работа с автором, который предлагает делать нарезки видео, была очень приятной. Условия сотрудничества ясные и прозрачные, а оплата справедливая. Автор всегда на связи и готов помочь с любыми вопросами. Рекомендую всем, кто хочет проявить свои творческие способности и заработать!'
  },
  {
    id: 5,
    name: 'Kutapatochka',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 5,
    text: 'Работа с автором, который предлагает делать нарезки видео, была очень приятной. Условия сотрудничества ясные и прозрачные, а оплата справедливая. Автор всегда на связи и готов помочь с любыми вопросами. Рекомендую всем, кто хочет проявить свои творческие способности и заработать!'
  }
];

const starStats = [
  { stars: 5, percent: 90 },
  { stars: 4, percent: 0 },
  { stars: 3, percent: 0 },
  { stars: 2, percent: 0 },
  { stars: 1, percent: 0 },
];

export default function ReviewsContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col gap-6"
    >
      {/* Flex-обёртка для статистики и отзывов */}
      <div className="flex flex-wrap gap-6 w-full justify-start items-stretch">
        {/* Статистика как карточка */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
          className="bg-black-02 rounded-xl p-6 flex flex-col items-center justify-center max-w-full min-w-[360px] w-full min-w-[260px] flex-1"
        >
          <div className="flex flex-col items-center mb-4">
            <span className="text-5xl md:text-6xl font-bold text-white">5.0</span>
            <div className="flex gap-1 my-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="26" height="26" fill="none" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z" fill="#FF883D"/>
                </svg>
              ))}
            </div>
            <span className="text-gray-400 text-base md:text-lg">27 отзывов</span>
          </div>
          <div className="w-full flex flex-col gap-1">
            {starStats.map(({ stars, percent }) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-white text-base md:text-lg w-4">{stars}</span>
                <div className="flex-1 h-2 bg-black-01 rounded">
                  {percent > 0 && (
                    <div className="h-2 bg-gradient-to-r from-[#FF4400] to-[#FF883D] rounded" style={{width: `${percent}%`}} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        {/* Отзывы через wrap */}
        {reviews.map((review, idx) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + idx * 0.08, ease: 'easeOut' }}
            className="bg-black-02 rounded-xl p-6 flex flex-col max-w-full min-w-[360px] w-full min-w-[260px] flex-1 justify-between md:h-auto h-full"
          >
            <div className="flex items-center gap-3 mb-2">
              <img src={review.avatar} alt={review.name} className="w-12 h-12 rounded-full object-cover" />
              <span className="text-white font-semibold text-lg md:text-xl">{review.name}</span>
              <div className="flex gap-1 ml-auto">
                {[...Array(review.rating)].map((_, i) => (
                  <svg key={i} width="22" height="22" fill="none" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z" fill="#FF883D"/>
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-white text-base md:text-lg mt-2 leading-relaxed">
              {review.text}
            </p>
          </motion.div>
        ))}
      </div>
      {/* Кнопка показать больше */}
      <div className="flex justify-end mt-2 w-full">
        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.97 }}
          className="bg-gradient-to-r from-[#FF4400] to-[#FF883D] text-white font-semibold px-8 py-3 rounded-xl text-lg shadow hover:opacity-90 transition w-full md:w-auto"
        >
          Показать больше
        </motion.button>
      </div>
    </motion.div>
  );
} 