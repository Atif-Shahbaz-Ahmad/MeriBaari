import { z } from 'zod';

import { ORGANIZATION_CATEGORY_IDS } from '@/constants/organization-categories';

const categorySchema = z.enum(
  ORGANIZATION_CATEGORY_IDS as unknown as [
    (typeof ORGANIZATION_CATEGORY_IDS)[number],
    ...(typeof ORGANIZATION_CATEGORY_IDS)[number][],
  ],
);

export const organizationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'validation.orgNameMin')
    .max(80, 'validation.orgNameMax'),
  category: categorySchema,
  description: z.string().trim().max(500, 'validation.descriptionMax').optional(),
  phone: z.string().trim().max(30, 'validation.phoneMax').optional(),
  email: z
    .union([z.literal(''), z.string().trim().email('validation.emailInvalid')])
    .optional(),
  address: z.string().trim().max(200, 'validation.addressMax').optional(),
  city: z.string().trim().max(80, 'validation.cityMax').optional(),
  latitude: z
    .union([
      z.literal(''),
      z
        .string()
        .trim()
        .refine((value) => {
          const n = Number(value);
          return Number.isFinite(n) && n >= -90 && n <= 90;
        }, 'validation.latitude'),
    ])
    .optional(),
  longitude: z
    .union([
      z.literal(''),
      z
        .string()
        .trim()
        .refine((value) => {
          const n = Number(value);
          return Number.isFinite(n) && n >= -180 && n <= 180;
        }, 'validation.longitude'),
    ])
    .optional(),
  logoUrl: z.string().trim().optional(),
});

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

export function parseOptionalCoordinate(
  value: string | undefined,
): number | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
