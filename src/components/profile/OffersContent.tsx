// Component for Offers content
"use client";

export default function OffersContent() {
  return (
    <div className="p-4 bg-black-02 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Предложения</h2>
      <div className="space-y-4">
        {/* Здесь будет список предложений */}
        <div className="bg-black-01 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-medium">Предложение #1</p>
              <p className="text-gray-400 text-sm">Статус: Активно</p>
            </div>
            <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm">Новое</span>
          </div>
        </div>
        <div className="bg-black-01 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-medium">Предложение #2</p>
              <p className="text-gray-400 text-sm">Статус: В обработке</p>
            </div>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm">В процессе</span>
          </div>
        </div>
      </div>
    </div>
  );
} 