import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { ThemeProvider, DarkTheme as NavDark, DefaultTheme as NavLight } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import '@/global.css';

import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-theme';
import { AppProviders } from '@/lib/providers';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const MeriBaariLight = {
  ...NavLight,
  colors: {
    ...NavLight.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.card,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.error,
  },
};

const MeriBaariDark = {
  ...NavDark,
  colors: {
    ...NavDark.colors,
    primary: Colors.primary,
    background: Colors.darkBackground,
    card: Colors.darkCard,
    text: Colors.textInverse,
    border: Colors.darkBorder,
    notification: Colors.error,
  },
};

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <ThemeProvider value={colorScheme === 'dark' ? MeriBaariDark : MeriBaariLight}>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="auth" options={{ animation: 'none' }} />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(business)" />
            <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
