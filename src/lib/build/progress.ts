import type { SupabaseClient } from '@supabase/supabase-js';
import { appliesTo } from '@/lib/estimate/calc';

// Видимость контента покупки: applies_when этапа и шага ⊆ config покупки (SPEC 3.8, edge 19).
export type StageMeta = {
  id: string;
  sort: number;
  code: string;
  title: string;
  display_name: string;
  color: string | null;
  intro: string;
  duration_days: number | null; // «карта путешествия»: примерная длительность
  result_image_url: string; // «должно получиться вот так»
  applies_when: Record<string, string> | null;
};

export type StepIdMeta = {
  id: string;
  stage_id: string;
  sort: number;
  applies_when: Record<string, string> | null;
};

export async function getVisibleStages(
  db: SupabaseClient,
  projectId: string,
  config: Record<string, string>
): Promise<StageMeta[]> {
  const { data: stages } = await db
    .from('stages')
    .select('id, sort, code, title, display_name, color, intro, duration_days, result_image_url, applies_when')
    .eq('project_id', projectId)
    .order('sort');
  return ((stages ?? []) as StageMeta[]).filter((s) => appliesTo(s.applies_when, config));
}

export async function getVisibleStepIds(
  db: SupabaseClient,
  stageIds: string[],
  config: Record<string, string>
): Promise<StepIdMeta[]> {
  if (stageIds.length === 0) return [];
  const { data: steps } = await db
    .from('steps')
    .select('id, stage_id, sort, applies_when')
    .in('stage_id', stageIds)
    .order('sort');
  return ((steps ?? []) as StepIdMeta[]).filter((s) => appliesTo(s.applies_when, config));
}

export type PurchaseProgress = {
  doneSteps: number;
  totalSteps: number;
  currentStage: string | null; // display_name (v1.5 «человеческий язык»)
  doneStepIds: Set<string>;
  stages: StageMeta[];
  steps: StepIdMeta[];
};

export async function getPurchaseProgress(
  db: SupabaseClient,
  purchaseId: string,
  projectId: string,
  config: Record<string, string>
): Promise<PurchaseProgress> {
  const stages = await getVisibleStages(db, projectId, config);
  const steps = await getVisibleStepIds(
    db,
    stages.map((s) => s.id),
    config
  );
  const { data: done } = await db
    .from('user_progress')
    .select('step_id')
    .eq('purchase_id', purchaseId);
  const doneStepIds = new Set(((done ?? []) as Array<{ step_id: string }>).map((d) => d.step_id));

  let currentStage: string | null = null;
  for (const stage of stages) {
    const stageSteps = steps.filter((s) => s.stage_id === stage.id);
    if (stageSteps.some((s) => !doneStepIds.has(s.id))) {
      currentStage = stage.display_name || stage.title;
      break;
    }
  }

  return {
    doneSteps: steps.filter((s) => doneStepIds.has(s.id)).length,
    totalSteps: steps.length,
    currentStage,
    doneStepIds,
    stages,
    steps,
  };
}
