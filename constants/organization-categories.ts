/**
 * Canonical organization category values.
 * Use these constants instead of hardcoding category strings in UI or services.
 */

import { t } from '@/lib/i18n';

export const ORGANIZATION_CATEGORY_IDS = [
  'barber_shop',
  'clinic',
  'workshop',
  'salon',
  'restaurant',
  'pharmacy',
  'other',
] as const;

export type OrganizationCategoryId = (typeof ORGANIZATION_CATEGORY_IDS)[number];

export interface OrganizationCategoryOption {
  id: OrganizationCategoryId;
  label: string;
  logoIcon:
    | 'hospital'
    | 'bank'
    | 'building'
    | 'clinic'
    | 'university'
    | 'utensils'
    | 'landmark'
    | 'car';
}

export const ORGANIZATION_CATEGORY_OPTIONS: OrganizationCategoryOption[] = [
  { id: 'barber_shop', label: 'Barber Shop', logoIcon: 'building' },
  { id: 'clinic', label: 'Clinic', logoIcon: 'clinic' },
  { id: 'workshop', label: 'Workshop', logoIcon: 'car' },
  { id: 'salon', label: 'Salon', logoIcon: 'building' },
  { id: 'restaurant', label: 'Restaurant', logoIcon: 'utensils' },
  { id: 'pharmacy', label: 'Pharmacy', logoIcon: 'hospital' },
  { id: 'other', label: 'Other', logoIcon: 'landmark' },
];

export const ORGANIZATION_CATEGORIES_WITH_ALL: Array<{
  id: OrganizationCategoryId | 'all';
  label: string;
}> = [
  { id: 'all', label: 'All' },
  ...ORGANIZATION_CATEGORY_OPTIONS.map(({ id, label }) => ({ id, label })),
];

const ICON_BY_ID: Record<
  OrganizationCategoryId,
  OrganizationCategoryOption['logoIcon']
> = Object.fromEntries(
  ORGANIZATION_CATEGORY_OPTIONS.map((o) => [o.id, o.logoIcon]),
) as Record<OrganizationCategoryId, OrganizationCategoryOption['logoIcon']>;

export function isOrganizationCategory(
  value: string,
): value is OrganizationCategoryId {
  return (ORGANIZATION_CATEGORY_IDS as readonly string[]).includes(value);
}

export function getOrganizationCategoryLabel(
  category: string | null | undefined,
): string {
  return t(organizationCategoryLabelKey(category));
}

export function organizationCategoryLabelKey(
  category: string | 'all' | null | undefined,
): string {
  if (!category || category === 'all') return 'categories.all';
  if (isOrganizationCategory(category)) return `categories.${category}`;
  return 'categories.other';
}

export function getOrganizationCategoryIcon(
  category: string | null | undefined,
): OrganizationCategoryOption['logoIcon'] {
  if (category && isOrganizationCategory(category)) {
    return ICON_BY_ID[category];
  }
  return 'building';
}

export function normalizeOrganizationCategory(
  value: string | null | undefined,
): OrganizationCategoryId {
  if (!value) return 'other';
  if (isOrganizationCategory(value)) return value;

  switch (value) {
    case 'hospitals':
    case 'clinics':
      return 'clinic';
    case 'restaurants':
      return 'restaurant';
    case 'banks':
    case 'government':
    case 'universities':
    case 'others':
      return 'other';
    default:
      return 'other';
  }
}
