import { NextResponse } from 'next/server';
import { apiError, dbError, parseJson, requireAdmin, validationError } from '@/lib/api/helpers';
import { priceUpdateSchema } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const parsed = priceUpdateSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const { data, error } = await auth.supabase
    .from('material_prices')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return dbError(error);
  if (!data) return apiError('NOT_FOUND', ru.api.notFound);
  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { data, error } = await auth.supabase
    .from('material_prices')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) return dbError(error);
  if (!data) return apiError('NOT_FOUND', ru.api.notFound);
  return NextResponse.json({ data: { id: data.id } });
}
