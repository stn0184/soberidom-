import { NextResponse, type NextRequest } from 'next/server';
import { apiError, dbError, parseJson, requireAdmin, validationError } from '@/lib/api/helpers';
import { priceSchema } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const materialId = request.nextUrl.searchParams.get('materialId');
  if (!materialId) return apiError('VALIDATION_ERROR', ru.api.validation);
  const { data, error } = await auth.supabase
    .from('material_prices')
    .select('*')
    .eq('material_id', materialId)
    .order('country_code');
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
  if (error) return dbError(error);
  return NextResponse.json({ data }, { status: 201 });
}
