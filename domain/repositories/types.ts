/**
 * Unsubscribe handle returned by realtime subscribe placeholders.
 */
export type Unsubscribe = () => void;

/**
 * Placeholder realtime subscription callback.
 * Implementations may no-op until Supabase Realtime is wired.
 */
export type SubscribeCallback<T> = (payload: T) => void;
