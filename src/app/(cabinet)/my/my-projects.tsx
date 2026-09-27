'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { House } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/admin/fetcher';
import { ru } from '@/lib/i18n/ru';
import { FreeProjects, type FreeProject } from './free-projects';

const t = ru.my;

type PurchaseCard = {
  purchaseId: string;
  status: 'pending' | 'active' | 'rejected' | 'refunded';
  project: { slug: string; title: string; coverImageUrl: string };
  progress: { doneSteps: number; totalSteps: number; currentStage: string | null } | null;
};
type Response = { data: PurchaseCard[]; meta: { freeProjects: FreeProject[] } };
type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; value: Response };

// /my — мои проекты (SPEC 4.6) + доступ к бесплатным разборам (v1.5, FreeProjects).
export function MyProjects() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Response>('/api/my/projects')
      .then((value) => {
        if (!cancelled) setState({ kind: 'ready', value });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  if (state.kind === 'loading') {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full" />
        ))}
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>{ru.admin.common.loadError}</span>
          <Button variant="outline" size="sm" onClick={() => {
            setState({ kind: 'loading' });
            setTick((n) => n + 1);
          }}>
            {ru.common.retry}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const { data, meta } = state.value;

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">{t.title}</h1>

      {data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium">{t.emptyTitle}</p>
          <p className="mt-1 text-muted-foreground">{t.emptyText}</p>
          <Button asChild className="mt-4">
            <Link href="/quiz">{t.emptyCta}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <Card key={p.purchaseId} className="overflow-hidden pt-0">
              <div className="relative aspect-video bg-muted">
                {p.project.coverImageUrl ? (
                  <Image
                    src={p.project.coverImageUrl}
                    alt={p.project.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <House className="size-10" />
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle>{p.project.title}</CardTitle>
                <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                  {p.status === 'active'
                    ? t.statusActive
                    : p.status === 'pending'
                      ? t.statusPending
                      : t.statusBlocked}
                </Badge>
              </CardHeader>
              {p.progress && (
                <CardContent className="space-y-2">
                  <Progress
                    value={
                      p.progress.totalSteps > 0
                        ? (p.progress.doneSteps / p.progress.totalSteps) * 100
                        : 0
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    {t.progressLabel(p.progress.doneSteps, p.progress.totalSteps)}
                  </p>
                </CardContent>
              )}
              <CardFooter className="gap-2">
                {p.status === 'active' ? (
                  <>
                    <Button asChild className="flex-1">
                      <Link href={`/my/${p.purchaseId}/build`}>{t.continueBtn}</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/my/${p.purchaseId}`}>{t.openHub}</Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/projects/${p.project.slug}/buy`}>{t.payInstructionsBtn}</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <FreeProjects projects={meta.freeProjects} />
    </div>
  );
}
