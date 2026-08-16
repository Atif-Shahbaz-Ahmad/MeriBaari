/**
 * Public app download URLs hosted in the Supabase `downloads` bucket.
 * Update this file when replacing preview builds.
 */
export const DOWNLOAD_CONFIG = {
  mobile: {
    platform: 'Android',
    title: 'Android app',
    description: 'Join live queues and track your ticket on your phone.',
    fileName: 'MeriBaari-preview.apk',
    fileLabel: 'APK',
    url: 'https://rkotgiaitaoyxiouaffp.supabase.co/storage/v1/object/public/downloads/mobile/MeriBaari-preview.apk',
  },
  desktop: {
    platform: 'Windows',
    title: 'Desktop app',
    description: 'Run your queue from a desktop workspace.',
    fileName: 'meribaari-desktop.exe',
    fileLabel: 'EXE',
    url: 'https://rkotgiaitaoyxiouaffp.supabase.co/storage/v1/object/public/downloads/desktop/meribaari-desktop.exe',
  },
} as const;

export type DownloadConfig = typeof DOWNLOAD_CONFIG;
