"use client";
import { useEffect, useState } from "react";

import { useSalon } from "@/contexts/SalonContext";
import { useSalonInvitation } from "@/contexts/SalonInvitationContext";
import { useUser } from "@/contexts/UserContext";

import type { SalonMember, SalonRole, User } from "@/types/database";

const ROLES: { value: SalonRole; label: string }[] = [
  { value: "owner", label: "Владелец" },
  { value: "manager", label: "Менеджер" },
  { value: "employee", label: "Сотрудник" },
  { value: "viewer", label: "Наблюдатель" },
];

export default function SalonStaffPage({ params }: { params: { salonId: string } }) {
  const { salonId } = params;
  const { fetchSalon, updateSalon, loading, error: salonError } = useSalon();
  const { getInvitationsBySalon, createInvitation, deleteInvitation, loading: invitationLoading } = useSalonInvitation();
  const { getUserById } = useUser();
  const [members, setMembers] = useState<SalonMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SalonRole>("employee");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [invitations, setInvitations] = useState<any[]>([]);
  const [userDataMap, setUserDataMap] = useState<Record<string, {name: string, email: string}>>({});

  useEffect(() => {
    const fetchData = async () => {
      const salon = await fetchSalon(salonId);
      if (salon?.members) {
        setMembers(salon.members);
        
        // Fetch user data for each member
        const userPromises = salon.members.map(member => 
          getUserById(member.userId).then(user => 
            user ? { ...user, id: member.userId } : null
          )
        );
        
        const users = (await Promise.all(userPromises)).filter(Boolean) as (User & { id: string })[];
        const userMap = users.reduce((acc, user) => ({
          ...acc,
          [user.id]: {
            name: user.displayName || user.email?.split('@')[0] || 'Пользователь',
            email: user.email || ''
          }
        }), {} as Record<string, {name: string, email: string}>);
        
        setUserDataMap(userMap);
      } else {
        setMembers([]);
      }
    };
    
    fetchData();
    getInvitationsBySalon(salonId).then(setInvitations);
  }, [salonId, fetchSalon, getInvitationsBySalon, getUserById]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Check if we've reached the maximum number of employees (3)
    if (members.length >= 3) {
      setError("Максимальное количество сотрудников - 3");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    const invitationId = `${salonId}`;
    try {
      await createInvitation(invitationId, {
        salonId,
        email,
        role,
        invitedBy: "admin",
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      setEmail("");
      setRole("employee");
      setSuccess(true);
      getInvitationsBySalon(salonId).then(setInvitations);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setError(error.message || "Ошибка при отправке приглашения");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    await deleteInvitation(invitationId);
    getInvitationsBySalon(salonId).then(setInvitations);
  };

  const handleRoleChange = async (idx: number, newRole: SalonRole) => {
    try {
      const updated = members.map((m, i) => i === idx ? { ...m, role: newRole } : m);
      await updateSalon(salonId, { members: updated });
      setMembers(updated);
    } catch (error: any) {
      setError(error.message || "Ошибка при изменении роли");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleRemove = async (idx: number) => {
    try {
      const updated = members.filter((_, i) => i !== idx);
      await updateSalon(salonId, { members: updated });
      setMembers(updated);
    } catch (error: any) {
      setError(error.message || "Ошибка при удалении сотрудника");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-3 sm:px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white p-4 sm:p-6 md:p-8 mx-2 sm:mx-4">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Сотрудники салона</h1>
        <div className="mb-4 text-sm text-gray-600">
          {members.length}/3 сотрудников (максимум)
        </div>
        <form className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8" onSubmit={handleInvite}>
          <div className="flex-1">
            <input
              type="email"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              placeholder="Email пользователя"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <select
            className="w-full sm:w-auto px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            value={role}
            onChange={e => setRole(e.target.value as SalonRole)}
          >
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button
            type="submit"
            disabled={loading || invitationLoading || members.length >= 3}
            className={`w-full sm:w-auto px-6 py-3 text-base rounded-xl font-semibold shadow transition-all ${
              members.length >= 3 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800'
            }`}
            title={members.length >= 3 ? 'Достигнуто максимальное количество сотрудников' : ''}
          >
            {members.length >= 3 ? 'Лимит' : 'Пригласить'}
          </button>
        </form>
        {success && <div className="text-green-600 mb-4 text-sm sm:text-base">Приглашение отправлено!</div>}
        {(error || salonError) && <div className="text-red-500 mb-4 text-sm sm:text-base">{error || salonError}</div>}
        
        <h2 className="text-lg font-bold mb-3 mt-6">Ожидающие приглашения</h2>
        <ul className="divide-y divide-gray-100 mb-8">
          {invitations.length === 0 && (
            <li className="text-gray-500 text-center py-3 text-sm sm:text-base">Нет приглашений</li>
          )}
          {invitations.map((inv) => (
            <li key={inv.id} className="py-3 sm:py-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1">
                  <div className="font-semibold text-sm sm:text-base">{inv.email}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs sm:text-sm text-gray-600">Роль: {ROLES.find(r => r.value === inv.role)?.label}</span>
                    <span className="text-xs text-gray-400">Статус: {inv.status}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelInvite(inv.id)}
                  className="mt-1 sm:mt-0 px-3 py-2 sm:py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors font-medium active:bg-red-100"
                >
                  Отменить
                </button>
              </div>
            </li>
          ))}
        </ul>
        <h2 className="text-lg font-bold mb-3 mt-6">Текущие сотрудники</h2>
        <ul className="divide-y divide-gray-100">
          {members.map((m, i) => (
            <li key={m.userId} className="py-4 sm:py-3">
              <div className="flex flex-col gap-3">
                <div>
                  <div className="font-semibold text-base sm:text-lg text-gray-900">
                    {userDataMap[m.userId]?.name || 'Пользователь'}
                  </div>
                  {userDataMap[m.userId]?.email && (
                    <div className="text-sm text-gray-500 mt-1 break-all">{userDataMap[m.userId].email}</div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <label className="text-sm text-gray-600 block mb-1">Роль:</label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      value={m.role}
                      onChange={e => handleRoleChange(i, e.target.value as SalonRole)}
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  
                  <div className="mt-2 sm:mt-0">
                    <label className="text-sm text-gray-400 block mb-1">Присоединился:</label>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => handleRemove(i)}
                    className="w-full sm:w-auto px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 rounded-xl transition-colors font-medium text-sm"
                  >
                    Удалить сотрудника
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {!loading && members.length === 0 && (
          <div className="text-center text-gray-500 mt-8">Нет сотрудников.</div>
        )}
      </div>
    </div>
  );
} 