'use client';

import { buildInteractiveMapHtml, hasValidCoords, openMapsLocation } from '@web/lib/geo';
import { cn } from '@web/lib/cn';

type LocationMapProps = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  label?: string | null;
  address?: string | null;
  className?: string;
};

export function LocationMap({
  latitude,
  longitude,
  label,
  address,
  className,
}: LocationMapProps) {
  if (!hasValidCoords(latitude, longitude)) return null;

  const html = buildInteractiveMapHtml({
    latitude,
    longitude: longitude as number,
    label,
  });

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-line bg-surface-card shadow-sm',
        className,
      )}
    >
      <iframe
        title={label ? `Map of ${label}` : 'Map'}
        srcDoc={html}
        className="h-72 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <button
        type="button"
        className="absolute bottom-3 left-3 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
        onClick={() =>
          void openMapsLocation({
            latitude,
            longitude,
            label: label ?? undefined,
            address: address ?? undefined,
          })
        }
      >
        Open in Maps
      </button>
    </div>
  );
}
