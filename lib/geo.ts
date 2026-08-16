import { Linking, Platform } from 'react-native';

export type GeoCoords = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_KM = 6371;

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Great-circle distance in kilometres (Haversine). */
export function haversineKm(from: GeoCoords, to: GeoCoords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** Round for display — one decimal under 10 km, otherwise whole km. */
export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '';
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function hasValidCoords(
  latitude: number | string | null | undefined,
  longitude: number | string | null | undefined,
): latitude is number {
  return toFiniteNumber(latitude) != null && toFiniteNumber(longitude) != null;
}

/**
 * Static map preview URL (OpenStreetMap community staticmap).
 * No API key / no native map dependency — suitable for Expo Go and SDK 54.
 * Callers should render a local fallback if the image fails to load.
 */
export function buildStaticMapPreviewUrl(
  latitude: number,
  longitude: number,
  options?: { width?: number; height?: number; zoom?: number },
): string {
  const width = options?.width ?? 640;
  const height = options?.height ?? 280;
  const zoom = options?.zoom ?? 15;
  return (
    `https://staticmap.openstreetmap.de/staticmap.php` +
    `?center=${latitude},${longitude}` +
    `&zoom=${zoom}` +
    `&size=${width}x${height}` +
    `&maptype=mapnik` +
    `&markers=${latitude},${longitude},red-pushpin`
  );
}

async function tryOpenUrl(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Open the platform maps app for coordinates or a free-text address.
 * Tries native maps URLs first, then Google Maps HTTPS.
 * Does not use canOpenURL as a gate — that API rejects on iOS without
 * LSApplicationQueriesSchemes and on Android 11+ without package queries,
 * which previously prevented Maps from opening at all.
 */
export async function openMapsLocation(options: {
  latitude?: number | null;
  longitude?: number | null;
  label?: string;
  address?: string;
}): Promise<boolean> {
  const { latitude, longitude, label, address } = options;
  const name = label?.trim() || address?.trim() || 'Location';
  const encodedName = encodeURIComponent(name);
  const lat = toFiniteNumber(latitude);
  const lng = toFiniteNumber(longitude);
  const candidates: string[] = [];

  if (lat != null && lng != null) {
    if (Platform.OS === 'ios') {
      candidates.push(`maps:0,0?q=${encodedName}@${lat},${lng}`);
      candidates.push(
        `http://maps.apple.com/?ll=${lat},${lng}&q=${encodedName}`,
      );
    } else if (Platform.OS === 'android') {
      candidates.push(`geo:${lat},${lng}?q=${lat},${lng}(${encodedName})`);
      candidates.push(`geo:0,0?q=${lat},${lng}(${encodedName})`);
    }
    candidates.push(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    );
    candidates.push(`https://maps.google.com/?q=${lat},${lng}`);
  } else {
    const query = encodeURIComponent(
      [address, label].filter((part) => part && part.trim()).join(', '),
    );
    if (!query) return false;
    if (Platform.OS === 'ios') {
      candidates.push(`http://maps.apple.com/?q=${query}`);
    } else if (Platform.OS === 'android') {
      candidates.push(`geo:0,0?q=${query}`);
    }
    candidates.push(`https://www.google.com/maps/search/?api=1&query=${query}`);
  }

  for (const url of candidates) {
    if (await tryOpenUrl(url)) return true;
  }

  return false;
}
