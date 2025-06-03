'use client'

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import React, { useCallback,useEffect, useState } from 'react';

interface AppSidebarProps {
  isMobile?: boolean;
}

const menu = [
    { href: '/app/', icon: 'home', label: 'Главная' },
    { href: '/app/chat', icon: 'chat', label: 'Чаты' },
    { href: '/app/offers', icon: 'user', label: 'Предложения' },
    { href: '/app/stats', icon: 'stats', label: 'Статистика' },
    { href: '/app/rating', icon: 'rating', label: 'Рейтинг' },
    { href: '/app/profile', icon: 'grid', label: 'Профиль' },
];

const icons: Record<string, React.ReactNode> = {
  plus: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="bi bi-plus-square-fill" viewBox="0 0 16 16">
      <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm6.5 4.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3a.5.5 0 0 1 1 0 " fill="#585A68" />
    </svg>
  ),
  home: (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="iconGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FF4400" />
          <stop offset="1" stopColor="#FF883D" />
        </linearGradient>
      </defs>
      <path d="M26.873 29.7539V36H23.125V29.7539H26.873ZM25 15.9512C26.3862 15.9514 27.5504 16.9493 29.8779 18.9443L31.127 20.0146C32.4148 21.1185 33.0585 21.6706 33.4014 22.416C33.7442 23.1615 33.7441 24.0099 33.7441 25.7061V31.0029C33.7441 33.3585 33.7445 34.5368 33.0127 35.2686C32.3486 35.9326 31.3169 35.9933 29.3711 35.999V29.7539C29.371 28.3742 28.2528 27.2559 26.873 27.2559H23.125C21.7453 27.256 20.6271 28.3742 20.627 29.7539V35.999C18.6819 35.9933 17.6503 35.9326 16.9863 35.2686C16.2546 34.5368 16.2549 33.3585 16.2549 31.0029V25.7061C16.2549 24.0099 16.2548 23.1615 16.5977 22.416C16.9405 21.6706 17.5843 21.1184 18.8721 20.0146L20.1221 18.9443C22.4498 16.9492 23.6136 15.9512 25 15.9512Z" fill="url(#iconGradient)" />
    </svg>
  ),
  grid: (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M34.4141 34.2253C35.0987 34.089 35.5038 33.3697 35.1419 32.7728C34.428 31.5954 33.3306 30.5605 31.9378 29.7665C30.091 28.7135 27.8283 28.1428 25.5004 28.1428C23.1726 28.1428 20.9098 28.7135 19.063 29.7665C17.6703 30.5605 16.5728 31.5954 15.859 32.7728C15.497 33.3697 15.9021 34.089 16.5868 34.2253C22.4715 35.3969 28.5294 35.3969 34.4141 34.2253Z" fill="#585A68" />
      <circle cx="25.5" cy="19.5" r="5.5" fill="#585A68" />
    </svg>
  ),
  user: (
<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="none" viewBox="0 0 16 16">
  <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5z"/>
</svg>
  ),
  chat: (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25.5664 14.0146C31.3783 14.3094 36 19.1148 36 25V30.5C36 32.2084 35.9998 33.0625 35.7207 33.7363C35.3486 34.6348 34.6348 35.3486 33.7363 35.7207C33.0625 35.9998 32.2084 36 30.5 36H25L24.4336 35.9854C18.8093 35.7001 14.2999 31.1907 14.0146 25.5664L14 25C14 18.9249 18.9249 14 25 14L25.5664 14.0146ZM25 27.4443C24.325 27.4443 23.7773 27.992 23.7773 28.667C23.7776 29.3418 24.3251 29.8896 25 29.8896H28.667L28.792 29.8828C29.408 29.8201 29.8884 29.2995 29.8887 28.667C29.8887 28.0343 29.4081 27.514 28.792 27.4512L28.667 27.4443H25ZM21.334 22.5557C20.659 22.5557 20.1113 23.1033 20.1113 23.7783C20.1116 24.4531 20.6591 25.001 21.334 25.001L28.667 25L28.792 24.9932C29.4084 24.9307 29.8896 24.4102 29.8896 23.7773C29.8894 23.1446 29.4083 22.624 28.792 22.5615L28.667 22.5547L21.334 22.5557Z" fill="#585A68" />
    </svg>
  ),
  stats: (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M27.1554 15.6006C31.2197 15.6006 33.2521 15.6007 34.5148 16.8633C35.7772 18.1259 35.7775 20.1585 35.7775 24.2227V26.3779C35.7775 30.4422 35.7774 32.4747 34.5148 33.7373C33.2521 34.9998 31.2196 35 27.1554 35H22.8448C18.7808 35 16.7481 34.9997 15.4855 33.7373C14.2229 32.4747 14.2228 30.4422 14.2228 26.3779V24.2227C14.2228 20.1583 14.2228 18.1259 15.4855 16.8633C16.7481 15.6007 18.7805 15.6006 22.8448 15.6006H27.1554ZM25.0001 24.9414C24.2065 24.9414 23.5636 25.5843 23.5636 26.3779V30.6885L23.5704 30.8359C23.6445 31.56 24.2565 32.1259 25.0001 32.126C25.7438 32.126 26.3557 31.56 26.4298 30.8359L26.4366 30.6885V26.3779C26.4366 25.5843 25.7937 24.9414 25.0001 24.9414ZM20.6886 22.7852C19.8951 22.7852 19.2522 23.4282 19.2521 24.2217V30.6885L19.2589 30.835C19.3327 31.5593 19.9448 32.125 20.6886 32.125C21.4325 32.125 22.0445 31.5594 22.1183 30.835L22.1251 30.6885V24.2217C22.125 23.4282 21.4821 22.7852 20.6886 22.7852ZM29.3107 20.6299C28.5172 20.63 27.8742 21.2729 27.8741 22.0664V30.6885L27.881 30.835C27.9547 31.5594 28.5668 32.1249 29.3107 32.125C30.0546 32.125 30.6667 31.5594 30.7404 30.835L30.7472 30.6885V22.0664C30.7471 21.2729 30.1042 20.6299 29.3107 20.6299Z" fill="#585A68" />
    </svg>
  ),
  rating: (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M31.2842 21.4541H35.4502C35.748 21.4541 35.9907 21.6953 35.9907 21.9934V35.4607C35.9907 35.7578 35.7489 36 35.4502 36H31.2842C30.9864 36 30.7437 35.7588 30.7437 35.4607V21.9934C30.7437 21.6953 30.9855 21.4541 31.2842 21.4541ZM25.5096 17.0066L26.1145 18.8768L28.089 18.8722C28.3859 18.8722 28.6268 19.1125 28.6268 19.4097C28.6268 19.5885 28.5394 19.7463 28.4043 19.8445L28.4052 19.8463L26.8057 21.0011L27.4189 22.8731C27.5108 23.1556 27.3564 23.4592 27.0732 23.5518C26.8885 23.6115 26.6945 23.5665 26.5576 23.45L24.9949 22.3127L23.3991 23.4739C23.1592 23.6481 22.8227 23.5949 22.6481 23.3555C22.5433 23.2115 22.5203 23.0318 22.5718 22.874H22.5699L23.1831 21.002L21.5836 19.8472C21.3419 19.6729 21.2885 19.3363 21.4632 19.096C21.5772 18.9401 21.7601 18.8621 21.9393 18.8749L23.8753 18.8786L24.4819 17.0047C24.5729 16.7222 24.8763 16.5663 25.1594 16.6571C25.3322 16.7121 25.4582 16.847 25.5087 17.0075L25.5096 17.0066ZM33.882 13.3763L34.4868 15.2464L36.4613 15.2428C36.7582 15.2428 37 15.4831 37 15.7794C37 15.9582 36.9127 16.1169 36.7775 16.2141L36.7785 16.215L35.179 17.3698L35.7921 19.2419C35.8841 19.5243 35.7296 19.828 35.4465 19.9206C35.2617 19.9802 35.0678 19.9353 34.9299 19.8188L33.3672 18.6814L31.7714 19.8426C31.5315 20.0169 31.1951 19.9637 31.0204 19.7252C30.9156 19.5812 30.8926 19.4014 30.9432 19.2437L30.9414 19.2427L31.5545 17.3707L29.955 16.2159C29.7133 16.0417 29.66 15.705 29.8346 15.4647C29.9486 15.3088 30.1315 15.2309 30.3108 15.2437L32.2467 15.2474L32.8524 13.3735C32.9434 13.091 33.2468 12.9351 33.5299 13.0259C33.7027 13.0818 33.8287 13.2157 33.8792 13.3762L33.882 13.3763ZM14.5405 22.4996C14.5405 22.4996 18.4086 22.4996 18.7064 22.4996C19.0043 22.4996 19.247 23.039 19.247 23.039C19.247 23.039 19.247 30.6091 19.247 35.4597C19.247 35.7569 19.0052 35.9991 18.7064 35.9991H14.5405C14.2427 35.9991 14 35.7578 14 35.4597V23.039C14 22.7418 14.2417 22.4996 14.5405 22.4996ZM22.9128 25.0201H27.0788C27.3766 25.0201 27.6193 25.2613 27.6193 25.5594V35.4607C27.6193 35.7578 27.3775 36 27.0788 36H22.9128C22.615 36 22.3723 35.7588 22.3723 35.4607V25.5594C22.3723 25.2613 22.6141 25.0201 22.9128 25.0201Z" fill="#585A68" />
    </svg>
  ),
};

export default function AppSidebar({ isMobile }: AppSidebarProps) {
  const t = useTranslations('auth');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [position, setPosition] = useState({ x: 24, y: window.innerHeight - 88 }); // Initial position
  const [isDragging, setIsDragging] = useState(false);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && !isCollapsed) {
      setIsCollapsed(true);
    } else if (isRightSwipe && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [touchStart, touchEnd, isCollapsed]);

  // Drag handlers for burger button
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    if ('touches' in e) {
      e.preventDefault();
    }
  };

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Calculate new position
    let newX = clientX - 28; // Half of button width
    let newY = clientY - 28; // Half of button height

    // Constrain to viewport bounds
    newX = Math.max(0, Math.min(newX, window.innerWidth - 56));
    newY = Math.max(0, Math.min(newY, window.innerHeight - 56));

    setPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Add and remove event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const burgerButton = document.getElementById('burger-button');
      
      if (sidebar && 
          !sidebar.contains(e.target as Node) && 
          burgerButton && 
          !burgerButton.contains(e.target as Node) && 
          !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCollapsed]);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 sm:hidden ${
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={() => setIsCollapsed(true)}
        aria-hidden={isCollapsed}
      />
      
      {/* Sidebar */}
      <aside 
        id="sidebar"
        className={`fixed top-0 left-0 h-full flex flex-col items-center transition-all duration-300 z-40
          ${isCollapsed ? '-translate-x-full sm:translate-x-0' : 'translate-x-0'}
          pl-2 sm:pl-[40px] pt-4 sm:pt-[40px] py-4 px-2 bg-transparent
          sm:opacity-100 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="mb-4 flex items-center justify-between w-full px-2 sm:px-0">
          <svg className={`${isMobile ? 'w-12 h-12' : 'w-[60px] h-[61px]'} pb-4`} viewBox="0 0 60 61" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 0.5C46.5686 0.5 60 13.9315 60 30.5C60 47.0684 47.7325 60.4999 31.1641 60.5C18.4884 60.5 11.9001 46.2838 24.9932 38.5029L27.9277 41.5762L31.499 40.4912L37.0068 46.1201C38.5644 45.2962 41.4978 41.9749 40.7686 35.2822C40.3253 35.7259 38.9519 36.7723 37.0068 37.4111C40.8058 34.4069 47.7052 25.8125 44.9092 15.4688C40.4643 14.2138 29.8877 14.1378 23.1406 23.873C23.1913 23.1377 23.6652 21.2186 25.1543 19.4238C22.9002 19.0689 17.6022 19.3632 14.4414 23.3789L20.2158 29.1973L19.3037 32.5439L21.8848 35.2471C15.6669 48.8453 3.95871e-05 42.0224 0 30.5C0 13.9315 13.4315 0.500005 30 0.5ZM36.8174 20.5078C38.5587 20.5079 39.9707 21.9219 39.9707 23.665C39.9705 25.408 38.5586 26.8212 36.8174 26.8213C35.0761 26.8213 33.6643 25.4081 33.6641 23.665C33.6641 21.9218 35.076 20.5078 36.8174 20.5078Z" fill="url(#paint0_linear_4_835)" />
            <defs>
              <linearGradient id="paint0_linear_4_835" x1="9.07143" y1="31.25" x2="54.4922" y2="21.0434" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF4400" />
                <stop offset="1" stopColor="#FF883D" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className={`flex flex-col items-center justify-between bg-black-02 rounded-[25px] p-2 h-full
          ${!isMobile ? 'w-[60px]' : 'w-auto'}`}>
          <nav className="flex flex-col gap-2 w-full">
            {menu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl transition group px-2
                  ${!isMobile ? 'w-full justify-center' : 'w-[200px]'}`}
                onClick={() => setIsCollapsed(true)}
              >
                <div className={`flex items-center justify-center rounded-xl transition-colors duration-200
                  ${isMobile ? 'w-10 h-10' : 'w-14 h-14'}`}>
                  <div className="group-hover:[&>svg>path]:fill-[url(#iconGradient)] group-hover:[&>svg>circle]:fill-[url(#iconGradient)] [&>svg>path]:fill-[#585A68]">
                    {icons[item.icon]}
                  </div>
                </div>
                {isMobile && (
                  <span className="text-white text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-auto w-full">
            <button className={`flex items-center gap-3 rounded-xl transition group px-2 w-full
              ${!isMobile ? 'justify-center' : 'w-[200px]'}`}>
              <div className={`flex items-center justify-center rounded-xl transition-colors duration-200
                ${!isMobile ? 'w-10 h-10' : 'w-14 h-14'}`}>
                <div className="group-hover:[&>svg>path]:fill-[url(#iconGradient)] [&>svg>path]:fill-white transition-colors duration-200">
                  <svg className={`${!isMobile ? 'w-10 h-10' : 'w-[50px] h-[50px]'}`} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="iconGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop stopColor="#FF4400" />
                        <stop offset="1" stopColor="#FF883D" />
                      </linearGradient>
                    </defs>
                    <path d="M24.0615 12.3626C28.674 11.5878 30.9807 11.2 32.4902 12.4769C33.9997 13.7539 34 16.0928 34 20.7698V23.595H27.0938L30.2646 19.3577L27.9893 17.6546L23.1172 24.1644L22.4805 25.0159L23.1172 25.8675L27.9893 32.3772L30.2646 30.6741L27.0938 26.4368H34V29.2581C34 33.9352 33.9997 36.274 32.4902 37.5511C30.9807 38.828 28.6741 38.4401 24.0615 37.6653L21.6904 37.2679C19.4253 36.8874 18.2924 36.6963 17.6201 35.9017C16.9482 35.107 16.9482 33.9586 16.9482 31.6624V18.3655C16.9482 16.0693 16.9482 14.9209 17.6201 14.1263C18.2924 13.3316 19.4253 13.1405 21.6904 12.7601L24.0615 12.3626Z" fill="white" />
                  </svg>
                </div>
              </div>
              {isMobile && (
                <span className="text-white text-sm font-medium">
                  Выйти
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button 
        id="burger-button"
        className="fixed sm:hidden w-14 h-14 flex items-center justify-center rounded-full bg-accent shadow-lg z-20 transition-transform duration-300 cursor-move"
        onClick={() => !isDragging && setIsCollapsed(false)}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        }}
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6H20M4 12H20M4 18H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </>
  );
} 