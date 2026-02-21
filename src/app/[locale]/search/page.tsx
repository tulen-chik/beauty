"use client"

import { useParams } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { getServiceImages } from "@/lib/firebase/database"
import { useSalonRating, useGeolocation, useSalon } from "@/contexts"
import { usePromotion } from "@/contexts/PromotionContext"
import { useServiceCategory } from "@/contexts/ServiceCategoryContext"
import { useSalonService } from "@/contexts/SalonServiceContext"
import { MobileViewToggle } from "./components/Selectors"
import { SearchAndFilterPanel } from "./components/Selectors"
import { MapPanel } from "./components/Selectors"

import type { Salon, SalonService, ServiceCategory } from "@/types/database";

interface ProcessedService extends SalonService {
  salon: { id: string; name: string; address: string } | null;
  imageUrl: string;
  isPromoted?: boolean;
  promotionEndDate?: string;
  categoryName?: string;
}

const imageCache = new Map<string, string>();
const promotionCache = new Map<string, { isPromoted: boolean; endDate?: string; timestamp: number }>();
const ratingStatsCache = new Map<string, { stats: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

const DEBOUNCE_DELAY = 300;
const PAGE_SIZE = 15;
const SALON_PAGE_SIZE = 50;


export default function SearchPage() {
  const locale = useParams().locale as string;

  const { getRatingStats } = useSalonRating();
  const { findActiveServicePromotion } = usePromotion();
  const { getCategoriesBySalon, getRandomCategories } = useServiceCategory();
  const { getServicesByCity, getServicesBySalon, getServicesBySalonPaginated } = useSalonService();
  const { city: userCity, position, loading: geoLoading } = useGeolocation();
  const { fetchSalonsByCity } = useSalon();

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
  
  const currentCity = manualCity || userCity || "Minsk";
  
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
        (async () => {
          try {
            let currentSalonNextKey: string | undefined = undefined;
            let hasMoreSalons = true;
            let localRatings: Record<string, any> = {};

            while (hasMoreSalons) {
              const response: { salons: Salon[]; nextKey: string | null } = await fetchSalonsByCity({
                city: currentCity,
                limit: SALON_PAGE_SIZE,
                startAfterKey: currentSalonNextKey,
              });

              const activeSalons = response.salons.filter(salon => salon.isActive !== false && salon.isActive !== undefined);

              setAllSalons(prev => [...prev, ...activeSalons]);
              setSalonsById(prev => ({ ...prev, ...Object.fromEntries(activeSalons.map(s => [s.id, s])) }));

              const ratingPromises = activeSalons.map(async (salon) => {
                const cached = ratingStatsCache.get(salon.id);
                if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                  return { salonId: salon.id, stats: cached.stats };
                }
                
                try {
                  const stats = await getRatingStats(salon.id);
                  ratingStatsCache.set(salon.id, { stats, timestamp: Date.now() });
                  return { salonId: salon.id, stats };
                } catch (error) {
                  console.warn(`Failed to load ratings for salon ${salon.id}`, error);
                  return { salonId: salon.id, stats: null };
                }
              });
              
              const ratingResults = await Promise.all(ratingPromises);
              ratingResults.forEach(({ salonId, stats }) => {
                if (stats) {
                  localRatings[salonId] = stats;
                  setSalonRatings(prev => ({ ...prev, [salonId]: stats }));
                }
              });

              currentSalonNextKey = response.nextKey ?? undefined;
              hasMoreSalons = !!response.nextKey;
            }
          } catch (e) {
            console.error('Background salons load failed:', e);
          }
        })();

        await fetchServices(false);
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
        let categoriesData: ServiceCategory[] = [];
        
        if (selectedSalonId) {
            categoriesData = await getCategoriesBySalon(selectedSalonId);
        } else {
            categoriesData = await getRandomCategories(20);
        }
        
        setCategories(categoriesData);
        setCategoriesById(Object.fromEntries(categoriesData.map(c => [c.id, c])));
    };
    
    loadCategories();
  }, [selectedSalonId, getCategoriesBySalon, getRandomCategories]);


  const processServicesChunk = useCallback(async (chunk: SalonService[], currentSalonsMap: Record<string, Salon>): Promise<ProcessedService[]> => {
    const baseProcessedServices = chunk.map((service) => {
      const salon = currentSalonsMap[service.salonId];
      const firstCategoryId = service.categoryIds?.[0];
      const category = firstCategoryId ? categoriesById[firstCategoryId] : undefined;
      
      return { 
        ...service, 
        salon: salon ? { id: salon.id, name: salon.name, address: salon.address } : null, 
        imageUrl: '', 
        isPromoted: false,
        promotionEndDate: undefined,
        categoryName: category?.name || '',
      };
    });

    const serviceIds = baseProcessedServices.map(s => s.id);
    
    (async () => {
      const imagePromises = serviceIds.map(async (serviceId) => {
        if (imageCache.has(serviceId)) {
          return { serviceId, imageUrl: imageCache.get(serviceId)! };
        }
        
        try {
          const imgs = await getServiceImages(serviceId);
          const imageUrl = imgs?.length > 0 ? imgs[0].url : '';
          imageCache.set(serviceId, imageUrl);
          return { serviceId, imageUrl };
        } catch (e) {
          return { serviceId, imageUrl: '' };
        }
      });
      
      const imageResults = await Promise.all(imagePromises);
      const imageMap = Object.fromEntries(imageResults.map(r => [r.serviceId, r.imageUrl]));
      
      setServices(prev => prev.map(service => {
        if (serviceIds.includes(service.id)) {
          return { ...service, imageUrl: imageMap[service.id] || '' };
        }
        return service;
      }));
    })();
    
    (async () => {
      const promotionPromises = serviceIds.map(async (serviceId) => {
        const cached = promotionCache.get(serviceId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          return { serviceId, isPromoted: cached.isPromoted, endDate: cached.endDate };
        }
        
        try {
          const promotion = await findActiveServicePromotion(serviceId);
          const isPromoted = promotion?.status === 'active';
          const endDate = promotion?.endDate;
          promotionCache.set(serviceId, { isPromoted, endDate, timestamp: Date.now() });
          return { serviceId, isPromoted, endDate };
        } catch (e) {
          return { serviceId, isPromoted: false };
        }
      });
      
      const promotionResults = await Promise.all(promotionPromises);
      const promotionMap = Object.fromEntries(promotionResults.map(r => [r.serviceId, { isPromoted: r.isPromoted, endDate: r.endDate }]));
      
      setServices(prev => prev.map(service => {
        if (serviceIds.includes(service.id)) {
          return { 
            ...service, 
            isPromoted: promotionMap[service.id]?.isPromoted || false,
            promotionEndDate: promotionMap[service.id]?.endDate
          };
        }
        return service;
      }));
    })();
    
    return baseProcessedServices;
  }, [categoriesById, findActiveServicePromotion]);

  const fetchServices = useCallback(async (isLoadMore = false, currentSalonsMap = salonsById) => {
    if (isLoadMore) setIsLoadingMore(true);

    try {
      let rawServices: SalonService[] = [];
      let newNextKey: string | null = null;

      if (selectedSalonId) {
        const result = await getServicesBySalonPaginated({
          salonId: selectedSalonId,
          limit: PAGE_SIZE,
          startAfterKey: isLoadMore ? (nextKey ?? undefined) : undefined,
        });
        rawServices = result.services;
        newNextKey = result.nextKey;
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
  }, [selectedSalonId, nextKey, getServicesByCity, getServicesBySalonPaginated, processServicesChunk, currentCity]);
  
  useEffect(() => {
    if (loading) return;

    setServices([]);
    setNextKey(undefined);
    setHasMore(true);
    fetchServices(false);
  }, [selectedSalonId, debouncedQuery, selectedCategory, sortBy, currentCity]);

  useEffect(() => {
    if (!services.length) return;
    setServices(prev => prev.map(s => {
      if (!s.salon) {
        const salon = salonsById[s.salonId];
        if (salon) {
          return {
            ...s,
            salon: { id: salon.id, name: salon.name, address: salon.address }
          };
        }
      }
      return s;
    }));
  }, [salonsById, salonRatings]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredAndSortedServices = useMemo(() => {
    let filtered = services.filter(s => {
        const salon = salonsById[s.salonId];
        return salon && salon.isActive !== false && salon.isActive !== undefined;
    });

    const qLower = debouncedQuery.trim().toLowerCase();
    
    if (qLower) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(qLower) || s.description?.toLowerCase().includes(qLower) || s.categoryName?.toLowerCase().includes(qLower));
    }
    if (selectedCategory) {
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
  }, [services, debouncedQuery, selectedCategory, sortBy, salonsById]);

  const salonsForMap = useMemo(() => {
    return allSalons.filter(salon => salon.isActive !== false && salon.isActive !== undefined);
  }, [allSalons]);

  const handleCityChange = useCallback((city: string) => { setManualCity(city); setSelectedSalonId(null); }, []);
  const handleSalonClick = useCallback((salonId: string) => { setSelectedSalonId(salonId); setMobileView('list'); }, []);

  return (
  <div
    className="flex flex-col md:flex-row bg-gray-50 overflow-hidden"
    style={{ height: 'calc(100vh - 4rem - 1px)' }}
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