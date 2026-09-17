'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { ToolsResponse } from '@/components/build/build-types';
import { ToolNeedCard } from '@/components/build/tool-need-card';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { toolsSummary } from '@/lib/tools/effective';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.tools;
const ALL = 'all';

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; value: ToolsResponse };

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{t.byYourChoice}</p>
      </CardContent>
    </Card>
  );
}

// Инструменты купить/арендовать (US-012a, SPEC 4.12a): потребность + варианты,
// выбор за человеком, суммы пересчитываются по выбору (спека 004).
export function ToolsView({ purchaseId }: { purchaseId: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [tick, setTick] = useState(0);
  const [category, setCategory] = useState(ALL);
  // Выбор показываем сразу, не дожидаясь сервера; ошибка — откат и тост.
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [busyTool, setBusyTool] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<ToolsResponse>(`/api/my/${purchaseId}/tools`)
      .then((value) => !cancelled && setState({ kind: 'ready', value }))
      .catch(() => !cancelled && setState({ kind: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [purchaseId, tick]);

  const tools = useMemo(() => {
    if (state.kind !== 'ready') return [];
    return state.value.data.tools.map((tool) => ({
      ...tool,
      chosenVariantId: choices[tool.id] ?? tool.chosenVariantId,
    }));
  }, [state, choices]);

  async function choose(toolId: string, variantId: string) {
    const previous = choices[toolId];
    setChoices((prev) => ({ ...prev, [toolId]: variantId }));
    setBusyTool(toolId);
    try {
      await apiFetch(`/api/my/${purchaseId}/tools/choice`, {
        method: 'PUT',
        body: JSON.stringify({ toolId, variantId }),
      });
    } catch (e) {
      setChoices((prev) => {
        const next = { ...prev };
        if (previous === undefined) delete next[toolId];
        else next[toolId] = previous;
        return next;
      });
      toast.error(e instanceof ApiError ? e.message : t.chooseError);
    } finally {
      setBusyTool(null);
    }
  }

  if (state.kind === 'loading') {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-56 w-full" />
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

  const { meta } = state.value;
  const summary = toolsSummary(tools);
  const shown = category === ALL ? tools : tools.filter((tool) => tool.category === category);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="max-w-3xl text-muted-foreground">{t.intro}</p>
      </div>

      {tools.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">{t.emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{t.emptyText}</p>
        </div>
      ) : (
        <>
          <div className="grid max-w-xl gap-3 sm:grid-cols-2">
            <StatCard
              label={t.buyTotal}
              value={formatMoneyMinor(summary.buyTotalMinor, meta.currency)}
            />
            <StatCard
              label={t.rentTotal}
              value={formatMoneyMinor(summary.rentTotalMinor, meta.currency)}
            />
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={t.filterCategory} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t.filterAll}</SelectItem>
              {Object.entries(t.categories).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-4">
            {shown.map((tool) => (
              <ToolNeedCard
                key={tool.id}
                tool={tool}
                currency={meta.currency}
                stageCount={meta.stageCount}
                busy={busyTool === tool.id}
                onChoose={(variantId) => void choose(tool.id, variantId)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
