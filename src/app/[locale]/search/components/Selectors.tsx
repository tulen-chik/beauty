"use client"

import { ChevronDown, Filter, Globe, List, Map as MapIcon, Search, Star, Store, Tag, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import React, { useEffect, useRef, useState } from "react"

import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import RatingDisplay from "@/components/RatingDisplay"
import { SalonsMap } from "./SalonsMap"

// --- 1. ИМПОРТ СУЩЕСТВУЮЩИХ ТИПОВ ---
import type { Salon, SalonService, ServiceCategory } from "@/types/database"

// --- 2. ОБНОВЛЕННЫЙ ИНТЕРФЕЙС ДЛЯ ОБРАБОТАННЫХ ДАННЫХ ---
// Он расширяет официальный SalonService, добавляя поля для отображения
interface ProcessedService extends SalonService {
  salon: { id: string; name: string; address: string } | null
  imageUrl: string
  isPromoted?: boolean
  promotionEndDate?: string
  categoryName?: string
}

// --- КОНСТАНТЫ ---
const POPULAR_CITIES = [
  { name: "Минск", value: "Минск" }, { name: "Гомель", value: "Гомель" },
  { name: "Гродно", value: "Гродно" }, { name: "Брест", value: "Брест" },
  { name: "Витебск", value: "Витебск" },
]
const POPULAR_CITIES_EN = [
  { name: "Minsk", value: "Minsk" }, { name: "Gomel", value: "Gomel" },
  { name: "Grodno", value: "Grodno" }, { name: "Brest", value: "Brest" },
  { name: "Vitebsk", value: "Vitebsk" },
]


export const CitySelector = React.memo(({ currentCity, onCityChange, locale }: { currentCity: string | null; onCityChange: (city: string) => void; locale: string }) => {
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
CitySelector.displayName = 'CitySelector';

export const ServiceCard = React.memo(({ service, locale, salonRating }: { service: ProcessedService; locale: string; salonRating?: any }) => {
  const formatAddress = (fullAddress: string) => { if (!fullAddress) return ""; return fullAddress.split(",").slice(0, 2).join(",").trim() };

  return (
    <div className={`border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors duration-200 group relative ${service.isPromoted ? 'bg-gradient-to-r from-rose-50 to-pink-50 border-l-4 border-l-rose-400' : ''}`}>
      {service.isPromoted && (
        <div className="absolute top-2 right-2 bg-rose-400 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          Рекомендуем
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <Image src={service.imageUrl || "/service-placeholder.svg"} alt={service.name} fill className={service.imageUrl ? "object-cover" : "object-contain p-2"} />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/${locale}/services/${service.id}`}><h3 className="text-base font-semibold text-gray-900 group-hover:text-rose-600 line-clamp-2 mb-1">{service.name}</h3></Link>
          {service.categoryName && (
            <div className="flex items-center gap-1 mb-1">
              <Tag className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{service.categoryName}</span>
            </div>
          )}
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
            <div className="text-base font-bold text-gray-800">{service.price} Br</div>
            <div className="text-sm text-gray-500">{service.durationMinutes} мин</div>
          </div>
        </div>
      </div>
    </div>
  );
});
ServiceCard.displayName = 'ServiceCard';

// --- 3. ИНТЕРФЕЙС ПРОПСОВ ДЛЯ ПАНЕЛИ ФИЛЬТРОВ ---
interface SearchAndFilterPanelProps {
  mobileView: 'list' | 'map';
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  currentCity: string | null;
  handleCityChange: (city: string) => void;
  locale: string;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  selectedCategory: string | null;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string | null>>;
  sortBy: 'relevance' | 'price' | 'duration' | 'promoted';
  setSortBy: React.Dispatch<React.SetStateAction<'relevance' | 'price' | 'duration' | 'promoted'>>;
  categories: ServiceCategory[];
  selectedSalonId: string | null;
  allSalons: Salon[];
  setSelectedSalonId: React.Dispatch<React.SetStateAction<string | null>>;
  loading: boolean;
  geoLoading: boolean;
  filteredAndSortedServices: ProcessedService[];
  salonRatings: Record<string, any>;
  loaderRef: (node: HTMLDivElement | null) => void;
  isLoadingMore: boolean;
  hasMore: boolean;
  services: ProcessedService[];
}

export const SearchAndFilterPanel = ({
    mobileView, searchQuery, setSearchQuery, currentCity, handleCityChange, locale,
    showFilters, setShowFilters, selectedCategory, setSelectedCategory, sortBy, setSortBy,
    categories, selectedSalonId, allSalons, setSelectedSalonId, loading, geoLoading,
    filteredAndSortedServices, salonRatings, loaderRef, isLoadingMore, hasMore, services
}: SearchAndFilterPanelProps) => {
    const t = useTranslations("search");

    return (
        <div className={`w-full md:w-2/5 lg:w-1/3 flex flex-col h-full bg-white border-r border-gray-200 ${mobileView === 'list' ? 'flex' : 'hidden'} md:flex`}>
            <div className="p-4 border-b border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500" />
                </div>
                <div className="mt-3 flex gap-2">
                    <CitySelector currentCity={currentCity} onCityChange={handleCityChange} locale={locale} />
                    <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-3 border rounded-xl text-sm font-medium transition-all duration-200 shadow-sm ${showFilters || selectedCategory ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                        <Filter className="w-4 h-4" />
                        {t('filters')}
                        {selectedCategory && <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-xs">1</span>}
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('category')}</label>
                                <select value={selectedCategory || ''} onChange={(e) => setSelectedCategory(e.target.value || null)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500">
                                    <option value="">{t('allCategories')}</option>
                                    {/* 4. Типизация элемента 'category' */}
                                    {categories.map((category: ServiceCategory) => (<option key={category.id} value={category.id}>{category.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('sortBy')}</label>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500">
                                    <option value="promoted">{t('promoted')}</option>
                                    <option value="relevance">{t('relevance')}</option>
                                    <option value="price">{t('priceAsc')}</option>
                                    <option value="duration">{t('durationAsc')}</option>
                                </select>
                            </div>
                            {(selectedCategory || sortBy !== 'promoted') && (<button onClick={() => { setSelectedCategory(null); setSortBy('promoted'); }} className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">{t('clearFilters')}</button>)}
                        </div>
                    </div>
                )}
            </div>

            {(selectedSalonId || selectedCategory) && (
                <div className="p-3 bg-rose-50 border-b border-rose-200">
                    <div className="flex flex-wrap gap-2">
                        {/* 5. Типизация элемента 's' и 'c' */}
                        {selectedSalonId && (<div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm border border-rose-200"><Store className="w-3 h-3 text-rose-600" /><span className="text-rose-800 font-medium">{allSalons.find((s: Salon) => s.id === selectedSalonId)?.name || ''}</span><button onClick={() => setSelectedSalonId(null)} className="p-0.5 hover:bg-rose-100 rounded-full"><X className="w-3 h-3 text-rose-600" /></button></div>)}
                        {selectedCategory && (<div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm border border-rose-200"><Tag className="w-3 h-3 text-rose-600" /><span className="text-rose-800 font-medium">{categories.find((c: ServiceCategory) => c.id === selectedCategory)?.name || ''}</span><button onClick={() => setSelectedCategory(null)} className="p-0.5 hover:bg-rose-100 rounded-full"><X className="w-3 h-3 text-rose-600" /></button></div>)}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {loading || geoLoading ? (
                    <div className="text-center text-gray-500 p-10"><LoadingSpinner /></div>
                ) : (
                    filteredAndSortedServices.length === 0 ? (
                        <div className="text-center text-gray-500 p-10">
                            <p className="font-medium">{t("noResults")}</p>
                            <p className="text-sm mt-1">{t("tryChangingFilters")}</p>
                        </div>
                    ) : (
                        <div>
                            {filteredAndSortedServices.map((service: ProcessedService) => (
                                <ServiceCard key={service.id} service={service} locale={locale} salonRating={service.salon ? salonRatings[service.salon.id] : undefined} />
                            ))}
                            <div ref={loaderRef} className="h-10 flex justify-center items-center">
                                {isLoadingMore && <LoadingSpinner />}
                                {!hasMore && services.length > 0 && <p className="text-sm text-gray-500">{t("noMoreServices")}</p>}
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

// --- 6. ИНТЕРФЕЙС ПРОПСОВ ДЛЯ ПАНЕЛИ КАРТЫ ---
interface MapPanelProps {
  mobileView: 'list' | 'map';
  salonsForMap: Salon[];
  handleSalonClick: (salonId: string) => void;
  locale: string;
  position: { latitude: number; longitude: number } | null;
}

export const MapPanel = ({ mobileView, salonsForMap, handleSalonClick, locale, position }: MapPanelProps) => {
    return (
        <div className={`flex-1 h-full min-w-0 ${mobileView === 'map' ? 'block' : 'hidden'} md:block`}>
            <SalonsMap salons={salonsForMap} onSalonClick={handleSalonClick} locale={locale} userPosition={position} />
        </div>
    );
};

// --- 7. ИНТЕРФЕЙС ПРОПСОВ ДЛЯ МОБИЛЬНОГО ПЕРЕКЛЮЧАТЕЛЯ ---
interface MobileViewToggleProps {
  mobileView: 'list' | 'map';
  setMobileView: React.Dispatch<React.SetStateAction<'list' | 'map'>>;
}

export const MobileViewToggle = ({ mobileView, setMobileView }: MobileViewToggleProps) => {
    return (
        <div className="md:hidden fixed bottom-6 right-6 z-50">
            {/* 8. Типизация 'prev' в колбэке */}
            <button onClick={() => setMobileView((prev: 'list' | 'map') => prev === 'list' ? 'map' : 'list')} className="w-14 h-14 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-700 transition-all">
                {mobileView === 'list' ? <MapIcon className="w-6 h-6" /> : <List className="w-6 h-6" />}
            </button>
        </div>
    );
};