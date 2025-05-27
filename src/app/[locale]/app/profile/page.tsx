"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

import CommunityContent from '@/components/profile/CommunityContent';
import PostsContent from '@/components/profile/PostsContent';
import ClipsContent from '@/components/profile/ClipsContent';
import OffersContent from '@/components/profile/OffersContent';
import ReviewsContent from '@/components/profile/ReviewsContent';
import { useDragScroll } from "@/hooks/useDragScroll";
import ModalSocialLink from '@/components/profile/ModalSocialLink';

const tabs = [
  { value: "community", label: "Коммьюнити" },
  { value: "posts", label: "Публикации" },
  { value: "clips", label: "Клипы" },
  { value: "offers", label: "Предложения" },
  { value: "reviews", label: "Отзывы" },
];

export default function ProfilePage() {
  const t = useTranslations();
  const [username, setUsername] = useState("Heilen");
  const [activeTab, setActiveTab] = useState("community");
  const dragScroll = useDragScroll();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSocial, setModalSocial] = useState<"instagram" | "tiktok" | null>(null);
  const [modalCode] = useState("Qn4dh6JH7gs"); // Пример кода, можно заменить на динамический

  const renderContent = () => {
    switch (activeTab) {
      case "community":
        return <CommunityContent />;
      case "posts":
        return <PostsContent />;
      case "clips":
        return <ClipsContent />;
      case "offers":
        return <OffersContent />;
      case "reviews":
        return <ReviewsContent />;
      default:
        return <CommunityContent />;
    }
  };

  const handleOpenModal = (social: "instagram" | "tiktok") => {
    setModalSocial(social);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setModalSocial(null);
  };
  const handleSubmitSocial = (link: string) => {
    // TODO: отправить ссылку на сервер или обработать
    handleCloseModal();
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 px-2 sm:px-4 w-full max-w-5xl mx-auto">
      {/* Верхний блок: аватар, имя, рейтинг */}
      <div className="relative mb-4 sm:mb-6 px-2 sm:px-4">
        {/* Блок пользователя с фоном */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 relative z-10 bg-black-01 rounded-t-2xl sm:rounded-t-[32px] rounded-b-2xl sm:rounded-b-[34px] px-3 sm:px-6 pt-4 pb-4 sm:pb-6">
          <div className="relative mb-2 sm:mb-0">
            <Image
              src="/avatar.jpg"
              alt="avatar"
              width={64}
              height={64}
              className="rounded-full object-cover border-4 border-black-02 w-16 h-16 sm:w-20 sm:h-20"
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-black-02" />
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <span className="text-2xl sm:text-3xl font-bold text-white">{username}</span>
              <button className="text-gray-400 hover:text-white">
                <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                  <path d="M2 14.5V18h3.5l10-10-3.5-3.5-10 10zM17.7 6.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0l-1.8 1.8 4 4 1.8-1.8z" fill="#fff"/>
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="16" height="16" fill="none" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z" fill="#585A68"/>
                </svg>
              ))}
              <span className="text-gray-400 text-base sm:text-lg ml-2">0.0</span>
            </div>
          </div>
          <span className="ml-auto text-gray-400 hidden sm:block">Это вы!</span>
        </div>
        {/* Оранжевая подложка чуть ниже блока пользователя */}
        <div
          className="absolute left-2 right-2 sm:left-4 sm:right-4 -bottom-[1px] h-[28px] sm:h-[34px] rounded-b-full pointer-events-none"
          style={{
            background: "linear-gradient(90deg, #FF4400 0%, #FF883D 100%)",
            zIndex: 0,
          }}
        />
      </div>

      {/* Кнопки смены пароля и кошелька */}
      <div className="flex flex-col gap-2 sm:gap-3 px-2 sm:px-0">
        <button className="flex items-center justify-between bg-black-02 rounded-xl px-3 sm:px-4 py-3 sm:py-[15px] text-white text-base sm:text-lg">
          <span className="flex items-center gap-2">
            <span role="img" aria-label="key"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="url(#paint0_linear_646_3047)" className="bi bi-key-fill" viewBox="0 0 16 16">
  <path d="M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2M2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
</svg></span> <span className="hidden xs:inline">Сменить пароль</span>
          </span>
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="40" height="40" rx="12" fill="url(#paint0_linear_646_3047)"/>
<path d="M18 14.5L24 20.5L18 26.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
<defs>
<linearGradient id="paint0_linear_646_3047" x1="6.04762" y1="20.5" x2="36.3281" y2="13.6956" gradientUnits="userSpaceOnUse">
<stop stopColor="#FF4400"/>
<stop offset="1" stopColor="#FF883D"/>
</linearGradient>
</defs>
</svg>
        </button>
        <button className="flex items-center justify-between bg-black-02 rounded-xl px-3 sm:px-4 py-3 sm:py-[15px] text-white text-base sm:text-lg">
          <span className="flex items-center gap-2">
            <span role="img" aria-label="wallet"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="url(#paint0_linear_646_3047)" className="bi bi-wallet-fill" viewBox="0 0 16 16">
  <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v2h6a.5.5 0 0 1 .5.5c0 .253.08.644.306.958.207.288.557.542 1.194.542s.987-.254 1.194-.542C9.42 6.644 9.5 6.253 9.5 6a.5.5 0 0 1 .5-.5h6v-2A1.5 1.5 0 0 0 14.5 2z"/>
  <path d="M16 6.5h-5.551a2.7 2.7 0 0 1-.443 1.042C9.613 8.088 8.963 8.5 8 8.5s-1.613-.412-2.006-.958A2.7 2.7 0 0 1 5.551 6.5H0v6A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5z"/>
</svg></span> <span className="hidden xs:inline">Сменить кошелек</span>
          </span>
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="40" height="40" rx="12" fill="url(#paint0_linear_646_3047)"/>
<path d="M18 14.5L24 20.5L18 26.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
<defs>
<linearGradient id="paint0_linear_646_3047" x1="6.04762" y1="20.5" x2="36.3281" y2="13.6956" gradientUnits="userSpaceOnUse">
<stop stopColor="#FF4400"/>
<stop offset="1" stopColor="#FF883D"/>
</linearGradient>
</defs>
</svg>
        </button>
      </div>

      {/* Привязка соцсетей */}
      <div className="flex gap-4">
        <button
          className="flex items-center gap-2 bg-black-02 rounded-xl px-4 py-4 w-full text-white"
          onClick={() => handleOpenModal("instagram")}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="9" fill="url(#paint0_linear_646_3062)" />
            <path d="M15.0041 18.0463C15.0041 16.3881 16.3476 15.0434 18.0054 15.0434C19.6632 15.0434 21.0074 16.3881 21.0074 18.0463C21.0074 19.7046 19.6632 21.0492 18.0054 21.0492C16.3476 21.0492 15.0041 19.7046 15.0041 18.0463ZM13.3812 18.0463C13.3812 20.601 15.4515 22.6718 18.0054 22.6718C20.5593 22.6718 22.6296 20.601 22.6296 18.0463C22.6296 15.4917 20.5593 13.4208 18.0054 13.4208C15.4515 13.4208 13.3812 15.4917 13.3812 18.0463ZM21.732 13.2374C21.7319 13.4512 21.7952 13.6602 21.9139 13.838C22.0325 14.0159 22.2013 14.1545 22.3987 14.2364C22.5961 14.3183 22.8134 14.3398 23.023 14.2981C23.2327 14.2565 23.4253 14.1536 23.5765 14.0025C23.7276 13.8514 23.8306 13.6588 23.8724 13.4492C23.9142 13.2395 23.8929 13.0221 23.8112 12.8246C23.7295 12.627 23.591 12.4582 23.4134 12.3393C23.2357 12.2205 23.0268 12.157 22.8131 12.1569H22.8126C22.5261 12.157 22.2514 12.2709 22.0488 12.4735C21.8462 12.6761 21.7322 12.9509 21.732 13.2374Z" fill="white" />
            <defs>
              <linearGradient id="paint0_linear_646_3062" x1="35.3081" y1="36" x2="-0.691919" y2="-9.69019e-07" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FBE18A" />
                <stop offset="0.21" stopColor="#FCBB45" />
                <stop offset="0.38" stopColor="#F75274" />
                <stop offset="0.52" stopColor="#D53692" />
                <stop offset="0.74" stopColor="#8F39CE" />
                <stop offset="1" stopColor="#5B4FE9" />
              </linearGradient>
            </defs>
          </svg>
          Привязать Instagram
        </button>
        <button
          className="flex items-center gap-2 bg-black-02 rounded-xl px-4 py-4 w-full text-white"
          onClick={() => handleOpenModal("tiktok")}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="9" fill="black" />
            <path fillRule="evenodd" clipRule="evenodd" d="M21.8882 15.5523C23.0939 16.4102 24.5378 16.8686 26.0171 16.863V13.9286C25.7263 13.9294 25.4363 13.8982 25.1523 13.8357V16.1734C23.6696 16.1761 22.2236 15.7124 21.0184 14.8481V20.8832C21.0147 21.8735 20.7434 22.8444 20.2332 23.6928C19.7229 24.5413 18.9927 25.2358 18.1201 25.7025C17.2475 26.1693 16.2649 26.3911 15.2766 26.3442C14.2882 26.2974 13.331 25.9837 12.5063 25.4364C13.2691 26.2089 14.2438 26.7374 15.3069 26.9551C16.37 27.1728 17.4737 27.0698 18.4783 26.6593C19.4829 26.2487 20.3431 25.549 20.9501 24.6487C21.5572 23.7485 21.8836 22.6882 21.8882 21.6021V15.5523ZM22.9583 12.5592C22.3451 11.894 21.9689 11.0446 21.8882 10.1432V9.76172H21.0673C21.1687 10.3347 21.3895 10.8799 21.7153 11.3619C22.0411 11.8438 22.4646 12.2518 22.9583 12.5592ZM14.4071 23.1134C14.1226 22.741 13.9483 22.2961 13.9039 21.8294C13.8595 21.3627 13.947 20.8929 14.1562 20.4735C14.3655 20.0541 14.6882 19.7019 15.0876 19.457C15.487 19.2121 15.9471 19.0844 16.4154 19.0883C16.674 19.0882 16.9311 19.1278 17.1777 19.2057V16.1734C16.8894 16.1352 16.5987 16.1189 16.3079 16.1245V18.4818C15.7075 18.2919 15.0575 18.3351 14.4874 18.6029C13.9173 18.8707 13.4688 19.3434 13.2311 19.9271C12.9934 20.5108 12.9839 21.1627 13.2046 21.753C13.4252 22.3434 13.8597 22.8291 14.4218 23.1134H14.4071Z" fill="#EE1D52" />
            <path fillRule="evenodd" clipRule="evenodd" d="M21.0185 14.8285C22.2237 15.6929 23.6697 16.1565 25.1524 16.1539V13.8161C24.3077 13.6373 23.5403 13.1977 22.9584 12.5592C22.4648 12.2518 22.0413 11.8438 21.7155 11.3619C21.3897 10.8799 21.1689 10.3347 21.0674 9.76172H18.9076V21.6021C18.9056 22.1262 18.7397 22.6365 18.4331 23.0614C18.1265 23.4863 17.6947 23.8044 17.1983 23.9711C16.7018 24.1378 16.1657 24.1447 15.6651 23.9909C15.1646 23.8371 14.7247 23.5302 14.4073 23.1133C13.9043 22.8593 13.5014 22.443 13.2637 21.9317C13.0261 21.4204 12.9674 20.8439 13.0973 20.2951C13.2272 19.7464 13.538 19.2574 13.9795 18.9071C14.4211 18.5568 14.9677 18.3657 15.5312 18.3645C15.7897 18.3653 16.0466 18.4049 16.2934 18.4818V16.1245C15.227 16.1502 14.1913 16.4869 13.3134 17.0933C12.4355 17.6998 11.7536 18.5496 11.3515 19.5385C10.9493 20.5274 10.8444 21.6123 11.0496 22.66C11.2547 23.7077 11.7611 24.6727 12.5065 25.4364C13.3313 25.9876 14.2901 26.3045 15.2806 26.3534C16.2712 26.4023 17.2564 26.1814 18.1314 25.7141C19.0064 25.2469 19.7384 24.5508 20.2494 23.7001C20.7604 22.8494 21.0313 21.8758 21.0332 20.8832L21.0185 14.8285Z" fill="white" />
            <path fillRule="evenodd" clipRule="evenodd" d="M25.1525 13.8163V13.1854C24.3768 13.1887 23.616 12.9716 22.9586 12.5594C23.5389 13.1997 24.307 13.6397 25.1525 13.8163ZM21.0675 9.76191C21.0675 9.64942 21.0333 9.53205 21.0187 9.41956V9.03809H18.038V20.8834C18.0354 21.5466 17.77 22.1818 17.3001 22.6494C16.8301 23.117 16.194 23.3789 15.5313 23.3776C15.1411 23.3796 14.756 23.2891 14.4074 23.1135C14.7249 23.5304 15.1647 23.8372 15.6653 23.9911C16.1659 24.1449 16.702 24.138 17.1984 23.9713C17.6949 23.8046 18.1267 23.4865 18.4333 23.0616C18.7398 22.6367 18.9058 22.1264 18.9078 21.6023V9.76191H21.0675ZM16.2936 16.1198V15.4498C15.067 15.283 13.8202 15.537 12.7564 16.1702C11.6925 16.8035 10.8743 17.7787 10.435 18.937C9.99583 20.0953 9.96153 21.3683 10.3377 22.5486C10.7139 23.7289 11.4784 24.7469 12.5066 25.4366C11.7669 24.6711 11.2659 23.7065 11.0649 22.6607C10.8639 21.6149 10.9716 20.5331 11.3748 19.5476C11.778 18.562 12.4593 17.7153 13.3354 17.1109C14.2115 16.5066 15.2445 16.1707 16.3082 16.1443L16.2936 16.1198Z" fill="#69C9D0" />
          </svg>
          Привязать TikTok
        </button>
      </div>
      <ModalSocialLink
        open={modalOpen && !!modalSocial}
        onClose={handleCloseModal}
        social={modalSocial || "instagram"}
        code={modalCode}
        onSubmit={handleSubmitSocial}
      />

      {/* Нижнее меню */}
      <div
        className="flex gap-2 w-full sm:gap-4 mt-4 pb-2 cursor-grab select-none"
        ref={dragScroll.ref}
        onMouseDown={dragScroll.onMouseDown}
        onMouseLeave={dragScroll.onMouseLeave}
        onMouseUp={dragScroll.onMouseUp}
        onMouseMove={dragScroll.onMouseMove}
        style={{ overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`
              flex-1 px-4 py-2 rounded-xl font-bold text-sm
              transition-all border-2
              ${activeTab === tab.value
                ? "bg-gradient-to-r from-[#FF4400] to-[#FF883D] text-white border-transparent"
                : "bg-black-02 text-white border-transparent"}
              ${activeTab === tab.value ? "shadow-md" : ""}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conditional content rendering */}
      <div className="mt-4 sm:mt-6 mb-[40px] flex-1">
        {renderContent()}
      </div>
    </div>
  );
}