'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CloudOff } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StageSidebar } from '@/components/build/stage-sidebar';
import { StepView } from '@/components/build/step-view';
import type { BuildStage } from '@/components/build/build-types';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { enqueue, flushQueue, queueSize, sendProgress } from '@/lib/build/offline-queue';
import { ru } from '@/lib/i18n/ru';

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; stages: BuildStage[] };

// Конструктор сборки (US-007): возврат открывает первый незавершённый шаг,
// отметки — optimistic с офлайн-очередью (edge 1), авто-переход после «Готово».
export function BuildView({ purchaseId }: { purchaseId: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [tick, setTick] = useState(0);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ data: BuildStage[] }>(`/api/my/${purchaseId}/build`)
      .then((body) => {
        if (cancelled) return;
        setState({ kind: 'ready', stages: body.data });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [purchaseId, tick]);

  // Синк офлайн-очереди: при загрузке и при возвращении сети.
  useEffect(() => {
    const sync = () => {
      void flushQueue().then(() => setPendingSync(queueSize(purchaseId)));
    };
    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [purchaseId]);

  const flatSteps = useMemo(() => {
    if (state.kind !== 'ready') return [];
    return state.stages.flatMap((stage) => stage.steps.map((step) => ({ stage, step })));
  }, [state]);

  // Первый незавершённый шаг (US-007) — если ничего не выбрано.
  const current = useMemo(() => {
    if (flatSteps.length === 0) return null;
    if (selectedStepId) {
      const found = flatSteps.find((f) => f.step.id === selectedStepId);
      if (found) return found;
    }
    return flatSteps.find((f) => !f.step.done) ?? flatSteps[flatSteps.length - 1];
  }, [flatSteps, selectedStepId]);

  const setStepDone = useCallback(
    (stepId: string, done: boolean) => {
      setState((prev) => {
        if (prev.kind !== 'ready') return prev;
        return {
          kind: 'ready',
          stages: prev.stages.map((stage) => ({
            ...stage,
            steps: stage.steps.map((s) => (s.id === stepId ? { ...s, done } : s)),
          })),
        };
      });
    },
    []
  );

  async function mark(stepId: string, done: boolean, advance: boolean) {
    setStepDone(stepId, done); // optimistic (edge 1)
    if (advance && current) {
      const idx = flatSteps.findIndex((f) => f.step.id === stepId);
      const next = flatSteps[idx + 1];
      if (next) setSelectedStepId(next.step.id);
    }
    try {
      await sendProgress({ purchaseId, stepId, done });
      setPendingSync(queueSize(purchaseId));
    } catch (e) {
      if (e instanceof ApiError) {
        setStepDone(stepId, !done); // сервер отверг — откатываем
        toast.error(e.message);
      } else {
        enqueue({ purchaseId, stepId, done }); // офлайн — в очередь
        setPendingSync(queueSize(purchaseId));
        toast.info(ru.build.offlineToast);
      }
    }
  }

  if (state.kind === 'loading') {
    return (
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <Skeleton className="h-64 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>{ru.admin.common.loadError}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setState({ kind: 'loading' });
              setTick((n) => n + 1);
            }}
          >
            {ru.common.retry}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (flatSteps.length === 0 || !current) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="font-medium">{ru.build.emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{ru.build.emptyText}</p>
      </div>
    );
  }

  const stageSteps = current.stage.steps;
  const stepIndexInStage = stageSteps.findIndex((s) => s.id === current.step.id);
  const globalIndex = flatSteps.findIndex((f) => f.step.id === current.step.id);
  const prev = globalIndex > 0 ? flatSteps[globalIndex - 1] : null;

  return (
    <div className="space-y-4">
      {pendingSync > 0 && (
        <Badge variant="secondary" className="gap-1">
          <CloudOff className="size-3.5" />
          {ru.build.offlineBadge}: {pendingSync}
        </Badge>
      )}
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside>
          <StageSidebar
            stages={state.stages}
            currentStageId={current.stage.id}
            onSelectStage={(stageId) => {
              const stage = state.stages.find((s) => s.id === stageId);
              const first = stage?.steps.find((s) => !s.done) ?? stage?.steps[0];
              if (first) setSelectedStepId(first.id);
            }}
          />
        </aside>
        <div className="min-w-0">
          <StepView
            key={current.step.id}
            stage={current.stage}
            step={current.step}
            index={stepIndexInStage}
            total={stageSteps.length}
            onDone={() => void mark(current.step.id, true, true)}
            onReopen={() => void mark(current.step.id, false, false)}
            onBack={prev ? () => setSelectedStepId(prev.step.id) : null}
          />
        </div>
      </div>
    </div>
  );
}
