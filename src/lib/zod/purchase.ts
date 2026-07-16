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

export const rejectSchema = z.object({
  reason: z.string().trim().min(1),
});
