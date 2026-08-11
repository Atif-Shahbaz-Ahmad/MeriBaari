import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import {
  useEnsureNotificationChannel,
  usePushNotificationResponses,
  usePushTokenRegistration,
} from '@/features/notifications/hooks/use-push-notifications';
import { queryClient } from '@/lib/query-client';

// Registers Expo foreground notification handler (side-effect).
import '@/lib/notifications';

function PushNotificationBootstrap() {
  useEnsureNotificationChannel();
  usePushTokenRegistration();
  usePushNotificationResponses();
  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <PushNotificationBootstrap />
      {children}
    </QueryClientProvider>
  );
}
