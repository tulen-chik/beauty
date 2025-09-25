"use client";
import { useState, useRef, useEffect } from "react";
import { Map, MapPin, Building2, Phone, FileText, CheckCircle, X } from "lucide-react";
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('mapSelector');

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

        const initialLat = initialCoordinates?.lat || 53.895042;
        const initialLng = initialCoordinates?.lng || 27.571326;

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
        setMapError(t('error'));
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
          {t('errorHelp')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Map className="h-4 w-4" />
        <span>{t('title')}</span>
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

export const CreateSalonModal = ({ isOpen, onClose, userId, userName }: CreateSalonModalProps) => {
  const { createSalon, loading, error } = useSalon();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const t = useTranslations('salonCreation');

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
    if (!name.trim()) errs.name = t('requiredName');
    if (!address.trim()) errs.address = t('requiredAddress');
    if (!phone.trim()) {
      errs.phone = t('requiredPhone');
    } else if (!PHONE_REGEX.test(phone)) {
      errs.phone = t('invalidPhone');
    }
    if (description.length > MAX_DESCRIPTION) {
      errs.description = t('descriptionTooLong', { max: MAX_DESCRIPTION });
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
        }], // Add the owner as the first member
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Call createSalon with the correct parameters
      await createSalon(
        tempId,  // salonId (temporary)
        salonData,  // data
        userId  // userId
      );
      
      setSuccess(true);
      
      // Reset form
      setName('');
      setAddress('');
      setPhone('');
      setDescription('');
      setCoordinates(undefined);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating salon:', error);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('createSalonFor')} {userName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('successTitle')}
            </h3>
            <p className="text-gray-600">
              {t('successMessage')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('nameLabel')} <span className="text-red-500">*</span>
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
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    validationErrors.name ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  placeholder={t('namePlaceholder')}
                />
              </div>
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                {t('addressLabel')} <span className="text-red-500">*</span>
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 bg-gray-50 rounded-md shadow-sm cursor-pointer focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('addressPlaceholder')}
                />
              </div>
              {validationErrors.address && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
              )}
            </div>

            {showMap && (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <MapSelector 
                  onLocationSelect={handleLocationSelect} 
                  initialCoordinates={coordinates}
                />
              </div>
            )}

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('phoneLabel')} <span className="text-red-500">*</span>
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
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    validationErrors.phone ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  placeholder={t('phonePlaceholder')}
                />
              </div>
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                {t('descriptionLabel')}
              </label>
              <div className="relative">
                <div className="absolute top-2 left-3">
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
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    validationErrors.description ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  placeholder={t('descriptionPlaceholder')}
                  maxLength={MAX_DESCRIPTION}
                />
                <div className="flex justify-end text-xs text-gray-500 mt-1">
                  {description.length}/{MAX_DESCRIPTION}
                </div>
              </div>
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {t('cancelButton')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? t('creatingButton') : t('createButton')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
