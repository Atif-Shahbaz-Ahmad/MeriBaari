'use client';

import { useCallback, useEffect, useState } from 'react';

import type { GeoCoords } from '@/lib/geo';

type Permission = 'granted' | 'denied' | 'undetermined' | null;

type UserLocationState = {
  coords: GeoCoords | null;
  permission: Permission;
  isLoading: boolean;
  error: string | null;
};

export function useUserLocation(options?: { autoRequest?: boolean }) {
  const autoRequest = options?.autoRequest ?? false;
  const [state, setState] = useState<UserLocationState>({
    coords: null,
    permission: null,
    isLoading: false,
    error: null,
  });

  const refresh = useCallback(async (requestIfNeeded: boolean) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({
        coords: null,
        permission: 'denied',
        isLoading: false,
        error: requestIfNeeded ? 'Location is not available in this browser.' : null,
      });
      return null;
    }

    return new Promise<GeoCoords | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setState({
            coords,
            permission: 'granted',
            isLoading: false,
            error: null,
          });
          resolve(coords);
        },
        (err) => {
          const denied = err.code === err.PERMISSION_DENIED;
          setState({
            coords: null,
            permission: denied ? 'denied' : 'undetermined',
            isLoading: false,
            error: requestIfNeeded
              ? denied
                ? 'Location permission was denied.'
                : 'Could not read your current location.'
              : null,
          });
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
      );
    });
  }, []);

  useEffect(() => {
    if (!autoRequest) return;
    void refresh(true);
  }, [autoRequest, refresh]);

  return {
    ...state,
    request: () => refresh(true),
    refresh: () => refresh(false),
  };
}
