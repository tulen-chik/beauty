'use client';

import {motion } from 'framer-motion';
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
  X,
  Zap} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef,useState } from 'react';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ModalPortal } from '@/components/ui/ModalPortal';

import { useSalon } from '@/contexts/SalonContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUser } from '@/contexts/UserContext';

import type { Salon, SalonMember } from '@/types/database';
import type { SalonSubscription, SalonSubscriptionPlan } from '@/types/subscriptions';

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

// Google Maps component (без изменений)
const MapSelector = ({ 
  onLocationSelect, 
  initialCoordinates 
}: { 
  onLocationSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  initialCoordinates?: { lat: number; lng: number };
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const t = useTranslations('salonCreation');

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google?.maps) return Promise.resolve();
      
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || apiKey === 'your_google_maps_api_key_here') {
          console.error('Invalid or missing Google Maps API key');
          return;
        }
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps'));
        document.head.appendChild(script);
      });
    };

    const initializeMap = async () => {
      try {
        await loadGoogleMaps();
        
        if (!mapRef.current || !window.google?.maps) {
          setMapError(t('error'));
          return;
        }

        const initialLat = initialCoordinates?.lat || 55.7558;
        const initialLng = initialCoordinates?.lng || 37.6176;

        const newMap = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: 13,
          mapTypeId: (window as any).google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi.business',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          gestureHandling: 'greedy',
          zoomControl: true,
          zoomControlOptions: {
            position: (window as any).google.maps.ControlPosition.RIGHT_TOP
          },
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        });

        const newMarker = new (window as any).google.maps.Marker({
          position: { lat: initialLat, lng: initialLng },
          map: newMap,
          draggable: true,
          title: 'Местоположение салона'
        });

        setMap(newMap);
        setMarker(newMarker);

        newMarker.addListener('dragend', async () => {
          const position = newMarker.getPosition();
          if (position) {
            const geocoder = new (window as any).google.maps.Geocoder();
            try {
              const result = await geocoder.geocode({ location: position });
              if (result.results[0]) {
                const address = result.results[0].formatted_address;
                onLocationSelect(address, { lat: position.lat(), lng: position.lng() });
              }
            } catch (error) {
              console.error('Geocoding error:', error);
            }
          }
        });

        newMap.addListener('click', async (event: any) => {
          if (event.latLng) {
            newMarker.setPosition(event.latLng);
            const geocoder = new (window as any).google.maps.Geocoder();
            try {
              const result = await geocoder.geocode({ location: event.latLng });
              if (result.results[0]) {
                const address = result.results[0].formatted_address;
                onLocationSelect(address, { lat: event.latLng.lat(), lng: event.latLng.lng() });
              }
            } catch (error) {
              console.error('Geocoding error:', error);
            }
          }
        });

      } catch (error) {
        console.error('Map initialization error:', error);
        setMapError(t('error'));
      }
    };

    initializeMap();

    return () => {
      if (marker) marker.setMap(null);
    };
  }, [onLocationSelect, initialCoordinates, t]);

  if (mapError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">{mapError}</p>
        <p className="text-red-600 text-xs mt-1">
          {t('mapErrorHelp')}
        </p>
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
      <p className="text-xs text-gray-500">
        {t('instructions')}
      </p>
    </div>
  );
};


export default function SalonSettingsPage() {
  const params = useParams();
  const salonId = params.salonId as string;
  const locale = params.locale as string;
  const t = useTranslations('salonSettings');
  const tCommon = useTranslations('common');
  
  const { fetchSalon, updateSalon, loading: salonLoading } = useSalon();
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
    business: {
      name: '',
      email: '',
      phone: '',
      address: '',
      timezone: 'Europe/Moscow',
      currency: 'RUB',
      coordinates: undefined
    },
    notifications: {
      email: true,
      sms: false,
      push: true,
      reminderTime: 24
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      passwordExpiry: 90
    },
    integrations: {
      googleCalendar: false,
      telegramBot: false,
      whatsapp: false
    }
  });
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [subscriptions, setSubscriptions] = useState<(SalonSubscription & { planName?: string })[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SalonSubscriptionPlan[]>([]);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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
            business: {
              ...prev.business,
              ...(salonData.settings?.business || {}),
              coordinates: salonData.settings?.business?.coordinates
            },
            notifications: {
              ...prev.notifications,
              ...(salonData.settings?.notifications || {})
            },
            security: {
              ...prev.security,
              ...(salonData.settings?.security || {})
            },
            integrations: {
              ...prev.integrations,
              ...(salonData.settings?.integrations || {})
            }
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
            timezone: prev.business.timezone,
            currency: prev.business.currency,
            coordinates: prev.business.coordinates
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

      const startDate = new Date();
      const endDate = new Date(startDate);
      if (plan.billingPeriod === 'monthly') {
        endDate.setMonth(startDate.getMonth() + 1);
      } else if (plan.billingPeriod === 'yearly') {
        endDate.setFullYear(startDate.getFullYear() + 1);
      }

      const newSubscription: Omit<SalonSubscription, 'id'> = {
        salonId,
        planId,
        currentPeriodStart: startDate.toISOString(),
        currentPeriodEnd: endDate.toISOString(),
        status: 'active',
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
      };

      const newSubscriptionId = `${salonId}_${planId}_${Date.now()}`;

      await createSubscription(newSubscriptionId, newSubscription);
      
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
    setSettings(prev => ({
      ...prev,
      business: {
        ...prev.business,
        address,
        coordinates
      }
    }));
  };

  const handleSave = async (section: keyof SalonSettings) => {
    setSaving(true);
    setError(null);
    
    try {
      let updatedSalon: Salon;
      
      if (section === 'business') {
        if (settings.business.email && settings.business.email.trim() !== '' && !settings.business.email.includes('@')) {
          setError(t('error.invalidEmail'));
          setSaving(false);
          return;
        }
        
        updatedSalon = {
          ...salon!,
          name: settings.business.name,
          address: settings.business.address,
          phone: settings.business.phone,
          settings: {
            ...salon?.settings,
            business: {
              ...salon?.settings?.business,
              ...settings.business
            }
          }
        };
      } else {
        updatedSalon = {
          ...salon!,
          settings: {
            ...salon?.settings,
            [section]: settings[section]
          }
        };
      }
      
      await updateSalon(salonId, updatedSalon);
      setSalon(updatedSalon);
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
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

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

  if (!currentUser) {
    return (
      <ProtectedRoute>
        <div></div>
      </ProtectedRoute>
    );
  }

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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{t('title')}</h1>
          <p className="text-sm sm:text-base text-gray-600">{t('subtitle')}</p>
        </motion.div>

          {/* Removed the unnecessary <> fragment */}
          {saved && (
            <motion.div
              key="saved-notification" // Unique key for the saved message
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center gap-3 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium text-sm sm:text-base">{saved}</span>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error-notification" // Unique key for the error message
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium text-sm sm:text-base">{error}</span>
              </div>
            </motion.div>
          )}

        <div className="space-y-6 sm:space-y-8">
          {/* Subscription Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-rose-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('sections.subscription.title')}</h2>
              </div>
              <button 
                onClick={() => setIsPurchaseModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              >
                {t('sections.subscription.purchase')}
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {subscriptionLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('sections.subscription.loading')}</span>
                </div>
              ) : subscriptions && subscriptions.length > 0 ? (
                <ul className="space-y-3">
                  {subscriptions.map((sub) => (
                    <li key={sub.id} className="p-3 border border-gray-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <p className="font-semibold text-gray-800">{sub.planName}</p>
                        <p className="text-sm text-gray-500">
                          {t('sections.subscription.period')}: {sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString() : 'N/A'} - {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          sub.status === 'active' ? 'bg-green-100 text-green-800' :
                          sub.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                          sub.status === 'canceled' ? 'bg-red-100 text-red-800' :
                          sub.status === 'past_due' ? 'bg-orange-100 text-orange-800' :
                          sub.status === 'unpaid' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {t(`sections.subscription.statuses.${sub.status}`, {
                          defaultValue: sub.status.charAt(0).toUpperCase() + sub.status.slice(1).replace('_', ' ')
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 text-sm">{t('sections.subscription.noSubscriptions')}</p>
              )}
            </div>
          </motion.div>

          {/* Purchase Subscription Modal */}
          <ModalPortal
            isOpen={isPurchaseModalOpen}
            onClose={() => !saving && setIsPurchaseModalOpen(false)}
            className="max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-rose-500" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('sections.subscription.modalTitle')}
                </h3>
              </div>
              <button
                onClick={() => !saving && setIsPurchaseModalOpen(false)}
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                disabled={saving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {availablePlans.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {availablePlans.map((plan) => (
                          <div
                            key={plan.id}
                            className={`relative p-5 rounded-xl border-2 transition-all ${
                              selectedPlanId === plan.id
                                ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                                : 'border-gray-200 dark:border-gray-800 hover:border-rose-300 dark:hover:border-rose-700'
                            }`}
                          >
                            <div className="flex flex-col h-full">
                              <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                      {plan.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {plan.description}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                      {plan.price} {plan.currency}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      / {t(`sections.subscription.billingPeriods.${plan.billingPeriod}`)}
                                    </div>
                                  </div>
                                </div>

                                <ul className="space-y-2.5 mt-4">
                                  {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {feature}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                                <button
                                  onClick={() => setSelectedPlanId(plan.id)}
                                  className={`w-full px-4 py-2.5 rounded-lg font-medium transition-colors ${
                                    selectedPlanId === plan.id
                                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                                  }`}
                                  disabled={saving}
                                >
                                  {selectedPlanId === plan.id
                                    ? t('sections.subscription.selected')
                                    : t('sections.subscription.selectPlan')}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CalendarOff className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {t('sections.subscription.noPlansTitle')}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {t('sections.subscription.noPlans')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                        {t('sections.subscription.cancelAnytime')}
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => setIsPurchaseModalOpen(false)}
                          disabled={saving}
                          className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium w-full sm:w-auto"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          onClick={() => selectedPlanId && handlePurchase(selectedPlanId)}
                          disabled={!selectedPlanId || saving}
                          className={`px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto ${
                            selectedPlanId && !saving
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t('sections.subscription.processing')}...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4" />
                              {t('sections.subscription.purchaseNow')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
          </ModalPortal>

          {/* Business Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-rose-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('sections.business.title')}</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('sections.business.name')}
                  </label>
                  <input
                    type="text"
                    value={settings.business.name}
                    onChange={(e) => updateSetting('business', 'name', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('sections.business.email')} <span className="text-gray-500 text-xs">({t('sections.business.optional')})</span>
                  </label>
                  <input
                    type="email"
                    value={settings.business.email}
                    onChange={(e) => updateSetting('business', 'email', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                    placeholder={t('sections.business.emailPlaceholder')}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('sections.business.phone')} <span className="text-gray-500 text-xs">({t('sections.business.optional')})</span>
                  </label>
                  <input
                    type="tel"
                    value={settings.business.phone}
                    onChange={(e) => updateSetting('business', 'phone', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                    placeholder={t('sections.business.phonePlaceholder')}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('sections.business.address')}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={settings.business.address}
                      onChange={(e) => updateSetting('business', 'address', e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                      placeholder="Введите адрес или выберите на карте"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 font-medium transition-colors"
                    >
                      <Map className="h-4 w-4" />
                      <span>{showMap ? 'Скрыть карту' : 'Показать карту'}</span>
                    </button>
                  </div>
                </div>
                  {showMap && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <MapSelector
                        onLocationSelect={handleLocationSelect}
                        initialCoordinates={settings.business.coordinates}
                      />
                    </motion.div>
                  )}
              </div>
              
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleSave('business')}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
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