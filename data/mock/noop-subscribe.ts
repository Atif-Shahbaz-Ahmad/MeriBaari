import type { Unsubscribe } from '@/domain/repositories';

/** No-op subscribe used by all mock repositories until Realtime is wired. */
export function noopSubscribe<T>(
  _callback: (payload: T) => void,
): Unsubscribe {
  return () => undefined;
}
