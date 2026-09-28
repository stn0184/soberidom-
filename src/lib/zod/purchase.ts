import { z } from 'zod';
import { ru } from '@/lib/i18n/ru';

// SPEC 3.6 PurchaseSchema; формат промокода — SPEC 5.1 (валидация до запроса в БД, edge 11).
export const purchaseSchema = z.object({
  projectId: z.uuid(),
  config: z.record(z.string(), z.string()),
  regionId: z.uuid(),
  promoCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{4,20}$/, ru.api.promoFormat)
    .optional(),
  disclaimerAccepted: z.literal(true),
});
export type PurchaseInput = z.infer<typeof purchaseSchema>;

// Тело POST /api/my/free-access (спека 006): бесплатный эталон открывается только
// с тем же согласием, что и покупка, — иначе VALIDATION_ERROR. config — выбор с
// витрины (спека 009), необязательный: без него сервер берёт варианты по умолчанию.
export const freeAccessSchema = z.object({
  projectId: z.uuid(),
  config: z.record(z.string(), z.string()).optional(),
  disclaimerAccepted: z.literal(true),
});
export type FreeAccessInput = z.infer<typeof freeAccessSchema>;

export const rejectSchema = z.object({
  reason: z.string().trim().min(1),
});
