import { useCallback, useEffect, useRef, useState } from 'react';

import {
  checkBackendHealth,
  getPublicSupabaseUrl,
  type BackendHealthStatus,
} from '@/lib/backend-health';

export type ConnectionState =
  | 'online'
  | 'offline'
  | 'reconnecting'
  | 'restored'
  | 'unavailable';

export function useBackendHealth(pollMs = 30000) {
  const [status, setStatus] = useState<BackendHealthStatus>('unknown');
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [connection, setConnection] = useState<ConnectionState>(
    typeof navigator === 'undefined' || navigator.onLine ? 'online' : 'offline',
  );
  const statusRef = useRef(status);
  statusRef.current = status;

  const refresh = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setBrowserOnline(false);
      setStatus('unavailable');
      setConnection('offline');
      return;
    }

    setBrowserOnline(true);
    const previous = statusRef.current;
    if (previous === 'unavailable') {
      setConnection('reconnecting');
    }

    const result = await checkBackendHealth(getPublicSupabaseUrl());
    setStatus(result.status);

    if (result.status === 'available') {
      setConnection(previous === 'unavailable' ? 'restored' : 'online');
      return;
    }

    if (result.status === 'unavailable') {
      setConnection('unavailable');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), pollMs);

    const onOnline = () => {
      setBrowserOnline(true);
      setConnection('reconnecting');
      void refresh();
    };
    const onOffline = () => {
      setBrowserOnline(false);
      setStatus('unavailable');
      setConnection('offline');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      }
    };
  }, [pollMs, refresh]);

  useEffect(() => {
    if (connection !== 'restored') return;
    const timer = setTimeout(() => setConnection('online'), 2500);
    return () => clearTimeout(timer);
  }, [connection]);

  return {
    status,
    browserOnline,
    connection,
    refresh,
    isBackendAvailable: status === 'available',
  };
}
