import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { apiError, dbError } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ slug: string }> };

// SPEC 3.3: карточка проекта (публичный). RLS отдаёт анониму только published.
export async function GET(_request: Request, { params }: Ctx) {
  const { slug } = await params;
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const { data: p, error } = await supabase
    .from('house_projects')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) return dbError(error);
  if (!p) return apiError('NOT_FOUND', ru.api.projectNotFound);

  const { data: options } = await supabase
    .from('config_options')
    .select('*')
    .eq('project_id', p.id)
    .order('sort');

  // v1.6-кандидат: поля человеческих карточек (UX_PRINCIPLES) — аддитивно к SPEC 3.3.
  const configOptions: Record<
    string,
    Array<{
      key: string;
      label: string;
      isDefault: boolean;
      imageUrl: string;
      humanDescription: string;
      priceHint: string;
      isBeginnerChoice: boolean;
      beginnerAdvice: string;
    }>
  > = {};
  for (const o of options ?? []) {
    (configOptions[o.group_key] ??= []).push({
      key: o.option_key,
      label: o.label,
      isDefault: o.is_default,
      imageUrl: o.image_url,
      humanDescription: o.human_description,
      priceHint: o.price_hint,
      isBeginnerChoice: o.is_beginner_choice,
      beginnerAdvice: o.beginner_advice,
    });
  }

  return NextResponse.json({
    data: {
      id: p.id,
      slug: p.slug,
      title: p.title,
      buildingType: p.building_type,
      style: p.style,
      floors: p.floors,
      areaM2: Number(p.area_m2),
      rooms: p.rooms,
      footprint: p.footprint,
      heatingOptions: p.heating_options,
      maxSnowRegion: p.max_snow_region,
      spCompliant: p.sp_compliant,
      isFree: p.is_free,
      layoutNotes: p.layout_notes,
      description: p.description,
      priceMinor: p.price_minor,
      currency: p.currency,
      coverImageUrl: p.cover_image_url,
      modelGlbUrl: p.model_glb_url,
      isometricFallbackUrl: p.isometric_fallback_url,
      galleryUrls: p.gallery_urls,
      configOptions,
    },
  });
}
