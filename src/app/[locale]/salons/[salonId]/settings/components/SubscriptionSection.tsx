"use client"

import { Crown, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"

type SubscriptionSectionProps = {
  subscriptions: any[]
  availablePlans: any[]
  loading: boolean
  saving: boolean
  error: string | null
  success: string | null
  t: any
  onPurchase: (planId: string) => void
  onOpenModal: (planId: string) => void
  onCloseModal: () => void
  isModalOpen: boolean
  selectedPlanId: string | null
}

export default function SubscriptionSection({
  subscriptions,
  availablePlans,
  loading,
  saving,
  error,
  success,
  t,
  onPurchase,
  onOpenModal,
  onCloseModal,
  isModalOpen,
  selectedPlanId
}: SubscriptionSectionProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-gray-300" />
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-3"></div>
                <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5 text-rose-600" />
          <h2 className="text-lg font-semibold text-gray-900">{t('sections.subscription.title')}</h2>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Current Subscriptions */}
        {subscriptions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{t('sections.subscription.current')}</h3>
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{sub.planName}</h4>
                      <p className="text-sm text-gray-600">
                        {t('sections.subscription.status')}: <span className="font-medium">{sub.status}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('sections.subscription.period')}: {new Date(sub.currentPeriodStart).toLocaleDateString()} - {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {t('sections.subscription.active')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Plans */}
        {availablePlans.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">{t('sections.subscription.available')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePlans.map((plan) => (
                <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:border-rose-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{plan.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">${plan.price}</div>
                      <div className="text-xs text-gray-500">/{plan.interval}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenModal(plan.id)}
                    className="w-full py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium text-sm"
                  >
                    {t('sections.subscription.upgrade')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purchase Modal */}
        {isModalOpen && selectedPlanId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('sections.subscription.confirmPurchase')}</h3>
              {(() => {
                const plan = availablePlans.find(p => p.id === selectedPlanId);
                return plan ? (
                  <div className="mb-6">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-900">{plan.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                      <div className="mt-3 text-2xl font-bold text-gray-900">${plan.price} <span className="text-sm text-gray-500">/{plan.interval}</span></div>
                    </div>
                  </div>
                ) : null;
              })()}
              <div className="flex gap-3">
                <button
                  onClick={onCloseModal}
                  className="flex-1 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => selectedPlanId && onPurchase(selectedPlanId)}
                  disabled={saving}
                  className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('sections.subscription.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
