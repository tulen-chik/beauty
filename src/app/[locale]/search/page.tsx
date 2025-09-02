"use client"

import React from "react"
import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { Search, MapPin, Scissors, Map as MapIcon, X, ChevronDown, Globe, Store, List } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { getAllSalons, getAllSalonServices, getServiceImages } from "@/lib/firebase/database"
import { useTranslations } from "next-intl"
import { useSalonRating } from "@/contexts"
import RatingDisplay from "@/components/RatingDisplay"

// --- ТИПЫ ДАННЫХ ---
type AnySalon = {
  id: string
  name: string
  address: string
  description?: string
  settings?: { business?: { coordinates?: { lat: number; lng: number } } }
}

type AnyService = {
  id: string
  salonId: string
  name: string
  description?: string
  price: number
  durationMinutes: number
  isActive: boolean
}

type ProcessedService = AnyService & {
  salon: { id: string; name: string; address: string } | null
  imageUrl: string
}

// --- КОНСТАНТЫ ---
const POPULAR_CITIES = [
  { name: "Москва", value: "Москва" },
  { name: "Минск", value: "Минск" },
  { name: "Гомель", value: "Гомель" },
  { name: "Гродно", value: "Гродно" },
  { name: "Брест", value: "Брест" },
  { name: "Витебск", value: "Витебск" },
]
const POPULAR_CITIES_EN = [
  { name: "Moscow", value: "Moscow" },
  { name: "Minsk", value: "Minsk" },
  { name: "Gomel", value: "Gomel" },
  { name: "Grodno", value: "Grodno" },
  { name: "Brest", value: "Brest" },
  { name: "Vitebsk", value: "Vitebsk" },
]
const DEBOUNCE_DELAY = 300;

// ===================================================================================
// КОМПОНЕНТ КАРТЫ (SalonsMap)
// ===================================================================================
const SalonsMap = ({
  salons,
  onSalonClick,
  locale,
}: {
  salons: AnySalon[]
  onSalonClick: (salonId: string) => void
  locale: string
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const isMounted = useRef(false)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const t = useTranslations("search")

  useEffect(() => {
    isMounted.current = true
    const salonsWithCoords = salons.filter((s) => s.settings?.business?.coordinates)
    if (salonsWithCoords.length > 0) {
      initializeMap()
    } else {
      setMapLoading(false)
    }
    return () => {
      isMounted.current = false
      markers.forEach((marker) => marker.setMap(null))
    }
  }, [salons])

  const loadGoogleMaps = () => {
    if (window.google?.maps) return Promise.resolve()
    return new Promise<void>((resolve, reject) => {
      const scriptId = "google-maps-script"
      if (document.getElementById(scriptId)) {
        setTimeout(() => {
          if (window.google?.maps) resolve()
          else reject(new Error("Script exists but google.maps not available."))
        }, 1000)
        return
      }
      const script = document.createElement("script")
      script.id = scriptId
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey || apiKey.includes("YOUR_GOOGLE_MAPS_API_KEY")) {
        return reject(new Error("Invalid or missing Google Maps API key"))
      }
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
      if (!isMounted.current || !mapRef.current) return
      if (!window.google?.maps) throw new Error("Google Maps API not available.")

      const salonsWithCoords = salons.filter((s) => s.settings?.business?.coordinates)
      let center = { lat: 55.7558, lng: 37.6176 }
      if (salonsWithCoords.length > 0) {
        const totalLat = salonsWithCoords.reduce((sum, s) => sum + (s.settings?.business?.coordinates?.lat || 0), 0)
        const totalLng = salonsWithCoords.reduce((sum, s) => sum + (s.settings?.business?.coordinates?.lng || 0), 0)
        center = { lat: totalLat / salonsWithCoords.length, lng: totalLng / salonsWithCoords.length }
      }

      const mapOptions: google.maps.MapOptions = {
        center,
        zoom: 12,
        styles: [{ featureType: "poi.business", elementType: "labels", stylers: [{ visibility: "off" }] }],
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy" as any,
      }
      if (!mapRef.current) throw new Error("Map container became null.")
      const newMap = new window.google.maps.Map(mapRef.current, mapOptions)
      const newMarkers: google.maps.Marker[] = []
      salonsWithCoords.forEach((salon) => {
        const coords = salon.settings?.business?.coordinates
        if (coords) {
          const icon = {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 0C10.7157 0 4 6.71573 4 15C4 23.2843 19 38 19 38C19 38 34 23.2843 34 15C34 6.71573 27.2843 0 19 0Z" fill="#DC2626"/><circle cx="19" cy="15" r="6" fill="white"/></svg>`),
            scaledSize: new window.google.maps.Size(38, 38),
            anchor: new window.google.maps.Point(19, 38),
          }
          const marker = new window.google.maps.Marker({ position: coords, map: newMap, title: salon.name, icon: icon as any })
          const infoWindow = new window.google.maps.InfoWindow({ content: `<div class="p-1 font-sans"><h3 class="font-semibold text-gray-900">${salon.name}</h3><p class="text-sm text-gray-600">${salon.address}</p></div>` })
          marker.addListener("mouseover", () => infoWindow.open(newMap, marker))
          marker.addListener("mouseout", () => infoWindow.close())
          marker.addListener("click", () => onSalonClick(salon.id))
          newMarkers.push(marker)
        }
      })
      if (isMounted.current) {
        setMarkers((prev) => { prev.forEach((m) => m.setMap(null)); return newMarkers })
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown map error."
      if (isMounted.current) setMapError(msg)
    } finally {
      if (isMounted.current) setMapLoading(false)
    }
  }

  if (mapLoading) {
    return <div className="w-full h-full rounded-lg bg-gray-50 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div></div>
  }
  if (mapError) {
    return <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center"><p className="text-red-800 text-sm font-medium mb-2">Не удалось загрузить карту</p><p className="text-red-700 text-xs mb-4">Ошибка: {mapError}</p><button onClick={initializeMap} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Попробовать снова</button></div>
  }
  return <div ref={mapRef} className="w-full h-full rounded-lg border border-gray-200" />
}

// ===================================================================================
// МЕМОИЗИРОВАННЫЕ ДОЧЕРНИЕ КОМПОНЕНТЫ
// ===================================================================================
const CitySelector = React.memo(({ currentCity, onCityChange, locale }: { currentCity: string | null; onCityChange: (city: string) => void; locale: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [customCity, setCustomCity] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const t = useTranslations("search")
  const popularCities = locale === "ru" ? POPULAR_CITIES : POPULAR_CITIES_EN

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowCustomInput(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleCitySelect = (city: string) => { onCityChange(city); setIsOpen(false); setShowCustomInput(false); setCustomCity("") }
  const handleCustomCitySubmit = (e: React.FormEvent) => { e.preventDefault(); if (customCity.trim()) { onCityChange(customCity.trim()); setCustomCity(""); setShowCustomInput(false); setIsOpen(false) } }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:border-gray-400 transition-all duration-200 text-sm font-medium shadow-sm">
        <Globe className="w-4 h-4 text-gray-500" />
        <span className="max-w-[140px] truncate">{currentCity || t("selectCity")}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("popularCities")}</h3>
            <div className="grid grid-cols-2 gap-1">{popularCities.map((city) => (<button key={city.value} onClick={() => handleCitySelect(city.value)} className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors">{city.name}</button>))}</div>
          </div>
          <div className="p-4">
            {!showCustomInput ? (<button onClick={() => setShowCustomInput(true)} className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">{t("customCity")}</button>) : (
              <form onSubmit={handleCustomCitySubmit} className="space-y-3">
                <input type="text" value={customCity} onChange={(e) => setCustomCity(e.target.value)} placeholder={t("enterCityName")} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" autoFocus />
                <div className="flex gap-2">
                  <button type="submit" disabled={!customCity.trim()} className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{t("confirm")}</button>
                  <button type="button" onClick={() => { setShowCustomInput(false); setCustomCity("") }} className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">{t("cancel")}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
});

const ServiceCard = React.memo(({ service, locale, salonRating }: { service: ProcessedService; locale: string; salonRating?: any }) => {
  const t = useTranslations("search");
  const formatAddress = (fullAddress: string) => { if (!fullAddress) return ""; return fullAddress.split(",").slice(0, 2).join(",").trim() };

  return (
    <div className="border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors duration-200 group">
      <div className="flex items-start gap-4">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <Image src={service.imageUrl || "/placeholder.svg"} alt={service.name} fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/${locale}/services/${service.id}`}><h3 className="text-base font-semibold text-gray-900 group-hover:text-rose-600 line-clamp-2 mb-1">{service.name}</h3></Link>
          {service.salon && (
            <div className="mb-2">
              <p className="text-sm text-gray-600">{service.salon.name}・{formatAddress(service.salon.address)}</p>
              {salonRating && (
                <div className="flex items-center gap-2 mt-1">
                  <RatingDisplay rating={salonRating.averageRating} size="sm" />
                  <span className="text-xs text-gray-500">({salonRating.totalRatings} отзывов)</span>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="text-base font-bold text-gray-800">{service.price} ₽</div>
            <div className="text-sm text-gray-500">{service.durationMinutes} мин</div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ===================================================================================
// ОСНОВНОЙ КОМПОНЕНТ СТРАНИЦЫ
// ===================================================================================
export default function SearchPage() {
  const t = useTranslations("search");
  const locale = useParams().locale as string;

  const { getRatingStats } = useSalonRating();

  const [loading, setLoading] = useState(true);
  const [processedServices, setProcessedServices] = useState<ProcessedService[]>([]);
  const [allSalons, setAllSalons] = useState<AnySalon[]>([]);
  const [salonRatings, setSalonRatings] = useState<Record<string, any>>({});
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [userCity, setUserCity] = useState<string | null>(null);
  const [manualCity, setManualCity] = useState<string | null>(null);
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const currentCity = manualCity || userCity;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [rawSalons, rawServices] = await Promise.all([getAllSalons(), getAllSalonServices()]);
      const salonsList: AnySalon[] = Object.entries(rawSalons || {}).map(([id, s]: any) => ({ id, ...s }));
      const servicesList: AnyService[] = Object.entries(rawServices || {}).map(([id, s]: any) => ({ id, ...s }));
      const salonsById = Object.fromEntries(salonsList.map(s => [s.id, s]));
      
      const servicesWithDetails = await Promise.all(
        servicesList.map(async (service) => {
          const salon = salonsById[service.salonId];
          let imageUrl = "";
          try {
            const imgs = await getServiceImages(service.id);
            if (imgs && imgs.length > 0) imageUrl = imgs[0].url;
          } catch (e) { console.warn(`Failed to load images for service ${service.id}`, e) }
          return { ...service, salon: salon ? { id: salon.id, name: salon.name, address: salon.address } : null, imageUrl };
        })
      );
      
      setAllSalons(salonsList);
      setProcessedServices(servicesWithDetails);
      
      // Загружаем рейтинги для всех салонов
      const ratingsData: Record<string, any> = {};
      for (const salon of salonsList) {
        try {
          const stats = await getRatingStats(salon.id);
          ratingsData[salon.id] = stats;
        } catch (error) {
          console.warn(`Failed to load ratings for salon ${salon.id}`, error);
        }
      }
      setSalonRatings(ratingsData);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredServices = useMemo(() => {
    let filtered = processedServices;
    const qLower = debouncedQuery.trim().toLowerCase();
    if (qLower) filtered = filtered.filter(s => s.name.toLowerCase().includes(qLower) || s.description?.toLowerCase().includes(qLower));
    if (currentCity) filtered = filtered.filter(s => s.salon?.address.toLowerCase().includes(currentCity.toLowerCase()));
    if (selectedSalonId) filtered = filtered.filter(s => s.salon?.id === selectedSalonId);
    filtered = filtered.filter(s => s.isActive)
    return filtered;
  }, [processedServices, debouncedQuery, currentCity, selectedSalonId]);

  const salonsForMap = useMemo(() => {
    if (!currentCity) return allSalons;
    return allSalons.filter(s => s.address.toLowerCase().includes(currentCity.toLowerCase()));
  }, [allSalons, currentCity]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=${locale || "ru"}`);
          if (response.ok) {
            const data = await response.json();
            setUserCity(data.address?.city || data.address?.town || data.address?.village || t("unknownCity"));
          }
        } catch (error) { console.error("Error getting city name:", error) }
      },
      (error) => console.error("Geolocation error:", error)
    );
  }, [locale, t]);

  const handleCityChange = useCallback((city: string) => { setManualCity(city); setSelectedSalonId(null); }, []);
  const handleSalonClick = useCallback((salonId: string) => { setSelectedSalonId(salonId); setMobileView('list'); }, []);
  const clearAllFilters = useCallback(() => { setManualCity(null); setSelectedSalonId(null); setSearchQuery(""); }, []);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      {/* --- ЛЕВАЯ КОЛОНКА (СПИСОК И ФИЛЬТРЫ) --- */}
      <div className={`w-full md:w-2/5 lg:w-1/3 flex flex-col h-full bg-white border-r border-gray-200 ${mobileView === 'list' ? 'flex' : 'hidden'} md:flex`}>
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500" />
          </div>
          <div className="mt-3">
            <CitySelector currentCity={currentCity} onCityChange={handleCityChange} locale={locale} />
          </div>
        </div>
        
        {selectedSalonId && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-sm">
            <Store className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium flex-1 text-rose-800">{t("showingSalonServices", { salonName: allSalons.find(s => s.id === selectedSalonId)?.name || '' })}</span>
            <button onClick={() => setSelectedSalonId(null)} className="p-1 hover:bg-rose-100 rounded-full" title={t("clearSalonFilter")}><X className="w-4 h-4 text-rose-600" /></button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-500 p-10">{t("loading")}</div>
          ) : (
            filteredServices.length === 0 ? (
              <div className="text-center text-gray-500 p-10">
                <p className="font-medium">{t("noResults")}</p>
                <p className="text-sm mt-1">{currentCity ? t("noServicesInCityMessage", { city: currentCity }) : ""}</p>
              </div>
            ) : (
              <div>{filteredServices.map((service) => (
                <ServiceCard 
                  key={service.id} 
                  service={service} 
                  locale={locale} 
                  salonRating={service.salon ? salonRatings[service.salon.id] : undefined}
                />
              ))}</div>
            )
          )}
        </div>
      </div>

      {/* --- ПРАВАЯ КОЛОНКА (КАРТА) --- */}
      {/* --- ИЗМЕНЕНИЕ ЗДЕСЬ --- */}
      <div className={`flex-1 h-full min-w-0 ${mobileView === 'map' ? 'block' : 'hidden'} md:block`}>
        <SalonsMap salons={salonsForMap} onSalonClick={handleSalonClick} locale={locale} />
      </div>

      {/* --- ПЛАВАЮЩАЯ КНОПКА ДЛЯ МОБИЛЬНЫХ --- */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setMobileView(prev => prev === 'list' ? 'map' : 'list')}
          className="w-14 h-14 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-700 transition-all"
        >
          {mobileView === 'list' ? <MapIcon className="w-6 h-6" /> : <List className="w-6 h-6" />}
        </button>
      </div>
    </div>
  )
}