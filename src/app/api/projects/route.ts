import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { dbError } from '@/lib/api/helpers';

const BUILDING_TYPES = ['house', 'banya', 'hozblok', 'garage'];
const STYLES = ['classic', 'barnhouse', 'scandinavian', 'a_frame', 'chalet', 'mini'];

// SPEC 3.2: каталог (публичный) с пагинацией.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const buildingType = params.get('buildingType');
  const style = params.get('style');
  const page = Math.max(1, Number(params.get('page')) || 1);
  const perPage = Math.min(50, Math.max(1, Number(params.get('per_page')) || 20));

  const supabase = (await createClient()) as unknown as SupabaseClient;
  let query = supabase
    .from('house_projects')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);
  if (buildingType && BUILDING_TYPES.includes(buildingType)) {
    query = query.eq('building_type', buildingType);
  }
  if (style && STYLES.includes(style)) query = query.eq('style', style);

  const { data, error, count } = await query;
  if (error) return dbError(error);

  return NextResponse.json({
    data: (data ?? []).map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      buildingType: p.building_type,
      style: p.style,
      floors: p.floors,
      areaM2: Number(p.area_m2),
      rooms: p.rooms,
      coverImageUrl: p.cover_image_url,
      priceMinor: p.price_minor,
      currency: p.currency,
      isFree: p.is_free,
    })),
    meta: { total: count ?? 0, page, per_page: perPage },
  });
}
