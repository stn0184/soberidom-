import { NextResponse } from 'next/server';
import { apiError, dbError, parseJson, requireOwnerPurchase, validationError } from '@/lib/api/helpers';
import { toolChoiceSchema } from '@/lib/zod/tools';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

// Покупатель выбрал вариант инструмента (спека 004). RLS пускает к своей
// покупке, но не видит, что вариант чужой потребности или потребность чужого
// проекта — это проверяем здесь, до записи.
export async function PUT(request: Request, { params }: Ctx) {
  const { purchaseId } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const { supabase: db, purchase } = auth;

  const parsed = toolChoiceSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const { toolId, variantId } = parsed.data;

  const [{ data: tool }, { data: variant }] = await Promise.all([
    db.from('project_tools').select('id, project_id').eq('id', toolId).maybeSingle(),
    db.from('tool_variants').select('id, tool_id').eq('id', variantId).maybeSingle(),
  ]);
  if (!tool || tool.project_id !== purchase.project_id || variant?.tool_id !== toolId) {
    return apiError('VALIDATION_ERROR', ru.api.validation);
  }

  const { error } = await db
    .from('user_tool_choices')
    .upsert(
      { purchase_id: purchase.id, tool_id: toolId, variant_id: variantId },
      { onConflict: 'purchase_id,tool_id' }
    );
  if (error) return dbError(error);

  return NextResponse.json({ data: { toolId, variantId } });
}
