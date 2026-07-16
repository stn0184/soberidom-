import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { apiError, parseJson, validationError } from '@/lib/api/helpers';
import { calcEstimate, type EstimateConfig } from '@/lib/estimate/calc';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { quizSchema } from '@/lib/zod/quiz';
import { ru } from '@/lib/i18n/ru';

// SPEC 3.1: подбор проектов (публичный). Rate limit 30 req/мин на IP (SPEC 5.8).
export async function POST(request: NextRequest) {
  if (!rateLimit(`quiz:${clientIp(request)}`, 30, 60_000)) {
    return apiError('RATE_LIMITED', ru.api.rateLimited);
  }
  const parsed = quizSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const q = parsed.data;

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data: region } = await supabase
    .from('regions')
    .select('id, name, snow_region')
    .eq('id', q.regionId)
    .maybeSingle();
  if (!region) return apiError('VALIDATION_ERROR', ru.api.validation);
  const { snow_region: snowRegion, name: regionName } = region;

  async function fetchCandidates(relaxedPass: boolean) {
    let query = supabase
      .from('house_projects')
      .select('*')
      .eq('status', 'published')
      .eq('building_type', q.buildingType)
      .gte('max_snow_region', snowRegion);
    if (!relaxedPass) {
      if (q.style !== 'any') query = query.eq('style', q.style);
      if (q.floors !== 0) query = query.eq('floors', q.floors);
      if (q.heating !== 'undecided') query = query.contains('heating_options', [q.heating]);
    }
    const { data } = await query;
    return data ?? [];
  }

  // Меньше 2 совпадений → снимаем мягкие фильтры (relaxed:true, US-001).
  let projects = await fetchCandidates(false);
  let relaxed = false;
  if (projects.length < 2) {
    projects = await fetchCandidates(true);
    relaxed = true;
  }

  // Дефолтная конфигурация каждого проекта — для расчёта estimate.
  const projectIds = projects.map((p) => p.id as string);
  const { data: options } = projectIds.length
    ? await supabase
        .from('config_options')
        .select('project_id, group_key, option_key, is_default')
        .in('project_id', projectIds)
    : { data: [] };
  const defaultsByProject = new Map<string, EstimateConfig>();
  for (const o of options ?? []) {
    if (!o.is_default) continue;
    const cfg = defaultsByProject.get(o.project_id) ?? {};
    cfg[o.group_key] = o.option_key;
    defaultsByProject.set(o.project_id, cfg);
  }

  const cards = [];
  for (const p of projects) {
    const est = await calcEstimate(supabase, {
      projectId: p.id,
      config: defaultsByProject.get(p.id) ?? {},
      regionId: q.regionId,
    });
    // Скоринг SPEC 3.1: 0.5×площадь + 0.3×бюджет + 0.2×комнаты.
    const areaScore = 1 - Math.min(Math.abs(Number(p.area_m2) - q.areaM2) / q.areaM2, 1);
    const budgetScore =
      q.budgetMinor !== null && est && est.totalMinor > 0
        ? 1 - Math.min(Math.abs(est.totalMinor - q.budgetMinor) / q.budgetMinor, 1)
        : 1;
    const roomsScore =
      q.rooms === undefined
        ? 1
        : p.rooms === q.rooms
          ? 1
          : Math.abs(p.rooms - q.rooms) === 1
            ? 0.5
            : 0;
    const matchScore = 0.5 * areaScore + 0.3 * budgetScore + 0.2 * roomsScore;

    const whyMatch = [ru.quiz.why.area(Number(p.area_m2), q.areaM2)];
    if (q.heating !== 'undecided') whyMatch.push(ru.quiz.why.heating(ru.dict.heating[q.heating]));
    whyMatch.push(ru.quiz.why.snow(snowRegion, regionName));
    if (relaxed) whyMatch.push(ru.quiz.why.relaxed);

    cards.push({
      id: p.id,
      slug: p.slug,
      title: p.title,
      areaM2: Number(p.area_m2),
      rooms: p.rooms,
      floors: p.floors,
      style: p.style,
      coverImageUrl: p.cover_image_url,
      estimateMinor: est?.totalMinor ?? 0,
      currency: est?.currency ?? p.currency,
      priceMinor: p.price_minor,
      isFree: p.is_free,
      matchScore: Math.round(matchScore * 100) / 100,
      whyMatch,
    });
  }

  cards.sort((a, b) => b.matchScore - a.matchScore);
  const top = cards.slice(0, 4);
  return NextResponse.json({ data: top, meta: { total: top.length, relaxed } });
}
