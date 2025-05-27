// Component for Reviews content
"use client";

export default function ReviewsContent() {
  return (
    <div className="p-4 bg-black-02 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Отзывы</h2>
      <div className="space-y-4">
        {/* Здесь будет список отзывов */}
        <div className="bg-black-01 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
            <div>
              <p className="text-white font-medium">Иван Петров</p>
              <div className="flex gap-1 my-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="16" height="16" fill="none" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z" fill="#FF883D"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-400 text-sm">Отличный сервис! Всё очень понравилось.</p>
            </div>
          </div>
        </div>
        <div className="bg-black-01 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
            <div>
              <p className="text-white font-medium">Мария Иванова</p>
              <div className="flex gap-1 my-1">
                {[...Array(4)].map((_, i) => (
                  <svg key={i} width="16" height="16" fill="none" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z" fill="#FF883D"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-400 text-sm">Хороший опыт работы, рекомендую!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 