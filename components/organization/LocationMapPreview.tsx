import { createElement, useMemo } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ExternalLink, MapPin } from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import {
  buildInteractiveMapHtml,
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
 * Interactive street map (pan / zoom / pin) plus a button to open the
 * device Maps app. Uses OpenStreetMap tiles so no Google Maps API key is required.
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

  const html = useMemo(() => {
    if (!hasValidCoords(latitude, longitude)) return null;
    return buildInteractiveMapHtml({
      latitude,
      longitude: longitude as number,
      label,
    });
  }, [latitude, longitude, label]);

  if (!html || !hasValidCoords(latitude, longitude)) {
    return null;
  }

  const lat = latitude;
  const lng = longitude as number;
  const addressLine = address?.trim() || null;
  const cityLine = city?.trim() || null;

  const onOpen = () => {
    void openMapsLocation({
      latitude: lat,
      longitude: lng,
      label: label ?? undefined,
      address: [addressLine, cityLine].filter(Boolean).join(', '),
    }).then((opened) => {
      if (!opened) {
        Alert.alert(t('maps.openFailedTitle'), t('maps.openFailedBody'));
      }
    });
  };

  return (
    <View style={[styles.wrap, style]}>
      <View
        style={[
          styles.mapFrame,
          { borderColor: theme.border, backgroundColor: theme.tints.muted.bg },
        ]}
      >
        <MapCanvas
          html={html}
          accessibilityLabel={label ? `Map of ${label}` : 'Map'}
        />
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={t('maps.openA11y')}
          accessibilityHint={t('maps.openHint')}
          style={styles.tapBadge}
        >
          <ExternalLink size={14} color={Colors.textInverse} />
          <Text style={styles.tapBadgeText}>{t('maps.tapToOpen')}</Text>
        </Pressable>
      </View>

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

/**
 * Leaflet HTML map. Native uses WebView; Expo web uses an iframe because
 * react-native-webview does not run in the browser.
 */
function MapCanvas({
  html,
  accessibilityLabel,
}: {
  html: string;
  accessibilityLabel: string;
}) {
  if (Platform.OS === 'web') {
    return createElement('iframe', {
      srcDoc: html,
      title: accessibilityLabel,
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderWidth: 0,
        backgroundColor: 'transparent',
      },
      referrerPolicy: 'no-referrer',
    });
  }

  return (
    <WebView
      source={{ html, baseUrl: 'https://unpkg.com/' }}
      style={styles.mapWebView}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      setSupportMultipleWindows={false}
      androidLayerType="hardware"
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  mapFrame: {
    height: 220,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  mapWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tapBadge: {
    position: 'absolute',
    left: Spacing.sm,
    bottom: Spacing.sm,
    zIndex: 2,
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
