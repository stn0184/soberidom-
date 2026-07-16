import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, dbError, parseJson, requireOwnerPurchase, validationError } from '@/lib/api/helpers';
import { calcEstimateDetailed } from '@/lib/estimate/detailed';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

const schema = z.object({ materialId: z.uuid(), purchased: z.boolean() });

// Чекбокс «куплено» (US-009): отметка создаёт редактируемый expense по факту
// (синк с фин-отчётом, US-010); снятие удаляет траты этого материала.
export async function POST(request: Request, { params }: Ctx) {
  const { purchaseId } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const parsed = schema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const { supabase: db, purchase } = auth;

  if (!parsed.data.purchased) {
    const { error } = await db
      .from('user_expenses')
      .delete()
      .eq('purchase_id', purchaseId)
      .eq('material_id', parsed.data.materialId);
    if (error) return dbError(error);
    return NextResponse.json({ data: { purchased: false } });
  }

  if (!purchase.region_id) return apiError('VALIDATION_ERROR', ru.api.validation);
  const estimate = await calcEstimateDetailed(db, {
    projectId: purchase.project_id,
    config: purchase.config ?? {},
    regionId: purchase.region_id,
    purchaseId,
  });
  const positions = (estimate?.positions ?? []).filter(
    (p) => p.materialId === parsed.data.materialId
  );
  if (positions.length === 0) return apiError('NOT_FOUND', ru.api.notFound);

  // Материал может встречаться в нескольких этапах — агрегируем в одну трату.
  const qty = positions.reduce((sum, p) => sum + p.qty, 0);
  const amount = positions.reduce((sum, p) => sum + p.amountMinor, 0);
  const { error } = await db.from('user_expenses').insert({
    purchase_id: purchaseId,
    material_id: parsed.data.materialId,
    qty,
    amount_minor: amount,
    currency: estimate?.currency ?? purchase.currency,
  });
  if (error) return dbError(error);
  return NextResponse.json({ data: { purchased: true } });
}
