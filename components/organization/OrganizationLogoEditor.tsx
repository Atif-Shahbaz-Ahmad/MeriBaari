import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, Trash2 } from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface OrganizationLogoEditorProps {
  name?: string | null;
  logoUrl?: string | null;
  loading?: boolean;
  /** When true, pick only updates local preview (create flow before org exists). */
  previewOnly?: boolean;
  onPick: (localUri: string) => Promise<void>;
  onRemove: () => Promise<void>;
}

/**
 * Business organization logo controls — gallery pick, replace, remove.
 * Mirrors ProfileAvatarEditor; uploads go through organization storage.
 */
export function OrganizationLogoEditor({
  name,
  logoUrl,
  loading = false,
  previewOnly = false,
  onPick,
  onRemove,
}: OrganizationLogoEditorProps) {
  const theme = useTheme();
  const [busyAction, setBusyAction] = useState<'pick' | 'remove' | null>(null);
  const isBusy = loading || busyAction !== null;
  const hasLogo = Boolean(logoUrl);

  const pickFromGallery = async () => {
    if (isBusy) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo library access to set your business logo.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      exif: false,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    setBusyAction('pick');
    try {
      await onPick(result.assets[0].uri);
    } finally {
      setBusyAction(null);
    }
  };

  const confirmRemove = () => {
    if (isBusy || !hasLogo) return;
    Alert.alert('Remove logo?', 'Your business will show the default icon instead.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusyAction('remove');
            try {
              await onRemove();
            } finally {
              setBusyAction(null);
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <Text style={[styles.title, { color: theme.text }]}>Business logo</Text>
      <View style={styles.avatarWrap}>
        <Avatar name={name} uri={logoUrl} size={96} />
        {isBusy ? (
          <View style={styles.overlay} accessibilityLabel="Updating business logo">
            <ActivityIndicator color={Colors.textInverse} />
          </View>
        ) : null}
      </View>

      <Text style={[styles.hint, { color: theme.textMuted }]}>
        {previewOnly
          ? 'Photos are resized to 512×512 and uploaded after you create the organization.'
          : 'Photos are resized to 512×512 and compressed before upload.'}
      </Text>

      <View style={styles.actions}>
        <Button
          title={hasLogo ? 'Change logo' : 'Add logo'}
          variant="outline"
          loading={busyAction === 'pick'}
          disabled={isBusy && busyAction !== 'pick'}
          leftIcon={
            busyAction === 'pick' ? undefined : hasLogo ? (
              <Camera size={18} color={Colors.primary} />
            ) : (
              <ImagePlus size={18} color={Colors.primary} />
            )
          }
          onPress={() => void pickFromGallery()}
          accessibilityHint="Opens your photo library"
        />
        {hasLogo ? (
          <Pressable
            onPress={confirmRemove}
            disabled={isBusy}
            style={[styles.removeRow, { opacity: isBusy ? 0.55 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Remove business logo"
            accessibilityState={{ disabled: isBusy, busy: busyAction === 'remove' }}
          >
            {busyAction === 'remove' ? (
              <ActivityIndicator color={Colors.error} size="small" />
            ) : (
              <Trash2 size={16} color={Colors.error} />
            )}
            <Text style={styles.removeText}>
              {busyAction === 'remove' ? 'Removing…' : 'Remove logo'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    ...Typography.bodyMedium,
    alignSelf: 'flex-start',
  },
  avatarWrap: {
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    ...Typography.caption,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
  removeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 44,
    borderRadius: Radius.lg,
  },
  removeText: {
    ...Typography.small,
    color: Colors.error,
  },
});
