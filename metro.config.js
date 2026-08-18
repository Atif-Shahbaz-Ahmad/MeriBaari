const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

if (process.env.MERIBAARI_PRODUCTION_APK === '1') {
  const extra =
    /node_modules[/\\](expo-dev-client|expo-dev-launcher|expo-dev-menu|expo-dev-menu-interface)[/\\].*/;
  const existing = config.resolver.blockList;
  config.resolver.blockList = existing ? [existing, extra].flat() : extra;
}

module.exports = withNativeWind(config, { input: './global.css' });
