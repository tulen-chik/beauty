"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

// Импорт компонентов
import { ProfilePageSkeleton } from "./components/Skeletons";
import Invitations from "./components/Invitations";
import QuickActions from "./components/QuickActions";
import ProfileSettings from "./components/ProfileSettings";
import AppointmentList from "./components/AppointmentList";
import UserRatings from "./components/UserRatings";
import RatingForm from "@/components/RatingForm"

// Контексты и типы
import { useSalonInvitation, useSalonRating, useSalonService, useAppointment, useSalon, useUser } from "@/contexts"
import { Appointment, Salon, SalonInvitation, SalonRating, SalonService, User } from "@/types/database"

type FormErrors = {
  displayName?: string;
  avatar?: string;
  general?: string;
};

export default function ProfilePage() {
  const t = useTranslations('profilePage')
  const tRoles = useTranslations('common');
  const router = useRouter()

  const { currentUser, loading: userLoading, updateProfile, logout, getUserById, uploadAvatar, removeAvatar } = useUser()
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
  const [saving, setSaving] = useState(false)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({});
  const [invitations, setInvitations] = useState<SalonInvitation[]>([]);
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
        const [userAppointments, userInvitations, ratings] = await Promise.all([
          listAppointmentsByCustomer(currentUser.userId),
          currentUser.email ? getInvitationsByEmail(currentUser.email) : Promise.resolve([]),
          getRatingsByCustomer(currentUser.userId),
        ]);

        setAppointments([...userAppointments].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()));
        const pendingInvitations = userInvitations.filter((inv) => inv.status === 'pending');
        setInvitations(pendingInvitations);
        setUserRatings(ratings);

        const serviceIds = new Set(userAppointments.map(a => a.serviceId));
        const employeeIds = new Set(userAppointments.map(a => a.employeeId).filter(Boolean) as string[]);
        const allUniqueSalonIds = Array.from(new Set([
          ...userAppointments.map(a => a.salonId),
          ...pendingInvitations.map(inv => inv.salonId)
        ]));

        const [fetchedSalonsRaw, fetchedServices, fetchedEmployees] = await Promise.all([
          Promise.all(allUniqueSalonIds.map(id => fetchSalon(id))),
          Promise.all(Array.from(serviceIds).map(id => getService(id))),
          Promise.all(Array.from(employeeIds).map(id => getUserById(id))),
        ]);

        const fetchedSalons = fetchedSalonsRaw.map((salon, index) => salon ? { ...salon, id: allUniqueSalonIds[index] } : null).filter((s): s is Salon => s !== null);
        setSalons(fetchedSalons);
        setServices(fetchedServices.filter((s): s is SalonService => s !== null));
        const employeeMap = new Map(fetchedEmployees.filter((e): e is User => e !== null).map(e => [e.id, e]));
        setEmployees(Object.fromEntries(employeeMap));

        const salonsMap = new Map(fetchedSalons.map(s => [s.id, s]));
        setEnrichedInvitations(pendingInvitations.map(inv => ({ ...inv, salon: salonsMap.get(inv.salonId) || null })));

      } catch (e) {
        console.error("CRITICAL ERROR during data load:", e);
        setErrors({ general: "Не удалось загрузить данные профиля. Пожалуйста, обновите страницу." });
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) loadData();
  }, [currentUser, userLoading, listAppointmentsByCustomer, getInvitationsByEmail, getRatingsByCustomer, fetchSalon, getService, getUserById]);

  const salonsById = useMemo(() => Object.fromEntries(salons.map(s => [s.id, s])), [salons]);
  const servicesById = useMemo(() => Object.fromEntries(services.map(s => [s.id, s])), [services]);

  const handleSaveProfile = async (displayName: string) => {
    if (!currentUser) return;
    setSaving(true); setMsg(null); setErrors({});
    try {
      if (displayName.trim() !== currentUser.displayName) {
        await updateProfile(displayName.trim());
      }
      setMsg("Профиль успешно обновлен");
    } catch (e: any) {
      setErrors({ general: e?.message || "Не удалось обновить профиль." });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (avatarFile: File) => {
    setIsAvatarUploading(true); setMsg(null); setErrors({});
    try {
      await uploadAvatar(avatarFile);
      setMsg("Аватар успешно обновлен!");
    } catch (e: any) {
      setErrors({ general: e?.message || "Не удалось загрузить аватар." });
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!currentUser?.avatarUrl) return;
      setIsAvatarUploading(true); setMsg(null); setErrors({});
      try {
        await removeAvatar();
        setMsg("Аватар удален.");
      } catch (e: any) {
        setErrors({ general: e?.message || "Не удалось удалить аватар." });
      } finally {
        setIsAvatarUploading(false);
      }
    
  };

  const handleInvitationResponse = async (invitationId: string, accept: boolean) => {
    if (!currentUser) {
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
    } catch (error) {
      setErrors({ general: "Не удалось обработать приглашение." });
    }
  };

  const handleCreateRating = async (appointmentId: string, salonId: string, serviceId: string, data: { rating: number; review: string; categories?: any; isAnonymous: boolean; attachments?: any[]; }) => {
    if (!currentUser) return;
    setRatingLoading(true); setErrors({});
    try {
      if (await getRatingByAppointment(appointmentId)) {
        setErrors({ general: "Вы уже оставили отзыв для этой записи" });
        setShowRatingForm(null);
        return;
      }
      const ratingId = `rating_${Date.now()}`;
      await createRating(ratingId, salonId, currentUser.userId, currentUser.displayName || "Аноним", data.rating, data.review, data.categories, appointmentId, serviceId, data.isAnonymous, data.attachments);
      setUserRatings(await getRatingsByCustomer(currentUser.userId));
      setMsg("Отзыв успешно отправлен!");
      setShowRatingForm(null);
    } catch (error: any) {
      setErrors({ general: error.message || "Не удалось отправить отзыв." });
    } finally {
      setRatingLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      setErrors({ general: "Не удалось выйти из аккаунта." });
    }
  };

  // Показываем скелет только во время начальной загрузки
  if (userLoading || loading) {
    return <ProfilePageSkeleton />;
  }

  // Если пользователь не авторизован после загрузки - показываем ссылки на авторизацию
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="text-lg font-semibold mb-2">{t('requireLogin.title')}</div>
            <p className="text-gray-600 mb-4">{t('requireLogin.desc')}</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/login" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">{t('requireLogin.login')}</Link>
              <Link href="/register" className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700">{t('requireLogin.register')}</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t('title')}</h1>
          <div className="text-sm sm:text-base text-gray-600 mt-1">{currentUser.displayName} • {currentUser.email}</div>
        </div>

        <Invitations
          enrichedInvitations={enrichedInvitations}
          onInvitationResponse={handleInvitationResponse}
          tRoles={tRoles}
        />

        <QuickActions t={t} />

        <ProfileSettings
          currentUser={currentUser}
          onSaveProfile={handleSaveProfile}
          onAvatarUpload={handleAvatarUpload}
          onAvatarRemove={handleAvatarRemove}
          onLogout={handleLogout}
          saving={saving}
          isAvatarUploading={isAvatarUploading}
          msg={msg}
          errors={errors}
          t={t}
        />

        <AppointmentList
          appointments={appointments}
          loading={loading}
          salonsById={salonsById}
          servicesById={servicesById}
          employees={employees}
          userRatings={userRatings}
          onShowRatingForm={setShowRatingForm}
          t={t}
        />

        <UserRatings userRatings={userRatings} />

        {showRatingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full max-h-[90vh] overflow-y-auto">
              <RatingForm
                onSubmit={(data) => {
                  const appointment = appointments.find(a => a.id === showRatingForm);
                  if (appointment) {
                    handleCreateRating(appointment.id, appointment.salonId, appointment.serviceId, data);
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
  );
}