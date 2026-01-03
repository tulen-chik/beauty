import React from 'react';

/**
 * Ненавязчивый серверный компонент для создания эффекта падающего снега
 * с использованием Tailwind CSS.
 *
 * @param {object} props - Пропсы компонента.
 * @param {number} [props.snowflakeCount=150] - Количество снежинок для рендеринга.
 * @returns {React.ReactElement}
 */
const Snowfall = ({ snowflakeCount = 150 }: { snowflakeCount?: number }) => {
  // Создаем массив снежинок со случайными стилями
  const snowflakes = Array.from({ length: snowflakeCount }).map((_, index) => {
    const size = 1 + Math.random() * 3; // Размер от 1px до 4px
    const style: React.CSSProperties = {
      left: `${Math.random() * 100}%`,
      width: `${size}px`,
      height: `${size}px`,
      // Длительность анимации от 8 до 20 секунд
      animationDuration: `${8 + Math.random() * 12}s`,
      // Задержка, чтобы снежинки появлялись в разное время
      animationDelay: `-${Math.random() * 5}s`,
      // Небольшая вариация в прозрачности
      opacity: `${0.7 + Math.random() * 0.3}`,
    };

    return (
      <div
        key={index}
        className="absolute top-0 bg-white rounded-full animate-fall"
        style={style}
      />
    );
  });

  return (
    <div
      className="fixed top-0 left-0 w-full h-screen -z-50 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {snowflakes}
    </div>
  );
};

export default Snowfall;