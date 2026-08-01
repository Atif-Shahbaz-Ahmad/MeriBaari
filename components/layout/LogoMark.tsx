import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';

interface LogoMarkProps {
  size?: number;
  /** light = blue figures (on light bg); dark/onPrimary = white figures */
  variant?: 'light' | 'dark' | 'onPrimary';
}

/**
 * MeriBaari symbol from branding guide:
 * two facing figures whose arms form a circle, with a green checkmark.
 */
export function LogoMark({ size = 48, variant = 'light' }: LogoMarkProps) {
  const figure = variant === 'light' ? Colors.primary : Colors.textInverse;
  const check = Colors.secondary;

  return (
    <Svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      {/* Left head */}
      <Circle cx="36" cy="30" r="13" fill={figure} />
      {/* Right head */}
      <Circle cx="92" cy="30" r="13" fill={figure} />
      {/* Left body */}
      <Path
        d="M20 52c1-3 4-5 8-5h16c10 0 18 7 20 17 3 12 1 26-5 36-3 5-8 8-14 8H31c-7 0-12-6-11-13 2-16 0-32 0-43z"
        fill={figure}
      />
      {/* Right body */}
      <Path
        d="M108 52c-1-3-4-5-8-5H84c-10 0-18 7-20 17-3 12-1 26 5 36 3 5 8 8 14 8h14c7 0 12-6 11-13-2-16 0-32 0-43z"
        fill={figure}
      />
      {/* Inner arm curves forming circle */}
      <Path
        d="M48 58c10 12 14 22 16 34"
        stroke={figure}
        strokeWidth={11}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M80 58c-10 12-14 22-16 34"
        stroke={figure}
        strokeWidth={11}
        strokeLinecap="round"
        fill="none"
      />
      {/* Green checkmark */}
      <Path
        d="M50 94l10 10 20-22"
        stroke={check}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
