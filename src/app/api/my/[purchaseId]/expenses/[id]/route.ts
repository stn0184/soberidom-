import { NextResponse } from 'next/server';
import { apiError, dbError, parseJson, requireOwnerPurchase, validationError } from '@/lib/api/helpers';
import { expenseUpdateSchema } from '@/lib/zod/expense';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string; id: string }> };

// SPEC 3.13: PATCH/DELETE траты по id.
export async function PATCH(request: Request, { params }: Ctx) {
  const { purchaseId, id } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const parsed = expenseUpdateSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const v = parsed.data;

  const { data, error } = await auth.supabase
    .from('user_expenses')
    .update({
      ...(v.stageId !== undefined ? { stage_id: v.stageId } : {}),
      ...(v.qty !== undefined ? { qty: v.qty } : {}),
      ...(v.amountMinor !== undefined ? { amount_minor: v.amountMinor } : {}),
      ...(v.spentOn !== undefined ? { spent_on: v.spentOn } : {}),
      ...(v.note !== undefined ? { note: v.note } : {}),
    })
    .eq('id', id)
    .eq('purchase_id', purchaseId)
    .select('id')
    .maybeSingle();
  if (error) return dbError(error);
  if (!data) return apiError('NOT_FOUND', ru.api.notFound);
  return NextResponse.json({ data: { id: data.id } });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { purchaseId, id } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const { data, error } = await auth.supabase
    .from('user_expenses')
    .delete()
    .eq('id', id)
    .eq('purchase_id', purchaseId)
    .select('id')
    .maybeSingle();
  if (error) return dbError(error);
  if (!data) return apiError('NOT_FOUND', ru.api.notFound);
  return NextResponse.json({ data: { id: data.id } });
}
