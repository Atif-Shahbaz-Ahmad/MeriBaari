import { z } from 'zod';

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'validation.phone')
    .max(20, 'validation.phoneLong')
    .regex(/^[+\d][\d\s-]*$/, 'validation.phone'),
});

export const emailSchema = z.object({
  email: z.string().email('validation.email'),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .min(6, 'validation.otp')
    .max(8, 'validation.otpLength')
    .regex(/^\d{6,8}$/, 'validation.otpDigits'),
});

export const loginSchema = z.object({
  email: z.string().email('validation.email'),
  password: z.string().min(6, 'validation.passwordMin'),
});

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(1, 'validation.nameRequired'),
    email: z.string().email('validation.email'),
    password: z.string().min(6, 'validation.passwordMin'),
    confirmPassword: z.string().min(6, 'validation.confirmPassword'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordMismatch',
    path: ['confirmPassword'],
  });

/** New password after recovery email / deep link. */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'validation.passwordMin'),
    confirmPassword: z.string().min(6, 'validation.confirmPassword'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordMismatch',
    path: ['confirmPassword'],
  });

/** @deprecated Prefer loginSchema */
export const passwordSchema = loginSchema;

export type PhoneFormValues = z.infer<typeof phoneSchema>;
export type EmailFormValues = z.infer<typeof emailSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type PasswordFormValues = LoginFormValues;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
