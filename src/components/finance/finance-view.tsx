'use client';

import { useEffect, useState } from 'react';
import { ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExpenseDialog, type ExpenseOption, type StageOption } from '@/components/finance/expense-dialog';
import { FinanceChart, type StageMoneyRow } from '@/components/finance/finance-chart';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { cn, formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.finance;

type ExpenseRow = {
  id: string;
  title: string;
  stageTitle: string;
  qty: number;
  amountMinor: number;
  spentOn: string;
  note: string;
};
type Response = {
  data: ExpenseRow[];
  meta: {
    planMinor: number;
    factMinor: number;
    currency: string;
    byStage: StageMoneyRow[];
    stages: StageOption[];
    materials: ExpenseOption[];
  };
};
type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; value: Response };

// Фин-отчёт план/факт (US-010): стат-карты, график по этапам, таблица трат.
export function FinanceView({ purchaseId }: { purchaseId: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [tick, setTick] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const reload = () => setTick((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Response>(`/api/my/${purchaseId}/expenses`)
      .then((value) => !cancelled && setState({ kind: 'ready', value }))
      .catch(() => !cancelled && setState({ kind: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [purchaseId, tick]);

  async function remove(id: string) {
    try {
      await apiFetch(`/api/my/${purchaseId}/expenses/${id}`, { method: 'DELETE' });
      toast.success(ru.admin.common.deleted);
      reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    }
  }

  if (state.kind === 'loading') {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-72 w-full" />
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
  const diff = meta.planMinor - meta.factMinor;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.intro}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus />
          {t.addExpense}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: t.plan, value: meta.planMinor, cls: '' },
          { label: t.fact, value: meta.factMinor, cls: '' },
          { label: t.diff, value: diff, cls: diff >= 0 ? 'text-green-600' : 'text-red-600' },
        ].map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn('text-2xl font-bold', card.cls)}>
                {card.label === t.diff && diff > 0 ? '+' : ''}
                {formatMoneyMinor(card.value, meta.currency)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {meta.byStage.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold">{t.chartTitle}</h2>
          <FinanceChart rows={meta.byStage} currency={meta.currency} />
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="px-0 text-muted-foreground">
                <ChevronsUpDown />
                {ru.liveEstimate.tabStages}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-1 pt-1 text-sm">
                {meta.byStage.map((row) => (
                  <li key={row.stageCode} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">{row.title}</span>
                    <span>
                      {formatMoneyMinor(row.planMinor, meta.currency)} /{' '}
                      {formatMoneyMinor(row.factMinor, meta.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">{t.emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{t.emptyText}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.thDate}</TableHead>
              <TableHead>{t.thItem}</TableHead>
              <TableHead>{t.thStage}</TableHead>
              <TableHead>{t.thQty}</TableHead>
              <TableHead>{t.thAmount}</TableHead>
              <TableHead>{t.thNote}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{new Date(row.spentOn).toLocaleDateString('ru-RU')}</TableCell>
                <TableCell className="font-medium">{row.title}</TableCell>
                <TableCell>{row.stageTitle || t.otherStage}</TableCell>
                <TableCell>{row.qty}</TableCell>
                <TableCell>{formatMoneyMinor(row.amountMinor, meta.currency)}</TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {row.note}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm" onClick={() => void remove(row.id)}>
                    <Trash2 />
                    <span className="sr-only">{ru.admin.common.del}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ExpenseDialog
        purchaseId={purchaseId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        materials={meta.materials}
        stages={meta.stages}
        onSaved={reload}
      />
    </div>
  );
}
