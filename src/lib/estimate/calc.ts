import type { SupabaseClient } from '@supabase/supabase-js';

// Расчёт сметы (SPEC 5.2). purchaseId/user_prices появятся на этапе 5.
export type EstimateConfig = Record<string, string>;

export type EstimateStageRow = {
  stageCode: string;
  title: string;
  subtotalMinor: number;
};

export type EstimateResult = {
  currency: string;
  totalMinor: number;
  byStage: EstimateStageRow[];
  priceMissingCount: number; // edge case 4: позиции без цены (price=0)
};

// applies_when ⊆ config: каждый ключ существует в config с тем же значением (SPEC 5.2 п.2).
export function appliesTo(
  appliesWhen: Record<string, string> | null,
  config: EstimateConfig
): boolean {
  return Object.entries(appliesWhen ?? {}).every(([key, value]) => config[key] === value);
}

export async function calcEstimate(
  db: SupabaseClient,
  params: { projectId: string; config: EstimateConfig; regionId: string }
): Promise<EstimateResult | null> {
  // Валюта — по стране региона (SPEC 5.2 п.5).
  const { data: region } = await db
    .from('regions')
    .select('country_code')
    .eq('id', params.regionId)
    .maybeSingle();
  if (!region) return null;
  const { data: country } = await db
    .from('countries')
    .select('currency')
    .eq('code', region.country_code)
    .maybeSingle();
  if (!country) return null;

  const { data: bomRows } = await db
    .from('bom_items')
    .select('stage_id, material_id, qty, applies_when')
    .eq('project_id', params.projectId);
  const items = (bomRows ?? []).filter((i) => appliesTo(i.applies_when, params.config));

  const stageIds = [...new Set(items.map((i) => i.stage_id as string))];
  const materialIds = [...new Set(items.map((i) => i.material_id as string))];

  const [{ data: stages }, { data: materials }, { data: prices }] = await Promise.all([
    stageIds.length
      ? db.from('stages').select('id, code, title, display_name, sort').in('id', stageIds)
      : Promise.resolve({ data: [] }),
    materialIds.length
      ? db.from('materials').select('id, unit').in('id', materialIds)
      : Promise.resolve({ data: [] }),
    materialIds.length
      ? db
          .from('material_prices')
          .select('material_id, region_id, price_minor')
          .in('material_id', materialIds)
          .eq('country_code', region.country_code)
      : Promise.resolve({ data: [] }),
  ]);

  const unitById = new Map((materials ?? []).map((m) => [m.id as string, m.unit as string]));
  // Приоритет цены: точный регион → вся страна (region_id null); SPEC 5.2 п.3.
  const priceById = new Map<string, number>();
  for (const p of prices ?? []) {
    if (p.region_id === params.regionId) priceById.set(p.material_id, p.price_minor);
  }
  for (const p of prices ?? []) {
    if (p.region_id === null && !priceById.has(p.material_id)) {
      priceById.set(p.material_id, p.price_minor);
    }
  }

  const subtotals = new Map<string, number>();
  let priceMissingCount = 0;
  for (const item of items) {
    const price = priceById.get(item.material_id);
    if (price === undefined) {
      priceMissingCount += 1; // позиция входит с price=0 (edge case 4)
      continue;
    }
    // Доски не бывают дробными: ceil(qty) для unit='pcs' (SPEC 5.2 п.4).
    const qty =
      unitById.get(item.material_id) === 'pcs' ? Math.ceil(Number(item.qty)) : Number(item.qty);
    const amount = Math.round(qty * price);
    subtotals.set(item.stage_id, (subtotals.get(item.stage_id) ?? 0) + amount);
  }

  const byStage: EstimateStageRow[] = (stages ?? [])
    .sort((a, b) => a.sort - b.sort)
    .map((s) => ({
      stageCode: s.code as string,
      // v1.5 «человеческий язык»: пользователю — display_name, если задан.
      title: (s.display_name as string) || (s.title as string),
      subtotalMinor: subtotals.get(s.id) ?? 0,
    }))
    .filter((s) => s.subtotalMinor > 0);

  return {
    currency: country.currency as string,
    totalMinor: byStage.reduce((sum, s) => sum + s.subtotalMinor, 0),
    byStage,
    priceMissingCount,
  };
}
