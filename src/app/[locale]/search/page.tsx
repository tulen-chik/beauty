"use client"

import { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react"
import { Search, MapPin, Scissors, Map, X, ChevronDown, Globe, Store } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { getAllSalons, getAllSalonServices, getServiceImages } from "@/lib/firebase/database"
import { useTranslations } from "next-intl"
import { GoogleMapsTest } from "@/components/GoogleMapsTest"

type AnySalon = {
  id: string
  name: string
  address: string
  description?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

type AnyService = {
  id: string
  salonId: string
  name: string
  description?: string
  price: number
  durationMinutes: number
}

// Popular cities for quick selection
const POPULAR_CITIES = [
  // Россия
  { name: 'Москва', value: 'Москва' },
  { name: 'Санкт-Петербург', value: 'Санкт-Петербург' },
  { name: 'Новосибирск', value: 'Новосибирск' },
  { name: 'Екатеринбург', value: 'Екатеринбург' },
  { name: 'Казань', value: 'Казань' },
  { name: 'Нижний Новгород', value: 'Нижний Новгород' },
  { name: 'Челябинск', value: 'Челябинск' },
  { name: 'Самара', value: 'Самара' },
  { name: 'Ростов-на-Дону', value: 'Ростов-на-Дону' },
  { name: 'Уфа', value: 'Уфа' },
  
  // Беларусь
  { name: 'Минск', value: 'Минск' },
  { name: 'Гомель', value: 'Гомель' },
  { name: 'Могилёв', value: 'Могилёв' },
  { name: 'Витебск', value: 'Витебск' },
  { name: 'Гродно', value: 'Гродно' },
  { name: 'Брест', value: 'Брест' },
];
// Popular cities for English locale
const POPULAR_CITIES_EN = [
  // Russia
  { name: 'Moscow', value: 'Moscow' },
  { name: 'Saint Petersburg', value: 'Saint Petersburg' },
  { name: 'Novosibirsk', value: 'Novosibirsk' },
  { name: 'Yekaterinburg', value: 'Yekaterinburg' },
  { name: 'Kazan', value: 'Kazan' },
  { name: 'Nizhny Novgorod', value: 'Nizhny Novgorod' },
  { name: 'Chelyabinsk', value: 'Chelyabinsk' },
  { name: 'Samara', value: 'Samara' },
  { name: 'Rostov-on-Don', value: 'Rostov-on-Don' },
  { name: 'Ufa', value: 'Ufa' },

  // Belarus
  { name: 'Minsk', value: 'Minsk' },
  { name: 'Gomel', value: 'Gomel' },
  { name: 'Mogilev', value: 'Mogilev' },
  { name: 'Vitebsk', value: 'Vitebsk' },
  { name: 'Grodno', value: 'Grodno' },
  { name: 'Brest', value: 'Brest' },
];

// City selector component
const CitySelector = ({ 
  currentCity, 
  onCityChange, 
  locale 
}: { 
  currentCity: string | null
  onCityChange: (city: string) => void
  locale: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [customCity, setCustomCity] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('search')

  const popularCities = locale === 'ru' ? POPULAR_CITIES : POPULAR_CITIES_EN

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowCustomInput(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCitySelect = (city: string) => {
    onCityChange(city)
    setIsOpen(false)
    setShowCustomInput(false)
    setCustomCity('')
  }

  const handleCustomCitySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customCity.trim()) {
      onCityChange(customCity.trim())
      setCustomCity('')
      setShowCustomInput(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
      >
        <Globe className="w-4 h-4" />
        <span className="max-w-[120px] truncate">
          {currentCity || t('selectCity')}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('popularCities')}</h3>
            <div className="grid grid-cols-1 gap-1">
              {popularCities.map((city) => (
                <button
                  key={city.value}
                  onClick={() => handleCitySelect(city.value)}
                  className="text-left px-2 py-1 text-sm text-gray-700 hover:bg-blue-50 rounded transition-colors"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3">
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full text-left px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                {t('customCity')}
              </button>
            ) : (
              <form onSubmit={handleCustomCitySubmit} className="space-y-2">
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder={t('enterCityName')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  autoFocus
                />
                <div className="flex gap-1">
                  <button
                    type="submit"
                    disabled={!customCity.trim()}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('confirm')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false)
                      setCustomCity('')
                    }}
                    className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Google Maps component for showing salons
const SalonsMap = ({ 
  salons, 
  filteredServices,
  onSalonClick,
  locale
}: { 
  salons: AnySalon[]
  filteredServices: AnyService[]
  onSalonClick: (salonId: string) => void
  locale: string
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const t = useTranslations('search')

  // Check API key availability
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  console.log('SalonsMap component - API key check:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length,
    apiKeyStart: apiKey?.substring(0, 10),
    isDefaultKey: apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || apiKey === 'your_google_maps_api_key_here'
  })

  // Function for proper Russian pluralization of salon count
  const getSalonsCountText = (count: number) => {
    if (locale === 'ru') {
      const lastDigit = count % 10
      const lastTwoDigits = count % 100
      
      if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return `${count} салонов`
      } else if (lastDigit === 1) {
        return `${count} салон`
      } else if (lastDigit >= 2 && lastDigit <= 4) {
        return `${count} салона`
      } else {
        return `${count} салонов`
      }
    } else {
      return count === 1 ? `${count} salon` : `${count} salons`
    }
  }

  // Load Google Maps script if not already loaded
  const loadGoogleMaps = () => {
    if (window.google?.maps) {
      console.log('Google Maps already loaded')
      return Promise.resolve()
    }
    
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      console.log('Loading Google Maps with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined')
      
      // Check if API key is valid
      if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || apiKey === 'your_google_maps_api_key_here') {
        console.error('Invalid or missing Google Maps API key')
        reject(new Error('Invalid or missing Google Maps API key'))
        return
      }
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      
      // Add timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.error('Google Maps loading timeout')
        reject(new Error('Google Maps loading timeout'))
      }, 15000) // 15 seconds timeout
      
      script.onload = () => {
        console.log('Google Maps script loaded successfully')
        clearTimeout(timeout)
        resolve()
      }
      
      script.onerror = (error) => {
        console.error('Google Maps script failed to load:', error)
        clearTimeout(timeout)
        reject(new Error('Failed to load Google Maps'))
      }
      
      document.head.appendChild(script)
    })
  };

  const initializeMap = async () => {
    try {
      setMapLoading(true)
      setMapError(null)
      
      console.log('Starting map initialization...')
      
      // Дополнительная проверка DOM элемента
      if (!mapRef.current) {
        console.error('Map container ref is null at start of initialization')
        setMapError('Map container not found')
        setMapLoading(false)
        return
      }
      
      // Проверяем, что элемент действительно в DOM
      if (!document.contains(mapRef.current)) {
        console.error('Map container element is not in DOM')
        setMapError('Map container not in DOM')
        setMapLoading(false)
        return
      }
      await loadGoogleMaps()
      
      console.log('Google Maps loaded, checking API...')
      
      if (!window.google?.maps) {
        console.error('Google Maps API not available after loading')
        setMapError('Google Maps API not available')
        setMapLoading(false)
        return
      }
      
      // Проверяем, что DOM элемент имеет размеры
      const rect = mapRef.current?.getBoundingClientRect()
      const offsetWidth = mapRef.current?.offsetWidth
      const offsetHeight = mapRef.current?.offsetHeight
      
      console.log('DOM element dimensions:', { 
        rect: { width: rect?.width, height: rect?.height },
        offset: { width: offsetWidth, height: offsetHeight }
      })
      
      if (!rect || rect.width === 0 || rect.height === 0 || !offsetWidth || !offsetHeight) {
        console.warn('DOM element has zero dimensions, waiting a bit more...')
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Проверяем еще раз после ожидания
        const newRect = mapRef.current?.getBoundingClientRect()
        const newOffsetWidth = mapRef.current?.offsetWidth
        const newOffsetHeight = mapRef.current?.offsetHeight
        
        if (!newRect || newRect.width === 0 || newRect.height === 0 || !newOffsetWidth || !newOffsetHeight) {
          console.error('DOM element still has zero dimensions after waiting')
          setMapError('Map container has no dimensions')
          setMapLoading(false)
          return
        }
      }
      
      console.log('Google Maps API is available, creating map...')

      // Финальная проверка DOM элемента
      if (!mapRef.current) {
        console.error('Map container ref became null during initialization')
        setMapError('Map container became unavailable')
        setMapLoading(false)
        return
      }
      
      // Финальная проверка размеров
      const finalRect = mapRef.current.getBoundingClientRect()
      const finalOffsetWidth = mapRef.current.offsetWidth
      const finalOffsetHeight = mapRef.current.offsetHeight
      
      console.log('Final DOM element dimensions:', { 
        rect: { width: finalRect.width, height: finalRect.height },
        offset: { width: finalOffsetWidth, height: finalOffsetHeight }
      })
      
      if (finalRect.width === 0 || finalRect.height === 0 || finalOffsetWidth === 0 || finalOffsetHeight === 0) {
        console.error('Map container has zero dimensions at final check')
        setMapError('Map container has no dimensions')
        setMapLoading(false)
        return
      }

      // Calculate center based on salons with coordinates
      const salonsWithCoords = salons.filter(s => s.coordinates)
      let center = { lat: 55.7558, lng: 37.6176 } // Default to Moscow
      
      if (salonsWithCoords.length > 0) {
        const totalLat = salonsWithCoords.reduce((sum, s) => sum + (s.coordinates?.lat || 0), 0)
        const totalLng = salonsWithCoords.reduce((sum, s) => sum + (s.coordinates?.lng || 0), 0)
        center = {
          lat: totalLat / salonsWithCoords.length,
          lng: totalLng / salonsWithCoords.length
        }
      }

      const newMap = new (window as any).google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
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

      setMap(newMap)

      // Add markers for salons with coordinates
      const newMarkers: any[] = []
      salonsWithCoords.forEach(salon => {
        if (salon.coordinates) {
          const marker = new (window as any).google.maps.Marker({
            position: { lat: salon.coordinates.lat, lng: salon.coordinates.lng },
            map: newMap,
            title: salon.name,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="16" fill="#DC2626" stroke="white" stroke-width="2"/>
                  <path d="M16 8C18.2091 8 20 9.79086 20 12C20 14.2091 18.2091 16 16 16C13.7909 16 12 14.2091 12 12C12 9.79086 13.7909 8 16 8Z" fill="white"/>
                  <path d="M8 24C8 20.6863 10.6863 18 14 18H18C21.3137 18 24 20.6863 24 24V26H8V24Z" fill="white"/>
                </svg>
              `),
              scaledSize: new (window as any).google.maps.Size(32, 32),
              anchor: new (window as any).google.maps.Point(16, 16)
            }
          })

          // Add click listener to marker
          marker.addListener('click', () => {
            onSalonClick(salon.id)
          })

          // Add info window
          const infoWindow = new (window as any).google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold text-gray-900">${salon.name}</h3>
                <p class="text-sm text-gray-600">${salon.address}</p>
                <p class="text-xs text-gray-500 mt-1">Кликните для просмотра услуг</p>
              </div>
            `
          })

          marker.addListener('mouseover', () => {
            infoWindow.open(newMap, marker)
          })

          marker.addListener('mouseout', () => {
            infoWindow.close()
          })

          newMarkers.push(marker)
        }
      })

      setMarkers(newMarkers)
      setMapLoading(false)

    } catch (error) {
      console.error('Map initialization error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error details:', {
        message: errorMessage,
        error: error,
        windowGoogle: !!window.google,
        windowGoogleMaps: !!window.google?.maps,
        mapRef: !!mapRef.current
      })
      setMapError(errorMessage)
      setMapLoading(false)
    }
  };

  useLayoutEffect(() => {
    if (salons.length > 0) {
      // Используем useLayoutEffect для синхронного доступа к DOM
      const initMap = () => {
        if (mapRef.current) {
          console.log('DOM element found, initializing map...')
          initializeMap()
        } else {
          console.log('DOM element not found, scheduling retry...')
          // Если DOM еще не готов, планируем повторную попытку
          requestAnimationFrame(() => {
            if (mapRef.current) {
              console.log('DOM element found on retry, initializing map...')
              initializeMap()
            } else {
              console.error('Map container still not available after retry')
              setMapError('Map container not available')
              setMapLoading(false)
            }
          })
        }
      }

      // Запускаем инициализацию
      initMap()
      
      return () => {
        markers.forEach(marker => marker.setMap(null))
      }
    } else {
      setMapLoading(false)
    }

    return () => {
      markers.forEach(marker => marker.setMap(null))
    }
  }, [salons, t, onSalonClick, locale])

  const salonsWithCoords = salons.filter(s => s.coordinates)
  
  console.log('SalonsMap render:', {
    totalSalons: salons.length,
    salonsWithCoords: salonsWithCoords.length,
    mapLoading,
    mapError,
    hasMapRef: !!mapRef.current,
    mapRefElement: mapRef.current?.tagName,
    mapRefId: mapRef.current?.id,
    mapRefClassName: mapRef.current?.className,
    isInDOM: mapRef.current ? document.contains(mapRef.current) : false,
    mapRefDimensions: mapRef.current ? {
      offsetWidth: mapRef.current.offsetWidth,
      offsetHeight: mapRef.current.offsetHeight,
      clientWidth: mapRef.current.clientWidth,
      clientHeight: mapRef.current.clientHeight
    } : null
  })

  if (mapLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Map className="h-4 w-4" />
            <span>{t('mapTitle')}</span>
          </div>
        </div>
        <div className="w-full h-64 sm:h-80 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm">{t('loadingMap')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Map className="h-4 w-4" />
            <span>{t('mapTitle')}</span>
          </div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm font-medium">{mapError}</p>
          {mapError.includes('API key') && (
            <div className="mt-2 text-red-600 text-xs">
              <p>Для отображения карты необходимо настроить Google Maps API ключ:</p>
              <ol className="mt-1 ml-4 list-decimal space-y-1">
                <li>Создайте файл <code className="bg-red-100 px-1 rounded">.env.local</code> в корне проекта</li>
                <li>Добавьте строку: <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=ваш_ключ_здесь</code></li>
                <li>Получите ключ на <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
              </ol>
            </div>
          )}
          {!mapError.includes('API key') && (
            <p className="text-red-600 text-xs mt-1">
              {t('mapErrorHelp')}
            </p>
          )}
        </div>
        
        {/* Debug component */}
        {/* <GoogleMapsTest /> */}
        
                 {/* Retry button */}
         <div className="text-center mt-4">
           <button
             onClick={() => {
               setMapError(null)
               setMapLoading(true)
               
               const retryInit = () => {
                 if (salons.length > 0 && mapRef.current) {
                   console.log('Retry: DOM element found, initializing map...')
                   initializeMap()
                 } else if (salons.length > 0) {
                   console.log('Retry: DOM element not found, scheduling retry...')
                   // Используем requestAnimationFrame для следующего кадра
                   requestAnimationFrame(() => {
                     if (mapRef.current) {
                       console.log('Retry: DOM element found on retry, initializing map...')
                       initializeMap()
                     } else {
                       console.error('Retry: Map container still not available')
                       setMapError('Map container not available for retry')
                       setMapLoading(false)
                     }
                   })
                 } else {
                   setMapLoading(false)
                 }
               }
               
               // Запускаем повторную инициализацию
               retryInit()
             }}
             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
           >
             Попробовать снова
           </button>
         </div>
        
        {/* Alternative salon list when map is not available */}
        {salonsWithCoords.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Салоны в вашем районе:</h3>
            <div className="space-y-2">
              {salonsWithCoords.slice(0, 5).map((salon) => (
                <div 
                  key={salon.id} 
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSalonClick(salon.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{salon.name}</h4>
                      <p className="text-sm text-gray-600">{salon.address}</p>
                    </div>
                    <button className="px-3 py-1 bg-rose-600 text-white text-xs rounded-lg hover:bg-rose-700 transition-colors">
                      Выбрать
                    </button>
                  </div>
                </div>
              ))}
              {salonsWithCoords.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  И еще {salonsWithCoords.length - 5} салонов...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }



  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Map className="h-4 w-4" />
          <span>{t('mapTitle')}</span>
        </div>
        <span className="text-xs text-gray-500">
          {getSalonsCountText(salonsWithCoords.length)}
        </span>
      </div>
      
      {salonsWithCoords.length === 0 ? (
        <div className="w-full h-64 sm:h-80 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">{t('noSalonsWithCoordinates')}</p>
          </div>
        </div>
      ) : (
        <>
          <div 
            ref={mapRef} 
            className="w-full h-64 sm:h-80 rounded-lg border border-gray-300 touch-manipulation"
            style={{ 
              minHeight: '256px',
              minWidth: '100%',
              position: 'relative'
            }}
          />
          <p className="text-xs text-gray-500">
            {t('mapInstructions')}
          </p>
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  const t = useTranslations('search')
  const params = useParams()
  const locale = params.locale as string
  const [q, setQ] = useState("")
  const [salons, setSalons] = useState<AnySalon[]>([])
  const [services, setServices] = useState<AnyService[]>([])
  const [loading, setLoading] = useState(true)
  const [userCity, setUserCity] = useState<string | null>(null)
  const [manualCity, setManualCity] = useState<string | null>(null)
  const [serviceImages, setServiceImages] = useState<Record<string, string>>({})
  const [showMap, setShowMap] = useState(false)
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null)

  // Current city (manual selection takes precedence over geolocation)
  const currentCity = manualCity || userCity

  // Helper function to format address for display
  const formatAddress = (fullAddress: string) => {
    if (!fullAddress) return '';
    const parts = fullAddress.split(',');
    // Take the first 2 parts (e.g., street and city) for a cleaner look
    return parts.slice(0, 2).join(',').trim();
  };

  // Function for proper Russian pluralization
  const getServicesCountText = (count: number) => {
    if (locale === 'ru') {
      const lastDigit = count % 10
      const lastTwoDigits = count % 100
      
      if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return 'услуг'
      } else if (lastDigit === 1) {
        return 'услуга'
      } else if (lastDigit >= 2 && lastDigit <= 4) {
        return 'услуги'
      } else {
        return 'услуг'
      }
    } else {
      return count === 1 ? 'service' : 'services'
    }
  }

  // Get user's city from geolocation
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setUserCity(null)
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          
          // Use OpenStreetMap Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=${locale || 'ru'}`
          )
          
          if (response.ok) {
            const data = await response.json()
            
            // Extract city name from response
            const cityName = data.address?.city || 
                            data.address?.town || 
                            data.address?.village || 
                            data.address?.municipality ||
                            data.address?.county ||
                            t('unknownCity')
            
            setUserCity(cityName)
          } else {
            setUserCity(null)
          }
        } catch (error) {
          console.error('Error getting city name:', error)
          setUserCity(null)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        setUserCity(null)
      },
      { maximumAge: 60_000, timeout: 10_000, enableHighAccuracy: false }
    )
  }, [locale, t])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [rawSalons, rawServices] = await Promise.all([
        getAllSalons(),
        getAllSalonServices(),
      ])
      const salonsList: AnySalon[] = Object.entries(rawSalons || {}).map(([id, s]: any) => ({ id, ...s }))
      const servicesList: AnyService[] = Object.entries(rawServices || {}).map(([id, s]: any) => ({ id, ...s }))
      setSalons(salonsList)
      setServices(servicesList)
      setLoading(false)
    }
    load()
  }, [])

  // Load preview image for each service (first image if exists)
  useEffect(() => {
    let isCancelled = false
    const fetchImages = async () => {
      try {
        const entries = await Promise.all(
          services.map(async (s) => {
            try {
              const imgs = await getServiceImages(s.id)
              if (imgs && imgs.length > 0) {
                return [s.id, imgs[0].url] as const
              }
            } catch (e) {
              console.warn('Failed to load service images', e)
            }
            return [s.id, ""] as const
          })
        )
        if (isCancelled) return
        const map: Record<string, string> = {}
        for (const [id, url] of entries) {
          if (url) map[id] = url
        }
        setServiceImages(map)
      } catch (e) {
        console.warn('Failed to fetch images for services', e)
      }
    }
    if (services.length > 0) {
      fetchImages()
    } else {
      setServiceImages({})
    }
    return () => { isCancelled = true }
  }, [services])

  const qLower = q.trim().toLowerCase()
  
  // Filter services by search query and user's city
  const filteredServices = useMemo(() => {
    let filtered = services

    // Filter by search query
    if (qLower) {
      filtered = filtered.filter((s) =>
        [s.name, s.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(qLower))
      )
    }

    // Filter by current city (if available)
    if (currentCity) {
      filtered = filtered.filter((s) => {
        const salon = salons.find(sal => sal.id === s.salonId)
        if (!salon) return false
        
        // Check if salon address contains current city
        return salon.address.toLowerCase().includes(currentCity.toLowerCase())
      })
    }

    // Filter by selected salon if map is active
    if (selectedSalonId) {
      filtered = filtered.filter(s => s.salonId === selectedSalonId)
    }

    return filtered
  }, [qLower, services, salons, currentCity, selectedSalonId])

  const salonsById = useMemo(() => Object.fromEntries(salons.map((s) => [s.id, s])), [salons])

  // Handle salon click from map
  const handleSalonClick = (salonId: string) => {
    setSelectedSalonId(salonId)
    setShowMap(false) // Hide map to show services
  }

  // Clear salon filter
  const clearSalonFilter = () => {
    setSelectedSalonId(null)
  }

  // Handle city change
  const handleCityChange = (city: string) => {
    setManualCity(city)
    setSelectedSalonId(null) // Clear salon filter when changing city
  }

  // Clear manual city selection
  const clearManualCity = () => {
    setManualCity(null)
    setSelectedSalonId(null)
  }

  // Clear all filters
  const clearAllFilters = () => {
    setManualCity(null)
    setSelectedSalonId(null)
    setQ('')
  }

  // Check if any filters are active
  const hasActiveFilters = manualCity || selectedSalonId || q.trim()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">{t('subtitle')}</p>
          
          {/* City selector and info */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
            <CitySelector 
              currentCity={currentCity} 
              onCityChange={handleCityChange}
              locale={locale}
            />
            
            {currentCity && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span>
                  {manualCity ? t('showingInCity', { city: currentCity }) : t('detectedCity', { city: currentCity })}
                </span>
                {manualCity && (
                  <button
                    onClick={clearManualCity}
                    className="ml-2 p-1 hover:bg-blue-100 rounded-full transition-colors"
                    title={t('clearCitySelection')}
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Active filters and clear all button */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">{t('activeFilters')}:</span>
              
              {q.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {t('searchQuery')}: "{q.trim()}"
                </span>
              )}
              
              {manualCity && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {t('city')}: {manualCity}
                </span>
              )}
              
              {selectedSalonId && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded-full">
                  {t('salon')}: {salonsById[selectedSalonId]?.name}
                </span>
              )}
              
              <button
                onClick={clearAllFilters}
                className="ml-2 px-3 py-1 text-xs bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
              >
                {t('clearAll')}
              </button>
            </div>
          )}

          {/* Selected salon filter */}
          {selectedSalonId && (
            <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-rose-50 px-3 py-2 rounded-lg">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-rose-600" />
              <span>{t('showingSalonServices', { salonName: salonsById[selectedSalonId]?.name })}</span>
              <button
                onClick={clearSalonFilter}
                className="ml-auto p-1 hover:bg-rose-100 rounded-full transition-colors"
                title={t('clearSalonFilter')}
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 text-rose-600" />
              </button>
            </div>
          )}
        </div>

        {/* Search and Map Toggle */}
        <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none text-gray-900 text-base"
              />
            </div>
            
            {/* <button
              onClick={() => setShowMap(!showMap)}
              className={`px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                showMap 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              <Map className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">
                {showMap ? t('hideMap') : t('showMap')}
              </span>
              <span className="sm:hidden">
                {showMap ? '✕' : '🗺️'}
              </span>
            </button> */}
          </div>
        </div>

        {/* Map View */}
        {/* {showMap && (
          <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
            <SalonsMap 
              salons={salons.filter(s => {
                if (!currentCity) return true
                return s.address.toLowerCase().includes(currentCity.toLowerCase())
              })}
              filteredServices={filteredServices}
              onSalonClick={handleSalonClick}
              locale={locale}
            />
          </div>
        )} */}

        {loading ? (
          <div className="text-center text-gray-500 py-12 text-sm sm:text-base">{t('loading')}</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('servicesTitle')}</h2>
              <span className="text-xs sm:text-sm text-gray-500 ml-2">({filteredServices.length} {getServicesCountText(filteredServices.length)})</span>
            </div>
            
            {filteredServices.length === 0 ? (
              <div className="text-center text-gray-500 py-12 text-sm sm:text-base">
                {currentCity ? 
                  t('noServicesInCityMessage', { city: currentCity }) : 
                  t('noResults')
                }
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {filteredServices.map((s) => {
                  const salon = salonsById[s.salonId]
                  return (
                    <div key={s.id} className="border border-gray-100 rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="group">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image src={serviceImages[s.id] || "/placeholder.svg"} alt={s.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/${locale}/book/${s.id}`}>
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                                {s.name}
                              </h3>
                            </Link>
                            
                            {salon && (
                              <div className="mt-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2 font-medium">
                                  <Store className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                  <span>{salon.name}</span>
                                </div>
                                <div className="flex items-center gap-2 font-medium">
                                  <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                  <span>{formatAddress(salon.address)}</span>
                                </div>
                              </div>
                            )}
                            
                            {s.description && (
                              <div className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">{s.description}</div>
                            )}
                            
                            <div className="flex items-center justify-between mt-3">
                              <div className="text-base sm:text-lg font-bold text-rose-600">
                                {s.price} ₽
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                {s.durationMinutes} мин
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
                        <Link 
                          href={`/${locale}/book/${s.id}`} 
                          className="flex-1 bg-rose-600 text-white text-center py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors font-medium text-sm sm:text-base"
                        >
                          {t('book')}
                        </Link>
                        <Link 
                          href={`/${locale}/services/${s.id}`} 
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium text-center whitespace-nowrap"
                        >
                          {t('details')}
                        </Link>
                        {salon && (
                          <Link 
                            href={`/${locale}/s/${salon.id}`} 
                            className="px-4 py-2 text-rose-600 border border-rose-600 rounded-lg hover:bg-rose-50 transition-colors text-xs sm:text-sm font-medium text-center whitespace-nowrap"
                          >
                            {t('aboutSalon')}
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}