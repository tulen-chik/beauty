"use client"

import React, { useEffect, useRef, useState } from "react"

import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import type { Salon } from "@/types/database"; // 1. Импортируем существующий тип

// Тип AnySalon удален

export const SalonsMap = React.memo(({
  salons,
  onSalonClick,
  userPosition,
}: {
  salons: Salon[] // 2. Используем тип Salon для пропсов
  onSalonClick: (salonId: string) => void
  locale: string
  userPosition: { latitude: number; longitude: number } | null
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const isMounted = useRef(false)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapLoading, setMapLoading] = useState(true)

  useEffect(() => {
    isMounted.current = true
    initializeMap();
    return () => {
      isMounted.current = false
      // Очищаем маркеры при размонтировании компонента
      markers.forEach((marker) => marker.setMap(null))
    }
  }, [salons, userPosition]) // Перезапускаем карту при изменении салонов или позиции пользователя

  const loadGoogleMaps = () => {
    if (window.google?.maps) return Promise.resolve()
    return new Promise<void>((resolve, reject) => {
      const scriptId = "google-maps-script"
      if (document.getElementById(scriptId)) {
        // Если скрипт уже есть, даем ему время на загрузку
        setTimeout(() => window.google?.maps ? resolve() : reject(new Error("Script exists but google.maps not available.")), 1000)
        return
      }
      const script = document.createElement("script")
      script.id = scriptId
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey || apiKey.includes("YOUR_GOOGLE_MAPS_API_KEY")) return reject(new Error("Invalid or missing Google Maps API key"))
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      const timeout = setTimeout(() => { script.remove(); reject(new Error("Google Maps loading timeout")) }, 15000)
      script.onload = () => { clearTimeout(timeout); resolve() }
      script.onerror = () => { clearTimeout(timeout); script.remove(); reject(new Error("Failed to load Google Maps script")) }
      document.head.appendChild(script)
    })
  }

  const initializeMap = async () => {
    setMapLoading(true)
    setMapError(null)
    try {
      await loadGoogleMaps()
      if (!isMounted.current || !mapRef.current || !window.google?.maps) return

      // 3. Обновляем фильтрацию для работы с salon.coordinates
      const salonsWithCoords = salons.filter((s) => s.coordinates?.lat && s.coordinates?.lng)
      
      let center = { lat: 53.9045, lng: 27.5615 } // Центр по умолчанию (Минск)
      if (userPosition) {
        center = { lat: userPosition.latitude, lng: userPosition.longitude };
      } else if (salonsWithCoords.length > 0) {
        // 4. Обновляем вычисление центра
        const totalLat = salonsWithCoords.reduce((sum, s) => sum + (s.coordinates?.lat || 0), 0)
        const totalLng = salonsWithCoords.reduce((sum, s) => sum + (s.coordinates?.lng || 0), 0)
        center = { lat: totalLat / salonsWithCoords.length, lng: totalLng / salonsWithCoords.length }
      }

      const map = new window.google.maps.Map(mapRef.current, {
        center, zoom: 12, styles: [{ featureType: "poi.business", elementType: "labels", stylers: [{ visibility: "off" }] }],
        zoomControl: true, streetViewControl: false, mapTypeControl: false, fullscreenControl: false, gestureHandling: "greedy",
      })
      
      const newMarkers = salonsWithCoords.map((salon) => {
        // 5. Получаем координаты напрямую из salon.coordinates
        const coords = salon.coordinates!
        const marker = new window.google.maps.Marker({
          position: coords, map, title: salon.name,
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C10.7157 0 4 6.71573 4 15C4 23.2843 19 38 19 38C19 38 34 23.2843 34 15C34 6.71573 27.2843 0 19 0Z" fill="#DC2626"/><circle cx="19" cy="15" r="6" fill="white"/></svg>`),
            scaledSize: new window.google.maps.Size(38, 38), anchor: new window.google.maps.Point(19, 38),
          }
        })
        const infoWindow = new window.google.maps.InfoWindow({ content: `<div class="p-1 font-sans"><h3 class="font-semibold text-gray-900">${salon.name}</h3><p class="text-sm text-gray-600">${salon.address}</p></div>` })
        marker.addListener("mouseover", () => infoWindow.open(map, marker))
        marker.addListener("mouseout", () => infoWindow.close())
        marker.addListener("click", () => onSalonClick(salon.id))
        return marker
      })
      if (isMounted.current) {
        // Перед установкой новых маркеров, удаляем старые
        setMarkers(prev => { 
          prev.forEach(m => m.setMap(null)); 
          return newMarkers 
        })
      }
    } catch (error) {
      if (isMounted.current) setMapError(error instanceof Error ? error.message : "Unknown map error.")
    } finally {
      if (isMounted.current) setMapLoading(false)
    }
  }

  if (mapLoading) return <div className="w-full h-full flex items-center justify-center bg-gray-100"><LoadingSpinner/></div>
  if (mapError) return <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center"><p className="text-red-800 text-sm font-medium mb-2">Не удалось загрузить карту</p><p className="text-red-700 text-xs mb-4">Ошибка: {mapError}</p><button onClick={initializeMap} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Попробовать снова</button></div>
  return <div ref={mapRef} className="w-full h-full rounded-lg border border-gray-200" />
});
SalonsMap.displayName = 'SalonsMap';