"use client"

import { Building2, Check, X } from "lucide-react";
import { Salon, SalonInvitation } from "@/types/database";

type EnrichedInvitation = SalonInvitation & { salon: Salon | null };

interface InvitationsProps {
  enrichedInvitations: EnrichedInvitation[];
  onInvitationResponse: (invitationId: string, accept: boolean) => void;
  tRoles: (key: string) => string;
}

const getRoleLabel = (role: string, t: (key: string) => string) => {
  const roles: Record<string, string> = {
    owner: t('roles.owner'),
    manager: t('roles.manager'),
    employee: t('roles.employee'),
    viewer: t('roles.viewer')
  };
  return roles[role] || role;
};

export default function Invitations({ enrichedInvitations, onInvitationResponse, tRoles }: InvitationsProps) {
  if (enrichedInvitations.length === 0) return null;

  return (
    <div className="mb-6 animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="bg-gradient-to-br from-white to-rose-50/50 border border-rose-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-rose-100 bg-white/50 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <div className="p-1.5 bg-rose-100 rounded-lg">
              <Building2 className="h-5 w-5 text-rose-600" />
            </div>
            Приглашения в салоны
            <span className="ml-2 px-2 py-0.5 bg-rose-600 text-white text-xs rounded-full font-bold">
              {enrichedInvitations.length}
            </span>
          </h2>
        </div>
        
        <div className="divide-y divide-rose-50">
          {enrichedInvitations.map((invitation) => (
            <div key={invitation.id} className="p-6 hover:bg-white transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {invitation.salon ? invitation.salon.name : 'Информация о салоне недоступна'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>Вам предложена роль:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {getRoleLabel(invitation.role, tRoles)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => onInvitationResponse(invitation.id, true)}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all active:scale-95 font-medium text-sm"
                  >
                    <Check className="h-4 w-4" />
                    Принять
                  </button>
                  <button
                    onClick={() => onInvitationResponse(invitation.id, false)}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 transition-all active:scale-95 font-medium text-sm"
                  >
                    <X className="h-4 w-4" />
                    Отклонить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}