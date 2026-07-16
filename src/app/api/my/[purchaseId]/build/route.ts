import { NextResponse } from 'next/server';
import { requireOwnerPurchase } from '@/lib/api/helpers';
import { appliesTo } from '@/lib/estimate/calc';
import { getVisibleStages } from '@/lib/build/progress';

type Ctx = { params: Promise<{ purchaseId: string }> };

// SPEC 3.8: этапы → шаги с анатомией, деталями и прогрессом.
// Этапы, шаги и детали фильтруются applies_when ⊆ purchase.config (edge 19).
export async function GET(_request: Request, { params }: Ctx) {
  const { purchaseId } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const { supabase: db, purchase } = auth;
  const config = purchase.config ?? {};

  const stages = await getVisibleStages(db, purchase.project_id, config);
  const stageIds = stages.map((s) => s.id);

  const [{ data: stepRows }, { data: doneRows }] = await Promise.all([
    stageIds.length
      ? db.from('steps').select('*').in('stage_id', stageIds).order('sort')
      : Promise.resolve({ data: [] }),
    db.from('user_progress').select('step_id').eq('purchase_id', purchaseId),
  ]);
  const steps = (stepRows ?? []).filter((s) => appliesTo(s.applies_when, config));
  const doneSet = new Set((doneRows ?? []).map((d) => d.step_id as string));
  const stepIds = steps.map((s) => s.id as string);

  const [{ data: stepParts }, { data: stepMaterials }] = await Promise.all([
    stepIds.length
      ? db
          .from('step_parts')
          .select('step_id, qty, parts(part_code, color, cut_length_mm, applies_when, materials(name))')
          .in('step_id', stepIds)
      : Promise.resolve({ data: [] }),
    stepIds.length
      ? db
          .from('step_materials')
          .select('step_id, qty, materials(name, unit)')
          .in('step_id', stepIds)
      : Promise.resolve({ data: [] }),
  ]);

  // PostgREST возвращает объект для many-to-one embed; loose-типизация видит массив.
  type PartEmbed = {
    part_code: string;
    color: string;
    cut_length_mm: number;
    applies_when: Record<string, string> | null;
    materials: { name: string } | null;
  } | null;
  type MaterialEmbed = { name: string; unit: string } | null;

  const partsByStep = new Map<string, unknown[]>();
  for (const sp of stepParts ?? []) {
    const part = sp.parts as unknown as PartEmbed;
    if (!part || !appliesTo(part.applies_when, config)) continue; // edge 19
    const list = partsByStep.get(sp.step_id) ?? [];
    list.push({
      partCode: part.part_code,
      color: part.color,
      name: part.materials?.name ?? '',
      cutLengthMm: part.cut_length_mm,
      qty: sp.qty,
    });
    partsByStep.set(sp.step_id, list);
  }
  const materialsByStep = new Map<string, unknown[]>();
  for (const sm of stepMaterials ?? []) {
    const material = sm.materials as unknown as MaterialEmbed;
    const list = materialsByStep.get(sm.step_id) ?? [];
    list.push({ name: material?.name ?? '', qty: Number(sm.qty), unit: material?.unit ?? '' });
    materialsByStep.set(sm.step_id, list);
  }

  const data = stages.map((stage, index) => ({
    id: stage.id,
    number: index + 1,
    code: stage.code,
    displayName: stage.display_name || stage.title,
    color: stage.color,
    intro: stage.intro,
    steps: steps
      .filter((s) => s.stage_id === stage.id)
      .map((s) => ({
        id: s.id,
        title: s.title,
        why: s.why_text,
        prep: s.prep_text,
        imageUrl: s.image_url,
        take: {
          parts: partsByStep.get(s.id) ?? [],
          materials: materialsByStep.get(s.id) ?? [],
        },
        actions: s.actions ?? [],
        tools: s.tools ?? [],
        safety: s.safety_text,
        durationMinSolo: s.duration_min_solo,
        durationMinPair: s.duration_min_pair,
        difficulty: s.difficulty,
        weatherNote: s.weather_note,
        selfCheck: s.self_check ?? [],
        hint: s.hint,
        commonMistake: s.common_mistake,
        helpersNeeded: s.helpers_needed,
        isPractice: s.is_practice,
        isMandatory: s.is_mandatory,
        done: doneSet.has(s.id),
      })),
  }));

  return NextResponse.json({ data });
}
