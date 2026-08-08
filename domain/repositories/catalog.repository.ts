import type { AboutContent, FaqItem, UserPreferences } from '@/types/profile';
import type { OrganizationCategoryMeta } from '@/types/organization';
import type { UserRole } from '@/types/auth';
import type { BusinessPriority } from '@/types/business';

export interface LanguageOption {
  value: 'en' | 'ur';
  label: string;
  nativeLabel: string;
}

export interface ThemeOption {
  value: 'system' | 'light' | 'dark';
  label: string;
  description: string;
}

export interface RoleCardCopy {
  title: string;
  description: string;
  bullets: string[];
}

export interface WalkInDepartmentOption {
  id: string;
  name: string;
}

export interface WalkInServiceOption {
  id: string;
  departmentId: string;
  name: string;
  queueId: string;
}

export interface WalkInPriorityOption {
  id: BusinessPriority;
  label: string;
}

export type SettingsItemKind = 'link' | 'toggle' | 'value' | 'action';

export interface SettingsDefinitionItem {
  id: string;
  label: string;
  description?: string;
  kind: SettingsItemKind;
  preferenceKey?: string;
  valueLabel?: string;
  route?: 'theme' | 'language' | 'help' | 'about' | 'privacy' | 'edit';
  danger?: boolean;
}

export interface SettingsGroupDefinition {
  id: string;
  title: string;
  items: SettingsDefinitionItem[];
}

/**
 * Static / catalog content that is not entity CRUD.
 * Keeps screens off `@/mock` for labels, FAQ, settings definitions, etc.
 */
export interface CatalogRepository {
  getOrganizationCategories(): Promise<OrganizationCategoryMeta[]>;
  getLanguageOptions(): Promise<LanguageOption[]>;
  getThemeOptions(): Promise<ThemeOption[]>;
  getDefaultPreferences(): Promise<UserPreferences>;
  getFaq(): Promise<FaqItem[]>;
  getAbout(): Promise<AboutContent>;
  getSettingsGroups(): Promise<SettingsGroupDefinition[]>;
  getRoleCardCopy(): Promise<Record<UserRole, RoleCardCopy>>;
  getRoleDisplayLabel(role: UserRole | null | undefined): Promise<string>;
  getNearbyServiceToOrgMap(): Promise<Record<string, string>>;
  getWalkInDepartments(): Promise<WalkInDepartmentOption[]>;
  getWalkInServices(): Promise<WalkInServiceOption[]>;
  getWalkInPriorities(): Promise<WalkInPriorityOption[]>;
}
