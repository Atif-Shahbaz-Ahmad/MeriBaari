import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/spacing';

type KeyboardFormProps = {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /**
   * Extra offset for stacked headers / safe area.
   * Defaults work for most Expo Router screens.
   */
  keyboardVerticalOffset?: number;
};

/**
 * Form-friendly keyboard avoidance for iOS + Android.
 * Prefer this over ad-hoc KeyboardAvoidingView (Android previously used
 * `behavior={undefined}`, which left fields behind the keyboard).
 */
export function KeyboardForm({
  children,
  contentContainerStyle,
  style,
  keyboardVerticalOffset,
}: KeyboardFormProps) {
  const insets = useSafeAreaInsets();
  const offset =
    keyboardVerticalOffset ??
    (Platform.OS === 'ios' ? insets.top : 0);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing.xl },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
