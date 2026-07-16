'use client';

import { useEffect, useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/admin/fetcher';
import type { EstimateConfig, EstimateStageRow } from '@/lib/estimate/calc';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

type EstimateResponse = {
  data: { currency: string; totalMinor: number; byStage: EstimateStageRow[] };
  meta: { priceMissingCount: number };
};

type State =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; value: EstimateResponse };

// Предварительная смета (SPEC 4.4 п.4): итог всегда виден, разбивка в Collapsible,
// пересчёт без перезагрузки при каждой смене опции (US-003).
export function EstimatePanel({
  projectId,
  regionId,
  config,
}: {
  projectId: string;
  regionId: string | null;
  config: EstimateConfig;
}) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!regionId) return;
    let cancelled = false;
    const params = new URLSearchParams({ regionId, ...config });
    apiFetch<EstimateResponse>(`/api/projects/${projectId}/estimate?${params}`)
      .then((value) => {
        if (!cancelled) setState({ kind: 'ready', value });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, regionId, config, tick]);

  if (!regionId || state.kind === 'loading') {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>{ru.project.estimateError}</span>
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

  const { data, meta } = state.value;
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm text-muted-foreground">{ru.project.estimateTotal}</p>
        <p className="text-3xl font-bold">{formatMoneyMinor(data.totalMinor, data.currency)}</p>
        {meta.priceMissingCount > 0 && (
          <Badge variant="secondary" className="mt-1">
            {ru.project.estimateMissing(meta.priceMissingCount)}
          </Badge>
        )}
      </div>
      {data.byStage.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="px-0">
              <ChevronsUpDown />
              {ru.project.estimateByStage}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="space-y-1 pt-2 text-sm">
              {data.byStage.map((row) => (
                <li key={row.stageCode} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{row.title}</span>
                  <span className="font-medium">
                    {formatMoneyMinor(row.subtotalMinor, data.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
