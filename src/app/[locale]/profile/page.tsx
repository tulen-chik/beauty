"use client"

import { AlertCircle, Building2, CheckCircle, LogOut, MessageCircle, Search, UserCircle, XCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState } from "react"

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
  avatar?: string;
  general?: string;
};

// --- SKELETON COMPONENTS ---
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

  const { 
    currentUser, 
    loading: userLoading, 
    updateProfile, 
    logout, 
    getUserById,
    uploadAvatar,
    removeAvatar
  } = useUser()
  
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
  const [enrichedInvitations, setEnrichedInvitations] = useState<(SalonInvitation & { salon: Salon | null })[]>([]);

  // Состояния для управления аватаром
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarInitials = useMemo(() => {
    const name = currentUser?.displayName || currentUser?.email || '';
    if (!name) return '';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || '').join('');
  }, [currentUser]);

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
        setUserRatings(ratings);

        const serviceIds = new Set(userAppointments.map(a => a.serviceId));
        const employeeIds = new Set(userAppointments.map(a => a.employeeId).filter(Boolean) as string[]);
        const appointmentSalonIds = new Set(userAppointments.map(a => a.salonId));
        const invitationSalonIds = new Set(pendingInvitations.map(inv => inv.salonId));
        
        const allUniqueSalonIds = Array.from(new Set([
          ...Array.from(appointmentSalonIds), 
          ...Array.from(invitationSalonIds)
      ]));

        const [fetchedSalonsRaw, fetchedServices, fetchedEmployees] = await Promise.all([
          Promise.all(allUniqueSalonIds.map(id => fetchSalon(id))),
          Promise.all(Array.from(serviceIds).map(id => getService(id))),
          Promise.all(Array.from(employeeIds).map(id => getUserById(id))),
        ]);

        const fetchedSalons = fetchedSalonsRaw.map((salon, index) => 
          salon ? { ...salon, id: allUniqueSalonIds[index] } : null
        ).filter((s): s is Salon => s !== null);
        
        setSalons(fetchedSalons);
        setServices(fetchedServices.filter((s): s is SalonService => s !== null));
        
        const employeeMap = new Map(fetchedEmployees.filter((e): e is User => e !== null).map(e => [e.id, e]));
        setEmployees(Object.fromEntries(employeeMap));

        const salonsMap = new Map(fetchedSalons.map(s => [s.id, s]));
        const enriched = pendingInvitations.map(inv => ({
          ...inv,
          salon: salonsMap.get(inv.salonId) || null
        }));
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB
        setErrors({ ...errors, avatar: "Размер файла не должен превышать 2 МБ." });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrors({ ...errors, avatar: "Пожалуйста, выберите изображение (JPG, PNG, WEBP)." });
        return;
      }

      setErrors({});
      setAvatarFile(file);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    }
  };

  const cancelAvatarChange = () => {
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setIsAvatarUploading(true);
    setMsg(null);
    setErrors({});
    try {
      await uploadAvatar(avatarFile);
      setMsg("Аватар успешно обновлен!");
      cancelAvatarChange();
    } catch (e: any) {
      console.error("Avatar upload error:", e);
      setErrors({ general: e?.message || "Не удалось загрузить аватар." });
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!currentUser?.avatarUrl) return;

    if (window.confirm("Вы уверены, что хотите удалить свой аватар?")) {
      setIsAvatarUploading(true);
      setMsg(null);
      setErrors({});
      try {
        await removeAvatar();
        setMsg("Аватар удален.");
      } catch (e: any) {
        console.error("Avatar removal error:", e);
        setErrors({ general: e?.message || "Не удалось удалить аватар." });
      } finally {
        setIsAvatarUploading(false);
      }
    }
  };

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
        setEnrichedInvitations((prev) => prev.filter(inv => inv.id !== invitationId));
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
          <div className="p-3 sm:p-4 space-y-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Аватар</label>
              <div className="flex items-center gap-5">
                <div className="group relative h-24 w-24 sm:h-28 sm:w-28 rounded-full ring-2 ring-rose-200 shadow-sm overflow-hidden">
                  {avatarPreviewUrl ? (
                    <Image src={avatarPreviewUrl} alt="Предпросмотр аватара" fill className="object-cover" />
                  ) : currentUser.avatarUrl ? (
                    <Image src={currentUser.avatarUrl} alt="Текущий аватар" fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-rose-100">
                      {avatarInitials ? (
                        <span className="text-rose-700 font-semibold text-xl">{avatarInitials}</span>
                      ) : (
                        <UserCircle className="h-12 w-12 text-rose-300" />
                      )}
                    </div>
                  )}
                  {/* hover overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAvatarUploading}
                    className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40 text-white text-xs font-medium transition-opacity"
                    aria-label="Изменить аватар"
                  >
                    Изменить
                  </button>
                  {/* uploading overlay */}
                  {isAvatarUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <div className="h-6 w-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                  {!avatarFile ? (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAvatarUploading}
                        className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        Изменить
                      </button>
                      {currentUser.avatarUrl && (
                        <button
                          onClick={handleAvatarRemove}
                          disabled={isAvatarUploading}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Удалить
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                       <button
                        onClick={handleAvatarUpload}
                        disabled={isAvatarUploading}
                        className="px-3 py-1.5 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-rose-400"
                      >
                        {isAvatarUploading ? 'Сохранение...' : 'Сохранить аватар'}
                      </button>
                      <button
                        onClick={cancelAvatarChange}
                        disabled={isAvatarUploading}
                        className="px-3 py-1.5 text-sm font-medium bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                      >
                        Отмена
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP • до 2 МБ • квадратное изображение</p>
                </div>
              </div>
              {errors.avatar && (
                <div className="flex items-center gap-1 text-red-600 mt-2 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.avatar}</span>
                </div>
              )}
            </div>

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
                disabled={saving || isAvatarUploading}
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