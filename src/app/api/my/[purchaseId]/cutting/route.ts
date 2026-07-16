import { NextResponse } from 'next/server';
import { requireOwnerPurchase } from '@/lib/api/helpers';
import { appliesTo } from '@/lib/estimate/calc';
import { ffd, type CutPart } from '@/lib/cutting/ffd';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

// SPEC 3.10: карта раскроя (FFD, заготовка 6000 мм, пропил 4 мм).
// Детали фильтруются applies_when ⊆ config покупки (edge 19).
export async function GET(_request: Request, { params }: Ctx) {
  const { purchaseId } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const { supabase: db, purchase } = auth;
  const config = purchase.config ?? {};

  const { data: partRows } = await db
    .from('parts')
    .select('id, part_code, color, cut_length_mm, qty, applies_when, materials(id, name, unit)')
    .eq('project_id', purchase.project_id)
    .order('part_code');
  const parts = (partRows ?? []).filter((p) => appliesTo(p.applies_when, config));

  // Использование деталей в шагах — для клика по сегменту (US-008) и фильтра по этапу.
  const partIds = parts.map((p) => p.id as string);
  const { data: usageRows } = partIds.length
    ? await db
        .from('step_parts')
        .select('part_id, steps(title, sort, stages(id, sort, title, display_name))')
        .in('part_id', partIds)
    : { data: [] };

  type UsageEmbed = {
    title: string;
    sort: number;
    stages: { id: string; sort: number; title: string; display_name: string } | null;
  } | null;
  const usage: Record<string, Array<{ stageId: string; stageName: string; stepTitle: string }>> = {};
  const stagesSeen = new Map<string, { id: string; sort: number; name: string }>();
  for (const row of usageRows ?? []) {
    const step = row.steps as unknown as UsageEmbed;
    if (!step?.stages) continue;
    const part = parts.find((p) => p.id === row.part_id);
    if (!part) continue;
    const stageName = step.stages.display_name || step.stages.title;
    (usage[part.part_code] ??= []).push({
      stageId: step.stages.id,
      stageName,
      stepTitle: step.title,
    });
    stagesSeen.set(step.stages.id, { id: step.stages.id, sort: step.stages.sort, name: stageName });
  }

  // FFD по каждому материалу-заготовке.
  type MaterialEmbed = { id: string; name: string; unit: string } | null;
  const byMaterial = new Map<string, { name: string; unit: string; parts: CutPart[] }>();
  for (const p of parts) {
    const material = p.materials as unknown as MaterialEmbed;
    if (!material) continue;
    const entry = byMaterial.get(material.id) ?? { name: material.name, unit: material.unit, parts: [] };
    entry.parts.push({
      partCode: p.part_code,
      color: p.color,
      lengthMm: p.cut_length_mm,
      qty: p.qty,
    });
    byMaterial.set(material.id, entry);
  }

  const stockPlans = [...byMaterial.values()].map((entry) => {
    const result = ffd(entry.parts);
    return {
      material: { name: entry.name, unit: entry.unit },
      boardsNeeded: result.boardsNeeded,
      layouts: result.layouts,
      partCodes: entry.parts.map((p) => p.partCode),
    };
  });

  // Сводка маркеров по цветам (US-008): «Красным отметьте 72 детали B-12…».
  const byColor = new Map<string, { count: number; codes: Set<string> }>();
  for (const p of parts) {
    const entry = byColor.get(p.color) ?? { count: 0, codes: new Set<string>() };
    entry.count += p.qty;
    entry.codes.add(p.part_code);
    byColor.set(p.color, entry);
  }
  const markerSummary = [...byColor.entries()].map(([color, entry]) => ({
    color,
    instruction: ru.cutting.markerInstruction(
      ru.dict.colors[color as keyof typeof ru.dict.colors] ?? color,
      entry.count,
      [...entry.codes].join(', ')
    ),
  }));

  return NextResponse.json({
    data: { stockPlans, markerSummary },
    meta: {
      usage,
      stages: [...stagesSeen.values()].sort((a, b) => a.sort - b.sort).map((s) => ({ id: s.id, name: s.name })),
    },
  });
}
