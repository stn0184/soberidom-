import { NextResponse } from 'next/server';
import { requireOwnerPurchase } from '@/lib/api/helpers';
import { getVisibleStages } from '@/lib/build/progress';

type Ctx = { params: Promise<{ purchaseId: string }> };

// SPEC 3.14a: инструменты купить/арендовать (US-012a → экран 4.12a).
export async function GET(_request: Request, { params }: Ctx) {
  const { purchaseId } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const { supabase: db, purchase } = auth;

  const [{ data: tools }, stages] = await Promise.all([
    db
      .from('project_tools')
      .select('*')
      .eq('project_id', purchase.project_id)
      .order('sort'),
    getVisibleStages(db, purchase.project_id, purchase.config ?? {}),
  ]);
  const stageNameByCode = new Map(stages.map((s) => [s.code, s.display_name || s.title]));

  const rows = (tools ?? []).map((t) => ({
    name: t.name,
    category: t.category,
    recommendation: t.recommendation,
    reason: t.reason,
    approxPriceMinor: t.approx_price_minor,
    approxRentDayMinor: t.approx_rent_day_minor,
    daysNeeded: t.days_needed,
    alternative: t.alternative,
    stages: (t.stage_codes ?? [])
      .map((code: string) => stageNameByCode.get(code) ?? code)
      .filter(Boolean),
  }));

  const buyTotalMinor = rows
    .filter((t) => t.recommendation === 'buy')
    .reduce((sum, t) => sum + t.approxPriceMinor, 0);
  const rentTotalMinor = rows
    .filter((t) => t.recommendation === 'rent')
    .reduce((sum, t) => sum + (t.approxRentDayMinor ?? 0) * t.daysNeeded, 0);

  return NextResponse.json({
    data: { summary: { buyTotalMinor, rentTotalMinor }, tools: rows },
    meta: { currency: purchase.currency },
  });
}
