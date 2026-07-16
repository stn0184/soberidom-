'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { apiFetch } from '@/lib/admin/fetcher';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.project;

type Recommendation = {
  foundation: 'piles' | 'mzlf' | 'columnar';
  label: string;
  freezingDepthM: number;
  reasonPoints: string[];
  estimateDeltaMinor: number;
  disclaimer: string;
};

function QuestionBlock<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Record<string, string>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as T)} className="gap-1.5">
        {Object.entries(options).map(([key, text]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <RadioGroupItem value={key} />
            {text}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

// Мини-гид «Какой фундамент нужен именно вам» (US-004, SPEC 4.4 п.5).
export function FoundationGuide({
  projectId,
  regionId,
  currency,
  onApply,
}: {
  projectId: string;
  regionId: string | null;
  currency: string;
  onApply: (foundation: string) => void;
}) {
  const [soil, setSoil] = useState<string>('unknown');
  const [water, setWater] = useState<string>('unknown');
  const [relief, setRelief] = useState<string>('flat');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [rec, setRec] = useState<Recommendation | null>(null);

  async function recommend() {
    if (!regionId) return;
    setBusy(true);
    setError(false);
    try {
      const body = await apiFetch<{ data: Recommendation }>('/api/foundation/recommend', {
        method: 'POST',
        body: JSON.stringify({ projectId, regionId, soil, highWater: water, relief }),
      });
      setRec(body.data);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const delta = rec
    ? rec.estimateDeltaMinor === 0
      ? t.deltaZero
      : rec.estimateDeltaMinor > 0
        ? t.deltaMore(formatMoneyMinor(rec.estimateDeltaMinor, currency))
        : t.deltaLess(formatMoneyMinor(Math.abs(rec.estimateDeltaMinor), currency))
    : '';

  return (
    <section id="foundation" className="space-y-4">
      <h2 className="text-2xl font-semibold">{t.foundationTitle}</h2>
      <p className="text-muted-foreground">{t.foundationIntro}</p>

      <div className="grid gap-6 sm:grid-cols-3">
        <QuestionBlock label={t.soilQ} options={t.soil} value={soil} onChange={setSoil} />
        <QuestionBlock label={t.waterQ} options={t.water} value={water} onChange={setWater} />
        <QuestionBlock label={t.reliefQ} options={t.relief} value={relief} onChange={setRelief} />
      </div>

      <Button onClick={() => void recommend()} disabled={busy || !regionId}>
        {busy && <Loader2 className="animate-spin" />}
        {busy ? t.recommending : t.recommendBtn}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{t.recError}</span>
            <Button variant="outline" size="sm" onClick={() => void recommend()}>
              {ru.common.retry}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {rec && (
        <Card>
          <CardHeader>
            <CardTitle>{t.recTitle(rec.label)}</CardTitle>
            <CardDescription>
              {t.freezing(rec.freezingDepthM)} · {delta}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {rec.reasonPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <Button variant="outline" onClick={() => onApply(rec.foundation)}>
              {t.applyToEstimate}
            </Button>
            <p className="text-xs text-muted-foreground">{rec.disclaimer}</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
