// components/Icicles.tsx
"use client";

import { useMemo } from 'react';

interface Icicle {
  left: string;
  height: string;
  width: string;
  opacity: string;
}

/**
 * Компонент для создания декоративных сосулек с помощью CSS.
 * Генерирует случайные сосульки один раз за рендер.
 * @param {object} props - Пропсы компонента.
 * @param {number} [props.count=70] - Количество сосулек.
 * @returns {React.ReactElement}
 */
const Icicles = ({ count = 70 }: { count?: number }) => {
  const icicles = useMemo(() => {
    return Array.from({ length: count }).map((): Icicle => ({
      left: `${Math.random() * 100}%`,
      // Высота от 4px до 16px
      height: `${4 + Math.random() * 12}px`,
      // Ширина от 2px до 5px
      width: `${2 + Math.random() * 3}px`,
      // Небольшая вариация в прозрачности для естественности
      opacity: `${0.6 + Math.random() * 0.4}`,
    }));
  }, [count]);

  return (
    <div
      // Контейнер позиционируется абсолютно под нижней границей родителя
      className="absolute bottom-0 left-0 w-full h-4 pointer-events-none translate-y-full"
      aria-hidden="true"
    >
      {icicles.map((style, i) => (
        <div
          key={i}
          // Используем полупрозрачный белый цвет, чтобы соответствовать стилю хедера
          className="absolute bottom-0 bg-white/90"
          style={{
            ...style,
            clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
            // ✨ ИСПРАВЛЕНИЕ: Добавляем едва заметную тень для видимости на белом фоне
            boxShadow: 'inset 0 -2px 3px rgba(200, 200, 220, 0.25)',
          }}
        />
      ))}
    </div>
  );
};

export default Icicles;