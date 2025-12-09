"use client"

import { MessageCircle, Smartphone, X, CheckCircle, AlertCircle } from "lucide-react"

type AppBookingInfoModalProps = {
  isOpen: boolean
  onClose: () => void
  t: any
}

export default function AppBookingInfoModal({ isOpen, onClose, t }: AppBookingInfoModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-rose-600" />
            {t("appBookingInfo.title")}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {/* Enabled State */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">
                  {t("appBookingInfo.enabled.title")}
                </h3>
                <p className="text-sm text-green-800 leading-relaxed">
                  {t("appBookingInfo.enabled.description")}
                </p>
              </div>
            </div>
          </div>

          {/* Disabled State */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  {t("appBookingInfo.disabled.title")}
                </h3>
                <p className="text-sm text-amber-800 leading-relaxed mb-3">
                  {t("appBookingInfo.disabled.description")}
                </p>
                <div className="bg-white/70 border border-amber-300 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-700">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {t("appBookingInfo.disabled.chatNote")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold text-slate-900 mb-2">
              {t("appBookingInfo.recommendation.title")}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {t("appBookingInfo.recommendation.description")}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-all active:scale-95"
          >
            {t("appBookingInfo.button")}
          </button>
        </div>
      </div>
    </div>
  )
}
