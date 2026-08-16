import { useCallback, useRef, useState } from 'react';
import * as Location from 'expo-location';

import { useUserLocation } from '@/features/search/hooks/use-user-location';
import type { GeoCoords } from '@/lib/geo';

export type CaptureOrganizationLocationStatus =
  | 'idle'
  | 'success'
  | 'denied'
  | 'error';

/**
 * Owner-facing wrapper around `useUserLocation` for filling org lat/lng.
 * Does not reverse-geocode; address/city stay under manual control.
 */
export function useCaptureOrganizationLocation() {
  const location = useUserLocation();
  const inFlight = useRef(false);
  const [status, setStatus] =
    useState<CaptureOrganizationLocationStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const capture = useCallback(async (): Promise<GeoCoords | null> => {
    if (inFlight.current || location.isLoading) return null;
    inFlight.current = true;
    setStatus('idle');
    setMessage(null);

    try {
      const coords = await location.request();

      if (coords) {
        setStatus('success');
        setMessage('Current location captured. Map preview updated.');
        return coords;
      }

      const latest = await Location.getForegroundPermissionsAsync();
      if (latest.status !== Location.PermissionStatus.GRANTED) {
        setStatus('denied');
        setMessage(
          'Location permission was denied. You can still save address and city, then try GPS again later.',
        );
        return null;
      }

      setStatus('error');
      setMessage(
        'Could not read your current location. Check GPS signal and try again.',
      );
      return null;
    } catch {
      setStatus('error');
      setMessage(
        'Could not read your current location. Check GPS signal and try again.',
      );
      return null;
    } finally {
      inFlight.current = false;
    }
  }, [location.isLoading, location.request]);

  return {
    capture,
    isLoading: location.isLoading,
    status,
    message,
    clearMessage: () => {
      setMessage(null);
      setStatus('idle');
    },
  };
}

/** Format GPS coords for form string fields. */
export function formatCoordinateForForm(value: number): string {
  return String(Number(value.toFixed(6)));
}
