import { useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import {
  isCustomerRecentActivity,
  mapNotificationToActivityItem,
} from '@/features/home/map-recent-activity';

export const RECENT_ACTIVITY_LIMIT = 8;

export function useRecentActivity() {
  const { data, isLoading, isError, refetch } = useNotifications({
    limit: RECENT_ACTIVITY_LIMIT,
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const items = useMemo(
    () =>
      (data ?? [])
        .filter(isCustomerRecentActivity)
        .slice(0, RECENT_ACTIVITY_LIMIT)
        .map(mapNotificationToActivityItem),
    [data],
  );

  return {
    items,
    isLoading,
    isError,
    refetch,
  };
}
