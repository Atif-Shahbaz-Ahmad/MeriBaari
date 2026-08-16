import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ExternalLink, MapPin } from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import {
  buildStaticMapPreviewUrl,
  hasValidCoords,
  openMapsLocation,
} from '@/lib/geo';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

type LocationMapPreviewProps = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  /** Organization / place name passed to the device Maps app. */
  label?: string | null;
  address?: string | null;
  city?: string | null;
  /** Show address/city text under the map (default true). */
  showAddress?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Tappable location preview: static map image (no react-native-maps) + address.
 * Tap opens the device Maps app via `openMapsLocation()`.
 */
export function LocationMapPreview({
  latitude,
  longitude,
  label,
  address,
  city,
  showAddress = true,
  style,
}: LocationMapPreviewProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [imageFailed, setImageFailed] = useState(false);

  if (!hasValidCoords(latitude, longitude)) {
    return null;
  }

  // hasValidCoords guarantees both values are finite numbers.
  const lat = latitude;
  const lng = longitude as number;
  const addressLine = address?.trim() || null;
  const cityLine = city?.trim() || null;
  const mapUri = buildStaticMapPreviewUrl(lat, lng);

  const onOpen = () => {
    void openMapsLocation({
      latitude: lat,
      longitude: lng,
      label: label ?? undefined,
      address: [addressLine, cityLine].filter(Boolean).join(', '),
    }).then((opened) => {
      if (!opened) {
        Alert.alert(
          t('maps.openFailedTitle'),
          t('maps.openFailedBody'),
        );
      }
    });
  };

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={t('maps.openA11y')}
        accessibilityHint={t('maps.openHint')}
        style={({ pressed }) => [
          styles.mapFrame,
          {
            borderColor: theme.border,
            backgroundColor: theme.tints.muted.bg,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        {!imageFailed ? (
          <Image
            source={{ uri: mapUri }}
            style={styles.mapImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View
            style={[styles.fallback, { backgroundColor: theme.tints.primary.bg }]}
          >
            <View style={[styles.fallbackGrid, { borderColor: theme.tints.primary.border }]} />
            <MapPin size={36} color={Colors.primary} strokeWidth={2.25} />
            <Text style={[styles.fallbackLabel, { color: theme.tints.primary.fg }]}>
              {t('maps.previewFallback')}
            </Text>
          </View>
        )}

        <View style={styles.tapBadge}>
          <ExternalLink size={14} color={Colors.textInverse} />
          <Text style={styles.tapBadgeText}>{t('maps.tapToOpen')}</Text>
        </View>
      </Pressable>

      {showAddress ? (
        <View style={styles.addressBlock}>
          {addressLine ? (
            <View style={styles.addressRow}>
              <MapPin size={16} color={Colors.primary} />
              <Text style={[styles.addressText, { color: theme.text }]}>
                {addressLine}
              </Text>
            </View>
          ) : (
            <View style={styles.addressRow}>
              <MapPin size={16} color={theme.textMuted} />
              <Text style={[styles.addressMuted, { color: theme.textMuted }]}>
                {t('maps.noStreetAddress')}
              </Text>
            </View>
          )}
          {cityLine ? (
            <Text style={[styles.cityText, { color: theme.textSecondary }]}>
              {cityLine}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  mapFrame: {
    height: 168,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  fallbackGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  fallbackLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  tapBadge: {
    position: 'absolute',
    left: Spacing.sm,
    bottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  tapBadgeText: {
    ...Typography.small,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  addressBlock: {
    gap: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  addressText: {
    ...Typography.body,
    flex: 1,
  },
  addressMuted: {
    ...Typography.caption,
    flex: 1,
  },
  cityText: {
    ...Typography.caption,
    marginLeft: 20,
  },
});
