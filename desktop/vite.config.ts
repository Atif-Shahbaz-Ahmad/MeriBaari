import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const webSrc = path.resolve(repoRoot, 'web/src');
const webApp = path.resolve(repoRoot, 'web/app');
const desktopSrc = path.resolve(__dirname, 'src');

function loadParentEnv() {
  const envPath = path.resolve(repoRoot, '.env');
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

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

function exactAlias(find: string, replacement: string) {
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { find: new RegExp(`^${escaped}$`), replacement };
}

const aliases = [
  exactAlias('@/lib/supabase', path.join(desktopSrc, 'lib/supabase.ts')),
  exactAlias('@/lib/secure-store', path.join(webSrc, 'lib/storage.ts')),
  exactAlias('@/lib/auth-redirect', path.join(desktopSrc, 'lib/auth-redirect.ts')),
  exactAlias('@/lib/avatar-image', path.join(webSrc, 'lib/avatar-image.ts')),
  exactAlias('@/lib/query-client', path.join(webSrc, 'lib/query-client.ts')),
  exactAlias(
    '@/lib/i18n/locale-context',
    path.join(webSrc, 'lib/locale-context.tsx'),
  ),
  exactAlias('@/lib/i18n/rtl', path.join(webSrc, 'lib/rtl.ts')),
  exactAlias('@/lib/geo', path.join(webSrc, 'lib/geo.ts')),
  exactAlias('@/data', path.join(webSrc, 'di/index.ts')),
  exactAlias('@/data/di', path.join(webSrc, 'di/index.ts')),
  exactAlias('@/data/di/container', path.join(webSrc, 'di/container.ts')),
  exactAlias('@/data/di/index', path.join(webSrc, 'di/index.ts')),
  exactAlias('@/hooks/use-theme', path.join(webSrc, 'hooks/use-theme.ts')),
  exactAlias('@/hooks/use-auth', path.join(webSrc, 'hooks/use-auth.ts')),
  exactAlias(
    '@/features/search/hooks/use-user-location',
    path.join(webSrc, 'hooks/use-user-location.ts'),
  ),
  exactAlias(
    '@/features/notifications/hooks/use-push-notifications',
    path.join(webSrc, 'hooks/use-push-notifications.ts'),
  ),
  exactAlias('react-native', path.join(webSrc, 'shims/react-native.ts')),
  exactAlias('expo-web-browser', path.join(webSrc, 'shims/expo-web-browser.ts')),
  exactAlias('expo-secure-store', path.join(webSrc, 'shims/expo-secure-store.ts')),
  exactAlias('expo-linking', path.join(webSrc, 'shims/expo-linking.ts')),
  exactAlias('expo-auth-session', path.join(webSrc, 'shims/expo-auth-session.ts')),
  exactAlias(
    'expo-image-manipulator',
    path.join(webSrc, 'shims/expo-image-manipulator.ts'),
  ),
  exactAlias('expo-audio', path.join(webSrc, 'shims/expo-audio.ts')),
  exactAlias(
    'expo-notifications',
    path.join(webSrc, 'shims/expo-notifications.ts'),
  ),
  exactAlias('expo-location', path.join(webSrc, 'shims/expo-location.ts')),
  exactAlias('expo-constants', path.join(webSrc, 'shims/expo-constants.ts')),
  exactAlias('expo-device', path.join(webSrc, 'shims/expo-device.ts')),
  exactAlias('expo-file-system', path.join(webSrc, 'shims/expo-file-system.ts')),
  exactAlias('expo-haptics', path.join(webSrc, 'shims/expo-haptics.ts')),
  exactAlias('expo-router', path.join(webSrc, 'shims/expo-router.ts')),
  exactAlias(
    '@react-navigation/native',
    path.join(webSrc, 'shims/react-navigation.ts'),
  ),
  exactAlias('next/link', path.join(desktopSrc, 'shims/next-link.tsx')),
  exactAlias('next/navigation', path.join(desktopSrc, 'shims/next-navigation.ts')),
  exactAlias('next/font/google', path.join(desktopSrc, 'shims/next-font.ts')),
  exactAlias('next/headers', path.join(desktopSrc, 'shims/next-headers.ts')),
  {
    find: 'lucide-react-native',
    replacement: path.join(__dirname, 'node_modules/lucide-react'),
  },
  { find: '@web-app', replacement: webApp },
  { find: '@web', replacement: webSrc },
  { find: '@', replacement: repoRoot },
  {
    find: 'react/jsx-runtime',
    replacement: path.join(__dirname, 'node_modules/react/jsx-runtime.js'),
  },
  {
    find: 'react/jsx-dev-runtime',
    replacement: path.join(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
  },
  {
    find: 'react-dom',
    replacement: path.join(__dirname, 'node_modules/react-dom'),
  },
  { find: /^react$/, replacement: path.join(__dirname, 'node_modules/react') },
  exactAlias(
    '@tanstack/react-query',
    path.join(
      __dirname,
      'node_modules/@tanstack/react-query/build/modern/index.js',
    ),
  ),
  exactAlias(
    'zustand',
    path.join(__dirname, 'node_modules/zustand/esm/index.mjs'),
  ),
  exactAlias(
    'zustand/vanilla',
    path.join(__dirname, 'node_modules/zustand/esm/vanilla.mjs'),
  ),
  exactAlias(
    'zustand/react',
    path.join(__dirname, 'node_modules/zustand/esm/react.mjs'),
  ),
  {
    find: '@supabase/supabase-js',
    replacement: path.join(repoRoot, 'node_modules/@supabase/supabase-js'),
  },
];

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(({ command }) => {
  if (command === 'build' && (!supabaseUrl || !supabaseAnonKey)) {
    throw new Error(
      'Desktop production build requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in the repo-root .env. Production must not use localhost.',
    );
  }

  if (command === 'build' && /localhost|127\.0\.0\.1/i.test(supabaseUrl)) {
    throw new Error(
      'Desktop production build refused a localhost Supabase URL. Set the production EXPO_PUBLIC_SUPABASE_URL.',
    );
  }

  return {
    plugins: [
      react(),
      {
        name: 'tauri-index-html',
        transformIndexHtml(html) {
          return html.replace(/(\s)crossorigin(="[^"]*")?/g, '');
        },
      },
    ],
    clearScreen: false,
    base: './',
    envPrefix: ['VITE_', 'TAURI_ENV_'],
    define: {
      __DEV__: JSON.stringify(command !== 'build'),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY':
        JSON.stringify(supabaseAnonKey),
      'process.env.EXPO_PUBLIC_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY':
        JSON.stringify(supabaseAnonKey),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.NODE_ENV': JSON.stringify(
        command === 'build' ? 'production' : 'development',
      ),
    },
    resolve: {
      alias: aliases,
      dedupe: ['react', 'react-dom', '@tanstack/react-query', 'zustand'],
    },
    optimizeDeps: {
      include: ['zustand', '@tanstack/react-query', 'react', 'react-dom'],
    },
    css: {
      postcss: path.join(__dirname, 'postcss.config.js'),
    },
    server: {
      port: 1420,
      strictPort: true,
      host: host || false,
      hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: ['es2021', 'chrome105', 'safari14'],
      minify: !process.env.TAURI_DEBUG,
      sourcemap: Boolean(process.env.TAURI_DEBUG),
    },
  };
});
