import { useQuery } from '@tanstack/react-query';

import { getContainer } from '@/data';
import { profileQueryKeys } from '@/features/profile/query-keys';
import { useAuthStore } from '@/store/auth-store';

/**
 * Cached current-profile fetch. Syncs into the auth store when data arrives.
 * Screens should prefer store `profile` for display; use this for refetch/caching.
 */
export function useCurrentProfileQuery(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);
  const applyProfile = useAuthStore((s) => s.applyProfile);

  return useQuery({
    queryKey: profileQueryKeys.current,
    queryFn: async () => {
      const profile = await getContainer().profileService.getCurrentProfile();
      if (profile) {
        applyProfile(profile);
      }
      return profile;
    },
    enabled: Boolean(enabled && userId),
  });
}
