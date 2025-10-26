"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"

import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { loadGoogleMapsApi } from "@/lib/googleMapsLoader"; 
import type { Salon } from "@/types/database";

export const SalonsMap = React.memo(({
  salons,
  onSalonClick,
  userPosition,
  locale,
}: {
  salons: Salon[]
  onSalonClick: (salonId: string) => void
  locale: string
  userPosition: { latitude: number; longitude: number } | null
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  // 1. Заменяем useState для маркеров на useRef.
  // Это позволит нам хранить маркеры без вызова повторных рендеров.
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

  // 2. Удаляем onSalonClick из зависимостей useCallback, если она не меняется.
  // Если onSalonClick обернута в useCallback в родительском компоненте, ее можно оставить.
  // Для безопасности, предполагаем, что она может меняться.
  const initializeMap = useCallback(async () => {
    setMapLoading(true);
    setMapError(null);
    
    try {
      await loadGoogleMapsApi();
      if (!mapRef.current || !window.google?.maps) return;

      // Очищаем старые маркеры перед отрисовкой новых
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      const salonsWithCoords = salons.filter((s) => s.coordinates?.lat && s.coordinates?.lng);
      
      let center = { lat: 53.9045, lng: 27.5615 }; // Центр по умолчанию (Минск)
      if (userPosition) {
        center = { lat: userPosition.latitude, lng: userPosition.longitude };
      } else if (salonsWithCoords.length > 0) {
        const totalLat = salonsWithCoords.reduce((sum, s) => sum + (s.coordinates?.lat || 0), 0);
        const totalLng = salonsWithCoords.reduce((sum, s) => sum + (s.coordinates?.lng || 0), 0);
        center = { lat: totalLat / salonsWithCoords.length, lng: totalLng / salonsWithCoords.length };
      }

      const map = new window.google.maps.Map(mapRef.current, {
        center, zoom: 12, styles: [{ featureType: "poi.business", elementType: "labels", stylers: [{ visibility: "off" }] }],
        zoomControl: true, streetViewControl: false, mapTypeControl: false, fullscreenControl: false, gestureHandling: "greedy",
      });
      
      const newMarkers = salonsWithCoords.map((salon) => {
        const coords = salon.coordinates!;
        const marker = new window.google.maps.Marker({
          position: coords, map, title: salon.name,
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C10.7157 0 4 6.71573 4 15C4 23.2843 19 38 19 38C19 38 34 23.2843 34 15C34 6.71573 27.2843 0 19 0Z" fill="#DC2626"/><circle cx="19" cy="15" r="6" fill="white"/></svg>`),
            scaledSize: new window.google.maps.Size(38, 38), anchor: new window.google.maps.Point(19, 38),
          }
        });
        const infoWindow = new window.google.maps.InfoWindow({ content: `<div class="p-1 font-sans"><h3 class="font-semibold text-gray-900">${salon.name}</h3><p class="text-sm text-gray-600">${salon.address}</p></div>` });
        marker.addListener("mouseover", () => infoWindow.open(map, marker));
        marker.addListener("mouseout", () => infoWindow.close());
        marker.addListener("click", () => onSalonClick(salon.id));
        return marker;
      });

      // 3. Сохраняем новые маркеры в ref, а не в state.
      markersRef.current = newMarkers;

    } catch (error) {
      setMapError(error instanceof Error ? error.message : "Unknown map error.");
    } finally {
      setMapLoading(false);
    }
  }, [salons, userPosition, onSalonClick]);

  useEffect(() => {
    initializeMap();

    // 4. Функция очистки теперь тоже использует ref.
    // Она будет вызвана при размонтировании компонента.
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  // 5. Убираем 'markers' из зависимостей. Теперь эффект зависит только от initializeMap,
  // которая, в свою очередь, зависит от пропсов. Цикл разорван.
  }, [initializeMap]);

  if (mapLoading) return <div className="w-full h-full flex items-center justify-center bg-gray-100"><LoadingSpinner/></div>;
  
  if (mapError) return <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center"><p className="text-red-800 text-sm font-medium mb-2">Не удалось загрузить карту</p><p className="text-red-700 text-xs mb-4">Ошибка: {mapError}</p><button onClick={initializeMap} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Попробовать снова</button></div>;
  
  return <div ref={mapRef} className="w-full h-full rounded-lg border border-gray-200" />;
});

SalonsMap.displayName = 'SalonsMap';