import { z } from 'zod';
import { ru } from '@/lib/i18n/ru';

// Правила — SPEC 5.1 «Валидация форм» (единые схемы для клиента и сервера).
export const registerSchema = z.object({
  name: z.string().trim().min(2, ru.validation.name).max(60, ru.validation.name),
  email: z.email(ru.validation.email),
  password: z
    .string()
    .min(8, ru.validation.password)
    .regex(/\d/, ru.validation.password),
  pdConsent: z.literal(true),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email(ru.validation.email),
  password: z.string().min(1, ru.validation.password),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const resetRequestSchema = z.object({
  email: z.email(ru.validation.email),
});
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

export const newPasswordSchema = z.object({
  password: z
    .string()
    .min(8, ru.validation.password)
    .regex(/\d/, ru.validation.password),
});
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
