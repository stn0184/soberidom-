import type { SupabaseClient } from '@supabase/supabase-js';
import { appliesTo, type EstimateConfig } from '@/lib/estimate/calc';

// Живая смета с позициями (SPEC 3.11, 5.2): цены user_prices → регион → страна;
// purchased — по наличию user_expense с материалом (US-009); storage_tip — HANDOFF.
export type EstimatePosition = {
  materialId: string;
  name: string;
  unit: string;
  storageTip: string;
  qty: number;
  priceMinor: number;
  isUserPrice: boolean;
  priceMissing: boolean;
  sku: { retailer: string; sku: string; url: string } | null;
  amountMinor: number;
  stageCode: string;
  stageTitle: string;
  purchased: boolean;
};

export type DetailedEstimate = {
  currency: string;
  totalMinor: number;
  positions: EstimatePosition[];
  priceMissingCount: number;
  purchasedCount: number;
};

export async function calcEstimateDetailed(
  db: SupabaseClient,
  params: { projectId: string; config: EstimateConfig; regionId: string; purchaseId: string }
): Promise<DetailedEstimate | null> {
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
  if (items.length === 0) {
    return { currency: country.currency, totalMinor: 0, positions: [], priceMissingCount: 0, purchasedCount: 0 };
  }

  const [{ data: stages }, { data: materials }, { data: prices }, { data: userPrices }, { data: skus }, { data: expenses }] =
    await Promise.all([
      db.from('stages').select('id, code, title, display_name, sort').in('id', stageIds),
      db.from('materials').select('id, name, unit, storage_tip').in('id', materialIds),
      db
        .from('material_prices')
        .select('material_id, region_id, price_minor')
        .in('material_id', materialIds)
        .eq('country_code', region.country_code),
      db
        .from('user_prices')
        .select('material_id, price_minor')
        .eq('purchase_id', params.purchaseId),
      db
        .from('retailer_skus')
        .select('material_id, sku, product_url, retailers(name)')
        .in('material_id', materialIds),
      db.from('user_expenses').select('material_id').eq('purchase_id', params.purchaseId),
    ]);

  const materialById = new Map((materials ?? []).map((m) => [m.id as string, m]));
  const stageById = new Map((stages ?? []).map((s) => [s.id as string, s]));
  const purchasedSet = new Set(
    (expenses ?? []).map((e) => e.material_id as string | null).filter(Boolean) as string[]
  );

  const userPriceById = new Map(
    (userPrices ?? []).map((u) => [u.material_id as string, u.price_minor as number])
  );
  const basePriceById = new Map<string, number>();
  for (const p of prices ?? []) {
    if (p.region_id === params.regionId) basePriceById.set(p.material_id, p.price_minor);
  }
  for (const p of prices ?? []) {
    if (p.region_id === null && !basePriceById.has(p.material_id)) {
      basePriceById.set(p.material_id, p.price_minor);
    }
  }
  type SkuEmbed = { name: string } | null;
  const skuById = new Map<string, { retailer: string; sku: string; url: string }>();
  for (const s of skus ?? []) {
    if (!skuById.has(s.material_id)) {
      skuById.set(s.material_id, {
        retailer: (s.retailers as unknown as SkuEmbed)?.name ?? '',
        sku: s.sku,
        url: s.product_url,
      });
    }
  }

  // Агрегация bom по (этап, материал).
  const grouped = new Map<string, { stageId: string; materialId: string; qty: number }>();
  for (const item of items) {
    const key = `${item.stage_id}:${item.material_id}`;
    const entry = grouped.get(key) ?? { stageId: item.stage_id, materialId: item.material_id, qty: 0 };
    entry.qty += Number(item.qty);
    grouped.set(key, entry);
  }

  const withSort: Array<EstimatePosition & { stageSort: number }> = [];
  for (const entry of grouped.values()) {
    const material = materialById.get(entry.materialId);
    const stage = stageById.get(entry.stageId);
    if (!material || !stage) continue;
    const qty = material.unit === 'pcs' ? Math.ceil(entry.qty) : entry.qty;
    const userPrice = userPriceById.get(entry.materialId);
    const basePrice = basePriceById.get(entry.materialId);
    const price = userPrice ?? basePrice;
    withSort.push({
      materialId: entry.materialId,
      name: material.name,
      unit: material.unit,
      storageTip: material.storage_tip ?? '',
      qty,
      priceMinor: price ?? 0,
      isUserPrice: userPrice !== undefined,
      priceMissing: price === undefined, // позиция входит с price=0 (edge 4)
      sku: skuById.get(entry.materialId) ?? null,
      amountMinor: price === undefined ? 0 : Math.round(qty * price),
      stageCode: stage.code,
      stageTitle: (stage.display_name as string) || (stage.title as string),
      purchased: purchasedSet.has(entry.materialId),
      stageSort: stage.sort as number,
    });
  }
  withSort.sort((a, b) => a.stageSort - b.stageSort || a.name.localeCompare(b.name, 'ru'));
  const positions: EstimatePosition[] = withSort.map((p) => ({
    materialId: p.materialId,
    name: p.name,
    unit: p.unit,
    storageTip: p.storageTip,
    qty: p.qty,
    priceMinor: p.priceMinor,
    isUserPrice: p.isUserPrice,
    priceMissing: p.priceMissing,
    sku: p.sku,
    amountMinor: p.amountMinor,
    stageCode: p.stageCode,
    stageTitle: p.stageTitle,
    purchased: p.purchased,
  }));

  return {
    currency: country.currency,
    totalMinor: positions.reduce((sum, p) => sum + p.amountMinor, 0),
    positions,
    priceMissingCount: positions.filter((p) => p.priceMissing).length,
    purchasedCount: positions.filter((p) => p.purchased).length,
  };
}
