const isProductionApk = process.env.MERIBAARI_PRODUCTION_APK === '1';

/** Keep Expo Go / `expo start` unchanged. Production APKs must not ship the dev client. */
module.exports = {
  dependencies: isProductionApk
    ? {
        'expo-dev-client': { platforms: { android: null, ios: null } },
        'expo-dev-launcher': { platforms: { android: null, ios: null } },
        'expo-dev-menu': { platforms: { android: null, ios: null } },
        'expo-dev-menu-interface': { platforms: { android: null, ios: null } },
      }
    : {},
};
