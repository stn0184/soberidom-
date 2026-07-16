import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbError, parseJson, requireOwnerPurchase, validationError } from '@/lib/api/helpers';
import { getPurchaseProgress } from '@/lib/build/progress';

type Ctx = { params: Promise<{ purchaseId: string }> };

const schema = z.object({ stepId: z.uuid(), done: z.boolean() });

// SPEC 3.9: отметка шага. upsert по unique(purchase, step) — конкурентные
// устройства не конфликтуют, последний синк побеждает (edge 7).
export async function POST(request: Request, { params }: Ctx) {
  const { purchaseId } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const parsed = schema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const { supabase: db, purchase } = auth;

  if (parsed.data.done) {
    const { error } = await db
      .from('user_progress')
      .upsert(
        { purchase_id: purchaseId, step_id: parsed.data.stepId },
        { onConflict: 'purchase_id,step_id', ignoreDuplicates: true }
      );
    if (error) return dbError(error);
  } else {
    const { error } = await db
      .from('user_progress')
      .delete()
      .eq('purchase_id', purchaseId)
      .eq('step_id', parsed.data.stepId);
    if (error) return dbError(error);
  }

  const progress = await getPurchaseProgress(db, purchaseId, purchase.project_id, purchase.config ?? {});
  return NextResponse.json({
    data: { doneSteps: progress.doneSteps, totalSteps: progress.totalSteps },
  });
}
