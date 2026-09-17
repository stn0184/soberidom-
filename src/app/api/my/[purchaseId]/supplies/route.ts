import { NextResponse } from 'next/server';
import { apiError, requireOwnerPurchase, validationError } from '@/lib/api/helpers';
import { getVisibleStages } from '@/lib/build/progress';
import { calcEstimateDetailed } from '@/lib/estimate/detailed';
import { suppliesQuerySchema } from '@/lib/zod/supplies';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

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

  const { data: toolRows } = await db
    .from('project_tools')
    .select('*')
    .eq('project_id', purchase.project_id)
    .order('sort');
  const stageNameByCode = new Map(stages.map((s) => [s.code, s.display_name || s.title]));
  const tools = (toolRows ?? [])
    .filter((t) => ((t.stage_codes ?? []) as string[]).includes(stage.code))
    .map((t) => ({
      name: t.name,
      category: t.category,
      recommendation: t.recommendation,
      reason: t.reason,
      approxPriceMinor: t.approx_price_minor,
      approxRentDayMinor: t.approx_rent_day_minor,
      daysNeeded: t.days_needed,
      alternative: t.alternative,
      stages: ((t.stage_codes ?? []) as string[])
        .map((code) => stageNameByCode.get(code) ?? code)
        .filter(Boolean),
    }));

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
