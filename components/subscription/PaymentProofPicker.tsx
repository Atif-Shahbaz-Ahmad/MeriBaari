import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, RefreshCw } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

interface PaymentProofPickerProps {
  uri: string | null;
  loading?: boolean;
  error?: string | null;
  onChange: (uri: string) => void;
}

export function PaymentProofPicker({
  uri,
  loading = false,
  error,
  onChange,
}: PaymentProofPickerProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [picking, setPicking] = useState(false);
  const busy = loading || picking;

  const pick = async () => {
    if (busy) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        exif: false,
      });
      if (result.canceled || !result.assets[0]?.uri) return;
      onChange(result.assets[0].uri);
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.text }]}>
        {t('subscription.payment.screenshotLabel')}
      </Text>
      {uri ? (
        <View style={[styles.previewWrap, { borderColor: theme.border }]}>
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
          {busy ? (
            <View style={styles.overlay}>
              <ActivityIndicator color={Colors.textInverse} />
            </View>
          ) : null}
        </View>
      ) : (
        <Pressable
          onPress={() => void pick()}
          disabled={busy}
          style={[styles.placeholder, { borderColor: theme.border, backgroundColor: theme.card }]}
        >
          {busy ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <ImagePlus size={28} color={Colors.primary} />
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                {t('subscription.payment.screenshotHint')}
              </Text>
            </>
          )}
        </Pressable>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        title={uri ? t('subscription.payment.replaceScreenshot') : t('subscription.payment.chooseScreenshot')}
        variant="outline"
        size="sm"
        leftIcon={<RefreshCw size={16} color={Colors.primary} />}
        onPress={() => void pick()}
        loading={picking}
        disabled={busy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.bodyMedium,
  },
  placeholder: {
    minHeight: 180,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  placeholderText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  previewWrap: {
    height: 220,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
});
