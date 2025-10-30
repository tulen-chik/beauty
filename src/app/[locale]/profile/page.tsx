"use client"

import { AlertCircle, Building2, CheckCircle, LogOut, MessageCircle, Search, XCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import RatingCard from "@/components/RatingCard"
import RatingForm from "@/components/RatingForm"

import {
  useSalonInvitation,
  useSalonRating,
  useSalonService,
  useAppointment,
  useSalon
} from "@/contexts"
import { useUser } from "@/contexts/UserContext"
import { Appointment, Salon, SalonInvitation, SalonRating, SalonService, User } from "@/types/database"

type FormErrors = {
  displayName?: string;
  general?: string;
};

// --- SKELETON COMPONENTS (без изменений) ---
const AppointmentCardSkeleton = () => (
  <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
    <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
      <div className="space-y-4 flex-1">
        <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
        <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
        <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
        <div className="h-5 w-5/6 bg-gray-200 rounded"></div>
      </div>
      <div className="flex-shrink-0 mt-4 sm:mt-0">
        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
    <div className="mt-6 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-3">
        <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  </div>
);

const AppointmentListSkeleton = () => (
  <div className="p-3 sm:p-4 space-y-4">
    <AppointmentCardSkeleton />
    <AppointmentCardSkeleton />
  </div>
);

const ProfilePageSkeleton = () => (
  <div className="min-h-screen bg-gray-50 animate-pulse">
    <div className="max-w-4xl mx-auto p-3 sm:p-4">
      <div className="mb-4 sm:mb-6">
        <div className="h-8 w-1/3 bg-gray-300 rounded-lg"></div>
        <div className="h-5 w-1/2 bg-gray-200 rounded-md mt-2"></div>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl mb-4 sm:mb-6">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="h-6 w-1/4 bg-gray-300 rounded-lg"></div>
        </div>
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl">
                <div className="p-2 bg-gray-200 rounded-lg w-12 h-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl mb-4 sm:mb-6">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="h-6 w-1/4 bg-gray-300 rounded-lg"></div>
        </div>
        <div className="p-3 sm:p-4 space-y-4">
          <div className="h-5 w-24 bg-gray-200 rounded-md mb-2"></div>
          <div className="h-10 w-full max-w-sm bg-gray-200 rounded-lg"></div>
          <div className="pt-2">
            <div className="h-10 w-36 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="h-6 w-1/4 bg-gray-300 rounded-lg"></div>
        </div>
        <AppointmentListSkeleton />
      </div>
    </div>
  </div>
);


const getRoleLabel = (role: string, t: (key: string) => string) => {
  const roles: Record<string, string> = {
    owner: t('roles.owner'),
    manager: t('roles.manager'),
    employee: t('roles.employee'),
    viewer: t('roles.viewer')
  };
  return roles[role] || role;
};


export default function ProfilePage() {
  const t = useTranslations('profilePage')
  const tRoles = useTranslations('common');
  const router = useRouter()

  const { currentUser, loading: userLoading, updateProfile, logout, getUserById } = useUser()
  const { getRatingsByCustomer, createRating, getRatingByAppointment } = useSalonRating()
  const { updateInvitation, getInvitationsByEmail, acceptInvitation } = useSalonInvitation();
  const { getService } = useSalonService();
  const { listAppointmentsByCustomer } = useAppointment();
  const { fetchSalon } = useSalon();

  const [loading, setLoading] = useState(true)
  const [salons, setSalons] = useState<Salon[]>([])
  const [services, setServices] = useState<SalonService[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [employees, setEmployees] = useState<Record<string, User>>({});
  const [userRatings, setUserRatings] = useState<SalonRating[]>([])
  const [showRatingForm, setShowRatingForm] = useState<string | null>(null)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({});
  const [invitations, setInvitations] = useState<SalonInvitation[]>([]);
  // Новое состояние для "обогащенных" данных
  const [enrichedInvitations, setEnrichedInvitations] = useState<(SalonInvitation & { salon: Salon | null })[]>([]);


  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      };

      setLoading(true);
      setErrors({});
      try {
        const appointmentsPromise = listAppointmentsByCustomer(currentUser.userId);
        const invitationsPromise = currentUser.email ? getInvitationsByEmail(currentUser.email) : Promise.resolve([]);
        const ratingsPromise = getRatingsByCustomer(currentUser.userId);

        const [userAppointments, userInvitations, ratings] = await Promise.all([
          appointmentsPromise,
          invitationsPromise,
          ratingsPromise,
        ]);

        const sortedAppointments = [...userAppointments].sort(
          (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
        );
        setAppointments(sortedAppointments);

        const pendingInvitations = userInvitations.filter((inv) => inv.status === 'pending');
        setInvitations(pendingInvitations);
        console.log("LOG 1: Полученные приглашения (pending):", pendingInvitations);

        setUserRatings(ratings);

        const serviceIds = new Set<string>();
        const employeeIds = new Set<string>();
        const appointmentSalonIds = new Set<string>();
        userAppointments.forEach(a => {
          appointmentSalonIds.add(a.salonId);
          serviceIds.add(a.serviceId);
          if (a.employeeId) employeeIds.add(a.employeeId);
        });

        const invitationSalonIds = new Set(pendingInvitations.map(inv => inv.salonId));
        
        const allUniqueSalonIds = Array.from(new Set([
            ...Array.from(appointmentSalonIds), 
            ...Array.from(invitationSalonIds)
        ]));
        console.log("LOG 2: Все уникальные ID салонов для загрузки:", allUniqueSalonIds);

        const salonPromises = allUniqueSalonIds.map(id => fetchSalon(id));
        const servicePromises = Array.from(serviceIds).map(id => getService(id));
        const employeePromises = Array.from(employeeIds).map(id => getUserById(id));

const [fetchedSalonsRaw, fetchedServices, fetchedEmployees] = await Promise.all([
  Promise.all(salonPromises),
  Promise.all(servicePromises),
  Promise.all(employeePromises),
]);
console.log("LOG 3: Результат fetchSalon (сырые данные):", fetchedSalonsRaw);

// Вручную добавляем ID к каждому полученному объекту салона
const fetchedSalons = fetchedSalonsRaw.map((salon, index) => {
  if (salon) {
    // Берем ID из массива, по которому делали запросы
    return { ...salon, id: allUniqueSalonIds[index] };
  }
  return null;
});

const filteredSalons = fetchedSalons.filter((s): s is Salon => s !== null);
        console.log("LOG 4: Салоны после фильтрации null:", filteredSalons);
        setSalons(filteredSalons);
        setServices(fetchedServices.filter((s): s is SalonService => s !== null));

        const validEmployees = fetchedEmployees.filter((e): e is User => e !== null);
        const employeeMap = new Map(validEmployees.map(e => [e.id, e]));
        setEmployees(Object.fromEntries(employeeMap));

        // --- БЛОК ОБЪЕДИНЕНИЯ ДАННЫХ С ЛОГИРОВАНИЕМ ---
        const salonsMap = new Map(filteredSalons.map(s => [s.id, s]));
        console.log("LOG 5: Создана карта салонов (salonsMap):", salonsMap);
        
        const enriched = pendingInvitations.map(inv => {
          const foundSalon = salonsMap.get(inv.salonId);
          if (!foundSalon) {
            console.warn(`WARN: Салон с ID ${inv.salonId} не найден в карте салонов для приглашения.`, inv);
          }
          return {
            ...inv,
            salon: foundSalon || null
          }
        });
        console.log("LOG 6: Обогащенные приглашения (перед установкой в state):", enriched);
        setEnrichedInvitations(enriched);

      } catch (e) {
        console.error("CRITICAL ERROR during data load:", e);
        setErrors({ general: "Не удалось загрузить данные профиля. Пожалуйста, обновите страницу." });
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) {
      loadData();
    }
  }, [currentUser, userLoading, listAppointmentsByCustomer, getInvitationsByEmail, getRatingsByCustomer, fetchSalon, getService, getUserById]);

  const salonsById = useMemo(() => Object.fromEntries(salons.map(s => [s.id, s])), [salons])
  const servicesById = useMemo(() => Object.fromEntries(services.map(s => [s.id, s])), [services])

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || "")
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

  const handleInvitationResponse = async (invitationId: string, accept: boolean) => {
    if (!currentUser) {
      setErrors({ general: "Для принятия приглашения необходимо войти в аккаунт." });
      router.push('/login');
      return;
    }

    try {
      if (accept) {
        await acceptInvitation({ invitationId, userId: currentUser.userId });
        window.location.reload();
      } else {
        await updateInvitation(invitationId, { status: 'declined' });
        setInvitations((prev) => prev.filter(inv => inv.id !== invitationId));
        setEnrichedInvitations((prev) => prev.filter(inv => inv.id !== invitationId)); // Также обновляем обогащенные данные
      }

      setMsg(accept ? "Приглашение принято! Страница перезагружается..." : "Приглашение отклонено.");
      setTimeout(() => setMsg(null), 5000);
    } catch (error) {
      console.error("Error updating invitation:", error);
      setErrors({ general: "Не удалось обработать приглашение. Пожалуйста, попробуйте снова." });
    }
  };

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

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error("Failed to log out:", error);
      setErrors({ general: "Не удалось выйти из аккаунта. Попробуйте еще раз." });
    }
  };

  const hasRatingForAppointment = (appointmentId: string) => {
    return userRatings.some(rating => rating.appointmentId === appointmentId)
  }

  const renderInvitations = () => {
    console.log("LOG 7: Рендеринг блока приглашений с данными:", enrichedInvitations);
    if (enrichedInvitations.length === 0) return null;

    return (
      <div className="mb-4 sm:mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-rose-600" />
              Приглашения в салоны
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {enrichedInvitations.map((invitation) => {
              const salon = invitation.salon;
              console.log(`LOG 8: Рендеринг приглашения ID ${invitation.id}, найденный салон:`, salon);
              return (
                <div key={invitation.id} className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {salon ? salon.name : (loading ? 'Загрузка...' : 'Информация о салоне недоступна')}
                      </h3>
                      <p className="text-sm text-gray-500">Вам предложена роль: <span className="font-medium text-gray-700">{getRoleLabel(invitation.role, tRoles)}</span></p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => handleInvitationResponse(invitation.id, true)}
                        className="px-3 py-1.5 bg-green-100 text-green-800 hover:bg-green-200 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Принять
                      </button>
                      <button
                        onClick={() => handleInvitationResponse(invitation.id, false)}
                        className="px-3 py-1.5 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Отклонить
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    );
  };

  if (userLoading || (loading && !currentUser)) {
    return <ProfilePageSkeleton />
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white shadow rounded-lg overflow-hidden p-6 text-center">
            <div className="text-lg font-semibold mb-2">{t('requireLogin.title')}</div>
            <p className="text-gray-600 mb-4">{t('requireLogin.desc')}</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/login" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">{t('requireLogin.login')}</Link>
              <Link href="/register" className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700">{t('requireLogin.register')}</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t('title')}</h1>
          <div className="text-sm sm:text-base text-gray-600 mt-1">{currentUser.displayName} • {currentUser.email}</div>
        </div>

        {renderInvitations()}

        <div className="bg-white border border-gray-200 rounded-2xl mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">{t('quickActions.title')}</h2>
          </div>
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className={`w-full max-w-sm px-3 py-2 border rounded-lg focus:ring-2 text-base ${errors.displayName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-rose-500 focus:border-rose-500'}`}
              />
              {errors.displayName && (
                <div className="flex items-center gap-1 text-red-600 mt-2 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.displayName}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-3 pt-2">
              <button
                disabled={saving}
                onClick={handleSaveProfile}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-medium disabled:bg-rose-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Сохранение...' : t('settings.saveProfile')}
              </button>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800 font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Выйти из аккаунта</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">МОИ ЗАПИСИ</h2>
          </div>
          {loading ? (
            <AppointmentListSkeleton />
          ) : appointments.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-gray-600">{t('appointments.empty')}</div>
          ) : (
            <div className="p-3 sm:p-4 space-y-4">
              {appointments.map((a) => {
                const service = servicesById[a.serviceId];
                const salon = salonsById[a.salonId];
                const specialist = a.employeeId ? employees[a.employeeId] : null;

                const start = new Date(a.startAt);
                const end = new Date(start.getTime() + (service?.durationMinutes || 0) * 60000);

                const dateStr = start.toLocaleDateString('ru-RU');
                const timeStr = `${start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

                const canEdit = (start.getTime() - new Date().getTime()) > 24 * 60 * 60 * 1000;
                const isCompleted = a.status === 'completed';
                const canReview = isCompleted && !hasRatingForAppointment(a.id);

                const AppointmentRow = ({ label, value }: { label: string, value?: string | null }) => {
                  if (!value) return null;
                  return (
                    <div className="text-sm sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-gray-500 mb-1 sm:mb-0">{label}</dt>
                      <dd className="sm:col-span-2 text-gray-900 font-medium">{value}</dd>
                    </div>
                  );
                };

                return (
                  <div key={a.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                      <dl className="space-y-3 flex-1">
                        <AppointmentRow label="Салон" value={salon?.name} />
                        <AppointmentRow label="Услуга" value={service?.name} />
                        <div className="text-sm sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-gray-500 mb-1 sm:mb-0">Дата</dt>
                          <dd className="sm:col-span-2 text-gray-900 font-medium">{dateStr}</dd>
                        </div>
                        <div className="text-sm sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-gray-500 mb-1 sm:mb-0">Время</dt>
                          <dd className="sm:col-span-2 text-gray-900 font-medium">{timeStr}</dd>
                        </div>
                        <AppointmentRow label="Адрес" value={salon?.address} />
                        <AppointmentRow label="Специалист" value={specialist?.displayName || 'Любой специалист'} />
                        <AppointmentRow label="Комментарий" value={a.notes} />
                        <AppointmentRow label="Статус" value={a.status} />
                      </dl>

                      {canEdit && (
                        <div className="flex-shrink-0 text-left sm:text-right mt-4 sm:mt-0">
                          <button className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium">
                            Редактировать
                          </button>
                          <p className="text-xs text-gray-500 mt-1 sm:max-w-[200px]">
                            *Редактировать запись можно не позднее, чем за день до услуги
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowRatingForm(a.id)}
                          disabled={!canReview}
                          className="px-4 py-2 text-sm rounded-lg bg-gray-200 text-gray-800 font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          Оставить отзыв
                        </button>
                        <Link
                          href={`/book/${service?.id || ''}`}
                          className="px-4 py-2 text-sm rounded-lg bg-gray-200 text-gray-800 font-medium"
                        >
                          Записаться снова
                        </Link>
                      </div>
                      {!isCompleted && (
                        <p className="text-xs text-gray-500 mt-2">
                          *Данные разделы будут доступны, после оказания услуги
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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