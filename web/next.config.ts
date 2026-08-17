import type { NextConfig } from 'next';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

function loadParentEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!existsSync(envPath)) return;
  for (const raw of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadParentEnv();

const repoRoot = path.resolve(__dirname, '..');
const webSrc = path.resolve(__dirname, 'src');
const webModules = path.join(__dirname, 'node_modules');

function resolvePkg(pkg: string) {
  const fromWeb = path.join(webModules, pkg);
  const fromRoot = path.join(repoRoot, 'node_modules', pkg);
  if (existsSync(fromWeb)) return fromWeb;
  if (existsSync(fromRoot)) return fromRoot;
  return fromWeb;
}

const aliases: Record<string, string> = {
  '@/lib/supabase': path.join(webSrc, 'lib/supabase.ts'),
  '@/lib/secure-store': path.join(webSrc, 'lib/storage.ts'),
  '@/lib/auth-redirect': path.join(webSrc, 'lib/auth-redirect.ts'),
  '@/lib/avatar-image': path.join(webSrc, 'lib/avatar-image.ts'),
  '@/lib/query-client': path.join(webSrc, 'lib/query-client.ts'),
  '@/lib/i18n/locale-context': path.join(webSrc, 'lib/locale-context.tsx'),
  '@/lib/i18n/rtl': path.join(webSrc, 'lib/rtl.ts'),
  '@/lib/geo': path.join(webSrc, 'lib/geo.ts'),
  '@/data': path.join(webSrc, 'di/index.ts'),
  '@/data/di': path.join(webSrc, 'di/index.ts'),
  '@/data/di/container': path.join(webSrc, 'di/container.ts'),
  '@/data/di/index': path.join(webSrc, 'di/index.ts'),
  '@/hooks/use-theme': path.join(webSrc, 'hooks/use-theme.ts'),
  '@/hooks/use-auth': path.join(webSrc, 'hooks/use-auth.ts'),
  '@/features/search/hooks/use-user-location': path.join(
    webSrc,
    'hooks/use-user-location.ts',
  ),
  '@/features/notifications/hooks/use-push-notifications': path.join(
    webSrc,
    'hooks/use-push-notifications.ts',
  ),
  'react-native': path.join(webSrc, 'shims/react-native.ts'),
  'expo-web-browser': path.join(webSrc, 'shims/expo-web-browser.ts'),
  'expo-secure-store': path.join(webSrc, 'shims/expo-secure-store.ts'),
  'expo-linking': path.join(webSrc, 'shims/expo-linking.ts'),
  'expo-auth-session': path.join(webSrc, 'shims/expo-auth-session.ts'),
  'expo-image-manipulator': path.join(webSrc, 'shims/expo-image-manipulator.ts'),
  'expo-audio': path.join(webSrc, 'shims/expo-audio.ts'),
  'expo-notifications': path.join(webSrc, 'shims/expo-notifications.ts'),
  'expo-location': path.join(webSrc, 'shims/expo-location.ts'),
  'expo-constants': path.join(webSrc, 'shims/expo-constants.ts'),
  'expo-device': path.join(webSrc, 'shims/expo-device.ts'),
  'expo-file-system': path.join(webSrc, 'shims/expo-file-system.ts'),
  'expo-haptics': path.join(webSrc, 'shims/expo-haptics.ts'),
  'expo-router': path.join(webSrc, 'shims/expo-router.ts'),
  'expo-clipboard': path.join(webSrc, 'shims/expo-clipboard.ts'),
  '@react-navigation/native': path.join(webSrc, 'shims/react-navigation.ts'),
  'lucide-react-native': path.join(webSrc, 'shims/lucide-react-native.ts'),
  '@supabase/supabase-js': resolvePkg('@supabase/supabase-js'),
  // Shared feature hooks live in the repo root and would otherwise resolve
  // @tanstack/react-query / zustand from the parent node_modules — a second
  // copy whose context is invisible to the web app's providers.
  '@tanstack/react-query': resolvePkg('@tanstack/react-query'),
  zustand: resolvePkg('zustand'),
  // Do NOT alias `react` or `react-dom` here (or in tsconfig paths).
  // Next.js 15 uses layer-specific vendored React (RSC vs SSR vs browser).
  // Pointing those names at node_modules/react bypasses the RSC/SSR split
  // and makes client hooks see a null dispatcher during prerender.
};

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: repoRoot,
  experimental: {
    externalDir: true,
  },
  typescript: {
    // Shared Expo sources live outside `web/` and resolve packages from the
    // repo-root node_modules. Vercel only installs `web/node_modules`.
    // Webpack already compiles; do not block the deploy on that typecheck.
    ignoreBuildErrors: process.env.VERCEL === '1',
  },
  turbopack: {
    resolveAlias: {
      ...aliases,
      '@': repoRoot,
      '@web': webSrc,
    },
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
    EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...aliases,
      '@': repoRoot,
      '@web': webSrc,
    };
    config.resolve.modules = [
      webModules,
      ...(Array.isArray(config.resolve.modules)
        ? config.resolve.modules
        : ['node_modules']),
    ];
    return config;
  },
};

export default nextConfig;
