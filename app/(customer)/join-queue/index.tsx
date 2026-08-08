import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { OrganizationCard } from '@/components/cards/OrganizationCard';
import { Screen } from '@/components/layout/Screen';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Spacing } from '@/constants/spacing';
import { pushOrganization } from '@/features/queue/navigation';
import { dataAccess } from '@/data';
import { useJoinQueueStore } from '@/store/join-queue-store';
import type { Organization, OrganizationCategory } from '@/types';

const ORGANIZATION_CATEGORIES = dataAccess.ORGANIZATION_CATEGORIES;

export default function OrganizationListScreen() {
  const selectOrganization = useJoinQueueStore((s) => s.selectOrganization);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<OrganizationCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, [query, category]);

  const results = useMemo(
    () => dataAccess.searchOrganizations(query, category),
    [query, category],
  );

  const featured = results.filter((org) => org.featured);
  const popular = results.filter((org) => org.popular);
  const nearby = results.filter((org) => org.nearby);
  const recent = results.filter((org) => org.recentlyVisited);

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
            {ORGANIZATION_CATEGORIES.map((item) => (
              <CategoryChip
                key={item.id}
                label={item.label}
                selected={category === item.id}
                onPress={() => setCategory(item.id)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {loading ? (
          <View style={styles.padded}>
            <LoadingSkeleton count={4} />
          </View>
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
          <>
            {featured.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                <SectionHeader title="Featured" style={styles.sectionPad} />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontal}
                >
                  {featured.map((org) => (
                    <OrganizationCard
                      key={org.id}
                      organization={org}
                      compact
                      onPress={() => openOrganization(org)}
                    />
                  ))}
                </ScrollView>
              </Animated.View>
            ) : null}

            {nearby.length > 0 ? (
              <OrgSection
                title="Nearby"
                subtitle="Close to your location"
                organizations={nearby}
                onPress={openOrganization}
                delay={140}
              />
            ) : null}

            {popular.length > 0 ? (
              <OrgSection
                title="Popular"
                subtitle="Most joined this week"
                organizations={popular}
                onPress={openOrganization}
                delay={180}
              />
            ) : null}

            {recent.length > 0 ? (
              <OrgSection
                title="Recently Visited"
                subtitle="Pick up where you left off"
                organizations={recent}
                onPress={openOrganization}
                delay={220}
              />
            ) : null}

            <OrgSection
              title="All Organizations"
              subtitle={`${results.length} result${results.length === 1 ? '' : 's'}`}
              organizations={results}
              onPress={openOrganization}
              delay={260}
            />
          </>
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
          <OrganizationCard key={`${title}-${org.id}`} organization={org} onPress={() => onPress(org)} />
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
  horizontal: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    paddingTop: Spacing.md,
  },
  sectionPad: {
    paddingHorizontal: Spacing.md,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  stack: {
    gap: Spacing.md,
  },
});
