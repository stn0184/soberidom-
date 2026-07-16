import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  Calculator,
  Hammer,
  Scissors,
  Truck,
  Wallet,
  Wrench,
} from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { JourneyMap, type JourneyStage } from '@/components/build/journey-map';
import { getPurchaseProgress } from '@/lib/build/progress';
import { createClient } from '@/lib/supabase/server';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

export const metadata: Metadata = {
  title: `${ru.my.title} — ${ru.common.appName}`,
};

const SECTIONS = [
  { key: 'build', icon: Hammer },
  { key: 'cutting', icon: Scissors },
  { key: 'estimate', icon: Calculator },
  { key: 'finance', icon: Wallet },
  { key: 'delivery', icon: Truck },
  { key: 'tools', icon: Wrench },
] as const;

// Хаб купленного проекта (SPEC: /my/[purchaseId]). Не-active → инструкция оплаты.
export default async function PurchaseHubPage({ params }: Ctx) {
  const { purchaseId } = await params;
  const client = await createClient();
  const db = client as unknown as SupabaseClient;

  const { data: purchase } = await db
    .from('purchases')
    .select('*, house_projects(slug, title)')
    .eq('id', purchaseId)
    .maybeSingle();
  if (!purchase) notFound(); // RLS скрывает чужие — 404, не раскрываем (edge 9)
  if (purchase.status !== 'active') {
    redirect(`/projects/${purchase.house_projects?.slug}/buy`);
  }

  const progress = await getPurchaseProgress(
    db,
    purchase.id,
    purchase.project_id,
    purchase.config ?? {}
  );
  const t = ru.my.hub;

  // «Карта путешествия» (ВИДЕНИЕ 2.1): все этапы по порядку с прогрессом.
  const journeyStages: JourneyStage[] = progress.stages.map((stage, index) => {
    const stageSteps = progress.steps.filter((s) => s.stage_id === stage.id);
    return {
      id: stage.id,
      number: index + 1,
      displayName: stage.display_name || stage.title,
      color: stage.color,
      intro: stage.intro,
      durationDays: stage.duration_days,
      resultImageUrl: stage.result_image_url,
      doneSteps: stageSteps.filter((s) => progress.doneStepIds.has(s.id)).length,
      totalSteps: stageSteps.length,
    };
  });
  const totalDays = journeyStages.reduce((sum, s) => sum + (s.durationDays ?? 0), 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{purchase.house_projects?.title}</h1>

      <section className="max-w-xl space-y-2">
        <h2 className="font-medium">{t.progressTitle}</h2>
        <Progress
          value={progress.totalSteps > 0 ? (progress.doneSteps / progress.totalSteps) * 100 : 0}
        />
        <p className="text-sm text-muted-foreground">
          {ru.my.progressLabel(progress.doneSteps, progress.totalSteps)}
          {' · '}
          {progress.totalSteps === 0
            ? t.notStarted
            : progress.currentStage
              ? t.currentStage(progress.currentStage)
              : t.allDone}
        </p>
      </section>

      {journeyStages.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">{t.journeyTitle}</h2>
            <p className="max-w-2xl text-muted-foreground">{t.journeyIntro}</p>
            {totalDays > 0 && <p className="mt-1 font-medium">{t.totalDuration(totalDays)}</p>}
          </div>
          <JourneyMap purchaseId={purchase.id} stages={journeyStages} />
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ key, icon: Icon }) => (
          <Link key={key} href={`/my/${purchase.id}/${key}`}>
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <Icon className="size-7 text-primary" />
                <CardTitle>{t.sections[key].title}</CardTitle>
                <CardDescription>{t.sections[key].text}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
