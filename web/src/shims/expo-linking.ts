export function createURL(path: string) {
  if (typeof window === 'undefined') return `/${path.replace(/^\//, '')}`;
  return `${window.location.origin}/${path.replace(/^\//, '')}`;
}

export async function getInitialURL() {
  return typeof window === 'undefined' ? null : window.location.href;
}

export function addEventListener() {
  return { remove: () => undefined };
}

export async function openURL(url: string) {
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
}

const Linking = { createURL, getInitialURL, addEventListener, openURL };
export default Linking;
