import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Input } from '@/components/ui/Input';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useState } from 'react';

export default function EditProfileScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  const onSave = () => {
    Alert.alert(
      'Profile updated (mock)',
      'Changes are local for now. Account sync arrives with Supabase in a later phase.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Edit Profile"
            subtitle="Update your personal details"
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.padded}>
          <Card style={styles.form}>
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              Placeholder editor — no backend write yet.
            </Text>
            <Input
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              accessibilityLabel="Full name"
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email"
            />
            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              accessibilityLabel="Phone number"
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.padded}>
          <PrimaryButton title="Save changes" onPress={onSave} />
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
  },
  form: {
    gap: Spacing.md,
  },
  hint: {
    ...Typography.caption,
  },
});
