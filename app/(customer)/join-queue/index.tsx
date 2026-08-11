import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { OrganizationCard } from '@/components/cards/OrganizationCard';
import { Screen } from '@/components/layout/Screen';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ORGANIZATION_CATEGORIES_WITH_ALL } from '@/constants/organization-categories';
import { Spacing } from '@/constants/spacing';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import type { Organization } from '@/domain/models';
import { pushOrganization } from '@/features/queue/navigation';
import { useOrganizations } from '@/features/organization/hooks/use-organizations';
import { useJoinQueueStore } from '@/store/join-queue-store';
import type { OrganizationCategory } from '@/types';

export default function OrganizationListScreen() {
  const selectOrganization = useJoinQueueStore((s) => s.selectOrganization);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<OrganizationCategory | 'all'>('all');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const {
    data: results = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOrganizations(debouncedQuery, category);

  const openOrganization = (org: Organization) => {
    selectOrganization(org.id);
    pushOrganization(org.id);
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Discover"
            subtitle="Find places and join smart queues"
            onBack={() => router.back()}
          />
          <SearchBar value={query} onChangeText={setQuery} style={styles.search} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {ORGANIZATION_CATEGORIES_WITH_ALL.map((item) => (
              <CategoryChip
                key={item.id}
                label={item.label}
                selected={category === item.id}
                onPress={() => setCategory(item.id)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {isLoading || (isFetching && results.length === 0) ? (
          <View style={styles.padded}>
            <LoadingSkeleton count={4} />
          </View>
        ) : isError ? (
          <ErrorState
            title="Could not load organizations"
            description={getOrganizationErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : results.length === 0 ? (
          <EmptyState
            title="No organizations found"
            description="Try another search term or clear the category filter."
            actionLabel="Clear filters"
            onActionPress={() => {
              setQuery('');
              setCategory('all');
            }}
          />
        ) : (
          <OrgSection
            title="All Organizations"
            subtitle={`${results.length} result${results.length === 1 ? '' : 's'}`}
            organizations={results}
            onPress={openOrganization}
            delay={100}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

function OrgSection({
  title,
  subtitle,
  organizations,
  onPress,
  delay,
}: {
  title: string;
  subtitle?: string;
  organizations: Organization[];
  onPress: (org: Organization) => void;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.padded}>
      <SectionHeader title={title} subtitle={subtitle} style={styles.sectionHeader} />
      <View style={styles.stack}>
        {organizations.map((org) => (
          <OrganizationCard
            key={`${title}-${org.id}`}
            organization={org}
            onPress={() => onPress(org)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
  },
  search: {
    marginTop: Spacing.md,
  },
  chips: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  stack: {
    gap: Spacing.md,
  },
});
