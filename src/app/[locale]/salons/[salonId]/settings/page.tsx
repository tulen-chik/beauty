'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  CreditCard, 
  Bell,
  Shield,
  Zap,
  Save,
  Loader2,
  Map
} from 'lucide-react';

import { useSalon } from '@/contexts/SalonContext';
import { useUser } from '@/contexts/UserContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import type { Salon, SalonMember } from '@/types/database';

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

// Google Maps component
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
    // Load Google Maps script if not already loaded
    const loadGoogleMaps = () => {
      if (window.google?.maps) return Promise.resolve();
      
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        // Check if API key is valid
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
          // Mobile-friendly map options
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

        // Handle marker drag
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

        // Handle map click
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

  useEffect(() => {
    if (salonId && currentUser) {
      loadSalon();
    }
  }, [salonId, currentUser]);

  const loadSalon = async () => {
    try {
      const salonData = await fetchSalon(salonId);
      if (salonData) {
        setSalon(salonData);
        // Загружаем настройки из салона, если они есть
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
        // Также загружаем основную информацию о салоне в настройки бизнеса
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
        // Validate email format only if it's not empty
        if (settings.business.email && settings.business.email.trim() !== '' && !settings.business.email.includes('@')) {
          setError('Пожалуйста, введите корректный email или оставьте поле пустым');
          setSaving(false);
          return;
        }
        
        // Для бизнес-информации обновляем как настройки, так и основную информацию о салоне
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
        // Для других секций обновляем только настройки
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
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('notFound.title')}</h2>
          <p className="text-gray-600">{t('notFound.description')}</p>
        </div>
      </div>
    );
  }

  // Проверяем права доступа - только владельцы и менеджеры могут изменять настройки
  const userRole = salon.members.find((member: SalonMember) => member.userId === currentUser.userId)?.role;
  const canEditSettings = userRole === 'owner' || userRole === 'manager';

  if (!canEditSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('accessDenied.title')}</h2>
          <p className="text-gray-600">{t('accessDenied.description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-sm sm:text-base text-gray-600">{t('subtitle')}</p>
        </motion.div>

        {/* Success Message */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center gap-2 text-green-800">
              <Save className="h-4 w-5" />
              <span className="font-medium text-sm sm:text-base">{saved}</span>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center gap-2 text-red-800">
              <span className="font-medium text-sm sm:text-base">{error}</span>
            </div>
          </motion.div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {/* Business Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-5 text-rose-600" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('sections.business.title')}</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sections.business.name')}
                  </label>
                  <input
                    type="text"
                    value={settings.business.name}
                    onChange={(e) => updateSetting('business', 'name', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sections.business.email')} <span className="text-gray-500 text-xs">(необязательно)</span>
                  </label>
                  <input
                    type="email"
                    value={settings.business.email}
                    onChange={(e) => updateSetting('business', 'email', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                    placeholder="Введите email или оставьте пустым"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sections.business.phone')} <span className="text-gray-500 text-xs">(необязательно)</span>
                  </label>
                  <input
                    type="tel"
                    value={settings.business.phone}
                    onChange={(e) => updateSetting('business', 'phone', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                    placeholder="Введите телефон или оставьте пустым"
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sections.business.currency')}
                  </label>
                  <select
                    value={settings.business.currency}
                    onChange={(e) => updateSetting('business', 'currency', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                  >
                    <option value="RUB">RUB (₽)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div> */}
              </div>
              
              {/* Address and Map */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sections.business.address')}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={settings.business.address}
                      onChange={(e) => updateSetting('business', 'address', e.target.value)}
                      className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                      placeholder="Введите адрес или выберите на карте"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="px-4 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center justify-center gap-2 font-medium min-w-[120px]"
                    >
                      <Map className="h-4 w-4" />
                      <span className="hidden sm:inline">{showMap ? 'Скрыть карту' : 'Показать карту'}</span>
                      <span className="sm:hidden">{showMap ? '✕' : '🗺️'}</span>
                    </button>
                  </div>
                </div>
                
                {showMap && (
                  <MapSelector
                    onLocationSelect={handleLocationSelect}
                    initialCoordinates={settings.business.coordinates}
                  />
                )}
                
                {/* {settings.business.coordinates && (
                  <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Координаты:</span> {settings.business.coordinates.lat.toFixed(6)}, {settings.business.coordinates.lng.toFixed(6)}
                  </div>
                )} */}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('business')}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{t('sections.business.save')}</span>
                  <span className="sm:hidden">Сохранить</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-5 text-rose-600" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('sections.notifications.title')}</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) => updateSetting('notifications', 'email', e.target.checked)}
                    className="h-5 w-5 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                  />
                  <span className="text-sm sm:text-base font-medium text-gray-700">{t('sections.notifications.email')}</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sms}
                    onChange={(e) => updateSetting('notifications', 'sms', e.target.checked)}
                    className="h-5 w-5 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                  />
                  <span className="text-sm sm:text-base font-medium text-gray-700">{t('sections.notifications.sms')}</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.push}
                    onChange={(e) => updateSetting('notifications', 'push', e.target.checked)}
                    className="h-5 w-5 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                  />
                  <span className="text-sm sm:text-base font-medium text-gray-700">{t('sections.notifications.push')}</span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('notifications')}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{t('sections.notifications.save')}</span>
                  <span className="sm:hidden">Сохранить</span>
                </button>
              </div>
            </div>
          </motion.div>

          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-5 text-rose-600" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('sections.security.title')}</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactor}
                    onChange={(e) => updateSetting('security', 'twoFactor', e.target.checked)}
                    className="h-5 w-5 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                  />
                  <span className="text-sm sm:text-base font-medium text-gray-700">{t('sections.security.twoFactor')}</span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('security')}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{t('sections.security.save')}</span>
                  <span className="sm:hidden">Сохранить</span>
                </button>
              </div>
            </div>
          </motion.div>

          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-5 text-rose-600" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('sections.integrations.title')}</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.integrations.googleCalendar}
                    onChange={(e) => updateSetting('integrations', 'googleCalendar', e.target.checked)}
                    className="h-5 w-5 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                  />
                  <span className="text-sm sm:text-base font-medium text-gray-700">{t('sections.integrations.googleCalendar')}</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.integrations.telegramBot}
                    onChange={(e) => updateSetting('integrations', 'telegramBot', e.target.checked)}
                    className="h-5 w-5 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                  />
                  <span className="text-sm sm:text-base font-medium text-gray-700">{t('sections.integrations.telegramBot')}</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.integrations.whatsapp}
                    onChange={(e) => updateSetting('integrations', 'whatsapp', e.target.checked)}
                    className="h-5 w-5 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                  />
                  <span className="text-sm sm:text-base font-medium text-gray-700">{t('sections.integrations.whatsapp')}</span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('integrations')}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{t('sections.integrations.save')}</span>
                  <span className="sm:hidden">Сохранить</span>
                </button>
              </div>
            </div>
          </motion.div> */}
        </div>
      </div>
    </div>
  );
}
