import { NextResponse } from 'next/server';
import { apiError, dbError, parseJson, requireOwnerPurchase, validationError } from '@/lib/api/helpers';
import { getVisibleStages } from '@/lib/build/progress';
import { calcEstimateDetailed } from '@/lib/estimate/detailed';
import { expenseSchema } from '@/lib/zod/expense';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

// SPEC 3.13: траты + сводка план/факт по этапам (US-010).
export async function GET(_request: Request, { params }: Ctx) {
  const { purchaseId } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const { supabase: db, purchase } = auth;

  const { data: expenses } = await db
    .from('user_expenses')
    .select('*, materials(name), stages(code, title, display_name)')
    .eq('purchase_id', purchaseId)
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false });

  const estimate = purchase.region_id
    ? await calcEstimateDetailed(db, {
        projectId: purchase.project_id,
        config: purchase.config ?? {},
        regionId: purchase.region_id,
        purchaseId,
      })
    : null;

  // План по этапам — из сметы; факт — по stage_id траты (null → «Прочее», US-010).
  const planByStage = new Map<string, { title: string; planMinor: number }>();
  for (const p of estimate?.positions ?? []) {
    const entry = planByStage.get(p.stageCode) ?? { title: p.stageTitle, planMinor: 0 };
    entry.planMinor += p.amountMinor;
    planByStage.set(p.stageCode, entry);
  }
  type StageEmbed = { code: string; title: string; display_name: string } | null;
  const factByStage = new Map<string, number>();
  let factTotal = 0;
  for (const e of expenses ?? []) {
    const stage = e.stages as unknown as StageEmbed;
    const code = stage?.code ?? 'other';
    factByStage.set(code, (factByStage.get(code) ?? 0) + e.amount_minor);
    factTotal += e.amount_minor;
  }
  const stageCodes = [...new Set([...planByStage.keys(), ...factByStage.keys()])];
  const byStage = stageCodes.map((code) => ({
    stageCode: code,
    title: code === 'other' ? ru.finance.otherStage : (planByStage.get(code)?.title ?? code),
    planMinor: planByStage.get(code)?.planMinor ?? 0,
    factMinor: factByStage.get(code) ?? 0,
  }));

  type MaterialEmbed = { name: string } | null;
  return NextResponse.json({
    data: (expenses ?? []).map((e) => ({
      id: e.id,
      title: (e.materials as unknown as MaterialEmbed)?.name ?? e.custom_title,
      isCustom: e.material_id === null,
      stageTitle: (() => {
        const stage = e.stages as unknown as StageEmbed;
        return stage ? stage.display_name || stage.title : '';
      })(),
      stageId: e.stage_id,
      qty: Number(e.qty),
      amountMinor: e.amount_minor,
      currency: e.currency,
      spentOn: e.spent_on,
      note: e.note,
    })),
    meta: {
      planMinor: estimate?.totalMinor ?? 0,
      factMinor: factTotal,
      currency: estimate?.currency ?? purchase.currency,
      byStage,
      // для диалога «Добавить трату»: этапы и материалы сметы
      stages: (await getVisibleStages(db, purchase.project_id, purchase.config ?? {})).map((s) => ({
        id: s.id,
        title: s.display_name || s.title,
      })),
      materials: [
        ...new Map(
          (estimate?.positions ?? []).map((p) => [p.materialId, { materialId: p.materialId, name: p.name }])
        ).values(),
      ],
    },
  });
}

export async function POST(request: Request, { params }: Ctx) {
  const { purchaseId } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const parsed = expenseSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const v = parsed.data;

  const { data, error } = await auth.supabase
    .from('user_expenses')
    .insert({
      purchase_id: purchaseId,
      material_id: v.materialId,
      custom_title: v.customTitle,
      stage_id: v.stageId,
      qty: v.qty,
      amount_minor: v.amountMinor,
      currency: auth.purchase.currency,
      spent_on: v.spentOn,
      note: v.note,
    })
    .select('id')
    .single();
  if (error) return dbError(error);
  if (!data) return apiError('INTERNAL', ru.api.internal);
  return NextResponse.json({ data: { id: data.id } }, { status: 201 });
}
