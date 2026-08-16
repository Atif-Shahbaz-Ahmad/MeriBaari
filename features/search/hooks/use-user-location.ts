import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

import type { GeoCoords } from '@/lib/geo';

type UserLocationState = {
  coords: GeoCoords | null;
  permission: Location.PermissionStatus | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * Optional foreground location for distance sort / “X km away”.
 * Requests permission only when `request()` is called (or autoRequest).
 */
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
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED && requestIfNeeded) {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setState({
          coords: null,
          permission: permission.status,
          isLoading: false,
          error: requestIfNeeded
            ? 'Location permission is required to sort by distance.'
            : null,
        });
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords: GeoCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setState({
        coords,
        permission: permission.status,
        isLoading: false,
        error: null,
      });
      return coords;
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Could not read your current location.',
      }));
      return null;
    }
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
