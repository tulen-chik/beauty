"use client"

import { Shield } from "lucide-react"

import ChatButton from "@/components/ChatButton"

type BookingActionsProps = {
  currentUser: any
  salon: any
  serviceId: string
  submitting: boolean
  t: any
  onCancel: () => void
  onSubmit: () => void
}

export default function BookingActions({
  currentUser,
  salon,
  serviceId,
  submitting,
  t,
  onCancel,
  onSubmit
}: BookingActionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-3 pt-2">
        {currentUser && salon && (
          <ChatButton
            salonId={salon.id}
            customerUserId={currentUser.userId}
            customerName={currentUser.displayName || ""}
            serviceId={serviceId}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
            variant="button"
          />
        )}
        <button
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
          disabled={submitting}
        >
          {t('buttons.cancel')}
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="px-5 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t('buttons.submitting') : t('buttons.bookNow')}
        </button>
      </div>

      <div className="pt-2 text-xs text-gray-500 flex items-center gap-2">
        <Shield className="w-3 h-3" />
        <span>{t('messages.privacyNotice')}</span>
      </div>
    </div>
  )
}
