"use client"

import type React from "react"

import { useEffect, useMemo, useState, useRef } from "react"
// ИЗМЕНЕНИЕ ЗДЕСЬ: Переименовываем иконку Map в MapIcon
import { Search, MapPin, Scissors, Map as MapIcon, X, ChevronDown, Globe, Store } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { getAllSalons, getAllSalonServices, getServiceImages } from "@/lib/firebase/database"
import { useTranslations } from "next-intl"

type AnySalon = {
  id: string
  name: string
  address: string
  description?: string
  settings?: {
    business?: {
      coordinates?: {
        lat: number
        lng: number
      }
    }
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
  { name: "Москва", value: "Москва" },
  { name: "Санкт-Петербург", value: "Санкт-Петербург" },
  { name: "Новосибирск", value: "Новосибирск" },
  { name: "Екатеринбург", value: "Екатеринбург" },
  { name: "Казань", value: "Казань" },
  { name: "Нижний Новгород", value: "Нижний Новгород" },
  { name: "Челябинск", value: "Челябинск" },
  { name: "Самара", value: "Самара" },
  { name: "Ростов-на-Дону", value: "Ростов-на-Дону" },
  { name: "Уфа", value: "Уфа" },

  // Беларусь
  { name: "Минск", value: "Минск" },
  { name: "Гомель", value: "Гомель" },
  { name: "Могилёв", value: "Могилёв" },
  { name: "Витебск", value: "Витебск" },
  { name: "Гродно", value: "Гродно" },
  { name: "Брест", value: "Брест" },
]
// Popular cities for English locale
const POPULAR_CITIES_EN = [
  // Russia
  { name: "Moscow", value: "Moscow" },
  { name: "Saint Petersburg", value: "Saint Petersburg" },
  { name: "Novosibirsk", value: "Novosibirsk" },
  { name: "Yekaterinburg", value: "Yekaterinburg" },
  { name: "Kazan", value: "Kazan" },
  { name: "Nizhny Novgorod", value: "Nizhny Novgorod" },
  { name: "Chelyabinsk", value: "Chelyabinsk" },
  { name: "Samara", value: "Samara" },
  { name: "Rostov-on-Don", value: "Rostov-on-Don" },
  { name: "Ufa", value: "Ufa" },

  // Belarus
  { name: "Minsk", value: "Minsk" },
  { name: "Gomel", value: "Gomel" },
  { name: "Mogilev", value: "Mogilev" },
  { name: "Vitebsk", value: "Vitebsk" },
  { name: "Grodno", value: "Grodno" },
  { name: "Brest", value: "Brest" },
]

// City selector component
const CitySelector = ({
  currentCity,
  onCityChange,
  locale,
}: {
  currentCity: string | null
  onCityChange: (city: string) => void
  locale: string
}) => {
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

  const handleCitySelect = (city: string) => {
    onCityChange(city)
    setIsOpen(false)
    setShowCustomInput(false)
    setCustomCity("")
  }

  const handleCustomCitySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customCity.trim()) {
      onCityChange(customCity.trim())
      setCustomCity("")
      setShowCustomInput(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 text-sm font-medium shadow-sm"
      >
        <Globe className="w-4 h-4" />
        <span className="max-w-[140px] truncate">{currentCity || t("selectCity")}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("popularCities")}</h3>
            <div className="grid grid-cols-2 gap-1">
              {popularCities.map((city) => (
                <button
                  key={city.value}
                  onClick={() => handleCitySelect(city.value)}
                  className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors duration-150"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150 font-medium"
              >
                {t("customCity")}
              </button>
            ) : (
              <form onSubmit={handleCustomCitySubmit} className="space-y-3">
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder={t("enterCityName")}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!customCity.trim()}
                    className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                  >
                    {t("confirm")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false)
                      setCustomCity("")
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                  >
                    {t("cancel")}
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

  const getSalonsCountText = (count: number) => {
    if (locale === "ru") {
      const lastDigit = count % 10
      const lastTwoDigits = count % 100
      if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return `${count} салонов`
      if (lastDigit === 1) return `${count} салон`
      if (lastDigit >= 2 && lastDigit <= 4) return `${count} салона`
      return `${count} салонов`
    }
    return count === 1 ? `${count} salon` : `${count} salons`
  }

  const loadGoogleMaps = () => {
    if (window.google?.maps) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const scriptId = "google-maps-script"
      if (document.getElementById(scriptId)) {
        setTimeout(() => {
          if (window.google?.maps) resolve()
          else reject(new Error("Script element exists, but google.maps is not available."))
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

      const timeout = setTimeout(() => {
        script.remove()
        reject(new Error("Google Maps loading timeout"))
      }, 15000)

      script.onload = () => {
        clearTimeout(timeout)
        resolve()
      }

      script.onerror = () => {
        clearTimeout(timeout)
        script.remove()
        reject(new Error("Failed to load Google Maps script"))
      }

      document.head.appendChild(script)
    })
  }

  const initializeMap = async () => {
    setMapLoading(true)
    setMapError(null)

    try {
      await loadGoogleMaps()

      if (!isMounted.current || !mapRef.current) {
        return
      }

      if (!window.google?.maps) {
        throw new Error("Google Maps API not available after script load.")
      }

      const salonsWithCoords = salons.filter((s) => s.settings?.business?.coordinates)
      let center = { lat: 55.7558, lng: 37.6176 }

      if (salonsWithCoords.length > 0) {
        const totalLat = salonsWithCoords.reduce((sum, s) => sum + (s.settings?.business?.coordinates?.lat || 0), 0)
        const totalLng = salonsWithCoords.reduce((sum, s) => sum + (s.settings?.business?.coordinates?.lng || 0), 0)
        center = {
          lat: totalLat / salonsWithCoords.length,
          lng: totalLng / salonsWithCoords.length,
        }
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

      if (!mapRef.current) {
        throw new Error("Map container became null right before map instantiation.")
      }

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions)

      const newMarkers: google.maps.Marker[] = []
      salonsWithCoords.forEach((salon) => {
        const coords = salon.settings?.business?.coordinates
        if (coords) {
          const icon = {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 0C10.7157 0 4 6.71573 4 15C4 23.2843 19 38 19 38C19 38 34 23.2843 34 15C34 6.71573 27.2843 0 19 0Z" fill="#DC2626"/>
                <circle cx="19" cy="15" r="6" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(38, 38),
            anchor: new window.google.maps.Point(19, 38),
          }

          const markerOptions: google.maps.MarkerOptions = {
            position: coords,
            map: newMap,
            title: salon.name,
            icon: icon as any,
          }

          const marker = new window.google.maps.Marker(markerOptions)

          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div class="p-1 font-sans"><h3 class="font-semibold text-gray-900">${salon.name}</h3><p class="text-sm text-gray-600">${salon.address}</p></div>`,
          })

          marker.addListener("mouseover", () => infoWindow.open(newMap, marker))
          marker.addListener("mouseout", () => infoWindow.close())
          marker.addListener("click", () => onSalonClick(salon.id))
          newMarkers.push(marker)
        }
      })

      if (isMounted.current) {
        setMarkers((prevMarkers) => {
          prevMarkers.forEach((m) => m.setMap(null))
          return newMarkers
        })
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred during map initialization."
      console.error("Map Initialization Failed:", error)
      if (isMounted.current) {
        setMapError(errorMessage)
      }
    } finally {
      if (isMounted.current) {
        setMapLoading(false)
      }
    }
  }

  if (mapLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapIcon className="h-4 w-4" />
            <span>{t("mapTitle")}</span>
          </div>
        </div>
        <div className="w-full h-64 sm:h-80 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm">{t("loadingMap")}</p>
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
            <MapIcon className="h-4 w-4" />
            <span>{t("mapTitle")}</span>
          </div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-800 text-sm font-medium mb-2">Не удалось загрузить карту</p>
          <p className="text-red-700 text-xs mb-4">Ошибка: {mapError}</p>

          {mapError.includes("API key") && (
            <div className="mt-2 text-red-600 text-xs text-left bg-red-100 p-2 rounded">
              <p className="font-semibold">Похоже, проблема с ключом Google Maps API:</p>
              <ol className="mt-1 ml-4 list-decimal space-y-1">
                <li>
                  Убедитесь, что в файле <code className="bg-red-200 px-1 rounded">.env.local</code> есть строка{" "}
                  <code className="bg-red-200 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...</code>
                </li>
                <li>
                  Проверьте, что ключ действителен и для него включены "Maps JavaScript API" и "Places API" в Google
                  Cloud Console.
                </li>
              </ol>
            </div>
          )}

          <button
            onClick={initializeMap}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  const salonsWithCoords = salons.filter((s) => s.settings?.business?.coordinates)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <MapIcon className="h-4 w-4" />
          <span>{t("mapTitle")}</span>
        </div>
        <span className="text-xs text-gray-500">{getSalonsCountText(salonsWithCoords.length)}</span>
      </div>

      {salonsWithCoords.length === 0 ? (
        <div className="w-full h-64 sm:h-80 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">{t("noSalonsWithCoordinates")}</p>
          </div>
        </div>
      ) : (
        <>
          <div ref={mapRef} className="w-full h-64 sm:h-80 rounded-lg border border-gray-300" />
          <p className="text-xs text-gray-500 text-center">{t("mapInstructions")}</p>
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  const t = useTranslations("search")
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

  const currentCity = manualCity || userCity

  const formatAddress = (fullAddress: string) => {
    if (!fullAddress) return ""
    const parts = fullAddress.split(",")
    return parts.slice(0, 2).join(",").trim()
  }

  const getServicesCountText = (count: number) => {
    if (locale === "ru") {
      const lastDigit = count % 10
      const lastTwoDigits = count % 100
      if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "услуг"
      if (lastDigit === 1) return "услуга"
      if (lastDigit >= 2 && lastDigit <= 4) return "услуги"
      return "услуг"
    }
    return count === 1 ? "service" : "services"
  }

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=${locale || "ru"}`,
          )
          if (response.ok) {
            const data = await response.json()
            const cityName = data.address?.city || data.address?.town || data.address?.village || t("unknownCity")
            setUserCity(cityName)
          }
        } catch (error) {
          console.error("Error getting city name:", error)
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
      },
    )
  }, [locale, t])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [rawSalons, rawServices] = await Promise.all([getAllSalons(), getAllSalonServices()])
      const salonsList: AnySalon[] = Object.entries(rawSalons || {}).map(([id, s]: any) => ({ id, ...s }))
      const servicesList: AnyService[] = Object.entries(rawServices || {}).map(([id, s]: any) => ({ id, ...s }))
      setSalons(salonsList)
      setServices(servicesList)
      setLoading(false)
    }
    load()
  }, [])

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
              console.warn(`Failed to load images for service ${s.id}`, e)
            }
            return [s.id, ""] as const
          }),
        )
        if (isCancelled) return
        const map: Record<string, string> = {}
        for (const [id, url] of entries) {
          if (url) map[id] = url
        }
        setServiceImages(map)
      } catch (e) {
        console.warn("Failed to fetch images for services", e)
      }
    }
    if (services.length > 0) {
      fetchImages()
    }
    return () => {
      isCancelled = true
    }
  }, [services])

  const qLower = q.trim().toLowerCase()

  const filteredServices = useMemo(() => {
    let filtered = services
    if (qLower) {
      filtered = filtered.filter((s) =>
        [s.name, s.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(qLower)),
      )
    }
    if (currentCity) {
      const cityLower = currentCity.toLowerCase()
      const salonsInCity = new Set(
        salons.filter((sal) => sal.address.toLowerCase().includes(cityLower)).map((sal) => sal.id),
      )
      filtered = filtered.filter((s) => salonsInCity.has(s.salonId))
    }
    if (selectedSalonId) {
      filtered = filtered.filter((s) => s.salonId === selectedSalonId)
    }
    return filtered
  }, [qLower, services, salons, currentCity, selectedSalonId])

  const salonsById = useMemo(() => Object.fromEntries(salons.map((s) => [s.id, s])), [salons])

  const handleSalonClick = (salonId: string) => {
    setSelectedSalonId(salonId)
    setShowMap(false)
  }

  const handleCityChange = (city: string) => {
    setManualCity(city)
    setSelectedSalonId(null)
  }

  const clearAllFilters = () => {
    setManualCity(null)
    setSelectedSalonId(null)
    setQ("")
  }

  const hasActiveFilters = manualCity || selectedSalonId || q.trim()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-8 sm:mb-10">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{t("title")}</h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{t("subtitle")}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-center">
            <CitySelector currentCity={currentCity} onCityChange={handleCityChange} locale={locale} />

            {currentCity && (
              <div className="flex items-center gap-3 text-sm text-gray-600 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 shadow-sm">
                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="font-medium">
                  {manualCity ? t("showingInCity", { city: currentCity }) : t("detectedCity", { city: currentCity })}
                </span>
                {manualCity && (
                  <button
                    onClick={() => setManualCity(null)}
                    className="ml-2 p-1 hover:bg-blue-100 rounded-full transition-colors duration-200"
                    title={t("clearCitySelection")}
                  >
                    <X className="w-4 h-4 text-blue-600" />
                  </button>
                )}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700">{t("activeFilters")}:</span>
                <div className="flex flex-wrap gap-2">
                  {q.trim() && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                      <Search className="w-3 h-3" />"{q.trim()}"
                    </span>
                  )}
                  {manualCity && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                      <Globe className="w-3 h-3" />
                      {manualCity}
                    </span>
                  )}
                  {selectedSalonId && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-100 text-rose-700 text-sm rounded-full font-medium">
                      <Store className="w-3 h-3" />
                      {salonsById[selectedSalonId]?.name}
                    </span>
                  )}
                </div>
                <button
                  onClick={clearAllFilters}
                  className="ml-auto px-4 py-1.5 text-sm bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors duration-200 font-medium"
                >
                  {t("clearAll")}
                </button>
              </div>
            </div>
          )}

          {selectedSalonId && (
            <div className="mt-4 flex items-center gap-3 text-sm text-gray-600 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 shadow-sm">
              <Store className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="font-medium flex-1">
                {t("showingSalonServices", { salonName: salonsById[selectedSalonId]?.name })}
              </span>
              <button
                onClick={() => setSelectedSalonId(null)}
                className="p-1 hover:bg-rose-100 rounded-full transition-colors duration-200"
                title={t("clearSalonFilter")}
              >
                <X className="w-4 h-4 text-rose-600" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none text-gray-900 text-base transition-all duration-200 shadow-sm"
              />
            </div>

            <button
              onClick={() => setShowMap(!showMap)}
              className={`px-6 py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 shadow-sm ${
                showMap
                  ? "bg-gray-600 text-white hover:bg-gray-700 hover:shadow-md"
                  : "bg-rose-600 text-white hover:bg-rose-700 hover:shadow-md"
              }`}
            >
              <MapIcon className="w-5 h-5" />
              <span className="hidden sm:inline font-semibold">{showMap ? t("hideMap") : t("showMap")}</span>
              <span className="sm:hidden text-lg">{showMap ? "✕" : "🗺️"}</span>
            </button>
          </div>
        </div>

        {showMap && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-lg">
            <SalonsMap
              salons={salons.filter((s) => {
                if (!currentCity) return true
                return s.address.toLowerCase().includes(currentCity.toLowerCase())
              })}
              onSalonClick={handleSalonClick}
              locale={locale}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-500 py-16">
            <div className="animate-spin h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
            <p className="text-base font-medium">{t("loading")}</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
              <div className="p-2 bg-rose-100 rounded-lg">
                <Scissors className="w-6 h-6 text-rose-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t("servicesTitle")}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredServices.length} {getServicesCountText(filteredServices.length)}
                </p>
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scissors className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-base font-medium">
                  {currentCity ? t("noServicesInCityMessage", { city: currentCity }) : t("noResults")}
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredServices.map((s) => {
                  const salon = salonsById[s.salonId]
                  return (
                    <div
                      key={s.id}
                      className="border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-300 group"
                    >
                      <div className="flex items-start gap-5">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                          <Image
                            src={serviceImages[s.id] || "/placeholder.svg"}
                            alt={s.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <Link href={`/${locale}/book/${s.id}`}>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-rose-600 transition-colors duration-200 line-clamp-2 mb-3">
                              {s.name}
                            </h3>
                          </Link>

                          {salon && (
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-1 bg-rose-100 rounded-md">
                                  <Store className="w-3 h-3 text-rose-600" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">{salon.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="p-1 bg-rose-100 rounded-md">
                                  <MapPin className="w-3 h-3 text-rose-600" />
                                </div>
                                <span className="text-sm text-gray-600">{formatAddress(salon.address)}</span>
                              </div>
                            </div>
                          )}

                          {s.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{s.description}</p>
                          )}

                          <div className="flex items-center justify-between mb-5">
                            <div className="text-xl sm:text-2xl font-bold text-rose-600">{s.price} ₽</div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              {s.durationMinutes} мин
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                        <Link
                          href={`/${locale}/book/${s.id}`}
                          className="flex-1 bg-rose-600 text-white text-center py-3 px-6 rounded-xl hover:bg-rose-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                        >
                          {t("book")}
                        </Link>
                        <Link
                          href={`/${locale}/services/${s.id}`}
                          className="px-6 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-center whitespace-nowrap shadow-sm"
                        >
                          {t("details")}
                        </Link>
                        {salon && (
                          <Link
                            href={`/${locale}/s/${salon.id}`}
                            className="px-6 py-3 text-rose-600 border border-rose-300 rounded-xl hover:bg-rose-50 hover:border-rose-400 transition-all duration-200 font-medium text-center whitespace-nowrap shadow-sm"
                          >
                            {t("aboutSalon")}
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