import { NextResponse, type NextRequest } from 'next/server';
import { apiError, dbError, parseJson, requireAdmin, validationError } from '@/lib/api/helpers';
import { toolSchema } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

// Потребности инструмента проекта вместе с вариантами: форма админки правит их
// одним экраном, поэтому варианты приезжают вложенными (спека 004).
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) return apiError('VALIDATION_ERROR', ru.api.validation);
  const { data, error } = await auth.supabase
    .from('project_tools')
    .select('*, tool_variants(*)')
    .eq('project_id', projectId)
    .order('sort')
    .order('sort', { referencedTable: 'tool_variants' });
  if (error) return dbError(error);
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const parsed = toolSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const { data, error } = await auth.supabase
    .from('project_tools')
    .insert(parsed.data)
    .select()
    .single();
  if (error) return dbError(error);
  return NextResponse.json({ data }, { status: 201 });
}
