'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { ConfigOptions } from '@/components/estimate/project-configurator';
import { RegionCombobox, type RegionOption } from '@/components/quiz/region-combobox';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { PayInstructions } from '@/lib/payments/provider';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';
import { PayCard } from './pay-card';

const t = ru.buy;

type ProjectInfo = {
  id: string;
  slug: string;
  title: string;
  priceMinor: number;
  currency: string;
};
type InitialPurchase = { code: string; status: string; amountMinor: number; currency: string };
type PurchaseResponse = {
  data: {
    purchaseId: string;
    code: string;
    status: 'pending' | 'active';
    amountMinor: number;
    currency: string;
    payInstructions?: PayInstructions;
  };
};

// Оформление покупки (US-006): сводка конфигурации, промокод,
// обязательный чекбокс дисклеймера, после POST — инструкция оплаты.
export function BuyForm({
  project,
  configOptions,
  initialPurchase,
}: {
  project: ProjectInfo;
  configOptions: ConfigOptions;
  initialPurchase: InitialPurchase | null;
}) {
  const [phase, setPhase] = useState<'form' | 'pending' | 'active' | 'blocked'>(
    initialPurchase
      ? initialPurchase.status === 'pending'
        ? 'pending'
        : initialPurchase.status === 'active'
          ? 'active'
          : 'blocked'
      : 'form'
  );
  const [code, setCode] = useState(initialPurchase?.code ?? '');
  const [amount, setAmount] = useState(initialPurchase?.amountMinor ?? project.priceMinor);
  const [payUrl, setPayUrl] = useState(process.env.NEXT_PUBLIC_DONATE_URL ?? '');
  const [config, setConfig] = useState<Record<string, string> | null>(null);
  const [region, setRegion] = useState<RegionOption | null>(null);
  const [promo, setPromo] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Конфигурация и город — из sessionStorage витрины; иначе дефолты.
  useEffect(() => {
    queueMicrotask(() => {
      const defaults: Record<string, string> = {};
      for (const [group, options] of Object.entries(configOptions)) {
        const def = options.find((o) => o.isDefault) ?? options[0];
        if (def) defaults[group] = def.key;
      }
      try {
        const rawConfig = sessionStorage.getItem(`sd_config_${project.id}`);
        setConfig(rawConfig ? { ...defaults, ...JSON.parse(rawConfig) } : defaults);
        const rawRegion = sessionStorage.getItem('sd_region_v1');
        if (rawRegion) setRegion(JSON.parse(rawRegion) as RegionOption);
      } catch {
        setConfig(defaults);
      }
    });
  }, [configOptions, project.id]);

  async function submit() {
    if (!region || !config) return;
    setBusy(true);
    setError(null);
    try {
      const body = await apiFetch<PurchaseResponse>('/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          projectId: project.id,
          config,
          regionId: region.id,
          promoCode: promo.trim() ? promo.trim().toUpperCase() : undefined,
          disclaimerAccepted: true,
        }),
      });
      setCode(body.data.code);
      setAmount(body.data.amountMinor);
      if (body.data.payInstructions?.url) setPayUrl(body.data.payInstructions.url);
      setPhase(body.data.status === 'active' ? 'active' : 'pending');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setBusy(false);
    }
  }

  if (phase === 'active') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.activeTitle}</CardTitle>
          <CardDescription>{t.activeText}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline">
            <Link href={`/projects/${project.slug}`}>{t.backToProject}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (phase === 'blocked') {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t.rejectedTitle}</AlertTitle>
        <AlertDescription>{t.rejectedText}</AlertDescription>
      </Alert>
    );
  }

  if (phase === 'pending') {
    return (
      <PayCard code={code} amountMinor={amount} currency={project.currency} url={payUrl} />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
        <CardDescription>
          {formatMoneyMinor(project.priceMinor, project.currency)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>{t.configTitle}</Label>
          {config === null ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {Object.entries(config)
                .filter(([group]) => configOptions[group])
                .map(([group, key]) => (
                  <li key={group} className="flex justify-between gap-3">
                    <span>{ru.project.groups[group as keyof typeof ru.project.groups] ?? group}</span>
                    <span className="text-foreground">
                      {configOptions[group]?.find((o) => o.key === key)?.label ?? key}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{t.regionLabel}</Label>
          <RegionCombobox value={region} onChange={setRegion} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="promo">{t.promoLabel}</Label>
          <Input id="promo" value={promo} onChange={(e) => setPromo(e.target.value)} />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={consent} onCheckedChange={(c) => setConsent(c === true)} />
          {t.disclaimer}
        </label>
      </CardContent>
      <CardFooter>
        <Button
          size="lg"
          className="w-full"
          disabled={!consent || !region || busy || config === null}
          onClick={() => void submit()}
        >
          {busy && <Loader2 className="animate-spin" />}
          {busy ? ru.common.pleaseWait : t.submit}
        </Button>
      </CardFooter>
    </Card>
  );
}
