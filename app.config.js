/**
 * Dynamic Expo config (SDK 54).
 * Preview/production APKs must embed hosted Supabase — never localhost.
 * `expo start` / development clients are unchanged.
 */
function isStandaloneMobileBuild() {
  if (process.env.MERIBAARI_PRODUCTION_APK === '1') {
    return true;
  }
  if (process.env.EAS_BUILD !== 'true') {
    return false;
  }
  const profile = process.env.EAS_BUILD_PROFILE ?? '';
  return profile === 'preview' || profile === 'production';
}

function isLocalhostBackendUrl(url) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

function readPublicBackend() {
  return {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  };
}

function assertStandaloneBackend() {
  if (!isStandaloneMobileBuild()) {
    return;
  }

  const { supabaseUrl, supabaseAnonKey } = readPublicBackend();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Standalone mobile builds require EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY. Set them in the repo-root .env (local APK builds) or EAS environment variables (cloud builds). Production must not use localhost.',
    );
  }

  if (isLocalhostBackendUrl(supabaseUrl)) {
    throw new Error(
      'Standalone mobile build refused a localhost Supabase URL. Set the hosted EXPO_PUBLIC_SUPABASE_URL.',
    );
  }
}

module.exports = ({ config }) => {
  assertStandaloneBackend();
  const { supabaseUrl, supabaseAnonKey } = readPublicBackend();
  return {
    ...config,
    extra: {
      ...config.extra,
      supabaseUrl,
      supabaseAnonKey,
    },
  };
};
