import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface AvatarProps {
  name?: string | null;
  uri?: string | null;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ name, uri, size = 48, style }: AvatarProps) {
  const theme = useTheme();
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.tints.primary.bgStrong,
          borderColor: theme.tints.primary.bg,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={name ? `Avatar for ${name}` : 'User avatar'}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.max(12, size * 0.36), color: theme.tints.primary.fg }]} importantForAccessibility="no">
          {initials}
        </Text>
      )}
    </View>
  );
}

function getInitials(name?: string | null) {
  if (!name?.trim()) return 'MB';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
  },
  initials: {
    ...Typography.bodyMedium,
  },
});
