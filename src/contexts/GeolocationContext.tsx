"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';

// --- Caching Configuration ---
const GEOLOCATION_CACHE_KEY = 'geolocation_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// --- Type Definitions ---
interface SimplifiedPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface CachedGeolocation {
  position: SimplifiedPosition;
  city: string;
  timestamp: number;
}

interface GeolocationContextType {
  position: SimplifiedPosition | null;
  city: string | null;
  error: string | null;
  loading: boolean;
  requestLocation: () => void;
  setLocationByCity: (cityName: string) => void; // New method
  fetchCityName: (position: SimplifiedPosition) => void;
  getCityFromCoordinates: (coords: { latitude: number; longitude: number }) => Promise<string>;
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(
  undefined
);

export const useGeolocation = () => {
  const ctx = useContext(GeolocationContext);
  if (!ctx) {
    throw new Error('useGeolocation must be used within a GeolocationProvider');
  }
  return ctx;
};

interface GeolocationProviderProps {
  children: ReactNode;
  locale: string;
}

export const GeolocationProvider = ({
  children,
  locale,
}: GeolocationProviderProps) => {
  const [position, setPosition] = useState<SimplifiedPosition | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const t = useTranslations('common');

  // --- Caching Functions ---
  const saveToCache = useCallback(
    (pos: SimplifiedPosition, cityName: string) => {
      try {
        const cacheData: CachedGeolocation = {
          position: pos,
          city: cityName,
          timestamp: Date.now(),
        };
        localStorage.setItem(GEOLOCATION_CACHE_KEY, JSON.stringify(cacheData));
      } catch (e) {
        console.warn('Failed to save geolocation to cache:', e);
      }
    },
    []
  );

  const getCityFromCoordinates = useCallback(
    async (coords: { latitude: number; longitude: number }): Promise<string> => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&accept-language=${locale}`
        );

        if (!response.ok) {
          console.error('Nominatim API request failed');
          return t('geolocation.unknownCity');
        }

        const data = await response.json();
        // Используем ту же логику для извлечения названия города
        const cityName =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.municipality ||
          data.address?.county ||
          t('geolocation.unknownCity');
        
        return cityName;
      } catch (err) {
        console.error('Failed to fetch city from coordinates:', err);
        return t('geolocation.unknownCity');
      }
    },
    [locale, t]
  );

  const loadFromCache = useCallback((): CachedGeolocation | null => {
    try {
      const cachedDataString = localStorage.getItem(GEOLOCATION_CACHE_KEY);
      if (!cachedDataString) {
        return null;
      }
      const cachedData: CachedGeolocation = JSON.parse(cachedDataString);
      const isCacheStale = Date.now() - cachedData.timestamp > CACHE_DURATION;

      if (isCacheStale) {
        localStorage.removeItem(GEOLOCATION_CACHE_KEY);
        return null;
      }

      return cachedData;
    } catch (e) {
      console.warn('Failed to load geolocation from cache:', e);
      return null;
    }
  }, []);

  // --- Geolocation Logic ---
  const fetchCityName = useCallback(
    async (currentPosition: SimplifiedPosition) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentPosition.latitude}&lon=${currentPosition.longitude}&zoom=10&accept-language=${locale}`
        );

        let cityName = t('geolocation.unknownCity');
        if (response.ok) {
          const data = await response.json();
          cityName =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality ||
            data.address?.county ||
            t('geolocation.unknownCity');
        }

        setCity(cityName);
        setError(null);
        saveToCache(currentPosition, cityName); // Save fresh data to cache
      } catch (err) {
        setCity(t('geolocation.unknownCity'));
      } finally {
        setLoading(false);
      }
    },
    [locale, t, saveToCache]
  );

  const handleSuccess = (pos: globalThis.GeolocationPosition) => {
    const newPosition: SimplifiedPosition = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };
    setPosition(newPosition);
    fetchCityName(newPosition);
  };

  const handleError = (err: globalThis.GeolocationPositionError) => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        setError(t('geolocation.permissionDenied'));
        break;
      case err.POSITION_UNAVAILABLE:
        setError(t('geolocation.unavailable'));
        break;
      case err.TIMEOUT:
        setError('The request to get user location timed out.');
        break;
      default:
        setError('An unknown error occurred.');
        break;
    }
    setLoading(false);
  };

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError(t('geolocation.unavailable'));
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      maximumAge: 60_000,
      timeout: 10_000,
      enableHighAccuracy: false,
    });
  }, [t]);

  // --- New method to get location by city name ---
  const setLocationByCity = useCallback(
    async (cityName: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
            cityName
          )}&format=json&limit=1`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            const { lat, lon } = data[0];
            const newPosition: SimplifiedPosition = {
              latitude: parseFloat(lat),
              longitude: parseFloat(lon),
              accuracy: 0, // Accuracy is not available from city search
            };
            setPosition(newPosition);
            setCity(cityName);
            saveToCache(newPosition, cityName);
          } else {
            setError(t('geolocation.cityNotFound'));
          }
        } else {
          setError(t('geolocation.geocodingError'));
        }
      } catch (err) {
        setError(t('geolocation.geocodingError'));
      } finally {
        setLoading(false);
      }
    },
    [t, saveToCache]
  );

  // --- Effect to load from cache on initial mount ---
  useEffect(() => {
    const cachedData = loadFromCache();

    if (cachedData) {
      setPosition(cachedData.position);
      setCity(cachedData.city);
      setLoading(false); // We have data, no need to load
    } else {
      requestLocation(); // No valid cache, fetch new location
    }
  }, [loadFromCache, requestLocation]);

  const value = useMemo(
    () => ({
      position,
      city,
      error,
      loading,
      requestLocation,
      setLocationByCity, // Expose the new method
      fetchCityName,
      getCityFromCoordinates,
    }),
    [position, city, error, loading, requestLocation, setLocationByCity, fetchCityName, getCityFromCoordinates]
  );

  return (
    <GeolocationContext.Provider value={value}>
      {children}
    </GeolocationContext.Provider>
  );
};