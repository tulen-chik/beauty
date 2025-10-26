"use client"

import { useParams } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

// --- ИМПОРТЫ КОНТЕКСТОВ И ВСПОМОГАТЕЛЬНЫХ КОМПОНЕНТОВ ---
import { getServiceImages } from "@/lib/firebase/database"
import { useSalonRating, useGeolocation, useSalon } from "@/contexts"
import { usePromotion } from "@/contexts/PromotionContext"
import { useServiceCategory } from "@/contexts/ServiceCategoryContext"
import { useSalonService } from "@/contexts/SalonServiceContext"
import { MobileViewToggle } from "./components/Selectors"
import { SearchAndFilterPanel } from "./components/Selectors"
import { MapPanel } from "./components/Selectors"

// --- ИМПОРТ ТИПОВ ДАННЫХ ---
import type { Salon, SalonService, ServiceCategory } from "@/types/database"; // Используем существующие типы

// --- НОВЫЙ ТИП ДЛЯ ОБРАБОТАННЫХ ДАННЫХ ---
interface ProcessedService extends SalonService {
  salon: { id: string; name: string; address: string } | null;
  imageUrl: string;
  isPromoted?: boolean;
  promotionEndDate?: string;
  categoryName?: string;
}

// --- КОНСТАНТЫ ---
const DEBOUNCE_DELAY = 300;
const PAGE_SIZE = 15;
const SALON_PAGE_SIZE = 50;


export default function SearchPage() {
  const locale = useParams().locale as string;

  // --- ИСПОЛЬЗОВАНИЕ КОНТЕКСТОВ ---
  const { getRatingStats } = useSalonRating();
  const { findActiveServicePromotion } = usePromotion();
  const { getCategoriesBySalon } = useServiceCategory();
  const { getServicesByCity, getServicesBySalon } = useSalonService();
  const { city: userCity, position, loading: geoLoading } = useGeolocation();
  const { fetchSalonsByCity } = useSalon();

  // --- СОСТОЯНИЯ (с обновленными типами) ---
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const [services, setServices] = useState<ProcessedService[]>([]);
  const [nextKey, setNextKey] = useState<string | null | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  const [allSalons, setAllSalons] = useState<Salon[]>([]);
  const [salonsById, setSalonsById] = useState<Record<string, Salon>>({});
  const [salonRatings, setSalonRatings] = useState<Record<string, any>>({});
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoriesById, setCategoriesById] = useState<Record<string, ServiceCategory>>({});
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [manualCity, setManualCity] = useState<string | null>(null);
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'price' | 'duration' | 'promoted'>('promoted');
  
  const [showFilters, setShowFilters] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  
  const currentCity = manualCity || userCity;
  
  // --- ЛОГИКА ЗАГРУЗКИ ДАННЫХ ---
  const observer = useRef<IntersectionObserver>();
  const loaderRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchServices(true);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, isLoadingMore, hasMore]);

  useEffect(() => {
    const loadDataForCity = async () => {
      if (!currentCity) return;

      setLoading(true);
      setServices([]);
      setNextKey(undefined);
      setHasMore(true);

      try {
        let accumulatedSalons: Salon[] = [];
        let currentSalonNextKey: string | undefined = undefined;
        let hasMoreSalons = true;

        while (hasMoreSalons) {
          // --- ИСПРАВЛЕНИЕ ---
          // 1. Получаем результат в одну переменную с явным типом.
          const response: { salons: Salon[]; nextKey: string | null } = await fetchSalonsByCity({
            city: currentCity,
            limit: SALON_PAGE_SIZE,
            startAfterKey: currentSalonNextKey,
          });

          // 2. Теперь безопасно используем свойства из этой переменной.
          accumulatedSalons = [...accumulatedSalons, ...response.salons];
          currentSalonNextKey = response.nextKey ?? undefined;
          hasMoreSalons = !!response.nextKey;
        }

        setAllSalons(accumulatedSalons);

        const salonsMap = Object.fromEntries(accumulatedSalons.map(s => [s.id, s]));
        setSalonsById(salonsMap);

        const ratingsData: Record<string, any> = {};
        for (const salon of accumulatedSalons) {
          try { ratingsData[salon.id] = await getRatingStats(salon.id); } 
          catch (error) { console.warn(`Failed to load ratings for salon ${salon.id}`, error); }
        }
        setSalonRatings(ratingsData);

        await fetchServices(false, salonsMap);

      } catch (error) {
        console.error("Error loading data for city:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDataForCity();
  }, [currentCity]);

  useEffect(() => {
    const loadCategories = async () => {
        if (!selectedSalonId) {
            setCategories([]);
            setCategoriesById({});
            return;
        }
        const categoriesData = await getCategoriesBySalon(selectedSalonId);
        setCategories(categoriesData);
        setCategoriesById(Object.fromEntries(categoriesData.map(c => [c.id, c])));
    };
    loadCategories();
  }, [selectedSalonId, getCategoriesBySalon]);


  const processServicesChunk = useCallback(async (chunk: SalonService[], currentSalonsMap: Record<string, Salon>): Promise<ProcessedService[]> => {
    return Promise.all(
      chunk.map(async (service) => {
        const salon = currentSalonsMap[service.salonId];
        const firstCategoryId = service.categoryIds?.[0];
        const category = firstCategoryId ? categoriesById[firstCategoryId] : undefined;
        let imageUrl = "";
        let isPromoted = false;
        
        try {
          const imgs = await getServiceImages(service.id);
          if (imgs?.length > 0) imageUrl = imgs[0].url;
        } catch (e) { /* Игнорируем ошибку */ }
        
        try {
          const promotion = await findActiveServicePromotion(service.id);
          if (promotion?.status === 'active') isPromoted = true;
        } catch (e) { /* Игнорируем ошибку */ }
        
        return { 
          ...service, 
          salon: salon ? { id: salon.id, name: salon.name, address: salon.address } : null, 
          imageUrl, 
          isPromoted, 
          categoryName: category?.name || '',
        };
      })
    );
  }, [categoriesById, findActiveServicePromotion]);

  const fetchServices = useCallback(async (isLoadMore = false, currentSalonsMap = salonsById) => {
    if (isLoadMore) setIsLoadingMore(true);

    try {
      let rawServices: SalonService[] = [];
      let newNextKey: string | null = null;

      if (selectedSalonId) {
        rawServices = await getServicesBySalon(selectedSalonId, { search: debouncedQuery });
        newNextKey = null;
      } else if (currentCity) {
        const result = await getServicesByCity({ 
          limit: PAGE_SIZE, 
          startAfterKey: isLoadMore ? (nextKey ?? undefined) : undefined ,
          city: currentCity
        });
        rawServices = result.services;
        newNextKey = result.nextKey;
      }

      const processedChunk = await processServicesChunk(rawServices, currentSalonsMap);
      
      setServices(prev => isLoadMore ? [...prev, ...processedChunk] : processedChunk);
      setNextKey(newNextKey);
      setHasMore(newNextKey !== null);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      if (isLoadMore) setIsLoadingMore(false);
    }
  }, [selectedSalonId, nextKey, getServicesByCity, getServicesBySalon, processServicesChunk, debouncedQuery, currentCity, salonsById]);
  
  useEffect(() => {
    if (loading) return;

    setServices([]);
    setNextKey(undefined);
    setHasMore(true);
    fetchServices(false);
  }, [selectedSalonId, debouncedQuery, selectedCategory, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- ЛОГИКА ФИЛЬТРАЦИИ И СОРТИРОВКИ ---
  const filteredAndSortedServices = useMemo(() => {
    let filtered = services;
    const qLower = debouncedQuery.trim().toLowerCase();
    
    if (qLower) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(qLower) || s.description?.toLowerCase().includes(qLower) || s.categoryName?.toLowerCase().includes(qLower));
    }
    if (selectedCategory) {
      // Обновленная логика для массива categoryIds
      filtered = filtered.filter(s => s.categoryIds?.includes(selectedCategory));
    }
    
    filtered = filtered.filter(s => s.isActive);
    
    filtered.sort((a, b) => {
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      switch (sortBy) {
        case 'price': return a.price - b.price;
        case 'duration': return a.durationMinutes - b.durationMinutes;
        default: return a.name.localeCompare(b.name);
      }
    });
    
    return filtered;
  }, [services, debouncedQuery, selectedCategory, sortBy]);

  const salonsForMap = useMemo(() => {
    return allSalons;
  }, [allSalons]);

  // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
  const handleCityChange = useCallback((city: string) => { setManualCity(city); setSelectedSalonId(null); }, []);
  const handleSalonClick = useCallback((salonId: string) => { setSelectedSalonId(salonId); setMobileView('list'); }, []);

  // --- РЕНДЕРИНГ ---
  return (
  <div
    className="flex flex-col md:flex-row bg-gray-50 overflow-hidden"
    style={{ height: 'calc(100vh - 4rem - 1px)' }} // 4rem - стандартная высота хедера (h-16 в Tailwind)
  >
      <SearchAndFilterPanel
        mobileView={mobileView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentCity={currentCity}
        handleCityChange={handleCityChange}
        locale={locale}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categories={categories}
        selectedSalonId={selectedSalonId}
        allSalons={allSalons}
        setSelectedSalonId={setSelectedSalonId}
        loading={loading}
        geoLoading={geoLoading}
        filteredAndSortedServices={filteredAndSortedServices}
        salonRatings={salonRatings}
        loaderRef={loaderRef}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        services={services}
      />
      <MapPanel
        mobileView={mobileView}
        salonsForMap={salonsForMap}
        handleSalonClick={handleSalonClick}
        locale={locale}
        position={position}
      />
      <MobileViewToggle
        mobileView={mobileView}
        setMobileView={setMobileView}
      />
    </div>
  )
}