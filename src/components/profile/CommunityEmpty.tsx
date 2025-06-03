"use client";
import Image from "next/image";
import { motion } from "framer-motion";

const SadSmile = () => (
  <svg width="80" height="81" viewBox="0 0 80 81" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40.0005 0.499023C62.0921 0.499162 80.0004 18.4084 80.0005 40.5C80.0005 62.5917 62.0922 80.5008 40.0005 80.501C17.9087 80.501 -0.000488281 62.5918 -0.000488281 40.5C-0.000362522 18.4083 17.9088 0.499023 40.0005 0.499023ZM40.0005 41.5C37.9018 41.5 35.8226 41.9124 33.8833 42.7139L33.522 42.8682C31.725 43.663 30.0889 44.783 28.6968 46.1719C27.2118 47.6535 26.0331 49.4129 25.229 51.3496C24.5937 52.8799 25.3198 54.6352 26.8501 55.2705C28.3803 55.9056 30.1357 55.1806 30.771 53.6504C31.2724 52.4427 32.0079 51.345 32.9351 50.4199C33.7463 49.6105 34.6905 48.9468 35.7261 48.458L36.1753 48.2588C37.3876 47.7578 38.6879 47.5 40.0005 47.5C41.1491 47.5 42.2878 47.6979 43.3667 48.083L43.8247 48.2588C44.8857 48.6973 45.8619 49.3147 46.7104 50.082L47.0659 50.4199C47.993 51.345 48.7286 52.4427 49.23 53.6504C49.8653 55.1806 51.6206 55.9058 53.1509 55.2705C54.6809 54.6351 55.4062 52.8797 54.771 51.3496C53.967 49.413 52.7891 47.6534 51.3042 46.1719L51.022 45.8975C49.5977 44.5447 47.9347 43.4652 46.1167 42.7139L45.7515 42.5684C43.9176 41.8627 41.968 41.5 40.0005 41.5ZM16.0005 28.499C12.6867 28.499 9.99951 31.1853 9.99951 34.499C9.99963 37.8127 12.6868 40.499 16.0005 40.499C19.314 40.4988 22.0004 37.8125 22.0005 34.499C22.0005 31.1854 19.314 28.4993 16.0005 28.499ZM64.0005 28.499C60.6867 28.499 57.9995 31.1853 57.9995 34.499C57.9996 37.8127 60.6868 40.499 64.0005 40.499C67.314 40.4988 70.0004 37.8125 70.0005 34.499C70.0005 31.1854 67.314 28.4993 64.0005 28.499Z" fill="url(#paint0_linear_656_3116)"/>
    <defs>
      <linearGradient id="paint0_linear_656_3116" x1="12.0949" y1="41.5" x2="72.6567" y2="27.8913" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF4400"/>
        <stop offset="1" stopColor="#FF883D"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function CommunityEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-black-02 rounded-xl p-0 overflow-hidden min-h-[240px] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black-01">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-black-01" />
          <div className="text-white text-base font-semibold">Неизвестное коммьюнити</div>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/images/cat.jpg"
            alt="empty state"
            width={32}
            height={32}
            className="rounded-full"
            loading="lazy"
          />
          <div className="ml-2 text-right">
            <div className="text-white text-base font-semibold">1 участник</div>
            <div className="text-gray-400 text-xs">1 онлайн</div>
          </div>
        </div>
      </div>
      {/* Empty state */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <SadSmile />
        <div className="text-white text-lg mt-4">Здесь пока нет сообщений!</div>
      </div>
    </motion.div>
  );
} 