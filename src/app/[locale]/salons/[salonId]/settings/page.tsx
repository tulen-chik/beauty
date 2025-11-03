'use client';

import { motion } from 'framer-motion';
import { 
  AlertCircle,
  Building2,
  CalendarOff,
  CheckCircle, 
  Crown, 
  Loader2, 
  Map, 
  Save,
  Shield,
  Trash2,
  UploadCloud,
  X,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ModalPortal } from '@/components/ui/ModalPortal';

import { useSalon } from '@/contexts/SalonContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUser } from '@/contexts/UserContext';

import type { Salon, SalonMember } from '@/types/database';
import type { SalonSubscription, SalonSubscriptionPlan } from '@/types/subscriptions';

// --- ИНТЕРФЕЙСЫ И ВЛОЖЕННЫЕ КОМПОНЕНТЫ ---

interface SalonSettings {
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

const MapSelector = ({ 
  onLocationSelect, 
  initialCoordinates 
}: { 
  onLocationSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  initialCoordinates?: { lat: number; lng: number };
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const t = useTranslations('salonCreation');

  useEffect(() => {
    // Логика инициализации Google Maps...
  }, [onLocationSelect, initialCoordinates, t]);

  if (mapError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">{mapError}</p>
        <p className="text-red-600 text-xs mt-1">{t('mapErrorHelp')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Map className="h-4 w-4" />
        <span>{t('mapInstructions')}</span>
      </div>
      <div 
        ref={mapRef} 
        className="w-full h-48 sm:h-64 rounded-lg border border-gray-300 touch-manipulation"
        style={{ minHeight: '192px' }}
      />
      <p className="text-xs text-gray-500">{t('instructions')}</p>
    </div>
  );
};


// --- ОСНОВНОЙ КОМПОНЕНТ СТРАНИЦЫ ---

export default function SalonSettingsPage() {
  const params = useParams();
  const salonId = params.salonId as string;
  const t = useTranslations('salonSettings');
  
  const { 
    fetchSalon, 
    updateSalon, 
    updateAvatar, 
    removeAvatar, 
    loading: salonLoading 
  } = useSalon();

  const { currentUser, loading: userLoading } = useUser();
  const { 
    getSalonSubscriptions, 
    getSubscriptionPlan, 
    getActiveSubscriptionPlans,
    createSubscription,
    loading: subscriptionLoading 
  } = useSubscription();
  
  const [salon, setSalon] = useState<Salon | null>(null);
  const [settings, setSettings] = useState<SalonSettings>({
    business: { name: '', email: '', phone: '', address: '', timezone: 'Europe/Moscow', currency: 'RUB', coordinates: undefined },
    notifications: { email: true, sms: false, push: true, reminderTime: 24 },
    security: { twoFactor: false, sessionTimeout: 30, passwordExpiry: 90 },
    integrations: { googleCalendar: false, telegramBot: false, whatsapp: false }
  });
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [subscriptions, setSubscriptions] = useState<(SalonSubscription & { planName?: string })[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SalonSubscriptionPlan[]>([]);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const salonInitials = useMemo(() => {
    const name = salon?.name || '';
    if (!name) return '';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || '').join('');
  }, [salon]);

  useEffect(() => {
    if (salonId && currentUser) {
      loadSalon();
      loadSubscriptions();
      loadAvailablePlans();
    }
  }, [salonId, currentUser]);

  const loadSalon = async () => {
    try {
      const salonData = await fetchSalon(salonId);
      if (salonData) {
        setSalon(salonData);
        if (salonData.settings) {
          setSettings(prev => ({
            ...prev,
            business: { ...prev.business, ...(salonData.settings?.business || {}), coordinates: salonData.coordinates },
            notifications: { ...prev.notifications, ...(salonData.settings?.notifications || {}) },
            security: { ...prev.security, ...(salonData.settings?.security || {}) },
            integrations: { ...prev.integrations, ...(salonData.settings?.integrations || {}) }
          }));
        }
        setSettings(prev => ({
          ...prev,
          business: {
            ...prev.business,
            name: salonData.name || '',
            address: salonData.address || '',
            phone: salonData.phone || '',
            email: salonData.settings?.business?.email || prev.business.email || '',
          }
        }));
      }
    } catch (err) {
      console.error('Error loading salon:', err);
      setError(t('error.loadFailed'));
    }
  };

  const loadSubscriptions = async () => {
    if (!salonId) return;
    try {
      const subs = await getSalonSubscriptions(salonId);
      const subsWithPlanNames = await Promise.all(
        subs.map(async (sub) => {
          const plan = await getSubscriptionPlan(sub.planId);
          return { ...sub, planName: plan?.name || 'Unknown Plan' };
        })
      );
      setSubscriptions(subsWithPlanNames);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError(t('error.loadSubscriptionsFailed'));
    }
  };

  const loadAvailablePlans = async () => {
    try {
      const plans = await getActiveSubscriptionPlans();
      setAvailablePlans(plans);
    } catch (err) {
      console.error('Error loading available plans:', err);
      setError(t('error.loadPlansFailed'));
    }
  };

  const handlePurchase = async (planId: string) => {
    if (!salonId) return;
    setSaving(true);
    try {
      const plan = availablePlans.find(p => p.id === planId);
      if (!plan) throw new Error('Selected plan not found');
      const newSubscriptionId = `${salonId}_${planId}_${Date.now()}`;
      await createSubscription(newSubscriptionId, {
        salonId,
        planId,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(), // Simplified for example
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
      });
      setIsPurchaseModalOpen(false);
      loadSubscriptions();
      setSaved(t('sections.subscription.purchaseSuccess'));
      setTimeout(() => setSaved(null), 3000);
    } catch (err) {
      console.error('Error purchasing subscription:', err);
      setError(t('error.purchaseFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSelect = (address: string, coordinates: { lat: number; lng: number }) => {
    setSettings(prev => ({ ...prev, business: { ...prev.business, address, coordinates } }));
  };

  const handleSave = async (section: keyof SalonSettings) => {
    setSaving(true);
    setError(null);
    try {
      if (section === 'business' && settings.business.email && !settings.business.email.includes('@')) {
        setError(t('error.invalidEmail'));
        setSaving(false);
        return;
      }
      const updatedSalonData = section === 'business'
        ? { name: settings.business.name, address: settings.business.address, phone: settings.business.phone, settings: { ...salon?.settings, business: settings.business } }
        : { settings: { ...salon?.settings, [section]: settings[section] } };
      
      const updated = await updateSalon(salonId, updatedSalonData);
      setSalon(updated);
      setSaved(t(`sections.${section}.saved`));
      setTimeout(() => setSaved(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(t('error.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof SalonSettings, key: string, value: any) => {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { setError(t('error.avatarSize')); return; }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError(t('error.avatarType')); return; }
      setError(null);
      setAvatarFile(file);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    }
  };

  const cancelAvatarChange = () => {
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setIsAvatarUploading(true);
    setError(null);
    try {
      const updatedSalon = await updateAvatar(salonId, avatarFile);
      setSalon(updatedSalon);
      setSaved(t('sections.business.avatarSaved'));
      setTimeout(() => setSaved(null), 3000);
      cancelAvatarChange();
    } catch (e: any) {
      setError(e.message || t('error.avatarUploadFailed'));
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!salon?.avatarUrl || !window.confirm(t('sections.business.confirmAvatarRemove'))) return;
    setIsAvatarUploading(true);
    setError(null);
    try {
      await removeAvatar(salonId);
      setSalon(prev => prev ? { ...prev, avatarUrl: '', avatarStoragePath: '' } : null);
      setSaved(t('sections.business.avatarRemoved'));
      setTimeout(() => setSaved(null), 3000);
    } catch (e: any) {
      setError(e.message || t('error.avatarRemoveFailed'));
    } finally {
      setIsAvatarUploading(false);
    }
  };

  // --- РЕНДЕРИНГ ---

  if (userLoading || salonLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-rose-600 mb-4" />
          <p className="text-gray-600">{t('loadingTitle')}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <ProtectedRoute><div></div></ProtectedRoute>;

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('notFound.title')}</h2>
          <p className="text-gray-600">{t('notFound.description')}</p>
        </div>
      </div>
    );
  }

  const userRole = salon.members.find((member: SalonMember) => member.userId === currentUser.userId)?.role;
  const canEditSettings = userRole === 'owner' || userRole === 'manager';

  if (!canEditSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('accessDenied.title')}</h2>
          <p className="text-gray-600">{t('accessDenied.description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{t('title')}</h1>
          <p className="text-sm sm:text-base text-gray-600">{t('subtitle')}</p>
        </motion.div>

        {saved && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium text-sm sm:text-base">{saved}</span>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium text-sm sm:text-base">{error}</span>
          </motion.div>
        )}

        <div className="space-y-6 sm:space-y-8">
          {/* --- Секция Подписки --- */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* ... Код секции подписок и модального окна ... */}
          </motion.div>

          {/* --- Секция Бизнес-информации --- */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-rose-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('sections.business.title')}</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-8">
              
              {/* --- БЛОК АВАТАРА --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t('sections.business.avatar')}</label>
                <div className="flex items-center gap-5">
                  <div className="group relative h-24 w-24 sm:h-28 sm:w-28 rounded-full ring-2 ring-rose-200 shadow-sm overflow-hidden">
                    {avatarPreviewUrl ? (
                      <Image src={avatarPreviewUrl} alt="Предпросмотр аватара" fill className="object-cover" />
                    ) : salon.avatarUrl ? (
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
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
                    {!avatarFile ? (
                      <>
                        <button onClick={() => fileInputRef.current?.click()} disabled={isAvatarUploading} className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">{t('sections.business.changeAvatar')}</button>
                        {salon.avatarUrl && <button onClick={handleAvatarRemove} disabled={isAvatarUploading} className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50">{t('sections.business.removeAvatar')}</button>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                         <button onClick={handleAvatarUpload} disabled={isAvatarUploading} className="px-3 py-1.5 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-rose-400">{t('sections.business.saveAvatar')}</button>
                         <button onClick={cancelAvatarChange} disabled={isAvatarUploading} className="px-3 py-1.5 text-sm font-medium bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{t('sections.business.avatarHint')}</p>
                  </div>
                </div>
              </div>

              {/* --- Остальные поля формы --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('sections.business.name')}</label>
                  <input type="text" value={settings.business.name} onChange={(e) => updateSetting('business', 'name', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('sections.business.email')} <span className="text-gray-500 text-xs">({t('sections.business.optional')})</span></label>
                  <input type="email" value={settings.business.email} onChange={(e) => updateSetting('business', 'email', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base" placeholder={t('sections.business.emailPlaceholder')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('sections.business.phone')} <span className="text-gray-500 text-xs">({t('sections.business.optional')})</span></label>
                  <input type="tel" value={settings.business.phone} onChange={(e) => updateSetting('business', 'phone', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base" placeholder={t('sections.business.phonePlaceholder')} />
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('sections.business.address')}</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={settings.business.address} onChange={(e) => updateSetting('business', 'address', e.target.value)} className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base" placeholder="Введите адрес или выберите на карте" />
                    <button type="button" onClick={() => setShowMap(!showMap)} className="px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 font-medium transition-colors">
                      <Map className="h-4 w-4" />
                      <span>{showMap ? 'Скрыть карту' : 'Показать карту'}</span>
                    </button>
                  </div>
                </div>
                {showMap && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-4"><MapSelector onLocationSelect={handleLocationSelect} initialCoordinates={settings.business.coordinates} /></motion.div>}
              </div>
              
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button onClick={() => handleSave('business')} disabled={saving || isAvatarUploading} className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  <span>{t('sections.business.save')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}