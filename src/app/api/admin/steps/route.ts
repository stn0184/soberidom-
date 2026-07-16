import { NextResponse, type NextRequest } from 'next/server';
import { apiError, dbError, parseJson, requireAdmin, validationError } from '@/lib/api/helpers';
import { stepSchema } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const stageId = request.nextUrl.searchParams.get('stageId');
  if (!stageId) return apiError('VALIDATION_ERROR', ru.api.validation);
  const { data, error } = await auth.supabase
    .from('steps')
    .select('*')
    .eq('stage_id', stageId)
    .order('sort');
  if (error) return dbError(error);
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const parsed = stepSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const { data, error } = await auth.supabase
    .from('steps')
    .insert(parsed.data)
    .select()
    .single();
  if (error) return dbError(error);
  return NextResponse.json({ data }, { status: 201 });
}
