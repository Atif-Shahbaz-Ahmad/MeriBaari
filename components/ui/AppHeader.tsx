import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Bell } from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface AppHeaderProps {
  greeting: string;
  name: string;
  notificationCount?: number;
  onNotificationPress?: () => void;
  style?: ViewStyle;
}

export function AppHeader({
  greeting,
  name,
  notificationCount = 0,
  onNotificationPress,
  style,
}: AppHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <Avatar name={name} size={44} />
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>{greeting}</Text>
          <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          notificationCount > 0
            ? `Notifications, ${notificationCount} unread`
            : 'Notifications'
        }
        accessibilityHint="Opens your notification center"
        onPress={onNotificationPress}
        hitSlop={8}
        style={[styles.bellButton, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Bell size={20} color={theme.text} strokeWidth={2} />
        {notificationCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 4,
  },
  greeting: {
    ...Typography.small,
    fontFamily: Typography.body.fontFamily,
  },
  name: {
    ...Typography.h3,
    marginTop: 2,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: 9,
    fontFamily: Typography.small.fontFamily,
  },
});
