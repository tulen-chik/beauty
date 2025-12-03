"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { UserPlus, ShieldCheck, Briefcase, User as UserIcon, Eye, Trash2, AlertTriangle, CheckCircle, X } from "lucide-react";

import { useSalon } from "@/contexts/SalonContext";
import { useSalonInvitation } from "@/contexts/SalonInvitationContext";
import { useUser } from "@/contexts/UserContext";

import type { SalonMember, SalonRole, User } from "@/types/database";

// --- КОМПОНЕНТЫ SKELETON И ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ ---

// Скелет для элемента списка в разделе "Ожидающие приглашения"
const InvitationListItemSkeleton = () => (
  <li className="flex items-center justify-between gap-4 p-4 border border-slate-100 rounded-xl">
    <div className="flex-1 space-y-2">
      <div className="h-5 w-2/3 bg-slate-200 rounded-md"></div>
      <div className="h-4 w-1/2 bg-slate-200 rounded-md"></div>
    </div>
    <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
  </li>
);

// Скелет для элемента списка в разделе "Текущие сотрудники"
const StaffListItemSkeleton = () => (
  <li className="p-4 border border-slate-100 rounded-xl space-y-4">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-6 w-1/2 bg-slate-300 rounded-lg"></div>
        <div className="h-4 w-3/4 bg-slate-200 rounded-md"></div>
      </div>
    </div>
    <div className="flex items-end justify-between gap-4">
      <div className="flex-1 space-y-1">
        <div className="h-4 w-12 bg-slate-200 rounded-md"></div>
        <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
      </div>
      <div className="h-10 w-10 bg-slate-200 rounded-xl"></div>
    </div>
  </li>
);

// Основной компонент-скелет для всей страницы
const SalonStaffPageSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 animate-pulse">
      <div className="h-8 w-1/2 bg-slate-300 rounded-lg mb-2"></div>
      <div className="h-5 w-1/3 bg-slate-200 rounded-md mb-8"></div>
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-12 flex-1 bg-slate-200 rounded-xl"></div>
          <div className="h-12 w-full sm:w-40 bg-slate-200 rounded-xl"></div>
          <div className="h-12 w-full sm:w-32 bg-slate-300 rounded-xl"></div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="h-7 w-1/3 bg-slate-300 rounded-lg mb-4"></div>
          <ul className="space-y-3">
            <InvitationListItemSkeleton />
            <InvitationListItemSkeleton />
          </ul>
        </div>
        <div>
          <div className="h-7 w-1/3 bg-slate-300 rounded-lg mb-4"></div>
          <ul className="space-y-3">
            <StaffListItemSkeleton />
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const ROLES: { value: SalonRole; label: string }[] = [
  { value: "owner", label: "Владелец" },
  { value: "manager", label: "Менеджер" },
  { value: "employee", label: "Сотрудник" },
  { value: "viewer", label: "Наблюдатель" },
];

const RoleIcon = ({ role }: { role: SalonRole }) => {
  const iconMap = {
    owner: <ShieldCheck className="w-4 h-4 text-amber-600" />,
    manager: <Briefcase className="w-4 h-4 text-sky-600" />,
    employee: <UserIcon className="w-4 h-4 text-emerald-600" />,
    viewer: <Eye className="w-4 h-4 text-slate-500" />,
  };
  return <div className="flex items-center gap-2">
    {iconMap[role]}
    <span className="font-medium">{ROLES.find(r => r.value === role)?.label}</span>
  </div>;
};

const InitialAvatar = ({ name }: { name: string }) => {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-full h-full rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center text-rose-600 font-bold text-xl">
      {initials || <UserIcon />}
    </div>
  );
};


export default function SalonStaffPage({ params }: { params: { salonId: string } }) {
  const { salonId } = params;
  const { fetchSalon, updateSalonMembers, loading, error: salonError } = useSalon();
  const { getInvitationsBySalon, createInvitation, deleteInvitation, loading: invitationLoading } = useSalonInvitation();
  
  // --- ИЗМЕНЕНИЕ: Получаем `currentUser` для самопроверки ---
  const { currentUser, getUserById, getAvatar } = useUser();
  
  const [members, setMembers] = useState<SalonMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SalonRole>("employee");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [invitations, setInvitations] = useState<any[]>([]);
  const [userDataMap, setUserDataMap] = useState<Record<string, {name: string, email: string, avatarUrl: string | null}>>({});

  useEffect(() => {
    const fetchData = async () => {
      const salon = await fetchSalon(salonId);
      if (salon?.members) {
        setMembers(salon.members);
        
        const userPromises = salon.members.map(async (member) => {
          const [user, avatar] = await Promise.all([
            getUserById(member.userId),
            getAvatar(member.userId)
          ]);
          return user ? { ...user, id: member.userId, avatarUrl: avatar?.url || null } : null;
        });
        
        const users = (await Promise.all(userPromises)).filter(Boolean) as (User & { id: string, avatarUrl: string | null })[];
        
        const userMap = users.reduce((acc, user) => ({
          ...acc,
          [user.id]: {
            name: user.displayName || user.email?.split('@')[0] || 'Пользователь',
            email: user.email || '',
            avatarUrl: user.avatarUrl
          }
        }), {} as Record<string, {name: string, email: string, avatarUrl: string | null}>);
        
        setUserDataMap(userMap);
      } else {
        setMembers([]);
      }
    };
    
    fetchData();
    getInvitationsBySalon(salonId).then(setInvitations);
  }, [salonId, fetchSalon, getInvitationsBySalon, getUserById, getAvatar]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    if (members.length >= 3) {
      setError("Достигнут лимит сотрудников (3).");
      setTimeout(() => setError(""), 4000);
      return;
    }
    
    const invitationId = `inv_${salonId}_${Date.now()}`;
    try {
      await createInvitation(invitationId, {
        salonId, email, role, invitedBy: currentUser?.userId || "unknown", status: "pending", createdAt: new Date().toISOString(),
      });
      setEmail("");
      setRole("employee");
      setSuccess(`Приглашение успешно отправлено на ${email}`);
      getInvitationsBySalon(salonId).then(setInvitations);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Ошибка при отправке приглашения");
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    await deleteInvitation(invitationId);
    getInvitationsBySalon(salonId).then(setInvitations);
  };

  const handleRoleChange = async (idx: number, newRole: SalonRole) => {
    try {
      const updated = members.map((m, i) => i === idx ? { ...m, role: newRole } : m);
      await updateSalonMembers(salonId, updated);
      setMembers(updated);
    } catch (err: any) {
      setError(err.message || "Ошибка при изменении роли");
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleRemove = async (idx: number) => {
    try {
      const updated = members.filter((_, i) => i !== idx);
      await updateSalonMembers(salonId, updated);
      setMembers(updated);
    } catch (err: any) {
      setError(err.message || "Ошибка при удалении сотрудника");
      setTimeout(() => setError(""), 4000);
    }
  };

  const isInitialLoading = (loading || invitationLoading) && members.length === 0 && invitations.length === 0;

  if (isInitialLoading) {
    return <SalonStaffPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Команда салона</h1>
          <p className="text-slate-500 mt-1">
            Управляйте доступом и ролями ваших сотрудников. Всего доступно: {members.length}/3.
          </p>
        </header>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-8">
          <form className="flex flex-col sm:flex-row items-center gap-3" onSubmit={handleInvite}>
            <div className="w-full flex-1">
              <input
                type="email"
                className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                placeholder="Email пользователя для приглашения"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <select
              className="w-full sm:w-44 px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
              value={role}
              onChange={e => setRole(e.target.value as SalonRole)}
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <button
              type="submit"
              disabled={loading || invitationLoading || members.length >= 3}
              className="w-full sm:w-auto px-5 py-3 text-base rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2 bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-5 h-5" />
              <span>{members.length >= 3 ? 'Лимит' : 'Пригласить'}</span>
            </button>
          </form>
          {success && <div className="flex items-center gap-2 text-emerald-600 mt-4 text-sm"><CheckCircle className="w-4 h-4"/>{success}</div>}
          {(error || salonError) && <div className="flex items-center gap-2 text-rose-600 mt-4 text-sm"><AlertTriangle className="w-4 h-4"/>{error || salonError}</div>}
        </div>
        
        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold mb-4 pb-2 border-b border-slate-200">Ожидающие приглашения ({invitations.length})</h2>
            {invitations.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Нет активных приглашений.</p>
            ) : (
              <ul className="space-y-3">
                {invitations.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">{inv.email}</div>
                      <div className="text-sm text-slate-500 mt-1"><RoleIcon role={inv.role} /></div>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                      title="Отменить приглашение"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 pb-2 border-b border-slate-200">Текущие сотрудники ({members.length})</h2>
            {members.length === 0 ? (
              <p className="text-slate-500 text-center py-4">У вас пока нет сотрудников.</p>
            ) : (
              <ul className="space-y-4">
                {members.map((m, i) => {
                  // --- ИЗМЕНЕНИЕ: Проверяем, является ли этот сотрудник текущим пользователем ---
                  const isCurrentUser = currentUser?.userId === m.userId;

                  return (
                    <li key={m.userId} className="p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 hover:shadow-lg transition-all">
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-md">
                          {userDataMap[m.userId]?.avatarUrl ? (
                            <Image src={userDataMap[m.userId].avatarUrl!} alt="avatar" width={56} height={56} className="object-cover w-full h-full" />
                          ) : (
                            <InitialAvatar name={userDataMap[m.userId]?.name || ''} />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                            <span>{userDataMap[m.userId]?.name || 'Загрузка...'}</span>
                            {/* --- ИЗМЕНЕНИЕ: Добавляем значок "Это вы" --- */}
                            {isCurrentUser && (
                              <span className="text-xs font-medium bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                                Это вы
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-slate-500 break-all">{userDataMap[m.userId]?.email}</p>
                          <p className="text-xs text-slate-400 mt-1">Присоединился: {new Date(m.joinedAt).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="w-full sm:w-auto flex items-center gap-2 mt-2 sm:mt-0">
                          <select
                            className="flex-1 sm:w-40 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
                            value={m.role}
                            onChange={e => handleRoleChange(i, e.target.value as SalonRole)}
                            // --- ИЗМЕНЕНИЕ: Отключаем селект для самого себя ---
                            disabled={isCurrentUser}
                          >
                            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                          <button
                            onClick={() => handleRemove(i)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            title={isCurrentUser ? "Вы не можете удалить самого себя" : "Удалить сотрудника"}
                            // --- ИЗМЕНЕНИЕ: Отключаем кнопку удаления для самого себя ---
                            disabled={isCurrentUser}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}