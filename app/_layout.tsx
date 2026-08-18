import 'react-native-worklets';
import 'react-native-reanimated';
import { sentryNavigationIntegration } from '@/lib/sentry';
import * as Sentry from '@sentry/react-native';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  ThemeProvider,
  DarkTheme as NavDark,
  DefaultTheme as NavLight,
} from '@react-navigation/native';
import { Stack, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet as RNStyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '@/global.css';

import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-theme';
import { AppProviders } from '@/lib/providers';
import { reportError } from '@/lib/monitoring';

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

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MeriBaari root error', error, info.componentStack);
    reportError(error, {
      feature: 'root-error-boundary',
      extras: { componentStack: info.componentStack ?? '' },
    });
  }

  render() {
    if (this.state.error) {
      return (
        <View style={errorStyles.wrap}>
          <Text style={errorStyles.title}>MeriBaari failed to start</Text>
          <Text style={errorStyles.body}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = RNStyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
});

function RootLayout() {
  const colorScheme = useColorScheme();
  const navigationRef = useNavigationContainerRef();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    sentryNavigationIntegration.registerNavigationContainer(navigationRef);
  }, [navigationRef]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootErrorBoundary>
        <AppProviders>
          <ThemeProvider value={colorScheme === 'dark' ? MeriBaariDark : MeriBaariLight}>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="auth" options={{ animation: 'none' }} />
              <Stack.Screen name="(customer)" />
              <Stack.Screen name="(business)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </ThemeProvider>
        </AppProviders>
      </RootErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
