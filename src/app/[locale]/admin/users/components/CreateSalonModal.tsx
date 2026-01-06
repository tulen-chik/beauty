"use client";
import { Building2, CheckCircle, FileText, Map, MapPin, Phone, X } from "lucide-react";
import { useEffect,useRef, useState } from "react";

import { useSalon } from "@/contexts/SalonContext";

import { SalonRole } from "@/types/salon";

interface CreateSalonModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

// Google Maps component for address selection
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

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google?.maps) return Promise.resolve();
      
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        // Check if API key is valid
        if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || apiKey === 'your_google_maps_api_key_here') {
          console.error('Invalid or missing Google Maps API key');
          return reject(new Error('Invalid or missing Google Maps API key'));
        }
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${navigator.language || 'en'}`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps'));
        document.head.appendChild(script);
      });
    };

    const getDefaultLocation = (): { lat: number; lng: number } => {
      // Use provided coordinates if available
      if (initialCoordinates) return initialCoordinates;
      
      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            return { lat: latitude, lng: longitude };
          },
          (error) => {
            console.warn('Could not get user location:', error);
            // Fallback to a more neutral location (center of the world map)
            return { lat: 20, lng: 0 };
          }
        );
      }
      
      // Default fallback to center of the world map
      return { lat: 20, lng: 0 };
    };

    const initializeMap = async () => {
      try {
        await loadGoogleMaps();
        
        if (!mapRef.current || !window.google?.maps) {
          setMapError('Ошибка загрузки карты');
          return;
        }

        const defaultLocation = getDefaultLocation();
        const initialLat = initialCoordinates?.lat || defaultLocation.lat;
        const initialLng = initialCoordinates?.lng || defaultLocation.lng;

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

        // Handle marker drag
        newMarker.addListener('dragend', () => {
          const position = newMarker.getPosition();
          if (position) {
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: position }, (results: any, status: string) => {
              if (status === 'OK' && results && results[0]) {
                const address = results[0].formatted_address;
                onLocationSelect(address, { lat: position.lat(), lng: position.lng() });
              } else if (status !== 'OK') {
                console.error('Geocoding error status:', status);
              }
            });
          }
        });

        // Handle map click
        newMap.addListener('click', (event: any) => {
          if (event.latLng) {
            newMarker.setPosition(event.latLng);
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: event.latLng }, (results: any, status: string) => {
              if (status === 'OK' && results && results[0]) {
                const address = results[0].formatted_address;
                onLocationSelect(address, { lat: event.latLng.lat(), lng: event.latLng.lng() });
              } else if (status !== 'OK') {
                console.error('Geocoding error status:', status);
              }
            });
          }
        });

      } catch (error) {
        console.error('Map initialization error:', error);
        setMapError('Ошибка загрузки карты');
      }
    };

    initializeMap();

    return () => {
      if (marker) marker.setMap(null);
    };
  }, [initialCoordinates]);

  if (mapError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">{mapError}</p>
        <p className="text-red-600 text-xs mt-1">
          Убедитесь, что API ключ Google Maps настроен правильно
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Map className="h-4 w-4" />
        <span>Выберите местоположение на карте</span>
      </div>
      <div 
        ref={mapRef} 
        className="w-full h-48 sm:h-64 rounded-lg border border-gray-300 touch-manipulation"
        style={{ minHeight: '192px' }}
      />
      <p className="text-xs text-gray-500">
        Нажмите на карту или перетащите маркер, чтобы выбрать местоположение салона
      </p>
    </div>
  );
};

import { useRouter } from "next/navigation";

import type { Salon as DBSalon } from "@/types/database";

export const CreateSalonModal = ({ isOpen, onClose, userId, userName }: CreateSalonModalProps) => {
  const router = useRouter();
  const { createSalon, loading, error } = useSalon();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [addServices, setAddServices] = useState(false);
  const [createdSalon, setCreatedSalon] = useState<DBSalon | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // validation state
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    address?: string;
    phone?: string;
    description?: string;
  }>({});

  const MAX_DESCRIPTION = 1000;
  const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

  const handleLocationSelect = (newAddress: string, newCoordinates: { lat: number; lng: number }) => {
    setAddress(newAddress);
    setCoordinates(newCoordinates);
    setShowMap(false);
    setValidationErrors(prev => ({ ...prev, address: undefined }));
  };

  const validate = () => {
    const errs: any = {};
    if (!name.trim()) errs.name = 'Название салона обязательно';
    if (!address.trim()) errs.address = 'Адрес салона обязателен';
    if (!phone.trim()) {
      errs.phone = 'Телефон обязателен';
    } else if (!PHONE_REGEX.test(phone)) {
      errs.phone = 'Неверный формат телефона';
    }
    if (description.length > MAX_DESCRIPTION) {
      errs.description = `Описание слишком длинное (макс. ${MAX_DESCRIPTION} символов)`;
    }
    
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      // Ensure we have all required fields
      if (!coordinates) {
        throw new Error('Coordinates are required');
      }
      
      // Generate a temporary ID for the new salon
      const tempId = `temp-${Date.now()}`;
      
      // Create salon data without the ID
      const salonData = {
        name,
        address,
        phone,
        description,
        coordinates: {
          lat: coordinates.lat,
          lng: coordinates.lng
        },
        ownerId: userId,
        isActive: true,
        services: [],
        workingHours: {},
        members: [{
          userId: userId,
          role: 'owner' as SalonRole,
          joinedAt: new Date().toISOString(),
          isActive: true
        }],
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Call createSalon with the correct parameters
      const salon = await createSalon(
        tempId,  // salonId (temporary)
        salonData,  // data
        userId  // userId
      );
      
      setCreatedSalon({
        ...salon,
        id: tempId
      });
      setSuccess(true);
      
      // Reset form
      setName('');
      setAddress('');
      setPhone('');
      setDescription('');
      setCoordinates(undefined);
      
      // Close modal after 2 seconds if not adding services
      if (!addServices) {
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error creating salon:', error);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl transform transition-all">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">
              Создать салон для {userName}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {success ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Салон успешно создан!
              </h3>
              <p className="text-gray-600 mb-8">
                Салон добавлен в систему
              </p>
              
              {addServices && createdSalon?.id && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/admin/salons/${createdSalon.id}/services`);
                      onClose();
                    }}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors duration-200"
                  >
                    Добавить услуги сейчас
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors duration-200"
                  >
                    Закрыть
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Название салона <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setValidationErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:ring-gray-900/20 focus:border-gray-900 transition-all duration-200 ${
                      validationErrors.name ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Например: Красота и Стиль"
                  />
                </div>
                {validationErrors.name && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес салона <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    readOnly
                    onClick={() => setShowMap(true)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 bg-gray-50 rounded-lg shadow-sm cursor-pointer focus:ring-gray-900/20 focus:border-gray-900 transition-all duration-200"
                    placeholder="Нажмите для выбора адреса на карте"
                  />
                </div>
                {validationErrors.address && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.address}</p>
                )}
              </div>

              {showMap && (
                <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <MapSelector 
                    onLocationSelect={handleLocationSelect} 
                    initialCoordinates={coordinates}
                  />
                </div>
              )}

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setValidationErrors(prev => ({ ...prev, phone: undefined }));
                    }}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:ring-gray-900/20 focus:border-gray-900 transition-all duration-200 ${
                      validationErrors.phone ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="+375 (XX) XXX-XX-XX"
                  />
                </div>
                {validationErrors.phone && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Описание салона
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="description"
                    rows={4}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setValidationErrors(prev => ({ ...prev, description: undefined }));
                    }}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:ring-gray-900/20 focus:border-gray-900 transition-all duration-200 ${
                      validationErrors.description ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Расскажите о вашем салоне..."
                    maxLength={MAX_DESCRIPTION}
                  />
                  <div className="flex justify-end text-xs text-gray-500 mt-2">
                    {description.length}/{MAX_DESCRIPTION}
                  </div>
                </div>
                {validationErrors.description && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.description}</p>
                )}
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center">
                  <input
                    id="add-services"
                    name="add-services"
                    type="checkbox"
                    checked={addServices}
                    onChange={(e) => setAddServices(e.target.checked)}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                  />
                  <label htmlFor="add-services" className="ml-3 block text-sm text-gray-700">
                    Добавить услуги после создания салона
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors duration-200"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors duration-200"
                  >
                    {loading ? 'Создание...' : 'Создать салон'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
