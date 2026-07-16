import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbError, parseJson, requireOwnerPurchase, validationError } from '@/lib/api/helpers';

// SPEC 3.12: своя цена. null → вернуть дефолт (удалить перекрытие).
// Лимит цены — SPEC 5.1 (≤ 1 000 000 00 минорных за единицу).
const schema = z.object({
  purchaseId: z.uuid(),
  materialId: z.uuid(),
  priceMinor: z.number().int().min(0).max(100_000_000).nullable(),
});

export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const auth = await requireOwnerPurchase(parsed.data.purchaseId);
  if ('error' in auth) return auth.error;
  const { supabase: db } = auth;

  if (parsed.data.priceMinor === null) {
    const { error } = await db
      .from('user_prices')
      .delete()
      .eq('purchase_id', parsed.data.purchaseId)
      .eq('material_id', parsed.data.materialId);
    if (error) return dbError(error);
  } else {
    const { error } = await db.from('user_prices').upsert(
      {
        purchase_id: parsed.data.purchaseId,
        material_id: parsed.data.materialId,
        price_minor: parsed.data.priceMinor,
      },
      { onConflict: 'purchase_id,material_id' }
    );
    if (error) return dbError(error);
  }
  return NextResponse.json({ data: { ok: true } });
}
