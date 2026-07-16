'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { apiFetch } from '@/lib/admin/fetcher';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.tools;
const ALL = 'all';

type Tool = {
  name: string;
  category: string;
  recommendation: 'buy' | 'rent' | 'borrow_or_buy_cheap';
  reason: string;
  approxPriceMinor: number;
  approxRentDayMinor: number | null;
  daysNeeded: number;
  alternative: string;
  stages: string[];
};
type Response = {
  data: { summary: { buyTotalMinor: number; rentTotalMinor: number }; tools: Tool[] };
  meta: { currency: string };
};
type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; value: Response };

const REC_VARIANT: Record<Tool['recommendation'], 'default' | 'secondary' | 'outline'> = {
  buy: 'default',
  rent: 'secondary',
  borrow_or_buy_cheap: 'outline',
};

// Инструменты купить/арендовать (US-012a, SPEC 4.12a).
export function ToolsView({ purchaseId }: { purchaseId: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [tick, setTick] = useState(0);
  const [category, setCategory] = useState(ALL);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Response>(`/api/my/${purchaseId}/tools`)
      .then((value) => !cancelled && setState({ kind: 'ready', value }))
      .catch(() => !cancelled && setState({ kind: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [purchaseId, tick]);

  const filtered = useMemo(() => {
    if (state.kind !== 'ready') return [];
    const tools = state.value.data.tools;
    return category === ALL ? tools : tools.filter((tool) => tool.category === category);
  }, [state, category]);

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
  if (data.tools.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="font-medium">{t.emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{t.emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">{t.intro}</p>
      </div>

      <div className="grid max-w-xl gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {t.buyTotal}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {t.approx(formatMoneyMinor(data.summary.buyTotalMinor, meta.currency))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {t.rentTotal}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {t.approx(formatMoneyMinor(data.summary.rentTotalMinor, meta.currency))}
            </p>
          </CardContent>
        </Card>
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

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((tool) => (
          <Card key={tool.name}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{tool.name}</CardTitle>
                <Badge variant={REC_VARIANT[tool.recommendation]}>
                  {t.recommendation[tool.recommendation]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{tool.reason}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                {t.price(formatMoneyMinor(tool.approxPriceMinor, meta.currency))}
                {tool.approxRentDayMinor !== null && (
                  <>
                    {' · '}
                    {t.rent(
                      formatMoneyMinor(tool.approxRentDayMinor, meta.currency),
                      tool.daysNeeded
                    )}
                  </>
                )}
              </p>
              {tool.alternative && (
                <p className="text-muted-foreground">
                  {t.alternative}: {tool.alternative}
                </p>
              )}
              {tool.stages.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tool.stages.map((stage) => (
                    <Badge key={stage} variant="secondary">
                      {stage}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
