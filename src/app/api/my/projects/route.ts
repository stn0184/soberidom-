import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { apiError } from '@/lib/api/helpers';
import { getPurchaseProgress } from '@/lib/build/progress';
import { createClient } from '@/lib/supabase/server';
import { ru } from '@/lib/i18n/ru';

// SPEC 3.7: покупки пользователя с прогрессом.
// meta.freeProjects — is_free-проекты без покупки (v1.5: доступ как у активной).
export async function GET() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return apiError('UNAUTHORIZED', ru.api.unauthorized);
  const db = client as unknown as SupabaseClient;

  const { data: purchases } = await db
    .from('purchases')
    .select('*, house_projects(slug, title, cover_image_url)')
    .order('created_at', { ascending: false });

  const data = [];
  for (const p of purchases ?? []) {
    const progress =
      p.status === 'active'
        ? await getPurchaseProgress(db, p.id, p.project_id, p.config ?? {})
        : null;
    data.push({
      purchaseId: p.id,
      status: p.status,
      code: p.code,
      project: {
        slug: p.house_projects?.slug ?? '',
        title: p.house_projects?.title ?? '',
        coverImageUrl: p.house_projects?.cover_image_url ?? '',
      },
      progress: progress
        ? {
            doneSteps: progress.doneSteps,
            totalSteps: progress.totalSteps,
            currentStage: progress.currentStage,
          }
        : null,
      activatedAt: p.activated_at,
    });
  }

  const ownedProjectIds = new Set((purchases ?? []).map((p) => p.project_id as string));
  const { data: freeRows } = await db
    .from('house_projects')
    .select('id, slug, title, cover_image_url')
    .eq('status', 'published')
    .eq('is_free', true);
  const freeProjects = (freeRows ?? [])
    .filter((p) => !ownedProjectIds.has(p.id))
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      coverImageUrl: p.cover_image_url,
    }));

  return NextResponse.json({ data, meta: { freeProjects } });
}
