'use client';

import { useEffect, useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { STOCK_LENGTH_MM, type BoardLayout } from '@/lib/cutting/ffd';
import { apiFetch } from '@/lib/admin/fetcher';
import { cn } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.cutting;
const ALL = 'all';

const COLOR_BG: Record<string, string> = {
  red: 'bg-red-500',
  green: 'bg-green-600',
  yellow: 'bg-yellow-400 text-yellow-950',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
};

type StockPlan = {
  material: { name: string; unit: string };
  boardsNeeded: number;
  layouts: BoardLayout[];
  partCodes: string[];
};
type Usage = Record<string, Array<{ stageId: string; stageName: string; stepTitle: string }>>;
type Response = {
  data: { stockPlans: StockPlan[]; markerSummary: Array<{ color: string; instruction: string }> };
  meta: { usage: Usage; stages: Array<{ id: string; name: string }> };
};
type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; value: Response };

// Карта раскроя (US-008): цветные полосы заготовок, сводка маркеров, печать.
export function CuttingView({ purchaseId }: { purchaseId: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [tick, setTick] = useState(0);
  const [stageFilter, setStageFilter] = useState(ALL);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Response>(`/api/my/${purchaseId}/cutting`)
      .then((value) => !cancelled && setState({ kind: 'ready', value }))
      .catch(() => !cancelled && setState({ kind: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [purchaseId, tick]);

  const filteredPlans = useMemo(() => {
    if (state.kind !== 'ready') return [];
    const { stockPlans } = state.value.data;
    if (stageFilter === ALL) return stockPlans;
    const usage = state.value.meta.usage;
    const inStage = (code: string) => (usage[code] ?? []).some((u) => u.stageId === stageFilter);
    return stockPlans
      .map((plan) => ({
        ...plan,
        layouts: plan.layouts.filter((l) =>
          l.segments.some((s) => s.kind === 'part' && inStage(s.partCode))
        ),
      }))
      .filter((plan) => plan.layouts.length > 0);
  }, [state, stageFilter]);

  if (state.kind === 'loading') {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
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
  if (data.stockPlans.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="font-medium">{t.emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{t.emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.intro}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={t.filterStage} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t.filterAll}</SelectItem>
              {meta.stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer />
            {t.print}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.markerSummary.map((m) => (
          <Card key={m.color}>
            <CardContent className="flex items-center gap-3 py-3">
              <span className={cn('size-5 shrink-0 rounded-full', COLOR_BG[m.color])} />
              <p className="text-sm">{m.instruction}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPlans.map((plan) => (
        <Card key={plan.material.name}>
          <CardHeader>
            <CardTitle className="text-base">
              {plan.material.name} · {t.boardsNeeded(plan.boardsNeeded)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plan.layouts.map((layout, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-sm font-medium">
                  {t.boardsCount(layout.boardCount)}
                </span>
                <div className="flex h-10 flex-1 overflow-hidden rounded-md border">
                  {layout.segments.map((segment, j) =>
                    segment.kind === 'part' ? (
                      <button
                        key={j}
                        type="button"
                        onClick={() => setSelectedPart(segment.partCode)}
                        className={cn(
                          'flex items-center justify-center overflow-hidden whitespace-nowrap border-r text-[11px] font-medium text-white last:border-r-0',
                          COLOR_BG[segment.color]
                        )}
                        style={{ width: `${(segment.lengthMm / STOCK_LENGTH_MM) * 100}%` }}
                        title={`${segment.partCode} · ${segment.lengthMm} мм`}
                      >
                        {segment.partCode} · {segment.lengthMm}
                      </button>
                    ) : (
                      <div
                        key={j}
                        className="flex items-center justify-center bg-muted text-[10px] text-muted-foreground"
                        style={{ width: `${(segment.wasteMm / STOCK_LENGTH_MM) * 100}%` }}
                        title={`${t.waste}: ${segment.wasteMm} мм`}
                      >
                        {segment.wasteMm >= 400 ? segment.wasteMm : ''}
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Dialog open={selectedPart !== null} onOpenChange={(o) => !o && setSelectedPart(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPart ? t.usageTitle(selectedPart) : ''}</DialogTitle>
          </DialogHeader>
          <ul className="space-y-1 text-sm">
            {(selectedPart ? (meta.usage[selectedPart] ?? []) : []).map((u, i) => (
              <li key={i}>
                {u.stageName} · {u.stepTitle}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
