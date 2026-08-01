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
    .length(6, 'Enter the 6-digit code')
    .regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export type PhoneFormValues = z.infer<typeof phoneSchema>;
export type EmailFormValues = z.infer<typeof emailSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
