export type Href = string;

export const router = {
  push: (_href: string) => undefined,
  replace: (_href: string) => undefined,
  back: () => undefined,
};

export function Redirect(_props: { href: string }) {
  return null;
}

export function Stack(_props: { children?: unknown }) {
  return null;
}

export function useLocalSearchParams() {
  return {};
}

export function useRouter() {
  return router;
}
