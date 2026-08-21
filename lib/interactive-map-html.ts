type InteractiveMapOptions = {
  latitude: number;
  longitude: number;
  label?: string | null;
  zoom?: number;
};

/**
 * Self-contained Leaflet + Carto Voyager map. Used by the web iframe,
 * desktop (same web component), and the native WebView preview.
 */
export function buildInteractiveMapHtml(options: InteractiveMapOptions): string {
  const lat = Number(options.latitude);
  const lng = Number(options.longitude);
  const zoom = options.zoom ?? 16;
  const title = JSON.stringify(options.label?.trim() || 'Location');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #e8eef4; }
    .leaflet-control-attribution { font-size: 10px; }
    .pin { width: 28px; height: 28px; margin-left: -14px; margin-top: -28px; }
    .pin-dot {
      width: 18px; height: 18px; margin: 0 auto;
      background: #2563EB; border: 3px solid #fff; border-radius: 50%;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.35);
    }
    .pin-stem { width: 3px; height: 10px; margin: 0 auto; background: #2563EB; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const lat = ${lat};
    const lng = ${lng};
    const map = L.map('map', { zoomControl: true }).setView([lat, lng], ${zoom});
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 20,
      subdomains: 'abcd'
    }).addTo(map);
    const icon = L.divIcon({
      className: '',
      html: '<div class="pin"><div class="pin-dot"></div><div class="pin-stem"></div></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });
    L.marker([lat, lng], { icon }).addTo(map).bindPopup(${title});
    setTimeout(function () { map.invalidateSize(); }, 200);
  </script>
</body>
</html>`;
}
