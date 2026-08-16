import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { OrganizationCard } from '@/components/cards/OrganizationCard';
import { Screen } from '@/components/layout/Screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Spacing } from '@/constants/spacing';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import type { Organization } from '@/domain/models';
import {
  useFavoriteOrganizations,
  useToggleFavorite,
} from '@/features/favorites/hooks/use-favorites';
import { pushJoinQueueList, pushOrganization } from '@/features/queue/navigation';
import { useJoinQueueStore } from '@/store/join-queue-store';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function FavoritesScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const selectOrganization = useJoinQueueStore((s) => s.selectOrganization);
  const {
    data: organizations = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useFavoriteOrganizations();
  const toggleFavorite = useToggleFavorite();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const openOrganization = (org: Organization) => {
    selectOrganization(org.id);
    pushOrganization(org.id);
  };

  const onToggle = useCallback(
    (org: Organization) => {
      if (toggleFavorite.isPending) return;
      setPendingId(org.id);
      toggleFavorite.mutate(
        {
          organizationId: org.id,
          currentlyFavorited: true,
          organization: org,
        },
        {
          onSettled: () => setPendingId(null),
        },
      );
    },
    [toggleFavorite],
  );

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={theme.textSecondary}
          />
        }
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title={t('favorites.title')}
            subtitle={t('favorites.subtitle')}
            onBack={() => router.back()}
          />
        </Animated.View>

        {isLoading ? (
          <View style={styles.padded}>
            <LoadingSkeleton count={4} />
          </View>
        ) : isError ? (
          <ErrorState
            title={t('favorites.loadError')}
            description={getOrganizationErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : organizations.length === 0 ? (
          <EmptyState
            title={t('favorites.emptyTitle')}
            description={t('favorites.emptyDescription')}
            actionLabel={t('favorites.browse')}
            onActionPress={pushJoinQueueList}
          />
        ) : (
          <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
            <View style={styles.stack}>
              {organizations.map((org) => (
                <OrganizationCard
                  key={org.id}
                  organization={org}
                  isFavorite
                  favoriteLoading={pendingId === org.id && toggleFavorite.isPending}
                  onToggleFavorite={() => onToggle(org)}
                  onPress={() => openOrganization(org)}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: Spacing.md,
  },
  stack: {
    gap: Spacing.md,
  },
});
