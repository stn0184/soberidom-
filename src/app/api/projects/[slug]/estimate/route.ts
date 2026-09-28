import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { apiError } from '@/lib/api/helpers';
import { calcEstimate } from '@/lib/estimate/calc';
import { resolveConfig } from '@/lib/estimate/config';
import { createClient } from '@/lib/supabase/server';
import { ru } from '@/lib/i18n/ru';

// Сегмент называется [slug] (Next.js требует одно имя параметра на уровень,
// а /api/projects/[slug] уже существует), но значение здесь — UUID проекта (SPEC 3.4).
type Ctx = { params: Promise<{ slug: string }> };

// SPEC 3.4: предварительная смета (публичный).
// Группы — из config_options проекта (спека 009), не из списка в коде: query-параметр
// с именем группы проверяется по её вариантам (неизвестный → 400), пустой — как
// отсутствующий, прочие параметры (regionId) не трогаются. Умолчания — resolveConfig.
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
    .select('group_key, option_key, is_default, sort')
    .eq('project_id', id);
  if (!options || options.length === 0) {
    return apiError('NOT_FOUND', ru.api.projectNotFound);
  }

  const sent: Record<string, string> = {};
  for (const group of new Set(options.map((o) => o.group_key))) {
    const value = searchParams.get(group);
    if (!value) continue;
    const valid = options.some((o) => o.group_key === group && o.option_key === value);
    if (!valid) return apiError('VALIDATION_ERROR', ru.api.validation);
    sent[group] = value;
  }
  const config = resolveConfig(sent, options);

  const estimate = await calcEstimate(supabase, { projectId: id, config, regionId });
  if (!estimate) return apiError('VALIDATION_ERROR', ru.api.validation);

  return NextResponse.json({
    data: {
      currency: estimate.currency,
      totalMinor: estimate.totalMinor,
      byStage: estimate.byStage,
    },
    meta: {
      priceMissingCount: estimate.priceMissingCount, // edge case 4
      // Честность сметы (спека 005): до какой даты цены проверены.
      pricesCheckedOldest: estimate.pricesCheckedOldest,
      staleCount: estimate.staleCount,
    },
  });
}
