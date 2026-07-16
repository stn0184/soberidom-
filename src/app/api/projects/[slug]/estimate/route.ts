import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { apiError } from '@/lib/api/helpers';
import { calcEstimate, type EstimateConfig } from '@/lib/estimate/calc';
import { createClient } from '@/lib/supabase/server';
import { ru } from '@/lib/i18n/ru';

// Сегмент называется [slug] (Next.js требует одно имя параметра на уровень,
// а /api/projects/[slug] уже существует), но значение здесь — UUID проекта (SPEC 3.4).
type Ctx = { params: Promise<{ slug: string }> };

const CONFIG_GROUPS = ['lumber', 'roofing', 'finish_ext', 'finish_int', 'foundation'] as const;

// SPEC 3.4: предварительная смета (публичный).
// Ключи query валидируются по config_options проекта; неизвестная опция → 400.
export async function GET(request: NextRequest, { params }: Ctx) {
  const { slug: id } = await params;
  const searchParams = request.nextUrl.searchParams;

  const regionId = searchParams.get('regionId');
  if (!regionId || !z.uuid().safeParse(regionId).success || !z.uuid().safeParse(id).success) {
    return apiError('VALIDATION_ERROR', ru.api.validation);
  }

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data: options } = await supabase
    .from('config_options')
    .select('group_key, option_key, is_default')
    .eq('project_id', id);
  if (!options || options.length === 0) {
    return apiError('NOT_FOUND', ru.api.projectNotFound);
  }

  // Дефолты проекта, поверх — валидные значения из query.
  const config: EstimateConfig = {};
  for (const o of options) {
    if (o.is_default) config[o.group_key] = o.option_key;
  }
  for (const group of CONFIG_GROUPS) {
    const value = searchParams.get(group);
    if (value === null) continue;
    const valid = options.some((o) => o.group_key === group && o.option_key === value);
    if (!valid) return apiError('VALIDATION_ERROR', ru.api.validation);
    config[group] = value;
  }

  const estimate = await calcEstimate(supabase, { projectId: id, config, regionId });
  if (!estimate) return apiError('VALIDATION_ERROR', ru.api.validation);

  return NextResponse.json({
    data: {
      currency: estimate.currency,
      totalMinor: estimate.totalMinor,
      byStage: estimate.byStage,
    },
    meta: { priceMissingCount: estimate.priceMissingCount }, // edge case 4
  });
}
