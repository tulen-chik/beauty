"use client";
import { useEffect, useState } from "react";
import { useSalon } from "@/contexts/SalonContext";
import type { SalonMember, SalonRole } from "@/types/database";
import { useSalonInvitation } from "@/contexts/SalonInvitationContext";

const ROLES: { value: SalonRole; label: string }[] = [
  { value: "owner", label: "Владелец" },
  { value: "manager", label: "Менеджер" },
  { value: "employee", label: "Сотрудник" },
  { value: "viewer", label: "Наблюдатель" },
];

export default function SalonStaffPage({ params }: { params: { salonId: string } }) {
  const { salonId } = params;
  const { fetchSalon, updateSalon, loading, error } = useSalon();
  const { getInvitationsBySalon, createInvitation, deleteInvitation, loading: invitationLoading } = useSalonInvitation();
  const [members, setMembers] = useState<SalonMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SalonRole>("employee");
  const [success, setSuccess] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);

  useEffect(() => {
    fetchSalon(salonId).then((salon) => {
      setMembers(salon?.members || []);
    });
    getInvitationsBySalon(salonId).then(setInvitations);
  }, [salonId, fetchSalon, getInvitationsBySalon]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const invitationId = `${salonId}-${email}`;
    await createInvitation(invitationId, {
      salonId,
      email,
      role,
      invitedBy: "admin", // можно заменить на текущего пользователя
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    setEmail("");
    setRole("employee");
    setSuccess(true);
    getInvitationsBySalon(salonId).then(setInvitations);
    setTimeout(() => setSuccess(false), 1200);
  };

  const handleCancelInvite = async (invitationId: string) => {
    await deleteInvitation(invitationId);
    getInvitationsBySalon(salonId).then(setInvitations);
  };

  const handleRoleChange = async (idx: number, newRole: SalonRole) => {
    const updated = members.map((m, i) => i === idx ? { ...m, role: newRole } : m);
    await updateSalon(salonId, { members: updated });
    setMembers(updated);
  };

  const handleRemove = async (idx: number) => {
    const updated = members.filter((_, i) => i !== idx);
    await updateSalon(salonId, { members: updated });
    setMembers(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Сотрудники салона</h1>
        <form className="flex gap-4 mb-8" onSubmit={handleInvite}>
          <input
            type="email"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-rose-500 focus:border-rose-500"
            placeholder="Email пользователя"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <select
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-rose-500 focus:border-rose-500"
            value={role}
            onChange={e => setRole(e.target.value as SalonRole)}
          >
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button
            type="submit"
            disabled={loading || invitationLoading}
            className="px-6 py-2 bg-rose-600 text-white rounded-xl font-semibold shadow hover:bg-rose-700 transition-all"
          >
            Пригласить
          </button>
        </form>
        {success && <div className="text-green-600 mb-4">Приглашение отправлено!</div>}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <h2 className="text-lg font-bold mb-2 mt-6">Ожидающие приглашения</h2>
        <ul className="divide-y divide-gray-100 mb-8">
          {invitations.length === 0 && <li className="text-gray-500 text-center py-2">Нет приглашений</li>}
          {invitations.map((inv) => (
            <li key={inv.id} className="py-2 flex items-center justify-between">
              <div>
                <span className="font-semibold">Email: {inv.email}</span>
                <span className="ml-4 text-sm text-gray-600">Роль: {ROLES.find(r => r.value === inv.role)?.label}</span>
                <span className="ml-4 text-xs text-gray-400">Статус: {inv.status}</span>
              </div>
              <button
                onClick={() => handleCancelInvite(inv.id)}
                className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
              >
                Отменить
              </button>
            </li>
          ))}
        </ul>
        <h2 className="text-lg font-bold mb-2 mt-6">Текущие сотрудники</h2>
        <ul className="divide-y divide-gray-100">
          {members.map((m, i) => (
            <li key={m.userId} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="font-semibold text-lg text-gray-900">ID: {m.userId}</div>
                <div className="text-sm text-gray-600">Роль: 
                  <select
                    className="ml-2 px-2 py-1 border border-gray-200 rounded"
                    value={m.role}
                    onChange={e => handleRoleChange(i, e.target.value as SalonRole)}
                  >
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="text-xs text-gray-400">Присоединился: {new Date(m.joinedAt).toLocaleDateString()}</div>
              </div>
              <button
                onClick={() => handleRemove(i)}
                className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                Удалить
              </button>
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