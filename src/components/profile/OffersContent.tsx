"use client";

import OfferCard from "@/components/profile/OfferCard";

export default function OffersContent() {
  return (
    <div className="rounded-xl p-2 sm:p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <OfferCard
          logo="/logo-roky.png"
          background="background: linear-gradient(180deg, #191919 0%, #FF4400 100%)"
          avatar="/avatar1.jpg"
          user="Heilen"
          deadline="до 10.05.25"
          rating={5.0}
          title="Зарабатывайте деньги, вырезая для ROKY"
          percent={88}
          current="$31,757.88"
          total="$80,850.80"
          price="$10"
          minViews="20K"
          socials={["instagram", "tiktok"]}
        />
        <OfferCard
          logo="/logo-smm-ai.png"
          background="background: linear-gradient(90deg, #6B3AF7 0%, #A259FF 100%)"
          avatar="/avatar1.jpg"
          user="Heilen"
          deadline="до 29.05.25"
          rating={5.0}
          title="Зарабатывайте деньги, вырезая для SMM AI"
          percent={88}
          current="$78,645.55"
          total="$120,000.00"
          price="$1"
          minViews="20K"
          socials={["instagram", "tiktok"]}
        />
      </div>
    </div>
  );
} 