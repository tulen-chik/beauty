"use client"

import { useState, useMemo } from "react";
import { ChevronDown, Star } from "lucide-react";
import RatingCard from "@/components/RatingCard";
import { SalonRating } from "@/types/database";

interface UserRatingsProps {
  userRatings: SalonRating[];
}

export default function UserRatings({ userRatings }: UserRatingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedRatings = useMemo(() => {
    return [...userRatings].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [userRatings]);

  if (sortedRatings.length === 0) {
    return null;
  }

  const latestRating = sortedRatings[0];
  const olderRatings = sortedRatings.slice(1);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl mt-6 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <Star className="w-5 h-5 text-rose-500 fill-current" />
        <h2 className="text-lg font-bold text-slate-800">Мои отзывы</h2>
        <span className="ml-auto text-xs font-medium bg-white px-2.5 py-1 rounded-full border border-slate-200 text-slate-500">
          Всего: {userRatings.length}
        </span>
      </div>

      <div className="p-6">
        <div className="mb-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Последний отзыв</h3>
          <RatingCard
            key={latestRating.id}
            rating={latestRating}
            responses={[]}
            className="border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          />
        </div>
      </div>

      {olderRatings.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/30">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-slate-50 transition-colors group"
          >
            <span className="text-sm font-medium text-slate-600 group-hover:text-rose-600 transition-colors">
              {isExpanded ? 'Скрыть историю отзывов' : `Показать еще ${olderRatings.length} ${olderRatings.length === 1 ? 'отзыв' : 'отзыва'}`}
            </span>
            <div className={`p-1 rounded-full bg-white border border-slate-200 group-hover:border-rose-200 transition-all ${isExpanded ? 'bg-rose-50' : ''}`}>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {isExpanded && (
            <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="h-px bg-slate-200 w-full mb-4 opacity-50" />
              {olderRatings.map((rating) => (
                <RatingCard
                  key={rating.id}
                  rating={rating}
                  responses={[]}
                  className="border border-slate-200 rounded-xl bg-white"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}