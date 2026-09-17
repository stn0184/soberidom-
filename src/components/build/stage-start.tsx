'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { BuildStage, SuppliesResponse } from '@/components/build/build-types';
import { COLOR_DOT } from '@/components/build/stage-sidebar';
import { SectionTitle, SuppliesMaterials } from '@/components/build/stage-supplies';
import { StageTools } from '@/components/build/stage-tools';
import { RegionCombobox, type RegionOption } from '@/components/quiz/region-combobox';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { cn } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.build.stageStart;

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; value: SuppliesResponse };

// Экран начала этапа (спека 003, ВИДЕНИЕ 2.3): что купить и чем работать —
// до первого шага. Шапка рисуется сразу, закупки догружаются отдельно:
// человек видит, куда попал, ещё до ответа /supplies.
export function StageStart({
  stage,
  purchaseId,
  onStart,
}: {
  stage: BuildStage;
  purchaseId: string;
  onStart: () => void;
}) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [tick, setTick] = useState(0);
  const reload = () => {
    setState({ kind: 'loading' });
    setTick((n) => n + 1);
  };

  // Родитель монтирует экран с key={stage.id}, так что смена этапа —
  // новый компонент с чистым состоянием, а не setState внутри эффекта.
  useEffect(() => {
    let cancelled = false;
    apiFetch<SuppliesResponse>(`/api/my/${purchaseId}/supplies?stage=${stage.id}`)
      .then((value) => !cancelled && setState({ kind: 'ready', value }))
      .catch(() => !cancelled && setState({ kind: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [purchaseId, stage.id, tick]);

  return (
    <div className="min-w-0 space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {stage.color && (
            <span className={cn('size-2.5 shrink-0 rounded-full', COLOR_DOT[stage.color])} />
          )}
          <span>{ru.build.breadcrumb(stage.number, stage.displayName)}</span>
          {stage.durationDays !== null && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="size-3" />
              {t.duration(stage.durationDays)}
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold">{stage.displayName}</h1>
        {stage.intro && <p className="max-w-2xl text-base text-muted-foreground">{stage.intro}</p>}
      </header>

      <Supplies state={state} purchaseId={purchaseId} stageId={stage.id} reload={reload} />

      <div className="flex flex-wrap items-center gap-4 border-t pt-6">
        {/* Кнопка на месте всегда: экран подсказывает, а не запирает (ВИДЕНИЕ 2.2). */}
        <Button size="xl" onClick={onStart}>
          {t.startStage}
        </Button>
        <Link href={`/my/${purchaseId}/estimate`} className="text-sm text-primary hover:underline">
          {t.estimateAll}
        </Link>
      </div>
    </div>
  );
}

function Supplies({
  state,
  purchaseId,
  stageId,
  reload,
}: {
  state: State;
  purchaseId: string;
  stageId: string;
  reload: () => void;
}) {
  const [region, setRegion] = useState<RegionOption | null>(null);

  async function saveRegion() {
    if (!region) return;
    try {
      await apiFetch(`/api/my/${purchaseId}/region`, {
        method: 'PATCH',
        body: JSON.stringify({ regionId: region.id }),
      });
      reload(); // цены появились — перезапрашиваем закупки, без перезагрузки страницы
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    }
  }

  if (state.kind === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (state.kind === 'error') {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>{ru.admin.common.loadError}</span>
          <Button variant="outline" size="sm" onClick={reload}>
            {ru.common.retry}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const { data, meta } = state.value;
  const toolsHref = `/my/${purchaseId}/tools`;
  const tools = data.tools.length > 0 && (
    <StageTools
      tools={data.tools}
      stageId={stageId}
      currency={data.currency}
      toolsHref={toolsHref}
    />
  );

  // Без региона цен нет — спрашиваем город прямо здесь, как в живой смете.
  if (meta.needRegion) {
    return (
      <>
        <section className="space-y-3">
          <SectionTitle icon={<ShoppingCart className="size-5" />}>{t.suppliesTitle}</SectionTitle>
          <div className="max-w-md space-y-3">
            <Alert>
              <AlertTitle>{t.needRegionTitle}</AlertTitle>
              <AlertDescription>{t.needRegionText}</AlertDescription>
            </Alert>
            <Label>{ru.project.regionLabel}</Label>
            <RegionCombobox value={region} onChange={setRegion} />
            <Button disabled={!region} onClick={() => void saveRegion()}>
              {ru.admin.common.save}
            </Button>
          </div>
        </section>
        {tools}
      </>
    );
  }

  if (data.materials.length === 0 && data.tools.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="font-medium">{t.emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t.emptyText}</p>
        <Link
          href={`/my/${purchaseId}/estimate`}
          className="mt-3 inline-block text-sm text-primary hover:underline"
        >
          {t.estimateAll}
        </Link>
      </div>
    );
  }

  return (
    <>
      {data.materials.length > 0 && (
        <SuppliesMaterials
          materials={data.materials}
          currency={data.currency}
          purchaseId={purchaseId}
        />
      )}
      {tools}
    </>
  );
}
