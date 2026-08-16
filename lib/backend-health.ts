export type BackendHealthStatus = 'available' | 'unavailable' | 'unknown';

export interface BackendHealthResult {
  status: BackendHealthStatus;
  latencyMs: number;
}

// Access env keys as static member expressions so Next/Vite can inline them
// in the browser bundle. Do not guard with `typeof process` first.
const PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';

const PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

/** Public Supabase URL used by mobile, web, and desktop clients. */
export function getPublicSupabaseUrl(explicitUrl?: string): string {
  return (explicitUrl || PUBLIC_SUPABASE_URL).replace(/\/$/, '');
}

function authHeaders(): Record<string, string> {
  if (!PUBLIC_SUPABASE_ANON_KEY) return {};
  return {
    apikey: PUBLIC_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${PUBLIC_SUPABASE_ANON_KEY}`,
  };
}

/**
 * Checks the real configured backend (Supabase Auth health).
 * Never points at localhost unless that is the configured project URL.
 *
 * Any HTTP response means the API gateway is reachable. Only a network
 * failure (CORS/offline/timeout) is treated as unavailable.
 */
export async function checkBackendHealth(
  supabaseUrl?: string,
  timeoutMs = 8000,
): Promise<BackendHealthResult> {
  const base = getPublicSupabaseUrl(supabaseUrl);
  if (!base) {
    return { status: 'unknown', latencyMs: 0 };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = authHeaders();
  const endpoints = [`${base}/auth/v1/health`, `${base}/rest/v1/`];

  try {
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
          cache: 'no-store',
        });
        if (response.status > 0) {
          return {
            status: 'available',
            latencyMs: Date.now() - started,
          };
        }
      } catch {
        // Try the next CORS-friendly endpoint before giving up.
      }
    }
    return { status: 'unavailable', latencyMs: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}
