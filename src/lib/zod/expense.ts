import { z } from 'zod';
import { ru } from '@/lib/i18n/ru';

// SPEC 3.13 + 5.1: трата — материал из сметы ИЛИ произвольная (custom_title);
// сумма ≤ 1 000 000 000 минорных; дата не в будущем.
export const expenseSchema = z
  .object({
    materialId: z.uuid().nullable().default(null),
    customTitle: z.string().trim().default(''),
    stageId: z.uuid().nullable().default(null),
    qty: z.number().positive().default(1),
    amountMinor: z.number().int().min(0).max(1_000_000_000),
    spentOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((d) => d <= new Date().toISOString().slice(0, 10), ru.finance.dateFuture),
    note: z.string().default(''),
  })
  .refine((v) => v.materialId !== null || v.customTitle !== '', ru.api.validation);

export const expenseUpdateSchema = z.object({
  stageId: z.uuid().nullable().optional(),
  qty: z.number().positive().optional(),
  amountMinor: z.number().int().min(0).max(1_000_000_000).optional(),
  spentOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((d) => d <= new Date().toISOString().slice(0, 10), ru.finance.dateFuture)
    .optional(),
  note: z.string().optional(),
});
