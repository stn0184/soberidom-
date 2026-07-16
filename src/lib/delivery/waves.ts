import type { SupabaseClient } from '@supabase/supabase-js';
import { appliesTo, type EstimateConfig } from '@/lib/estimate/calc';
import { ru } from '@/lib/i18n/ru';

// Волны доставки (SPEC 5.7, US-011): агрегация bom по stages.delivery_wave,
// объём/вес из материалов, транспорт по правилам SPEC 3.14.
export type WaveMaterial = { name: string; qty: number; unit: string };

export type Wave = {
  wave: number;
  title: string;
  volumeM3: number;
  weightKg: number;
  transport: { type: string; why: string };
  tips: string[];
  materials: WaveMaterial[];
};

export type WavesResult = {
  waves: Wave[];
  stagesWithMaterials: number; // «доставок было бы по одной на этап»
};

const LUMBER_LENGTH_MM = 6000; // SPEC 5.7: длинномеры — пиломатериал 6 м

function pickTransport(weightKg: number, maxLenMm: number): { type: string; why: string } {
  const t = ru.delivery.transport;
  if (weightKg <= 1500 && maxLenMm < 4000) return { type: t.gazelle, why: t.gazelleWhy };
  if (weightKg <= 5000 || maxLenMm >= LUMBER_LENGTH_MM) {
    return { type: t.manipulator, why: t.manipulatorWhy };
  }
  return { type: t.truck, why: t.truckWhy };
}

export async function calcWaves(
  db: SupabaseClient,
  params: { projectId: string; config: EstimateConfig }
): Promise<WavesResult> {
  const [{ data: bomRows }, { data: stages }] = await Promise.all([
    db
      .from('bom_items')
      .select('stage_id, material_id, qty, applies_when')
      .eq('project_id', params.projectId),
    db
      .from('stages')
      .select('id, title, display_name, delivery_wave, sort, applies_when')
      .eq('project_id', params.projectId)
      .order('sort'),
  ]);
  const visibleStages = (stages ?? []).filter((s) => appliesTo(s.applies_when, params.config));
  const stageById = new Map(visibleStages.map((s) => [s.id as string, s]));
  const items = (bomRows ?? []).filter(
    (i) => appliesTo(i.applies_when, params.config) && stageById.has(i.stage_id)
  );

  const materialIds = [...new Set(items.map((i) => i.material_id as string))];
  const { data: materials } = materialIds.length
    ? await db
        .from('materials')
        .select('id, name, unit, volume_m3, weight_kg, category')
        .in('id', materialIds)
    : { data: [] };
  const materialById = new Map((materials ?? []).map((m) => [m.id as string, m]));

  type Acc = {
    volume: number;
    weight: number;
    maxLen: number;
    hasFoundation: boolean;
    stageNames: Set<string>;
    materials: Map<string, WaveMaterial>;
  };
  const byWave = new Map<number, Acc>();
  const stagesWithMaterials = new Set<string>();

  for (const item of items) {
    const stage = stageById.get(item.stage_id);
    const material = materialById.get(item.material_id);
    if (!stage || !material) continue;
    stagesWithMaterials.add(item.stage_id);
    const wave = stage.delivery_wave as number;
    const acc: Acc = byWave.get(wave) ?? {
      volume: 0,
      weight: 0,
      maxLen: 0,
      hasFoundation: false,
      stageNames: new Set(),
      materials: new Map(),
    };
    const qty = material.unit === 'pcs' ? Math.ceil(Number(item.qty)) : Number(item.qty);
    acc.volume += qty * Number(material.volume_m3);
    acc.weight += qty * Number(material.weight_kg);
    if (material.category === 'lumber') acc.maxLen = Math.max(acc.maxLen, LUMBER_LENGTH_MM);
    if (material.category === 'foundation') acc.hasFoundation = true;
    acc.stageNames.add((stage.display_name as string) || (stage.title as string));
    const existing = acc.materials.get(material.id);
    if (existing) existing.qty += qty;
    else acc.materials.set(material.id, { name: material.name, qty, unit: material.unit });
    byWave.set(wave, acc);
  }

  const waves: Wave[] = [...byWave.entries()]
    .sort(([a], [b]) => a - b)
    .map(([wave, acc]) => {
      const transport = pickTransport(acc.weight, acc.maxLen);
      const tips: string[] = [];
      if (acc.maxLen >= LUMBER_LENGTH_MM) tips.push(ru.delivery.tipLongBoards);
      if (acc.hasFoundation) tips.push(ru.delivery.tipFoundation);
      tips.push(ru.delivery.tipUnload);
      return {
        wave,
        title: [...acc.stageNames].slice(0, 3).join(' + '),
        volumeM3: Math.round(acc.volume * 10) / 10,
        weightKg: Math.round(acc.weight),
        transport,
        tips,
        materials: [...acc.materials.values()],
      };
    });

  return { waves, stagesWithMaterials: stagesWithMaterials.size };
}
