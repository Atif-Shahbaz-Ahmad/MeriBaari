import { z } from 'zod';

import { DEPARTMENT_ICON_IDS } from '@/domain/models/department';

const iconSchema = z.enum(
  DEPARTMENT_ICON_IDS as unknown as [
    (typeof DEPARTMENT_ICON_IDS)[number],
    ...(typeof DEPARTMENT_ICON_IDS)[number][],
  ],
);

export const departmentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Department name must be at least 2 characters.')
    .max(80, 'Department name is too long.'),
  description: z.string().trim().max(500, 'Description is too long.').optional(),
  icon: iconSchema,
  isActive: z.boolean(),
  displayOrder: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Display order must be a whole number.'),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export const serviceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Service name must be at least 2 characters.')
    .max(80, 'Service name is too long.'),
  description: z.string().trim().max(500, 'Description is too long.').optional(),
  durationMinutes: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, 'Duration must be greater than 0.'),
  price: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      'Price must be zero or greater.',
    )
    .optional(),
  isActive: z.boolean(),
  displayOrder: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Display order must be a whole number.'),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
