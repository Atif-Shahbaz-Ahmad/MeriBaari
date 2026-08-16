import { StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useCaptureOrganizationLocation } from '@/features/organization/hooks/use-capture-organization-location';
import type { GeoCoords } from '@/lib/geo';
import { useTheme } from '@/hooks/use-theme';

type UseCurrentLocationControlProps = {
  onCoords: (coords: GeoCoords) => void;
  disabled?: boolean;
};

/**
 * “Use Current Location” control for organization create/edit forms.
 * Reuses `useUserLocation` via `useCaptureOrganizationLocation`.
 */
export function UseCurrentLocationControl({
  onCoords,
  disabled = false,
}: UseCurrentLocationControlProps) {
  const theme = useTheme();
  const { capture, isLoading, status, message } =
    useCaptureOrganizationLocation();

  const onPress = () => {
    void (async () => {
      const coords = await capture();
      if (coords) onCoords(coords);
    })();
  };

  const messageColor =
    status === 'success'
      ? theme.tints.secondary.fg
      : status === 'denied' || status === 'error'
        ? theme.tints.error.fg
        : theme.textMuted;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.sectionLabel, { color: theme.text }]}>Map location</Text>
      <Text style={[styles.hint, { color: theme.textMuted }]}>
        Use your phone’s GPS so customers can find you on the map. Address and city stay
        as you typed them.
      </Text>
      <Button
        title={isLoading ? 'Getting location…' : 'Use Current Location'}
        variant="outline"
        size="md"
        loading={isLoading}
        disabled={disabled || isLoading}
        onPress={onPress}
        leftIcon={
          isLoading ? undefined : <MapPin size={18} color={Colors.primary} />
        }
        accessibilityLabel="Use current location"
        accessibilityHint="Saves your current GPS location for the map preview"
      />
      {message ? (
        <Text style={[styles.message, { color: messageColor }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.bodyMedium,
  },
  hint: {
    ...Typography.caption,
  },
  message: {
    ...Typography.caption,
  },
});
