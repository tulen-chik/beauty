"use client"

import { ChevronDown, Filter, Globe, List, Map as MapIcon, Scissors, Search, Star, Store, Tag, X, Check } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import React, { useEffect, useRef, useState } from "react"

import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import RatingDisplay from "@/components/RatingDisplay"
import { SalonsMap } from "./SalonsMap"

import type { Salon, SalonService, ServiceCategory } from "@/types/database"

interface ProcessedService extends SalonService {
  salon: { id: string; name: string; address: string } | null
  imageUrl: string
  isPromoted?: boolean
  promotionEndDate?: string
  categoryName?: string
}

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
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`flex items-center gap-2 px-4 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md ${isOpen ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-200 hover:border-rose-300'}`}
      >
        <Globe className={`w-4 h-4 ${isOpen ? 'text-rose-500' : 'text-slate-400'}`} />
        <span className="max-w-[120px] truncate text-slate-700">{currentCity || t("selectCity")}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 bg-slate-50/50 border-b border-slate-100">
            <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("popularCities")}</h3>
            <div className="grid grid-cols-2 gap-1">
              {popularCities.map((city) => (
                <button 
                  key={city.value} 
                  onClick={() => handleCitySelect(city.value)} 
                  className={`text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between group ${currentCity === city.value ? 'bg-rose-50 text-rose-700 font-medium' : 'text-slate-700 hover:bg-white hover:shadow-sm'}`}
                >
                  {city.name}
                  {currentCity === city.value && <Check className="w-3 h-3 text-rose-500" />}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3">
            {!showCustomInput ? (
              <button 
                onClick={() => setShowCustomInput(true)} 
                className="w-full text-left px-3 py-2.5 text-sm text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {t("customCity")}
              </button>
            ) : (
              <form onSubmit={handleCustomCitySubmit} className="space-y-2">
                <input 
                  type="text" 
                  value={customCity} 
                  onChange={(e) => setCustomCity(e.target.value)} 
                  placeholder={t("enterCityName")} 
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" 
                  autoFocus 
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={!customCity.trim()} className="flex-1 px-3 py-1.5 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors">{t("confirm")}</button>
                  <button type="button" onClick={() => { setShowCustomInput(false); setCustomCity("") }} className="flex-1 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">{t("cancel")}</button>
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
    <Link href={`/${locale}/services/${service.id}`}>
      <div className={`relative p-4 border-b border-slate-100 hover:bg-slate-50/80 transition-all duration-300 group ${service.isPromoted ? 'bg-gradient-to-r from-rose-50/40 to-transparent' : ''}`}>
        {service.isPromoted && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-current" />
            TOP
          </div>
        )}
        
        <div className="flex items-start gap-4">
          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
            {service.imageUrl ? (
              <Image
                src={service.imageUrl}
                alt={service.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 25vw, 15vw"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-slate-300 bg-slate-50">
                <Scissors className="w-8 h-8" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 py-0.5">
            <div className="flex flex-col h-full justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2 mb-1.5 leading-tight">
                  {service.name}
                </h3>
                
                {service.categoryName && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {service.categoryName}
                    </span>
                  </div>
                )}
                
                {service.salon && (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{service.salon.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate pl-5">{formatAddress(service.salon.address)}</p>
                    
                    {salonRating && (
                      <div className="flex items-center gap-1.5 mt-1 pl-5">
                        <RatingDisplay rating={salonRating.averageRating} size="sm" />
                        <span className="text-xs text-slate-400 font-medium">({salonRating.totalRatings})</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between mt-3 pt-3 border-t border-slate-100 border-dashed">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                  {service.durationMinutes} мин
                </div>
                <div className="text-lg font-bold text-rose-600">
                  {service.price} <span className="text-sm font-medium text-rose-400">Br</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});
ServiceCard.displayName = 'ServiceCard';

export const ServiceCardSkeleton = () => (
    <div className="border-b border-slate-100 p-4">
        <div className="flex items-start gap-4 animate-pulse">
            <div className="w-24 h-24 rounded-xl bg-slate-200 flex-shrink-0"></div>
            <div className="flex-1 min-w-0 space-y-3 py-1">
                <div className="h-5 bg-slate-200 rounded-lg w-3/4"></div>
                <div className="flex gap-2">
                    <div className="h-4 bg-slate-100 rounded w-16"></div>
                </div>
                <div className="space-y-2 pt-1">
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-50 rounded w-1/3"></div>
                </div>
                <div className="flex items-center justify-between pt-2">
                    <div className="h-6 bg-slate-100 rounded w-16"></div>
                    <div className="h-6 bg-slate-200 rounded w-20"></div>
                </div>
            </div>
        </div>
    </div>
);

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
        <div className={`w-full md:w-[420px] lg:w-[480px] flex-shrink-0 flex flex-col h-full bg-white border-r border-slate-200 shadow-xl shadow-slate-200/50 z-20 ${mobileView === 'list' ? 'flex' : 'hidden'} md:flex`}>
            <div className="p-4 border-b border-slate-100 bg-white z-10">
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                    <input 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        placeholder={t("searchPlaceholder")} 
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-slate-400" 
                    />
                </div>
                
                <div className="mt-3 flex gap-2">
                    <CitySelector currentCity={currentCity} onCityChange={handleCityChange} locale={locale} />
                    <button 
                        onClick={() => setShowFilters(!showFilters)} 
                        className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md ${showFilters || selectedCategory ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600'}`}
                    >
                        <Filter className="w-4 h-4" />
                        {t('filters')}
                        {selectedCategory && <span className="flex items-center justify-center w-5 h-5 bg-rose-600 text-white text-[10px] font-bold rounded-full ml-1">1</span>}
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t('category')}</label>
                                <div className="relative">
                                    <select 
                                        value={selectedCategory || ''} 
                                        onChange={(e) => setSelectedCategory(e.target.value || null)} 
                                        className="w-full appearance-none px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all text-slate-700"
                                    >
                                        <option value="">{t('allCategories')}</option>
                                        {categories.map((category: ServiceCategory) => (<option key={category.id} value={category.id}>{category.name}</option>))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t('sortBy')}</label>
                                <div className="relative">
                                    <select 
                                        value={sortBy} 
                                        onChange={(e) => setSortBy(e.target.value as any)} 
                                        className="w-full appearance-none px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all text-slate-700"
                                    >
                                        <option value="promoted">{t('promoted')}</option>
                                        <option value="relevance">{t('relevance')}</option>
                                        <option value="price">{t('priceAsc')}</option>
                                        <option value="duration">{t('durationAsc')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            {(selectedCategory || sortBy !== 'promoted') && (
                                <button 
                                    onClick={() => { setSelectedCategory(null); setSortBy('promoted'); }} 
                                    className="w-full px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    {t('clearFilters')}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {(selectedSalonId || selectedCategory) && (
                <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex flex-wrap gap-2">
                        {selectedSalonId && (
                            <div className="flex items-center gap-2 bg-white pl-3 pr-1 py-1 rounded-full text-xs font-medium border border-rose-100 text-rose-700 shadow-sm animate-in fade-in zoom-in-95">
                                <Store className="w-3 h-3" />
                                <span className="max-w-[150px] truncate">{allSalons.find((s: Salon) => s.id === selectedSalonId)?.name || ''}</span>
                                <button onClick={() => setSelectedSalonId(null)} className="p-1 hover:bg-rose-50 rounded-full transition-colors"><X className="w-3 h-3" /></button>
                            </div>
                        )}
                        {selectedCategory && (
                            <div className="flex items-center gap-2 bg-white pl-3 pr-1 py-1 rounded-full text-xs font-medium border border-rose-100 text-rose-700 shadow-sm animate-in fade-in zoom-in-95">
                                <Tag className="w-3 h-3" />
                                <span className="max-w-[150px] truncate">{categories.find((c: ServiceCategory) => c.id === selectedCategory)?.name || ''}</span>
                                <button onClick={() => setSelectedCategory(null)} className="p-1 hover:bg-rose-50 rounded-full transition-colors"><X className="w-3 h-3" /></button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto scroll-smooth bg-white">
                {loading || geoLoading ? (
                    <div>
                        {[...Array(6)].map((_, i) => <ServiceCardSkeleton key={i} />)}
                    </div>
                ) : (
                    filteredAndSortedServices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="font-semibold text-slate-900">{t("noResults")}</p>
                            <p className="text-sm text-slate-500 mt-1 max-w-[200px]">{t("tryChangingFilters")}</p>
                        </div>
                    ) : (
                        <div>
                            {filteredAndSortedServices.map((service: ProcessedService) => (
                                <ServiceCard key={service.id} service={service} locale={locale} salonRating={service.salon ? salonRatings[service.salon.id] : undefined} />
                            ))}
                            <div ref={loaderRef} className="h-16 flex justify-center items-center">
                                {isLoadingMore && <LoadingSpinner />}
                                {!hasMore && services.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        <div className="w-8 h-px bg-slate-200"></div>
                                        {t("noMoreServices")}
                                        <div className="w-8 h-px bg-slate-200"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

interface MapPanelProps {
  mobileView: 'list' | 'map';
  salonsForMap: Salon[];
  handleSalonClick: (salonId: string) => void;
  locale: string;
  position: { latitude: number; longitude: number } | null;
}

export const MapPanel = ({ mobileView, salonsForMap, handleSalonClick, locale, position }: MapPanelProps) => {
    return (
        <div className={`flex-1 h-full min-w-0 relative ${mobileView === 'map' ? 'block' : 'hidden'} md:block`}>
            <SalonsMap salons={salonsForMap} onSalonClick={handleSalonClick} locale={locale} userPosition={position} />
            {/* Gradient overlay for desktop to smooth transition from list to map */}
            <div className="hidden md:block absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/5 to-transparent pointer-events-none z-10"></div>
        </div>
    );
};

interface MobileViewToggleProps {
  mobileView: 'list' | 'map';
  setMobileView: React.Dispatch<React.SetStateAction<'list' | 'map'>>;
}

export const MobileViewToggle = ({ mobileView, setMobileView }: MobileViewToggleProps) => {
    return (
        <div className="md:hidden fixed bottom-6 right-6 z-50">
            <button 
                onClick={() => setMobileView((prev: 'list' | 'map') => prev === 'list' ? 'map' : 'list')} 
                className="group relative w-14 h-14 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-600/30 hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all duration-300"
            >
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-active:opacity-100"></div>
                {mobileView === 'list' ? <MapIcon className="w-6 h-6" /> : <List className="w-6 h-6" />}
            </button>
        </div>
    );
};