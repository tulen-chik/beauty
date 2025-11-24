"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { loadGoogleMapsApi } from "@/lib/googleMapsLoader"; 
import type { Salon } from "@/types/database";

const MapSkeleton = () => (
  <div className="absolute inset-0 z-10 w-full h-full bg-gray-200 animate-pulse rounded-lg overflow-hidden border border-gray-200">
    <div className="absolute top-4 right-4 space-y-2">
      <div className="w-10 h-10 bg-gray-300 rounded-md"></div>
      <div className="w-10 h-10 bg-gray-300 rounded-md"></div>
    </div>
    <div className="absolute bottom-4 right-4 w-12 h-12 bg-gray-300 rounded-full"></div>
    <div className="absolute top-4 left-4 w-48 h-12 bg-gray-300 rounded-lg"></div>
  </div>
);

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
  // Храним инстанс карты, чтобы не пересоздавать его
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  
  const [mapError, setMapError] = useState<string | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  // 1. Загружаем API один раз при маунте
  useEffect(() => {
    const loadApi = async () => {
      try {
        await loadGoogleMapsApi();
        setIsApiLoaded(true);
      } catch (error) {
        setMapError(error instanceof Error ? error.message : "Unknown map error.");
      }
    };
    loadApi();
  }, []);

  // 2. Инициализация карты и обновление маркеров
  useEffect(() => {
    if (!isApiLoaded || !mapRef.current || !window.google?.maps) return;

    const salonsWithCoords = salons.filter((s) => s.coordinates?.lat && s.coordinates?.lng);

    // Вычисляем центр
    let center = { lat: 53.9045, lng: 27.5615 };
    if (userPosition) {
      center = { lat: userPosition.latitude, lng: userPosition.longitude };
    } else if (salonsWithCoords.length > 0) {
      const totalLat = salonsWithCoords.reduce((sum, s) => sum + (s.coordinates?.lat || 0), 0);
      const totalLng = salonsWithCoords.reduce((sum, s) => sum + (s.coordinates?.lng || 0), 0);
      center = { lat: totalLat / salonsWithCoords.length, lng: totalLng / salonsWithCoords.length };
    }

    // Создаем карту ТОЛЬКО если её еще нет
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
        styles: [{ featureType: "poi.business", elementType: "labels", stylers: [{ visibility: "off" }] }],
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
      });
    } else {
      // Если карта есть, просто плавно меняем центр (опционально)
      // mapInstanceRef.current.panTo(center); 
    }

    // Очищаем старые маркеры
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Добавляем новые маркеры
    const newMarkers = salonsWithCoords.map((salon) => {
      const coords = salon.coordinates!;
      const marker = new window.google.maps.Marker({
        position: coords,
        map: mapInstanceRef.current,
        title: salon.name,
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C10.7157 0 4 6.71573 4 15C4 23.2843 19 38 19 38C19 38 34 23.2843 34 15C34 6.71573 27.2843 0 19 0Z" fill="#DC2626"/><circle cx="19" cy="15" r="6" fill="white"/></svg>`),
          scaledSize: new window.google.maps.Size(38, 38),
          anchor: new window.google.maps.Point(19, 38),
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div class="p-1 font-sans"><h3 class="font-semibold text-gray-900">${salon.name}</h3><p class="text-sm text-gray-600">${salon.address}</p></div>`
      });

      marker.addListener("mouseover", () => infoWindow.open(mapInstanceRef.current, marker));
      marker.addListener("mouseout", () => infoWindow.close());
      marker.addListener("click", () => onSalonClick(salon.id));
      return marker;
    });

    markersRef.current = newMarkers;

  }, [isApiLoaded, salons, userPosition, onSalonClick]); // Зависимости для обновления

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      // mapInstanceRef.current = null; // Можно не занулять, React сам очистит ref при удалении компонента
    };
  }, []);

  if (mapError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-800 text-sm font-medium mb-2">Не удалось загрузить карту</p>
        <p className="text-red-700 text-xs mb-4">Ошибка: {mapError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Обновить страницу
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-lg border border-gray-200 overflow-hidden">
      {/* Скелетон показывается поверх карты, пока API не загрузится */}
      {!isApiLoaded && <MapSkeleton />}
      
      {/* Div карты всегда рендерится, но может быть скрыт под скелетоном */}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
});

SalonsMap.displayName = 'SalonsMap';