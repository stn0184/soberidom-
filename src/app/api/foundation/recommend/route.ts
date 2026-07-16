import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { apiError, parseJson, validationError } from '@/lib/api/helpers';
import { calcEstimate, type EstimateConfig } from '@/lib/estimate/calc';
import { freezingDepthM } from '@/lib/foundation/freezing';
import {
  computeWeightClass,
  pickFoundationRule,
  type FoundationRuleRow,
} from '@/lib/foundation/rules';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { foundationSchema } from '@/lib/zod/quiz';
import { ru } from '@/lib/i18n/ru';

// SPEC 3.5: рекомендация фундамента (публичный). Rate limit 30 req/мин (5.8).
export async function POST(request: NextRequest) {
  if (!rateLimit(`foundation:${clientIp(request)}`, 30, 60_000)) {
    return apiError('RATE_LIMITED', ru.api.rateLimited);
  }
  const parsed = foundationSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const [{ data: region }, { data: project }, { data: rules }] = await Promise.all([
    supabase.from('regions').select('mt').eq('id', input.regionId).maybeSingle(),
    supabase
      .from('house_projects')
      .select('id, building_type, area_m2')
      .eq('id', input.projectId)
      .maybeSingle(),
    supabase.from('foundation_rules').select('*'),
  ]);
  if (!region) return apiError('VALIDATION_ERROR', ru.api.validation);
  if (!project) return apiError('NOT_FOUND', ru.api.projectNotFound);

  const weightClass = computeWeightClass(project.building_type, Number(project.area_m2));
  const { foundation, reasonPoints } = pickFoundationRule((rules ?? []) as FoundationRuleRow[], {
    soil: input.soil,
    highWater: input.highWater,
    relief: input.relief,
    weightClass,
  });

  // Дельта к смете: рекомендованный фундамент против дефолтного (SPEC 3.5).
  const { data: options } = await supabase
    .from('config_options')
    .select('group_key, option_key, is_default')
    .eq('project_id', input.projectId);
  const defaults: EstimateConfig = {};
  for (const o of options ?? []) {
    if (o.is_default) defaults[o.group_key] = o.option_key;
  }
  let estimateDeltaMinor = 0;
  if (defaults.foundation && defaults.foundation !== foundation) {
    const [base, recommended] = await Promise.all([
      calcEstimate(supabase, {
        projectId: input.projectId,
        config: defaults,
        regionId: input.regionId,
      }),
      calcEstimate(supabase, {
        projectId: input.projectId,
        config: { ...defaults, foundation },
        regionId: input.regionId,
      }),
    ]);
    if (base && recommended) estimateDeltaMinor = recommended.totalMinor - base.totalMinor;
  }

  return NextResponse.json({
    data: {
      foundation,
      label: ru.dict.foundations[foundation],
      freezingDepthM: freezingDepthM(input.soil, Number(region.mt)),
      reasonPoints,
      estimateDeltaMinor,
      disclaimer: ru.foundation.disclaimer,
    },
  });
}
