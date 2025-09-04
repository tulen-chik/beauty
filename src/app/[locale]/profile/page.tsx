"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
// ИЗМЕНЕНИЕ: Импортируем useRouter
import { useRouter } from "next/navigation" 
// ИЗМЕНЕНИЕ: Импортируем иконку LogOut
import { Calendar, Clock, MapPin, Scissors, CheckCircle, XCircle, Building2, Search, MessageCircle, AlertCircle, MessageSquare, LogOut } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useSalonRating } from "@/contexts"
import { getAllSalons, getAllSalonServices, appointmentOperations, userOperations } from "@/lib/firebase/database"
import { useTranslations } from "next-intl"
import RatingCard from "@/components/RatingCard"
import RatingForm from "@/components/RatingForm"

type AnySalon = { id: string; name: string; address?: string }
type AnyService = { id: string; salonId: string; name: string; durationMinutes: number }

type FormErrors = {
  displayName?: string;
  general?: string;
};

export default function ProfilePage() {
  const t = useTranslations('profilePage')
  const router = useRouter() // ИЗМЕНЕНИЕ: Инициализируем роутер
  // ИЗМЕНЕНИЕ: Получаем функцию logout из контекста
  const { currentUser, loading: userLoading, updateProfile, logout } = useUser()
  const { getRatingsByCustomer, createRating, getRatingByAppointment } = useSalonRating()
  
  // ... состояния остаются без изменений ...
  const [loading, setLoading] = useState(true)
  const [salons, setSalons] = useState<AnySalon[]>([])
  const [services, setServices] = useState<AnyService[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [userRatings, setUserRatings] = useState<any[]>([])
  const [showRatingForm, setShowRatingForm] = useState<string | null>(null)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [language, setLanguage] = useState("en")
  const [notifications, setNotifications] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({});

  // ... useEffect и другие функции остаются без изменений ...
  useEffect(() => {
    const load = async () => {
      if (!currentUser) return
      setLoading(true)
      setErrors({});
      try {
        const [rawSalons, rawServices] = await Promise.all([
          getAllSalons(),
          getAllSalonServices(),
        ])
        const salonsList: AnySalon[] = Object.entries(rawSalons || {}).map(([id, s]: any) => ({ id, ...s }))
        const servicesList: AnyService[] = Object.entries(rawServices || {}).map(([id, s]: any) => ({ id, ...s }))
        setSalons(salonsList)
        setServices(servicesList)

        const allSalonIds = salonsList.map(s => s.id)
        const chunks = await Promise.all(allSalonIds.map(async (salonId) => {
          const appts = await appointmentOperations.listBySalon(salonId, { customerUserId: currentUser.userId })
          return appts.map(a => ({ ...a, salonId }))
        }))
        const flat = chunks.flat()
        flat.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        setAppointments(flat)

        if (currentUser) {
          const ratings = await getRatingsByCustomer(currentUser.userId)
          setUserRatings(ratings)
        }
      } catch (e) {
        console.error("Failed to load profile data:", e);
        setErrors({ general: "Не удалось загрузить данные профиля. Пожалуйста, обновите страницу." });
      } finally {
        setLoading(false)
      }
    }
    if (!userLoading) load()
  }, [currentUser, userLoading, getRatingsByCustomer])

  const salonsById = useMemo(() => Object.fromEntries(salons.map(s => [s.id, s])), [salons])
  const servicesById = useMemo(() => Object.fromEntries(services.map(s => [s.id, s])), [services])

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || "")
      setLanguage(currentUser.settings?.language || "en")
      setNotifications(Boolean(currentUser.settings?.notifications))
    }
  }, [currentUser])

  const validateProfile = (): boolean => {
    const newErrors: FormErrors = {};
    if (!displayName.trim()) {
      newErrors.displayName = "Имя не может быть пустым";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !validateProfile()) return
    
    setSaving(true); setMsg(null); setErrors({})
    try {
      if (displayName.trim() !== currentUser.displayName) {
        await updateProfile(displayName.trim())
      }
      setMsg("Профиль успешно обновлен")
    } catch (e: any) {
      console.error("Profile update error:", e)
      setErrors({ general: e?.message || "Не удалось обновить профиль. Попробуйте еще раз." })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!currentUser) return
    setSaving(true); setMsg(null); setErrors({})
    try {
      await userOperations.update(currentUser.userId, {
        settings: { language, notifications }
      } as any)
      setMsg("Настройки успешно сохранены")
    } catch (e: any) {
      console.error("Preferences save error:", e)
      setErrors({ general: e?.message || "Не удалось сохранить настройки. Попробуйте еще раз." })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateRating = async (appointmentId: string, salonId: string, serviceId: string, data: {
    rating: number;
    review: string;
    categories?: any;
    isAnonymous: boolean;
  }) => {
    if (!currentUser) return
    
    setRatingLoading(true)
    setErrors({})
    try {
      const existingRating = await getRatingByAppointment(appointmentId)
      if (existingRating) {
        setErrors({ general: "Вы уже оставили отзыв для этой записи" })
        setShowRatingForm(null)
        return
      }

      const ratingId = `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await createRating(
        ratingId, salonId, currentUser.userId,
        currentUser.displayName || currentUser.email || "Аноним",
        data.rating, data.review, data.categories,
        appointmentId, serviceId, data.isAnonymous
      )

      const ratings = await getRatingsByCustomer(currentUser.userId)
      setUserRatings(ratings)
      
      setMsg("Отзыв успешно отправлен!")
      setShowRatingForm(null)
    } catch (error: any) {
      console.error("Rating creation error:", error)
      setErrors({ general: error.message || "Не удалось отправить отзыв. Пожалуйста, попробуйте еще раз." })
    } finally {
      setRatingLoading(false)
    }
  }

  // ИЗМЕНЕНИЕ: Новая функция для обработки выхода из аккаунта
  const handleLogout = async () => {
    try {
      await logout();
      // Перенаправляем на главную страницу после успешного выхода
      router.push('/');
    } catch (error) {
      console.error("Failed to log out:", error);
      setErrors({ general: "Не удалось выйти из аккаунта. Попробуйте еще раз." });
    }
  };

  const hasRatingForAppointment = (appointmentId: string) => {
    return userRatings.some(rating => rating.appointmentId === appointmentId)
  }

  if (userLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">{t('loading')}</div>
  }
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center max-w-md w-full">
          <div className="text-lg font-semibold mb-2">{t('requireLogin.title')}</div>
          <p className="text-gray-600 mb-4">{t('requireLogin.desc')}</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">{t('requireLogin.login')}</Link>
            <Link href="/register" className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700">{t('requireLogin.register')}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        {/* ... остальная разметка без изменений ... */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t('title')}</h1>
          <div className="text-sm sm:text-base text-gray-600 mt-1">{currentUser.displayName} • {currentUser.email}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">{t('quickActions.title')}</h2>
          </div>
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/salons" className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
                  <Building2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{t('quickActions.mySalons')}</div>
                  <div className="text-sm text-gray-600">{t('quickActions.mySalonsDesc')}</div>
                </div>
              </Link>
              <Link href="/search" className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Search className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{t('quickActions.findServices')}</div>
                  <div className="text-sm text-gray-600">{t('quickActions.findServicesDesc')}</div>
                </div>
              </Link>
              <Link href="/chats" className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Мои чаты</div>
                  <div className="text-sm text-gray-600">Общение с салонами</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">{t('settings.title')}</h2>
          </div>
          <div className="p-3 sm:p-4 space-y-4">
            {msg && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>{msg}</span>
              </div>
            )}
            {errors.general && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                <XCircle className="w-4 h-4" />
                <span>{errors.general}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">{t('settings.name')}</label>
                <input 
                  id="displayName"
                  value={displayName} 
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (errors.displayName) {
                      const newErrors = { ...errors };
                      delete newErrors.displayName;
                      setErrors(newErrors);
                    }
                  }} 
                  className={`w-full px-3 py-3 border rounded-lg focus:ring-2 text-base ${errors.displayName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-rose-500 focus:border-rose-500'}`}
                />
                {errors.displayName && (
                  <div className="flex items-center gap-1 text-red-600 mt-2 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.displayName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
              <button 
                disabled={saving} 
                onClick={handleSaveProfile} 
                className="px-4 py-3 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-medium disabled:bg-rose-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Сохранение...' : t('settings.saveProfile')}
              </button>
            </div>

            {/* ИЗМЕНЕНИЕ: Добавлен блок с кнопкой выхода */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800 font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Выйти из аккаунта</span>
              </button>
            </div>
          </div>
        </div>

        {/* ... остальная разметка без изменений ... */}
        <div className="bg-white border border-gray-200 rounded-2xl">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">{t('appointments.title')}</h2>
          </div>
          {loading ? (
            <div className="p-4 sm:p-6 text-gray-600">{t('loading')}</div>
          ) : appointments.length === 0 ? (
            <div className="p-4 sm:p-6 text-gray-600">{t('appointments.empty')}</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {appointments.map((a) => {
                const s = servicesById[a.serviceId]
                const salon = salonsById[a.salonId]
                const start = new Date(a.startAt)
                const dateStr = start.toLocaleDateString('ru-RU')
                const timeStr = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                return (
                  <li key={`${a.salonId}-${a.id}`} className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-rose-600" />
                          {s?.name || 'Услуга'}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{dateStr}</span>
                            <Clock className="w-4 h-4 ml-2" />
                            <span>{timeStr}</span>
                          </div>
                          {s?.durationMinutes && (
                            <div className="text-gray-500">• {s.durationMinutes} мин</div>
                          )}
                        </div>
                        {salon && (
                          <div className="text-sm text-gray-600 flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium">{salon.name}</div>
                              {salon.address && <div className="text-gray-500">{salon.address}</div>}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {t('appointments.status')} {a.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 sm:pt-0">
                        {!hasRatingForAppointment(a.id) ? (
                          <button
                            onClick={() => setShowRatingForm(a.id)}
                            className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Оставить отзыв
                          </button>
                        ) : (
                          <span className="px-4 py-2 text-sm rounded-lg bg-green-100 text-green-700 font-medium">
                            Отзыв оставлен
                          </span>
                        )}
                        <Link
                          href={`/book/${s?.id || ''}`}
                          className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 font-medium text-center min-w-[100px]"
                        >
                          {t('appointments.rebook')}
                        </Link>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {userRatings.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl mt-4 sm:mt-6">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Мои отзывы</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {userRatings.map((rating) => (
                <RatingCard
                  key={rating.id}
                  rating={rating}
                  responses={[]}
                  className="border border-gray-200 rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        {showRatingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full">
              <RatingForm
                onSubmit={(data) => {
                  const appointment = appointments.find(a => a.id === showRatingForm)
                  if (appointment) {
                    handleCreateRating(
                      appointment.id,
                      appointment.salonId,
                      appointment.serviceId,
                      data
                    )
                  }
                }}
                onCancel={() => setShowRatingForm(null)}
                loading={ratingLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}