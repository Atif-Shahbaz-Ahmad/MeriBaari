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
    .min(2, 'Organization name must be at least 2 characters.')
    .max(80, 'Organization name is too long.'),
  category: categorySchema,
  description: z.string().trim().max(500, 'Description is too long.').optional(),
  phone: z.string().trim().max(30, 'Phone number is too long.').optional(),
  email: z
    .union([z.literal(''), z.string().trim().email('Enter a valid email.')])
    .optional(),
  address: z.string().trim().max(200, 'Address is too long.').optional(),
  city: z.string().trim().max(80, 'City name is too long.').optional(),
  logoUrl: z
    .union([
      z.literal(''),
      z.string().trim().url('Enter a valid image URL, or leave blank.'),
    ])
    .optional(),
});

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
