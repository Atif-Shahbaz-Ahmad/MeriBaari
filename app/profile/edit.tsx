import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import { router } from 'expo-router';
import { Alert, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useState } from 'react';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { KeyboardForm } from '@/components/layout/KeyboardForm';
import { Screen } from '@/components/layout/Screen';
import { ProfileAvatarEditor } from '@/components/profile/ProfileAvatarEditor';
import { Card } from '@/components/ui/Card';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';

export default function EditProfileScreen() {
  const {
    profile,
    user,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    isLoading,
  } = useAuth();
  const [fullName, setFullName] = useState(
    profile?.fullName ?? user?.fullName ?? '',
  );
  const [email, setEmail] = useState(profile?.email ?? user?.email ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? user?.phone ?? '');
  const [error, setError] = useState<string | null>(null);

  const displayName = fullName.trim() || profile?.fullName || user?.fullName;
  const avatarUrl = profile?.avatarUrl ?? user?.avatarUrl ?? null;

  const onSave = async () => {
    setError(null);
    try {
      await updateProfile({
        fullName: fullName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
      });
      Alert.alert('Profile updated', 'Your changes have been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(getAuthErrorMessage(e));
    }
  };

  const onPickAvatar = async (localUri: string) => {
    setError(null);
    try {
      await uploadAvatar(localUri);
    } catch (e) {
      const message = getAuthErrorMessage(e);
      setError(message);
      Alert.alert('Couldn’t update photo', message);
      throw e;
    }
  };

  const onRemoveAvatar = async () => {
    setError(null);
    try {
      await removeAvatar();
    } catch (e) {
      const message = getAuthErrorMessage(e);
      setError(message);
      Alert.alert('Couldn’t remove photo', message);
      throw e;
    }
  };

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <KeyboardForm contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Edit Profile"
            subtitle="Update your photo and personal details"
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(40).duration(400)} style={styles.padded}>
          <Card style={styles.avatarCard}>
            <ProfileAvatarEditor
              name={displayName}
              avatarUrl={avatarUrl}
              loading={isLoading}
              onPick={onPickAvatar}
              onRemove={onRemoveAvatar}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.padded}>
          <Card style={styles.form}>
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
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.padded}>
          <PrimaryButton
            title="Save changes"
            onPress={() => void onSave()}
            loading={isLoading}
          />
        </Animated.View>
      </KeyboardForm>
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
  avatarCard: {
    alignItems: 'stretch',
  },
  form: {
    gap: Spacing.md,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
});
