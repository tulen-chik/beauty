"use client";

import { motion } from "framer-motion";
import OfferCard from "@/components/profile/OfferCard";

export default function OffersContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="rounded-xl p-2 sm:p-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {[0, 1].map((idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.08, ease: 'easeOut' }}
          >
            <OfferCard
              {...(idx === 0
                ? {
                    logo: "/images/cat.jpg",
                    background: "background: linear-gradient(180deg, #191919 0%, #FF4400 100%)",
                    avatar: "/images/cat.jpg",
                    user: "Heilen",
                    deadline: "до 10.05.25",
                    rating: 5.0,
                    title: "Зарабатывайте деньги, вырезая для ROKY",
                    percent: 10,
                    current: "$31,757.88",
                    total: "$80,850.80",
                    price: "$10",
                    minViews: "20K",
                    socials: ["instagram", "tiktok"],
                  }
                : {
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
                    socials: ["instagram", "tiktok"],
                  })}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
} 