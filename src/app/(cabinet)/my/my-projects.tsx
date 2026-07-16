'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { House, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { ru } from '@/lib/i18n/ru';

const t = ru.my;

type PurchaseCard = {
  purchaseId: string;
  status: 'pending' | 'active' | 'rejected' | 'refunded';
  project: { slug: string; title: string; coverImageUrl: string };
  progress: { doneSteps: number; totalSteps: number; currentStage: string | null } | null;
};
type FreeProject = { id: string; slug: string; title: string; coverImageUrl: string };
type Response = { data: PurchaseCard[]; meta: { freeProjects: FreeProject[] } };
type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; value: Response };

// /my — мои проекты (SPEC 4.6) + доступ к бесплатным разборам (v1.5).
export function MyProjects() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [tick, setTick] = useState(0);
  const [opening, setOpening] = useState<string | null>(null);

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

  async function openFree(projectId: string) {
    setOpening(projectId);
    try {
      const body = await apiFetch<{ data: { purchaseId: string } }>('/api/my/free-access', {
        method: 'POST',
        body: JSON.stringify({ projectId }),
      });
      router.push(`/my/${body.data.purchaseId}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
      setOpening(null);
    }
  }

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

      {meta.freeProjects.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">{t.freeTitle}</h2>
            <p className="text-muted-foreground">{t.freeText}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {meta.freeProjects.map((p) => (
              <Card key={p.id} className="overflow-hidden pt-0">
                <div className="relative aspect-video bg-muted">
                  {p.coverImageUrl ? (
                    <Image src={p.coverImageUrl} alt={p.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <House className="size-10" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle>{p.title}</CardTitle>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={opening !== null}
                    onClick={() => void openFree(p.id)}
                  >
                    {opening === p.id && <Loader2 className="animate-spin" />}
                    {opening === p.id ? t.freeOpening : t.freeOpen}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
