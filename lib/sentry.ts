import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

import {
  registerErrorReporter,
  resolveSentryEnvironment,
  setErrorReportingEnabled,
  type MonitoringContext,
} from '@/lib/monitoring';
import { sanitizeSentryEvent } from '@/lib/sentry-sanitize';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  sentryDsn?: string;
  sentryEnvironment?: string;
};

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || extra.sentryDsn || '';

const environment = resolveSentryEnvironment(
  process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || extra.sentryEnvironment,
  __DEV__ ? 'development' : process.env.EAS_BUILD_PROFILE === 'preview' ? 'preview' : 'production',
);

const release = `meribaari-mobile@${Constants.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '1.0.0'}+${
  Constants.nativeBuildVersion ?? 'dev'
}`;

export const sentryNavigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

if (dsn) {
  Sentry.init({
    dsn,
    enabled: true,
    environment,
    release,
    sendDefaultPii: false,
    tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
    enableNativeFramesTracking: !isRunningInExpoGo(),
    enableAutoSessionTracking: true,
    integrations: [sentryNavigationIntegration],
    beforeSend(event) {
      return sanitizeSentryEvent(event);
    },
  });

  setErrorReportingEnabled(true);
  registerErrorReporter((error, context) => {
    Sentry.withScope((scope) => {
      applyContext(scope, context);
      Sentry.captureException(error);
    });
  });
}

function applyContext(scope: Sentry.Scope, context: MonitoringContext | undefined): void {
  if (!context) return;
  if (context.level) scope.setLevel(context.level);
  scope.setTag('platform', 'mobile');
  if (context.feature) scope.setTag('feature', context.feature);
  if (context.provider) scope.setTag('provider', context.provider);
  if (context.tags) {
    for (const [key, value] of Object.entries(context.tags)) {
      scope.setTag(key, value);
    }
  }
  if (context.extras) scope.setExtras(context.extras);
}
