export const Platform = {
  OS: 'web' as const,
  select: <T,>(spec: { web?: T; default?: T; ios?: T; android?: T; native?: T }) =>
    spec.web ?? spec.default,
};

export const StyleSheet = {
  hairlineWidth: 1,
  create: <T,>(styles: T) => styles,
  flatten: (style: unknown) => style,
};

export const Keyboard = {
  dismiss: () => undefined,
  addListener: () => ({ remove: () => undefined }),
};

export function View(props: Record<string, unknown>) {
  return props.children ?? null;
}

export function Text(props: Record<string, unknown>) {
  return props.children ?? null;
}

export const Linking = {
  openURL: async (url: string) => {
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  },
  createURL: (path: string) => path,
  getInitialURL: async () =>
    typeof window === 'undefined' ? null : window.location.href,
  addEventListener: () => ({ remove: () => undefined }),
};

export function useColorScheme(): 'light' | 'dark' | null {
  return null;
}

export const I18nManager = {
  allowRTL: (_value: boolean) => undefined,
  forceRTL: (_value: boolean) => undefined,
  isRTL: false,
};

export const Alert = {
  alert: (title: string, message?: string) => {
    if (typeof window !== 'undefined') window.alert(message ? `${title}\n${message}` : title);
  },
};

export const AppState = {
  currentState: 'active',
  addEventListener: () => ({ remove: () => undefined }),
};

export type AppStateStatus = string;
export type ViewStyle = Record<string, unknown>;
export type TextStyle = Record<string, unknown>;
export type StyleProp<T> = T | T[] | undefined;
export type ViewProps = Record<string, unknown>;
export type TextProps = Record<string, unknown>;
