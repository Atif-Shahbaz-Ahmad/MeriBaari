import type { Unsubscribe } from '@/domain/repositories';

/** No-op subscribe used by mock repositories (and unused domain subscribe stubs). */
export function noopSubscribe<T>(
  _callback: (payload: T) => void,
): Unsubscribe {
  return () => undefined;
}
