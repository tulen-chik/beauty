"use client"

import { Building2, Save, Loader2, Map } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

type SalonSettings = {
  business: {
    name: string;
    email: string;
    phone: string;
    address: string;
    timezone: string;
    currency: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    reminderTime: number;
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
  };
  integrations: {
    googleCalendar: boolean;
    telegramBot: boolean;
    whatsapp: boolean;
  };
}

type BusinessSettingsProps = {
  settings: SalonSettings
  salon: any
  salonInitials: string
  avatarFile: File | null
  avatarPreviewUrl: string | null
  isAvatarUploading: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  loading: boolean
  t: any
  onUpdateSetting: (section: keyof SalonSettings, key: string, value: any) => void
  onSave: (section: keyof SalonSettings) => Promise<void>
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onAvatarUpload: () => void
  onAvatarRemove: () => void
  onCancelAvatarChange: () => void
  onShowMap: () => void
  showMap: boolean
  MapSelector?: React.ComponentType<any>
  onLocationSelect: (address: string, coordinates: { lat: number; lng: number }) => void
}

export default function BusinessSettingsSection({
  settings,
  salon,
  salonInitials,
  avatarFile,
  avatarPreviewUrl,
  isAvatarUploading,
  fileInputRef,
  loading,
  t,
  onUpdateSetting,
  onSave,
  onFileChange,
  onAvatarUpload,
  onAvatarRemove,
  onCancelAvatarChange,
  onShowMap,
  showMap,
  MapSelector,
  onLocationSelect
}: BusinessSettingsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-rose-600" />
          <h2 className="text-lg font-semibold text-gray-900">{t('sections.business.title')}</h2>
        </div>
      </div>
      <div className="p-4 sm:p-6 space-y-8">
        {/* Avatar Block */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">{t('sections.business.avatar')}</label>
          <div className="flex items-center gap-5">
            <div className="group relative h-24 w-24 sm:h-28 sm:w-28 rounded-full ring-2 ring-rose-200 shadow-sm overflow-hidden">
              {avatarPreviewUrl ? (
                <Image src={avatarPreviewUrl} alt="Предпросмотр аватара" fill className="object-cover" />
              ) : salon?.avatarUrl ? (
                <Image src={salon.avatarUrl} alt="Аватар салона" fill className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-rose-100">
                  {salonInitials ? <span className="text-3xl font-semibold text-rose-600">{salonInitials}</span> : <Building2 className="h-10 w-10 text-rose-300" />}
                </div>
              )}
              <button type="button" onClick={() => !isAvatarUploading && fileInputRef.current?.click()} disabled={isAvatarUploading} className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40 text-white text-xs font-medium transition-opacity" aria-label="Изменить аватар">Изменить</button>
              {isAvatarUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/60"><div className="h-6 w-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" /></div>}
            </div>
            <div className="flex flex-col gap-2">
              <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
              {!avatarFile ? (
                <>
                  <button onClick={() => fileInputRef.current?.click()} disabled={isAvatarUploading} className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">{t('sections.business.changeAvatar')}</button>
                  {salon?.avatarUrl && <button onClick={onAvatarRemove} disabled={isAvatarUploading} className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50">{t('sections.business.removeAvatar')}</button>}
                </>
              ) : (
                <div className="flex items-center gap-2">
                   <button onClick={onAvatarUpload} disabled={isAvatarUploading} className="px-3 py-1.5 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-rose-400">{t('sections.business.saveAvatar')}</button>
                   <button onClick={onCancelAvatarChange} disabled={isAvatarUploading} className="px-3 py-1.5 text-sm font-medium bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">{t('sections.business.avatarHint')}</p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('sections.business.name')}</label>
            <input 
              type="text" 
              value={settings.business.name} 
              onChange={(e) => onUpdateSetting('business', 'name', e.target.value)} 
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('sections.business.email')} <span className="text-gray-500 text-xs">({t('sections.business.optional')})</span></label>
            <input 
              type="email" 
              value={settings.business.email} 
              onChange={(e) => onUpdateSetting('business', 'email', e.target.value)} 
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base" 
              placeholder={t('sections.business.emailPlaceholder')} 
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('sections.business.phone')} <span className="text-gray-500 text-xs">({t('sections.business.optional')})</span></label>
            <input 
              type="tel" 
              value={settings.business.phone} 
              onChange={(e) => onUpdateSetting('business', 'phone', e.target.value)} 
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base" 
              placeholder={t('sections.business.phonePlaceholder')} 
            />
          </div>
        </div>
        
        {/* Address */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('sections.business.address')}</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                value={settings.business.address} 
                onChange={(e) => onUpdateSetting('business', 'address', e.target.value)} 
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base" 
                placeholder="Введите адрес или выберите на карте" 
              />
              <button 
                type="button" 
                onClick={onShowMap} 
                className="px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <Map className="h-4 w-4" />
                <span>{showMap ? 'Скрыть карту' : 'Показать карту'}</span>
              </button>
            </div>
          </div>
          {showMap && MapSelector && (
            <div className="pt-4">
              <MapSelector onLocationSelect={onLocationSelect} initialCoordinates={settings.business.coordinates} />
            </div>
          )}
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button 
            onClick={() => onSave('business')} 
            disabled={loading || isAvatarUploading} 
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            <span>{t('sections.business.save')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
