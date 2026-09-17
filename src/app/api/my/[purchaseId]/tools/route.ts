import { NextResponse } from 'next/server';
import { requireOwnerPurchase } from '@/lib/api/helpers';
import { getVisibleStages } from '@/lib/build/progress';
import { toolsSummary, type Recommendation } from '@/lib/tools/effective';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

type VariantRow = {
  id: string;
  name: string;
  description: string;
  recommendation: Recommendation;
  price_minor: number | null;
  rent_day_minor: number | null;
  speed_note: string;
  is_beginner_choice: boolean;
  sort: number;
};

// sort едет на клиент вместе с вариантом: правило «выбранный → для новичка →
// первый по sort» работает и там, пока выбор не сохранён.
const toVariant = (v: VariantRow) => ({
  id: v.id,
  name: v.name,
  description: v.description,
  recommendation: v.recommendation,
  priceMinor: v.price_minor,
  rentDayMinor: v.rent_day_minor,
  speedNote: v.speed_note,
  isBeginnerChoice: v.is_beginner_choice,
  sort: v.sort,
});

// SPEC 3.14a: инструменты купить/арендовать (US-012a → экран 4.12a).
// Потребность отдаётся со всеми вариантами и выбором покупателя; суммы —
// по действующему варианту каждой потребности (спека 004).
export async function GET(_request: Request, { params }: Ctx) {
  const { purchaseId } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const { supabase: db, purchase } = auth;

  const [{ data: tools }, { data: choices }, stages] = await Promise.all([
    db
      .from('project_tools')
      .select('*, tool_variants(*)')
      .eq('project_id', purchase.project_id)
      .order('sort')
      .order('sort', { referencedTable: 'tool_variants' }),
    db.from('user_tool_choices').select('tool_id, variant_id').eq('purchase_id', purchase.id),
    getVisibleStages(db, purchase.project_id, purchase.config ?? {}),
  ]);

  const stageNameByCode = new Map(stages.map((s) => [s.code, s.display_name || s.title]));
  const chosenByTool = new Map<string, string>(
    (choices ?? []).map((c: { tool_id: string; variant_id: string }) => [c.tool_id, c.variant_id])
  );

  // Потребность без вариантов показывать нечем — в ответ не попадает.
  const rows = (tools ?? [])
    .map((t) => ({
      id: t.id as string,
      name: t.name as string,
      category: t.category as string,
      reason: t.reason as string,
      daysNeeded: t.days_needed as number,
      stages: ((t.stage_codes ?? []) as string[]).map(
        (code) => stageNameByCode.get(code) ?? ru.build.stageCodes[code] ?? code
      ),
      variants: ((t.tool_variants ?? []) as VariantRow[]).map(toVariant),
      chosenVariantId: chosenByTool.get(t.id as string) ?? null,
    }))
    .filter((t) => t.variants.length > 0);

  return NextResponse.json({
    data: { summary: toolsSummary(rows), tools: rows },
    meta: { currency: purchase.currency, stageCount: stages.length },
  });
}
