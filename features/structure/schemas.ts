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
    .min(2, 'validation.departmentNameMin')
    .max(80, 'validation.departmentNameMax'),
  description: z.string().trim().max(500, 'validation.descriptionMax').optional(),
  icon: iconSchema,
  isActive: z.boolean(),
  displayOrder: z
    .string()
    .trim()
    .regex(/^\d+$/, 'validation.displayOrder'),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export const serviceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'validation.serviceNameMin')
    .max(80, 'validation.serviceNameMax'),
  description: z.string().trim().max(500, 'validation.descriptionMax').optional(),
  durationMinutes: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, 'validation.duration'),
  price: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      'validation.price',
    )
    .optional(),
  isActive: z.boolean(),
  displayOrder: z
    .string()
    .trim()
    .regex(/^\d+$/, 'validation.displayOrder'),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
