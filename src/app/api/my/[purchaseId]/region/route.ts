import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbError, parseJson, requireOwnerPurchase, validationError } from '@/lib/api/helpers';

type Ctx = { params: Promise<{ purchaseId: string }> };

const schema = z.object({ regionId: z.uuid() });

// Смена региона покупки (edge 17: явное действие пользователя; также первый выбор
// города у бесплатной покупки, где region_id пуст).
export async function PATCH(request: Request, { params }: Ctx) {
  const { purchaseId } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const parsed = schema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await auth.supabase
    .from('purchases')
    .update({ region_id: parsed.data.regionId })
    .eq('id', purchaseId);
  if (error) return dbError(error);
  return NextResponse.json({ data: { ok: true } });
}
