'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EstimateRow } from '@/components/estimate/estimate-row';
import { RegionCombobox, type RegionOption } from '@/components/quiz/region-combobox';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { buildEstimateCsv, downloadCsv } from '@/lib/estimate/csv';
import type { DetailedEstimate, EstimatePosition } from '@/lib/estimate/detailed';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.liveEstimate;

type Response = { data: DetailedEstimate | null; meta: { needRegion: boolean } };
type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; value: Response };

// Живая смета (US-009 + HANDOFF): чек-лист закупок с прогресс-баром,
// свои цены, storage_tip, CSV. Группировка: по этапам / список покупок.
export function EstimateView({ purchaseId }: { purchaseId: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [tick, setTick] = useState(0);
  const [region, setRegion] = useState<RegionOption | null>(null);
  const reload = () => setTick((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Response>(`/api/my/${purchaseId}/estimate`)
      .then((value) => !cancelled && setState({ kind: 'ready', value }))
      .catch(() => !cancelled && setState({ kind: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [purchaseId, tick]);

  async function saveRegion() {
    if (!region) return;
    try {
      await apiFetch(`/api/my/${purchaseId}/region`, {
        method: 'PATCH',
        body: JSON.stringify({ regionId: region.id }),
      });
      setState({ kind: 'loading' });
      reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    }
  }

  const shoppingList = useMemo<EstimatePosition[]>(() => {
    if (state.kind !== 'ready' || !state.value.data) return [];
    const byMaterial = new Map<string, EstimatePosition>();
    for (const p of state.value.data.positions) {
      const existing = byMaterial.get(p.materialId);
      if (existing) {
        existing.qty += p.qty;
        existing.amountMinor += p.amountMinor;
      } else {
        byMaterial.set(p.materialId, { ...p, stageTitle: '' });
      }
    }
    return [...byMaterial.values()];
  }, [state]);

  if (state.kind === 'loading') {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-64 w-full" />
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
            reload();
          }}>
            {ru.common.retry}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const { data, meta } = state.value;
  if (meta.needRegion || !data) {
    return (
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
    );
  }

  if (data.positions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="font-medium">{t.emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{t.emptyText}</p>
      </div>
    );
  }

  const stageTitles = [...new Set(data.positions.map((p) => p.stageTitle))];
  const table = (rows: EstimatePosition[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.thMaterial}</TableHead>
          <TableHead className="w-20">{t.thQty}</TableHead>
          <TableHead className="w-16">{t.thUnit}</TableHead>
          <TableHead className="w-48">{t.thPrice}</TableHead>
          <TableHead className="w-32">{t.thAmount}</TableHead>
          <TableHead className="w-20">{t.thPurchased}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => (
          <EstimateRow
            key={`${p.stageCode}:${p.materialId}`}
            position={p}
            currency={data.currency}
            purchaseId={purchaseId}
            onChanged={reload}
          />
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">{t.intro}</p>
      </div>

      {/* Прогресс-шкала закупок (HANDOFF п.1) */}
      <div className="max-w-xl space-y-1.5">
        <Progress
          value={shoppingList.length > 0 ? (shoppingList.filter((p) => p.purchased).length / shoppingList.length) * 100 : 0}
        />
        <p className="text-sm text-muted-foreground">
          {t.progress(shoppingList.filter((p) => p.purchased).length, shoppingList.length)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            {t.totalLabel}: {formatMoneyMinor(data.totalMinor, data.currency)}
          </span>
          {data.priceMissingCount > 0 && (
            <Badge variant="secondary">{t.totalApprox(data.priceMissingCount)}</Badge>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => downloadCsv(buildEstimateCsv(shoppingList, data.currency), 'soberidom-shopping.csv')}
        >
          <Download />
          {t.csvExport}
        </Button>
      </div>

      <Tabs defaultValue="stages">
        <TabsList>
          <TabsTrigger value="stages">{t.tabStages}</TabsTrigger>
          <TabsTrigger value="shopping">{t.tabShopping}</TabsTrigger>
        </TabsList>
        <TabsContent value="stages" className="space-y-6 pt-2">
          {stageTitles.map((stage) => (
            <div key={stage} className="space-y-2">
              <h2 className="font-semibold">{stage}</h2>
              {table(data.positions.filter((p) => p.stageTitle === stage))}
            </div>
          ))}
        </TabsContent>
        <TabsContent value="shopping" className="pt-2">
          {table(shoppingList)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
