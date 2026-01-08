"use client"

import { Map } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { loadGoogleMapsApi } from "@/lib/googleMapsLoader"

interface MapComponentProps {
  onLocationSelect: (address: string, coordinates: { lat: number; lng: number }) => void
  initialCoordinates?: { lat: number; lng: number }
}

export default function MapComponent({ onLocationSelect, initialCoordinates }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isMapLoading, setIsMapLoading] = useState(true)

  useEffect(() => {
    let map: any = null
    let marker: any = null
    let geocoder: any = null
    let timeoutId: NodeJS.Timeout | null = null

    const initMap = async () => {
      try {
        console.log('MapComponent: Starting map initialization...')
        
        // Проверяем что элемент карты доступен
        const mapElement = mapRef.current
        if (!mapElement) {
          console.error('MapComponent: Map element not found')
          setMapError('Элемент карты не найден')
          setIsMapLoading(false)
          return
        }
        
        console.log('MapComponent: Map element found, loading Google Maps API...')
        
        // Загружаем Google Maps API
        await loadGoogleMapsApi()
        console.log('MapComponent: Google Maps API loaded successfully')
        
        // Проверяем что API действительно загрузился
        if (!(window as any).google?.maps) {
          console.error('MapComponent: Google Maps API not found after loading')
          throw new Error('Google Maps API не инициализирован после загрузки')
        }
        
        console.log('MapComponent: Initializing map...')

        // Инициализация карты
        const defaultCoords = initialCoordinates || { lat: 53.9045, lng: 27.5615 }
        const googleMaps = (window as any).google.maps
        
        map = new googleMaps.Map(mapElement, {
          center: defaultCoords,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        })

        console.log('MapComponent: Map created successfully')

        // Инициализация маркера
        marker = new googleMaps.Marker({
          position: defaultCoords,
          map: map,
          draggable: true,
          title: "Местоположение салона"
        })

        console.log('MapComponent: Marker created successfully')

        // Инициализация геокодера
        geocoder = new googleMaps.Geocoder()
        console.log('MapComponent: Geocoder created successfully')

        // Обработка перемещения маркера
        marker.addListener('dragend', async () => {
          if (marker && geocoder) {
            const position = marker.getPosition()
            if (position) {
              const coords = { lat: position.lat(), lng: position.lng() }
              
              try {
                const response = await geocoder.geocode({ location: coords })
                if (response.results[0]) {
                  onLocationSelect(response.results[0].formatted_address, coords)
                } else {
                  onLocationSelect(`Координаты: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`, coords)
                }
              } catch (error) {
                console.error('MapComponent: Geocoding error:', error)
                onLocationSelect(`Координаты: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`, coords)
              }
            }
          }
        })

        // Обработка клика по карте
        map.addListener('click', async (e: any) => {
          const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() }
          if (marker) {
            marker.setPosition(coords)
          }
          
          if (geocoder) {
            try {
              const response = await geocoder.geocode({ location: coords })
              if (response.results[0]) {
                onLocationSelect(response.results[0].formatted_address, coords)
              } else {
                onLocationSelect(`Координаты: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`, coords)
              }
            } catch (error) {
              console.error('MapComponent: Geocoding error:', error)
              onLocationSelect(`Координаты: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`, coords)
            }
          }
        })

        console.log('MapComponent: Map initialization completed successfully')
        setIsMapLoading(false)
      } catch (error) {
        console.error('MapComponent: Error initializing map:', error)
        setMapError(error instanceof Error ? error.message : 'Не удалось загрузить карту')
        setIsMapLoading(false)
      }
    }

    // Таймаут для предотвращения бесконечной загрузки
    timeoutId = setTimeout(() => {
      if (isMapLoading) {
        setMapError('Превышено время загрузки карты')
        setIsMapLoading(false)
      }
    }, 20000)

    // Запускаем инициализацию карты
    initMap()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (marker) marker.setMap(null)
      if (map) map = null
    }
  }, [onLocationSelect, initialCoordinates])

  if (mapError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">{mapError}</p>
      </div>
    )
  }

  if (isMapLoading) {
    return (
      <div className="w-full h-48 sm:h-64 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Загрузка карты...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Map className="h-4 w-4" />
        <span>Перетащите маркер или кликните по карте для выбора местоположения</span>
      </div>
      <div 
        ref={mapRef} 
        className="w-full h-48 sm:h-64 rounded-lg border border-gray-300 touch-manipulation"
        style={{ minHeight: '192px' }}
      />
      <p className="text-xs text-gray-500">Вы можете перетащить маркер или кликнуть в любую точку на карте</p>
    </div>
  )
}
