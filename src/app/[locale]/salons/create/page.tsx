"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSalon } from "@/contexts/SalonContext";
import { useUser } from "@/contexts/UserContext";
import { Map, MapPin, Building2, Phone, FileText } from "lucide-react";
import { useTranslations } from 'next-intl';

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

export default function CreateSalonPage() {
  const { createSalon, loading, error } = useSalon();
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const { currentUser } = useUser();
  const userId = currentUser?.userId;
  const t = useTranslations('salonCreation');

  const handleLocationSelect = (newAddress: string, newCoordinates: { lat: number; lng: number }) => {
    setAddress(newAddress);
    setCoordinates(newCoordinates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const salonId = Date.now().toString(); // Можно заменить на uuid
    try {
      await createSalon(salonId, {
        name,
        address,
        phone,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        coordinates,
        members: [
          {
            userId,
            role: "owner",
            joinedAt: new Date().toISOString(),
          },
        ],
        settings: {
          business: {
            name,
            address,
            phone,
            timezone: 'Europe/Moscow',
            currency: 'RUB',
            coordinates
          }
        }
      }, userId);
      setSuccess(true);
      setTimeout(() => router.push("/salons"), 1500);
    } catch (e) {
      console.error('Failed to create salon', e)
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100">
          <h1 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 text-center">{t('title')}</h1>
          
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="inline h-4 w-4 mr-2" />
                {t('name')}
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-base"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                required
              />
            </div>
            
            {/* Address and Map */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-2" />
                {t('address')}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-base"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={t('addressPlaceholder')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 flex items-center justify-center gap-2 font-medium min-w-[120px]"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">{showMap ? t('hideMap') : t('map')}</span>
                  <span className="sm:hidden">{showMap ? '✕' : '🗺️'}</span>
                </button>
              </div>
              
              {showMap && (
                <MapSelector
                  onLocationSelect={handleLocationSelect}
                  initialCoordinates={coordinates}
                />
              )}
              
              {coordinates && (
                <div className="text-sm text-gray-600 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-rose-600" />
                  <span className="font-medium">{t('coordinates')}:</span>
                  <span className="font-mono">{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</span>
                </div>
              )}
            </div>
            
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-2" />
                {t('phone')}
              </label>
              <input
                type="tel"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-base"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder={t('phonePlaceholder')}
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-2" />
                {t('description')}
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-base resize-none"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={3}
              />
            </div>
            
            {/* Error and Success Messages */}
            {error && (
              <div className="text-red-500 text-sm text-center p-3 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-600 text-sm text-center p-3 bg-green-50 rounded-lg border border-green-200">
                {t('success')}
              </div>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-rose-600 text-white font-semibold rounded-xl shadow-lg hover:bg-rose-700 transition-all disabled:opacity-50 text-base"
            >
              {loading ? t('creating') : t('createButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 