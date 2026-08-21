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

export { buildInteractiveMapHtml } from '@/lib/interactive-map-html';

/** @deprecated Use buildInteractiveMapHtml — static OSM previews fail in production. */
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

export async function openMapsLocation(options: {
  latitude?: number | null;
  longitude?: number | null;
  label?: string;
  address?: string;
}): Promise<boolean> {
  const { latitude, longitude, label, address } = options;
  const lat = toFiniteNumber(latitude);
  const lng = toFiniteNumber(longitude);
  const name = encodeURIComponent(label?.trim() || address?.trim() || 'Location');
  const url =
    lat != null && lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${name}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
}
