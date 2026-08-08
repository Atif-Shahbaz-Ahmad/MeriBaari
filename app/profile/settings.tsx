import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeftRight } from 'lucide-react-native';

import { Screen } from '@/components/layout/Screen';
import { SettingsGroup } from '@/components/profile/SettingsGroup';
import { SettingsItem } from '@/components/profile/SettingsItem';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { AuthHref } from '@/features/auth/navigation';
import {
  pushAbout,
  pushEditProfile,
  pushHelp,
  pushLanguageSettings,
  pushPrivacy,
  pushThemeSettings,
} from '@/features/profile/navigation';
import { useAuth } from '@/hooks/use-auth';
import { dataAccess } from '@/data';
import { usePreferencesStore } from '@/store/preferences-store';
import { useThemeStore } from '@/store/theme-store';
import type { UserPreferences, UserRole } from '@/types';

const LANGUAGE_OPTIONS = dataAccess.LANGUAGE_OPTIONS;
const SETTINGS_GROUPS = dataAccess.SETTINGS_GROUPS;

export default function SettingsScreen() {
  const preference = useThemeStore((s) => s.preference);
  const language = usePreferencesStore((s) => s.language);
  const prefs = usePreferencesStore();
  const toggle = usePreferencesStore((s) => s.toggle);
  const { role, switchRole } = useAuth();

  const languageLabel =
    LANGUAGE_OPTIONS.find((o) => o.value === language)?.label ?? 'English';

  const resolveValue = (itemId: string, preferenceKey?: string) => {
    if (itemId === 'theme') return preference;
    if (preferenceKey === 'language') return languageLabel;
    return undefined;
  };

  const resolvePress = (route?: string) => {
    switch (route) {
      case 'theme':
        return pushThemeSettings;
      case 'language':
        return pushLanguageSettings;
      case 'help':
        return pushHelp;
      case 'about':
        return pushAbout;
      case 'privacy':
        return pushPrivacy;
      case 'edit':
        return pushEditProfile;
      default:
        return undefined;
    }
  };

  /**
   * DEV ONLY — instantly switch Customer ↔ Business mock experiences.
   * Remove this handler and the Developer SettingsGroup before production.
   */
  const onDevSwitchRole = async () => {
    const next: UserRole = role === 'business' ? 'customer' : 'business';
    await switchRole(next);
    router.replace(next === 'business' ? AuthHref.businessHome : AuthHref.customerHome);
  };

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Settings"
            subtitle="Personalize your MeriBaari experience"
            onBack={() => router.back()}
          />
        </Animated.View>

        {SETTINGS_GROUPS.map((group, index) => (
          <View key={group.id} style={styles.padded}>
            <SettingsGroup title={group.title} index={index}>
              {group.items.map((item, itemIndex) => {
                const isToggle = item.kind === 'toggle' && item.preferenceKey;
                const prefKey = item.preferenceKey as keyof UserPreferences | undefined;

                return (
                  <SettingsItem
                    key={item.id}
                    label={item.label}
                    description={item.description}
                    value={resolveValue(item.id, item.preferenceKey)}
                    onPress={isToggle ? undefined : resolvePress(item.route)}
                    switchValue={
                      isToggle && prefKey && typeof prefs[prefKey] === 'boolean'
                        ? (prefs[prefKey] as boolean)
                        : undefined
                    }
                    onSwitchChange={
                      isToggle && prefKey
                        ? () => {
                            void toggle(prefKey);
                          }
                        : undefined
                    }
                    showDivider={itemIndex < group.items.length - 1}
                    danger={item.danger}
                  />
                );
              })}
            </SettingsGroup>
          </View>
        ))}

        {/* DEV ONLY — remove before production */}
        {__DEV__ ? (
          <View style={styles.padded}>
            <SettingsGroup title="Developer" index={99}>
              <SettingsItem
                icon={<ArrowLeftRight size={18} color={Colors.accent} />}
                label="Switch Role"
                description={`DEV: currently ${role ?? 'unset'} — tap to flip`}
                onPress={() => void onDevSwitchRole()}
                showDivider={false}
              />
            </SettingsGroup>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
  },
});
