import { z } from 'zod';

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter a valid phone number')
    .max(20, 'Phone number is too long')
    .regex(/^[+\d][\d\s-]*$/, 'Enter a valid phone number'),
});

export const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .min(6, 'Enter the verification code')
    .max(8, 'Code must be 6–8 digits')
    .regex(/^\d{6,8}$/, 'Enter a 6–8 digit code'),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Enter your name'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
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
