import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/ui/ErrorState';
import {
  useEnsureNotificationChannel,
  usePushNotificationResponses,
  usePushTokenRegistration,
} from '@/features/notifications/hooks/use-push-notifications';
import { LocaleProvider } from '@/lib/i18n/locale-context';
import { queryClient } from '@/lib/query-client';
import { getReleaseBackendError } from '@/lib/supabase';

// Registers Expo foreground notification handler (side-effect).
import '@/lib/notifications';

function PushNotificationBootstrap() {
  useEnsureNotificationChannel();
  usePushTokenRegistration();
  usePushNotificationResponses();
  return null;
}

function ReleaseBackendGate({ children }: PropsWithChildren) {
  const error = getReleaseBackendError();
  if (!error) {
    return <>{children}</>;
  }

  return (
    <View style={styles.misconfigured}>
      <ErrorState variant="network" title="MeriBaari is not connected" description={error} />
    </View>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ReleaseBackendGate>
          <PushNotificationBootstrap />
          {children}
        </ReleaseBackendGate>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  misconfigured: {
    flex: 1,
    justifyContent: 'center',
  },
});
