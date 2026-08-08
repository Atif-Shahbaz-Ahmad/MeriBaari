import { Switch } from 'react-native';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/use-theme';

interface PreferenceSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function PreferenceSwitch({
  value,
  onValueChange,
  label,
  disabled = false,
}: PreferenceSwitchProps) {
  const theme = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      trackColor={{ false: theme.border, true: Colors.primary100 }}
      thumbColor={value ? Colors.primary : '#f4f4f5'}
      ios_backgroundColor={theme.border}
    />
  );
}
