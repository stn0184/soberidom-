import { NextResponse } from 'next/server';
import { apiError, requireOwnerPurchase, validationError } from '@/lib/api/helpers';
import { getVisibleStages } from '@/lib/build/progress';
import { calcEstimateDetailed } from '@/lib/estimate/detailed';
import { effectiveVariant, type Recommendation } from '@/lib/tools/effective';
import { suppliesQuerySchema } from '@/lib/zod/supplies';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

type ToolVariantRow = {
  id: string;
  name: string;
  recommendation: Recommendation;
  price_minor: number | null;
  rent_day_minor: number | null;
  is_beginner_choice: boolean;
  sort: number;
};

const toVariant = (v: ToolVariantRow) => ({
  id: v.id,
  name: v.name,
  recommendation: v.recommendation,
  priceMinor: v.price_minor,
  rentDayMinor: v.rent_day_minor,
  isBeginnerChoice: v.is_beginner_choice,
  sort: v.sort,
});

// Закупки перед этапом (спека 003, ВИДЕНИЕ 2.3): позиции BOM этого этапа и
// инструменты, у которых код этапа есть в stage_codes. Отдельного экрана в
// SPEC ещё нет — контракт записан в ADR и ждёт SPEC v1.6.
// Без региона смету не считаем: инструменты отдаём, материалы пустые и
// meta.needRegion — клиент попросит город, как в живой смете (3.11).
export async function GET(request: Request, { params }: Ctx) {
  const { purchaseId } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const { supabase: db, purchase } = auth;

  const stageParam = new URL(request.url).searchParams.get('stage');
  const parsed = suppliesQuerySchema.safeParse({ stage: stageParam ?? undefined });
  if (!parsed.success) return validationError(parsed.error);

  const config = purchase.config ?? {};
  const stages = await getVisibleStages(db, purchase.project_id, config);
  const stage = stages.find((s) => s.id === parsed.data.stage);
  // Этап чужого проекта или скрытый конфигурацией (edge 19) — 404, как чужая покупка.
  if (!stage) return apiError('NOT_FOUND', ru.api.notFound);

  const [{ data: toolRows }, { data: choices }] = await Promise.all([
    db
      .from('project_tools')
      .select('*, tool_variants(*)')
      .eq('project_id', purchase.project_id)
      .order('sort')
      .order('sort', { referencedTable: 'tool_variants' }),
    db.from('user_tool_choices').select('tool_id, variant_id').eq('purchase_id', purchase.id),
  ]);
  const chosenByTool = new Map<string, string>(
    (choices ?? []).map((c: { tool_id: string; variant_id: string }) => [c.tool_id, c.variant_id])
  );

  // firstStageId — первый видимый этап потребности: по нему экран этапа
  // отделяет «купите сейчас» от «уже должно быть у вас» (спека 004).
  const tools = (toolRows ?? [])
    .filter((t) => ((t.stage_codes ?? []) as string[]).includes(stage.code))
    .map((t) => {
      const codes = (t.stage_codes ?? []) as string[];
      const chosenVariantId = chosenByTool.get(t.id as string) ?? null;
      const variants = ((t.tool_variants ?? []) as ToolVariantRow[]).map(toVariant);
      const variant = effectiveVariant({ variants, chosenVariantId });
      return {
        id: t.id as string,
        name: t.name as string,
        reason: t.reason as string,
        daysNeeded: t.days_needed as number,
        variantCount: variants.length,
        variant,
        isChosen: variant !== null && variant.id === chosenVariantId,
        firstStageId: stages.find((s) => codes.includes(s.code))?.id ?? stage.id,
      };
    })
    .filter((t) => t.variant !== null);

  if (!purchase.region_id) {
    return NextResponse.json({
      data: { materials: [], tools, currency: purchase.currency },
      meta: { needRegion: true },
    });
  }

  const estimate = await calcEstimateDetailed(db, {
    projectId: purchase.project_id,
    config,
    regionId: purchase.region_id,
    purchaseId,
  });
  if (!estimate) return apiError('INTERNAL', ru.api.internal);

  return NextResponse.json({
    data: {
      materials: estimate.positions.filter((p) => p.stageCode === stage.code),
      tools,
      currency: estimate.currency,
    },
    meta: { needRegion: false },
  });
}
