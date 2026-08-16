import { forwardRef, useState, type ComponentProps } from 'react';
import { Pressable, type TextInput } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

type PasswordInputProps = Omit<
  ComponentProps<typeof Input>,
  'secureTextEntry' | 'rightElement'
> & {
  /** When true, password is hidden (default). */
  defaultHidden?: boolean;
};

/**
 * Password field with show/hide toggle.
 * Reuses Input; never mutates the stored password value.
 */
export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  function PasswordInput({ defaultHidden = true, accessibilityLabel, ...rest }, ref) {
    const theme = useTheme();
    const { t } = useTranslation();
    const [hidden, setHidden] = useState(defaultHidden);

    const toggleLabel = hidden
      ? t('common.showPassword')
      : t('common.hidePassword');

    return (
      <Input
        ref={ref}
        {...rest}
        secureTextEntry={hidden}
        accessibilityLabel={accessibilityLabel}
        rightElement={
          <Pressable
            onPress={() => setHidden((prev) => !prev)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={toggleLabel}
            accessibilityState={{ checked: !hidden }}
          >
            {hidden ? (
              <Eye size={20} color={theme.textMuted} />
            ) : (
              <EyeOff size={20} color={Colors.primary} />
            )}
          </Pressable>
        }
      />
    );
  },
);
