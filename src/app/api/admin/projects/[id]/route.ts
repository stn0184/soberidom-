import { NextResponse } from 'next/server';
import { apiError, dbError, parseJson, requireAdmin, validationError } from '@/lib/api/helpers';
import { lintStep } from '@/lib/admin/linter';
import { projectUpdateSchema } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const parsed = projectUpdateSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);

  // Публикация блокируется линтером контента шагов (SPEC 5.10, US-007).
  if (parsed.data.status === 'published') {
    const { data: stages } = await auth.supabase
      .from('stages')
      .select('id,title')
      .eq('project_id', id);
    const stageIds = (stages ?? []).map((s) => s.id);
    if (stageIds.length > 0) {
      const { data: steps } = await auth.supabase
        .from('steps')
        .select('*')
        .in('stage_id', stageIds);
      const problems: string[] = [];
      for (const s of steps ?? []) {
        const issues = lintStep({
          ...s,
          actions: s.actions ?? [],
          self_check: s.self_check ?? [],
        });
        if (issues.length > 0) {
          problems.push(ru.admin.linter.stepIssues(s.title, issues.join('; ')));
        }
      }
      if (problems.length > 0) {
        return apiError(
          'VALIDATION_ERROR',
          `${ru.admin.linter.publishBlocked}. ${problems.join(' | ')}`
        );
      }
    }
  }

  const { data, error } = await auth.supabase
    .from('house_projects')
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
    .from('house_projects')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) return dbError(error);
  if (!data) return apiError('NOT_FOUND', ru.api.notFound);
  return NextResponse.json({ data: { id: data.id } });
}
