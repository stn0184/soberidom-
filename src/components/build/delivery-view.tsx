'use client';

import { useEffect, useState } from 'react';
import { ChevronsUpDown, Truck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import type { Wave } from '@/lib/delivery/waves';
import { apiFetch } from '@/lib/admin/fetcher';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.delivery;

type Response = {
  data: { waves: Wave[] };
  meta: { savedDeliveries: number; savingsMinor: number; currency: string; wavesCount: number };
};
type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; value: Response };

// Волны доставки (US-011): объём/вес, транспорт, советы, оценка экономии.
export function DeliveryView({ purchaseId }: { purchaseId: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Response>(`/api/my/${purchaseId}/delivery`)
      .then((value) => !cancelled && setState({ kind: 'ready', value }))
      .catch(() => !cancelled && setState({ kind: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [purchaseId, tick]);

  if (state.kind === 'loading') {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
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
  if (data.waves.length === 0) {
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

      {data.waves.map((wave) => (
        <Card key={wave.wave}>
          <CardHeader>
            <CardTitle>{t.waveTitle(wave.wave, wave.title)}</CardTitle>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{t.volume(wave.volumeM3.toLocaleString('ru-RU'))}</Badge>
              <Badge variant="secondary">{t.weight(wave.weightKg.toLocaleString('ru-RU'))}</Badge>
              <Badge>{wave.transport.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{wave.transport.why}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="px-0">
                  <ChevronsUpDown />
                  {t.materialsToggle}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="space-y-0.5 pt-1 text-sm">
                  {wave.materials.map((m) => (
                    <li key={m.name} className="flex justify-between gap-3">
                      <span>{m.name}</span>
                      <span className="text-muted-foreground">
                        {m.qty}{' '}
                        {ru.admin.materials.units[m.unit as keyof typeof ru.admin.materials.units] ?? m.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
            <div className="space-y-1">
              <p className="text-sm font-medium">{t.tipsTitle}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {wave.tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <Truck className="mt-0.5 size-4 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}

      {meta.savedDeliveries > 0 && (
        <Alert>
          <Truck />
          <AlertDescription>
            {t.savings(meta.wavesCount, formatMoneyMinor(meta.savingsMinor, meta.currency))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
