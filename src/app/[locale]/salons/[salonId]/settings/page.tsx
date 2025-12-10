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
import { useToast } from '@/contexts';

import SettingsPageSkeleton from './components/SettingsPageSkeleton';
import BusinessSettingsSection from './components/BusinessSettingsSection';
import SubscriptionSection from './components/SubscriptionSection';
import BusinessSettingsSkeleton from './components/BusinessSettingsSkeleton';
import SubscriptionSkeleton from './components/SubscriptionSkeleton';

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

import type { Salon, SalonMember } from '@/types/database';
import type { SalonSubscription, SalonSubscriptionPlan } from '@/types/subscriptions';

// --- ИНТЕРФЕЙСЫ И ВЛОЖЕННЫЕ КОМПОНЕНТЫ ---

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
    getSalonAvatar,
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
  const { success, error: showError, dismissAll } = useToast();
  
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isSalonLoading, setIsSalonLoading] = useState(false);
  const [isSubscriptionsLoading, setIsSubscriptionsLoading] = useState(false);
  const [isPlansLoading, setIsPlansLoading] = useState(false);
  const [settings, setSettings] = useState<SalonSettings>({
    business: { name: '', email: '', phone: '', address: '', timezone: 'Europe/Moscow', currency: 'RUB', coordinates: undefined },
    notifications: { email: true, sms: false, push: true, reminderTime: 24 },
    security: { twoFactor: false, sessionTimeout: 30, passwordExpiry: 90 },
    integrations: { googleCalendar: false, telegramBot: false, whatsapp: false }
  });
  
  const [saving, setSaving] = useState(false);
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
      // Запускаем загрузку последовательно с задержкой для инкрементального эффекта
      setTimeout(() => loadSalon(), 0);
      setTimeout(() => loadSubscriptions(), 300);
      setTimeout(() => loadAvailablePlans(), 600);
    }
  }, [salonId, currentUser]);

  const loadSalon = async () => {
    setIsSalonLoading(true);
    try {
      const salonData = await fetchSalon(salonId);
      if (salonData) {
        const avatarUrl = await getSalonAvatar(salonId);
        salonData.avatarUrl = avatarUrl?.url;
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
      showError('Не удалось загрузить данные салона. Попробуйте обновить страницу.');
    } finally {
      setIsSalonLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    if (!salonId) return;
    setIsSubscriptionsLoading(true);
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
      showError('Не удалось загрузить подписки. Попробуйте обновить страницу.');
    } finally {
      setIsSubscriptionsLoading(false);
    }
  };

  const loadAvailablePlans = async () => {
    setIsPlansLoading(true);
    try {
      const plans = await getActiveSubscriptionPlans();
      setAvailablePlans(plans);
    } catch (err) {
      console.error('Error loading available plans:', err);
      showError('Не удалось загрузить доступные планы. Попробуйте обновить страницу.');
    } finally {
      setIsPlansLoading(false);
    }
  };

  const handlePurchase = async (planId: string) => {
    if (!salonId) return;
    setSaving(true);
    dismissAll();
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
      success('Подписка успешно оформлена');
    } catch (err) {
      console.error('Error purchasing subscription:', err);
      showError('Не удалось оформить подписку. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSelect = (address: string, coordinates: { lat: number; lng: number }) => {
    setSettings(prev => ({ ...prev, business: { ...prev.business, address, coordinates } }));
  };

  const handleSave = async (section: keyof SalonSettings) => {
    setSaving(true);
    dismissAll();
    try {
      if (section === 'business' && settings.business.email && !settings.business.email.includes('@')) {
        showError('Введите корректный email адрес');
        setSaving(false);
        return;
      }
      const updatedSalonData = section === 'business'
        ? { name: settings.business.name, address: settings.business.address, phone: settings.business.phone, settings: { ...salon?.settings, business: settings.business } }
        : { settings: { ...salon?.settings, [section]: settings[section] } };
      
      const updated = await updateSalon(salonId, updatedSalonData);
      setSalon(updated);
      success('Настройки успешно сохранены');
    } catch (err) {
      console.error('Error saving settings:', err);
      showError('Не удалось сохранить настройки. Попробуйте еще раз.');
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
      if (file.size > 2 * 1024 * 1024) { showError('Размер файла не должен превышать 2 МБ'); return; }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { showError('Поддерживаемые форматы: JPEG, PNG, WebP'); return; }
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
    dismissAll();
    try {
      const updatedSalon = await updateAvatar(salonId, avatarFile);
      updatedSalon.avatarUrl = (await getSalonAvatar(salonId))?.url;
      setSalon(updatedSalon);
      success('Аватар успешно загружен');
      cancelAvatarChange();
    } catch (e: any) {
      console.error('Error uploading avatar:', e);
      showError(e.message || 'Не удалось загрузить аватар. Попробуйте еще раз.');
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!salon?.avatarUrl || !window.confirm('Вы уверены, что хотите удалить аватар?')) return;
    setIsAvatarUploading(true);
    dismissAll();
    try {
      await removeAvatar(salonId);
      setSalon(prev => prev ? { ...prev, avatarUrl: '', avatarStoragePath: '' } : null);
      success('Аватар успешно удален');
    } catch (e: any) {
      console.error('Error removing avatar:', e);
      showError(e.message || 'Не удалось удалить аватар. Попробуйте еще раз.');
    } finally {
      setIsAvatarUploading(false);
    }
  };

  // --- РЕНДЕРИНГ ---

  if (userLoading || isSalonLoading || (!isSalonLoading && !salon)) {
    return <SettingsPageSkeleton />;
  }

  if (!currentUser) return <ProtectedRoute><div></div></ProtectedRoute>;

  if (!isSalonLoading && !salon) {
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

  const userRole = salon?.members?.find((member: SalonMember) => member.userId === currentUser.userId)?.role;
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

        <div className="space-y-6 sm:space-y-8">
          {/* --- Секция Подписки --- */}
          {/* {isSubscriptionsLoading ? (
            <SubscriptionSkeleton />
          ) : (
            <SubscriptionSection
              subscriptions={subscriptions}
              availablePlans={availablePlans}
              loading={isSubscriptionsLoading}
              saving={saving}
              error={error}
              success={saved}
              t={t}
              onPurchase={handlePurchase}
              onOpenModal={(planId) => {
                setSelectedPlanId(planId);
                setIsPurchaseModalOpen(true);
              }}
              onCloseModal={() => {
                setIsPurchaseModalOpen(false);
                setSelectedPlanId(null);
              }}
              isModalOpen={isPurchaseModalOpen}
              selectedPlanId={selectedPlanId}
            />
          )} */}

          {/* --- Секция Бизнес-информации --- */}
          {isSalonLoading ? (
            <BusinessSettingsSkeleton />
          ) : (
            <BusinessSettingsSection
              settings={settings}
              salon={salon}
              salonInitials={salonInitials}
              avatarFile={avatarFile}
              avatarPreviewUrl={avatarPreviewUrl}
              isAvatarUploading={isAvatarUploading}
              fileInputRef={fileInputRef}
              loading={saving}
              t={t}
              onUpdateSetting={updateSetting}
              onSave={handleSave}
              onFileChange={handleFileChange}
              onAvatarUpload={handleAvatarUpload}
              onAvatarRemove={handleAvatarRemove}
              onCancelAvatarChange={cancelAvatarChange}
              onShowMap={() => setShowMap(!showMap)}
              showMap={showMap}
              MapSelector={MapSelector}
              onLocationSelect={handleLocationSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}