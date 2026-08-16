import { router } from 'expo-router';
import { Bug, FileText, Mail, Phone, Shield } from 'lucide-react-native';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/layout/Screen';
import { FAQCard } from '@/components/profile/FAQCard';
import { SettingsGroup } from '@/components/profile/SettingsGroup';
import { SettingsItem } from '@/components/profile/SettingsItem';
import { Card } from '@/components/ui/Card';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { dataAccess } from '@/data';
import { pushPrivacy } from '@/features/profile/navigation';
import { useTheme } from '@/hooks/use-theme';

const MOCK_ABOUT = dataAccess.MOCK_ABOUT;
const MOCK_FAQ = dataAccess.MOCK_FAQ;

export default function HelpSupportScreen() {
  const theme = useTheme();

  const contactEmail = () => {
    void Linking.openURL(`mailto:${MOCK_ABOUT.supportEmail}?subject=MeriBaari%20Support`);
  };

  const contactPhone = () => {
    Alert.alert('Support phone', MOCK_ABOUT.supportPhone, [
      { text: 'Close', style: 'cancel' },
      {
        text: 'Call',
        onPress: () => void Linking.openURL(`tel:${MOCK_ABOUT.supportPhone.replace(/\s/g, '')}`),
      },
    ]);
  };

  const reportProblem = () => {
    Alert.alert(
      'Report a problem',
      'Thanks for helping improve MeriBaari. Full reporting connects in a later release.',
      [{ text: 'OK' }],
    );
  };

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Help & Support"
            subtitle="Answers, contact, and policies"
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <Text style={[styles.section, { color: theme.textMuted }]}>Frequently asked questions</Text>
          <View style={styles.faqStack}>
            {MOCK_FAQ.map((item, index) => (
              <FAQCard key={item.id} item={item} index={index} />
            ))}
          </View>
        </Animated.View>

        <View style={styles.padded}>
          <SettingsGroup title="Contact" index={1}>
            <SettingsItem
              icon={<Mail size={18} color={Colors.primary} />}
              label="Contact Support"
              description={MOCK_ABOUT.supportEmail}
              onPress={contactEmail}
            />
            <SettingsItem
              icon={<Phone size={18} color={Colors.primary} />}
              label="Support Phone"
              description={MOCK_ABOUT.supportPhone}
              onPress={contactPhone}
            />
            <SettingsItem
              icon={<Bug size={18} color={Colors.primary} />}
              label="Report a Problem"
              description="Send your report to the support team at atif.s.ahmad2@gmail.com"
              onPress={reportProblem}
              showDivider={false}
            />
          </SettingsGroup>
        </View>

        <View style={styles.padded}>
          <SettingsGroup title="Legal" index={2}>
            <SettingsItem
              icon={<Shield size={18} color={Colors.primary} />}
              label="Privacy Policy"
              onPress={pushPrivacy}
            />
            <SettingsItem
              icon={<FileText size={18} color={Colors.primary} />}
              label="Terms & Conditions"
              onPress={() =>
                Alert.alert(
                  'Terms & Conditions',
                  'Full legal terms will be published with the public launch.',
                )
              }
              showDivider={false}
            />
          </SettingsGroup>
        </View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.padded}>
          <Card>
            <Text style={[styles.versionLabel, { color: theme.textMuted }]}>App version</Text>
            <Text style={[styles.version, { color: theme.text }]}>{MOCK_ABOUT.version}</Text>
          </Card>
        </Animated.View>
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
    gap: Spacing.sm,
  },
  section: {
    ...Typography.small,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  faqStack: {
    gap: Spacing.sm,
  },
  versionLabel: {
    ...Typography.caption,
  },
  version: {
    ...Typography.h3,
    marginTop: Spacing.xs,
  },
});
