import { NextResponse, type NextRequest } from 'next/server';
import { apiError, dbError, parseJson, requireAdmin, validationError } from '@/lib/api/helpers';
import { staleBefore, todayIso } from '@/lib/estimate/prices';
import { priceSchema } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

// Уникальный индекс предложения (материал, страна, регион, подпись) —
// не «внутренняя ошибка», а понятная админу подсказка.
function priceError(error: { code?: string }) {
  return error.code === '23505'
    ? apiError('VALIDATION_ERROR', ru.admin.materials.priceDuplicate)
    : dbError(error);
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const params = request.nextUrl.searchParams;

  // ?stale=1 — счётчик устаревших цен для /admin/materials (спека 005).
  if (params.get('stale') === '1') {
    const { count, error } = await auth.supabase
      .from('material_prices')
      .select('id', { count: 'exact', head: true })
      .lt('checked_at', staleBefore(todayIso()));
    if (error) return dbError(error);
    return NextResponse.json({ data: { count: count ?? 0 } });
  }

  const materialId = params.get('materialId');
  if (!materialId) return apiError('VALIDATION_ERROR', ru.api.validation);
  const { data, error } = await auth.supabase
    .from('material_prices')
    .select('*')
    .eq('material_id', materialId)
    .order('country_code')
    .order('price_minor');
  if (error) return dbError(error);
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const parsed = priceSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const { data, error } = await auth.supabase
    .from('material_prices')
    .insert(parsed.data)
    .select()
    .single();
  if (error) return priceError(error);
  return NextResponse.json({ data }, { status: 201 });
}
