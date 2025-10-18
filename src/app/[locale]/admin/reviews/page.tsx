"use client"

import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { 
  Calendar,
  Check, 
  Clock,
  MessageSquare,
  Search, 
  Star, 
  X} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState, useCallback } from "react"

// Контексты
import { useSalonRating } from "@/contexts/SalonRatingContext"
import { useSalon } from "@/contexts/SalonContext" // <-- Изменено
// import { useAuth } from "@/contexts/AuthContext" // <-- Предполагаемый импорт для получения пользователя

import type { Salon, SalonRating } from "@/types/database"

type ReviewStatus = 'all' | 'pending' | 'approved' | 'rejected'

export default function AdminReviewsPage() {
  const t = useTranslations('admin')
  const { ratings, getRatingsBySalon, approveRating, rejectRating, loading: ratingsLoading } = useSalonRating()
  
  // --- Использование нового контекста ---
  const { fetchUserSalons, fetchSalon, loading: salonsLoading } = useSalon()
  // const { user } = useAuth() // <-- Предполагается, что у вас есть доступ к текущему пользователю
  
  const [adminSalons, setAdminSalons] = useState<Salon[]>([])
  
  // Flatten the ratings object into an array
  const allRatings = useMemo(() => {
    return Object.values(ratings).flat()
  }, [ratings])
  
  const [selectedSalonId, setSelectedSalonId] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('all')
  const [expandedReview, setExpandedReview] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null)

  // --- Новая логика загрузки салонов ---
  const loadAdminSalons = useCallback(async () => {
    // Замените 'user.id' на реальный ID пользователя из вашего контекста аутентификации
    const userId = 'current_user_id'; // <-- ЗАМЕНИТЬ
    if (!userId) return;

    try {
      const userSalonsData = await fetchUserSalons(userId);
      if (userSalonsData && userSalonsData.salons) {
        const salonPromises = userSalonsData.salons.map(s => fetchSalon(s.salonId));
        const fetchedSalons = await Promise.all(salonPromises);
        setAdminSalons(fetchedSalons.filter((s): s is Salon => s !== null));
      }
    } catch (error) {
      console.error("Failed to load admin salons:", error);
    }
  }, [fetchUserSalons, fetchSalon]);

  useEffect(() => {
    loadAdminSalons();
  }, [loadAdminSalons]);

  // --- Обновленная логика загрузки отзывов ---
  useEffect(() => {
    if (selectedSalonId === 'all') {
      // Загружаем отзывы для всех салонов, которыми управляет админ
      if (adminSalons.length > 0) {
        adminSalons.forEach(salon => {
          getRatingsBySalon(salon.id);
        });
      }
    } else {
      // Загружаем отзывы для конкретного выбранного салона
      getRatingsBySalon(selectedSalonId);
    }
  }, [selectedSalonId, adminSalons, getRatingsBySalon]);


  const filteredReviews = allRatings.filter((rating: SalonRating) => {
    const matchesSalon = selectedSalonId === 'all' || rating.salonId === selectedSalonId;

    const matchesSearch = 
      (rating.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rating.review?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false))
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !rating.approvedAt && !rating.rejectedAt) ||
      (statusFilter === 'approved' && rating.approvedAt) ||
      (statusFilter === 'rejected' && rating.rejectedAt)
    
    return matchesSalon && matchesSearch && matchesStatus
  })

  const handleApprove = async (ratingId: string) => {
    try {
      await approveRating(ratingId)
    } catch (error) {
      console.error('Error approving review:', error)
    }
  }

  const handleReject = async (ratingId: string) => {
    try {
      if (rejectReason.trim()) {
        await rejectRating(ratingId, rejectReason)
        setShowRejectDialog(null)
        setRejectReason("")
      }
    } catch (error) {
      console.error('Error rejecting review:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: ru })
  }

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ))
  }

  if (ratingsLoading || salonsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Управление отзывами</h1>
      </div>

      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по отзывам..."
                className="pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as ReviewStatus)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">Все отзывы</option>
              <option value="pending">На модерации</option>
              <option value="approved">Одобренные</option>
              <option value="rejected">Отклоненные</option>
            </select>
          </div>
          <div>
            <select 
              value={selectedSalonId}
              onChange={(e) => setSelectedSalonId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">Все салоны</option>
              {/* --- Использование нового списка салонов --- */}
              {adminSalons.map(salon => (
                <option key={salon.id} value={salon.id}>
                  {salon.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="mt-2 text-gray-500">Отзывы не найдены</p>
            </div>
          ) : (
            filteredReviews.map((rating: SalonRating) => (
              <div key={rating.id} className="bg-white rounded-lg shadow overflow-hidden mb-4">
                <div className="bg-gray-50 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">
                          {rating.isAnonymous ? 'Анонимный пользователь' : rating.customerName || 'Без имени'}
                        </h3>
                        {rating.isVerified && (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Подтвержден
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>{formatDate(rating.createdAt)}</span>
                        <Clock className="h-3.5 w-3.5 ml-3 mr-1" />
                        <span>{new Date(rating.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {renderStars(rating.rating)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{rating.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="prose max-w-none">
                    <p className={`${expandedReview !== rating.id && 'line-clamp-3'} whitespace-pre-line`}>
                      {rating.review || 'Без текста отзыва'}
                    </p>
                    {rating.review && rating.review.length > 200 && (
                      <button
                        onClick={() => setExpandedReview(expandedReview === rating.id ? null : rating.id)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        {expandedReview === rating.id ? 'Свернуть' : 'Читать далее'}
                      </button>
                    )}
                  </div>

                  {rating.categories && Object.keys(rating.categories).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(rating.categories).map(([category, value]) => (
                        <span key={category} className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          {category}: {value}
                        </span>
                      ))}
                    </div>
                  )}

                  {!rating.approvedAt && !rating.rejectedAt && (
                    <div className="mt-4 flex space-x-2">
                      <button 
                        onClick={() => handleApprove(rating.id)}
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-green-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Одобрить
                      </button>
                      <button 
                        onClick={() => setShowRejectDialog(rating.id)}
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Отклонить
                      </button>
                    </div>
                  )}

                  {rating.rejectedAt && rating.rejectedReason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-md">
                      <p className="text-sm font-medium text-red-800">Причина отклонения:</p>
                      <p className="text-sm text-red-700">{rating.rejectedReason}</p>
                    </div>
                  )}
                </div>

                {/* Reject Dialog */}
                {showRejectDialog === rating.id && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                      <h3 className="text-lg font-medium mb-4">Укажите причину отклонения</h3>
                      <textarea
                        className="w-full border rounded-md p-2 mb-4 h-24"
                        placeholder="Введите причину отклонения отзыва..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => {
                            setShowRejectDialog(null)
                            setRejectReason("")
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Отмена
                        </button>
                        <button 
                          onClick={() => handleReject(rating.id)}
                          disabled={!rejectReason.trim()}
                          className={`px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${!rejectReason.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Отклонить
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}