import type {
  CatalogRepository,
  LanguageOption,
  RoleCardCopy,
  SettingsGroupDefinition,
  ThemeOption,
  WalkInDepartmentOption,
  WalkInPriorityOption,
  WalkInServiceOption,
} from '@/domain/repositories';
import type { AboutContent, FaqItem, UserPreferences } from '@/types/profile';
import type { OrganizationCategoryMeta } from '@/types/organization';
import type { UserRole } from '@/types/auth';
import { ROLE_CARD_COPY } from '@/mock/auth';
import { ORGANIZATION_CATEGORIES } from '@/mock/categories';
import {
  WALK_IN_DEPARTMENTS,
  WALK_IN_PRIORITIES,
  WALK_IN_SERVICES,
} from '@/mock/businessCustomers';
import { MOCK_ABOUT, MOCK_FAQ } from '@/mock/faq';
import { NEARBY_SERVICE_TO_ORG } from '@/mock/organizations';
import {
  DEFAULT_PREFERENCES,
  LANGUAGE_OPTIONS,
  THEME_OPTIONS,
} from '@/mock/preferences';
import { getRoleDisplayLabel } from '@/mock/profile';
import { SETTINGS_GROUPS } from '@/mock/settings';

export class MockCatalogRepository implements CatalogRepository {
  async getOrganizationCategories(): Promise<OrganizationCategoryMeta[]> {
    return [...ORGANIZATION_CATEGORIES];
  }

  async getLanguageOptions(): Promise<LanguageOption[]> {
    return [...LANGUAGE_OPTIONS];
  }

  async getThemeOptions(): Promise<ThemeOption[]> {
    return [...THEME_OPTIONS];
  }

  async getDefaultPreferences(): Promise<UserPreferences> {
    return { ...DEFAULT_PREFERENCES };
  }

  async getFaq(): Promise<FaqItem[]> {
    return [...MOCK_FAQ];
  }

  async getAbout(): Promise<AboutContent> {
    return { ...MOCK_ABOUT, team: [...MOCK_ABOUT.team], social: [...MOCK_ABOUT.social], technologies: [...MOCK_ABOUT.technologies] };
  }

  async getSettingsGroups(): Promise<SettingsGroupDefinition[]> {
    return SETTINGS_GROUPS.map((g) => ({
      ...g,
      items: g.items.map((i) => ({ ...i })),
    }));
  }

  async getRoleCardCopy(): Promise<Record<UserRole, RoleCardCopy>> {
    return { ...ROLE_CARD_COPY };
  }

  async getRoleDisplayLabel(
    role: UserRole | null | undefined,
  ): Promise<string> {
    return getRoleDisplayLabel(role);
  }

  async getNearbyServiceToOrgMap(): Promise<Record<string, string>> {
    return { ...NEARBY_SERVICE_TO_ORG };
  }

  async getWalkInDepartments(): Promise<WalkInDepartmentOption[]> {
    return [...WALK_IN_DEPARTMENTS];
  }

  async getWalkInServices(): Promise<WalkInServiceOption[]> {
    return [...WALK_IN_SERVICES];
  }

  async getWalkInPriorities(): Promise<WalkInPriorityOption[]> {
    return [...WALK_IN_PRIORITIES];
  }
}
