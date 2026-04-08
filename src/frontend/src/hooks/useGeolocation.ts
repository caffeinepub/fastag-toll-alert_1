import { useCallback, useEffect, useRef, useState } from "react";
import { haversine } from "../utils/haversine";

export interface GeoState {
  latitude: number | null;
  longitude: number | null;
  speed: number; // km/h
  accuracy: number | null;
  error: string | null;
  isAcquiring: boolean;
}

interface PositionSnapshot {
  lat: number;
  lon: number;
  time: number; // ms
}

export function useGeolocation() {
  const [geo, setGeo] = useState<GeoState>({
    latitude: null,
    longitude: null,
    speed: 0,
    accuracy: null,
    error: null,
    isAcquiring: true,
  });

  const prevPos = useRef<PositionSnapshot | null>(null);
  const watchId = useRef<number | null>(null);

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy, speed } = pos.coords;
    const now = pos.timestamp;

    let calculatedSpeed = 0;

    // Use native speed if available (m/s → km/h)
    if (speed !== null && speed >= 0) {
      calculatedSpeed = speed * 3.6;
    } else if (prevPos.current) {
      const prev = prevPos.current;
      const distKm = haversine(prev.lat, prev.lon, latitude, longitude);
      const timeDeltaHr = (now - prev.time) / 3_600_000;
      if (timeDeltaHr > 0) {
        calculatedSpeed = distKm / timeDeltaHr;
      }
    }

    // Clamp speed to 0-250
    calculatedSpeed = Math.max(0, Math.min(250, calculatedSpeed));

    prevPos.current = { lat: latitude, lon: longitude, time: now };

    setGeo({
      latitude,
      longitude,
      speed: calculatedSpeed,
      accuracy,
      error: null,
      isAcquiring: false,
    });
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    let message = "Location access denied";
    if (err.code === 2) message = "Location unavailable";
    if (err.code === 3) message = "Location request timed out";
    setGeo((prev) => ({ ...prev, error: message, isAcquiring: false }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo((prev) => ({
        ...prev,
        error: "Geolocation not supported",
        isAcquiring: false,
      }));
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Always get fresh position — critical for smooth distance countdown
      },
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [handlePosition, handleError]);

  return geo;
}
