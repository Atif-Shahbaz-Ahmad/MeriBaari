import { Alert } from 'react-native';
import { Bug } from 'lucide-react-native';

import { SettingsItem } from '@/components/profile/SettingsItem';
import { Colors } from '@/constants/colors';
import { isErrorReportingEnabled, triggerSentryTestException } from '@/lib/monitoring';

export function SentryTestSettingsItem({ showDivider = false }: { showDivider?: boolean }) {
  if (!__DEV__) return null;

  return (
    <SettingsItem
      icon={<Bug size={18} color={Colors.accent} />}
      label="Send Sentry test error"
      description={
        isErrorReportingEnabled()
          ? 'Development only. Sends a test exception to meribaari-mobile.'
          : 'Set EXPO_PUBLIC_SENTRY_DSN to enable Sentry.'
      }
      onPress={() => {
        triggerSentryTestException('mobile');
        Alert.alert(
          'Sentry',
          isErrorReportingEnabled() ? 'Test exception sent.' : 'Sentry DSN is not set.',
        );
      }}
      showDivider={showDivider}
    />
  );
}
