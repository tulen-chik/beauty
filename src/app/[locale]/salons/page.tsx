"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSalon } from "@/contexts/SalonContext";
import { useUser } from "@/contexts/UserContext";

export default function UserSalonsPage() {
  const { fetchUserSalons, userSalons, loading, error } = useSalon();
  const [fetched, setFetched] = useState(false);
  const { currentUser } = useUser();
  const userId = currentUser?.userId;

  useEffect(() => {
    if (userId && !fetched) {
      fetchUserSalons(userId);
      setFetched(true);
    }
  }, [userId, fetched, fetchUserSalons]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Мои салоны</h1>
          <Link
            href="/salons/create"
            className="px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold shadow hover:bg-rose-700 transition-all"
          >
            + Новый салон
          </Link>
        </div>
        {loading && <div className="text-center text-gray-500">Загрузка...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}
        {!loading && userSalons && userSalons.salons.length === 0 && (
          <div className="text-center text-gray-500">У вас пока нет салонов.</div>
        )}
        {!loading && userSalons && userSalons.salons.length > 0 && (
          <ul className="space-y-4">
            {userSalons.salons.map((s) => (
              <li key={s.salonId} className="p-4 border rounded-xl flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold text-lg text-gray-900">
                    <Link href={`/salons/${s.salonId}`} className="hover:underline text-rose-600">
                      ID: {s.salonId}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-600">Ваша роль: {s.role}</div>
                  <div className="text-xs text-gray-400">Присоединились: {new Date(s.joinedAt).toLocaleDateString()}</div>
                </div>
                <Link
                  href={`/salons/${s.salonId}`}
                  className="mt-2 md:mt-0 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl font-semibold border border-rose-200 hover:bg-rose-100 transition-all"
                >
                  Перейти в CRM
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 