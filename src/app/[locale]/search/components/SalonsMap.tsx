"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"

import { loadGoogleMapsApi } from "@/lib/googleMapsLoader"; 
import type { Salon } from "@/types/database";

// --- НОВЫЙ КОМПОНЕНТ SKELETON ДЛЯ КАРТЫ ---
const MapSkeleton = () => (
  <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg relative overflow-hidden border border-gray-200">
    {/* Placeholder for UI elements to make it look more like a map interface */}
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
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

  const initializeMap = useCallback(async () => {
    setMapLoading(true);
    setMapError(null);
    
    try {
      await loadGoogleMapsApi();
      if (!mapRef.current || !window.google?.maps) return;

      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      const salonsWithCoords = salons.filter((s) => s.coordinates?.lat && s.coordinates?.lng);
      
      let center = { lat: 53.9045, lng: 27.5615 }; // Default center (Minsk)
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

      markersRef.current = newMarkers;

    } catch (error) {
      setMapError(error instanceof Error ? error.message : "Unknown map error.");
    } finally {
      setMapLoading(false);
    }
  }, [salons, userPosition, onSalonClick]);

  useEffect(() => {
    initializeMap();

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [initializeMap]);

  // --- ИЗМЕНЕНИЕ ЗДЕСЬ: Замена спиннера на скелет ---
  if (mapLoading) return <MapSkeleton />;
  
  if (mapError) return <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center"><p className="text-red-800 text-sm font-medium mb-2">Не удалось загрузить карту</p><p className="text-red-700 text-xs mb-4">Ошибка: {mapError}</p><button onClick={initializeMap} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Попробовать снова</button></div>;
  
  return <div ref={mapRef} className="w-full h-full rounded-lg border border-gray-200" />;
});

SalonsMap.displayName = 'SalonsMap';