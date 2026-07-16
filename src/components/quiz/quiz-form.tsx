'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { RegionCombobox, type RegionOption } from '@/components/quiz/region-combobox';
import { TileGroup } from '@/components/quiz/tile-group';
import { apiFetch } from '@/lib/admin/fetcher';
import { COUNTRY_CURRENCY, type CountryCode } from '@/lib/constants';
import { ru } from '@/lib/i18n/ru';

const t = ru.quiz;
const STORAGE_KEY = 'sd_quiz_v1'; // ответы переживают перезагрузку (US-001)
const TOTAL_STEPS = 5;

export type QuizAnswers = {
  buildingType: string | null;
  style: string;
  floors: number; // 0 = не важно
  rooms: number | null;
  areaM2: number;
  region: RegionOption | null;
  heating: string;
  budgetMinor: number | null;
  budgetUnknown: boolean;
};

const DEFAULTS: QuizAnswers = {
  buildingType: null,
  style: 'any',
  floors: 0,
  rooms: null,
  areaM2: 50,
  region: null,
  heating: 'undecided',
  budgetMinor: 100_000_000,
  budgetUnknown: false,
};

export function loadAnswers(): QuizAnswers {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as QuizAnswers) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function QuizForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<QuizAnswers>(DEFAULTS);
  const [busy, setBusy] = useState(false);

  // Восстановление из sessionStorage после гидратации (без SSR-рассинхрона).
  useEffect(() => {
    const stored = loadAnswers();
    queueMicrotask(() => setAnswers(stored));
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  function set<K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  const canNext =
    step === 1 ? answers.buildingType !== null : step === 3 ? answers.region !== null : true;

  async function submit() {
    if (!answers.region || !answers.buildingType) return;
    setBusy(true);
    try {
      const result = await apiFetch<unknown>('/api/quiz/match', {
        method: 'POST',
        body: JSON.stringify({
          buildingType: answers.buildingType,
          style: answers.style,
          floors: answers.floors,
          rooms: answers.rooms ?? undefined,
          areaM2: answers.areaM2,
          regionId: answers.region.id,
          heating: answers.heating,
          budgetMinor: answers.budgetUnknown ? null : answers.budgetMinor,
        }),
      });
      sessionStorage.setItem('sd_quiz_result', JSON.stringify(result));
      router.push('/quiz/results');
    } catch {
      toast.error(t.error);
      setBusy(false);
    }
  }

  function next() {
    if (!canNext) return;
    if (step < TOTAL_STEPS) setStep(step + 1);
    else void submit();
  }

  const currencyLabel = answers.region
    ? (COUNTRY_CURRENCY[answers.region.countryCode as CountryCode] ?? 'RUB')
    : 'RUB';

  return (
    <div
      className="space-y-6"
      onKeyDown={(e) => e.key === 'Enter' && next()} // Enter = далее (SPEC 4.2)
    >
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{t.stepOf(step, TOTAL_STEPS)}</p>
        <Progress value={(step / TOTAL_STEPS) * 100} />
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <h1 className="text-2xl font-semibold">{t.step1Title}</h1>
          <TileGroup
            options={Object.entries(ru.dict.buildingTypes).map(([key, label]) => ({ key, label }))}
            value={answers.buildingType}
            onChange={(v) => set('buildingType', v)}
          />
          <Label>{t.step1Format}</Label>
          <TileGroup
            options={[
              ...Object.entries(ru.dict.styles).map(([key, label]) => ({
                key,
                label,
                hint: t.styleHints[key as keyof typeof t.styleHints],
              })),
              { key: 'any', label: t.anyStyle },
            ]}
            value={answers.style}
            onChange={(v) => set('style', v)}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <h1 className="text-2xl font-semibold">{t.step2Title}</h1>
          <Label>{t.floorsLabel}</Label>
          <TileGroup
            options={[
              { key: '1', label: t.floors1 },
              { key: '2', label: t.floors2 },
              { key: '0', label: t.floorsAny },
            ]}
            value={String(answers.floors)}
            onChange={(v) => set('floors', Number(v))}
          />
          <Label>{t.roomsLabel}</Label>
          <TileGroup
            options={[1, 2, 3, 4, 5].map((n) => ({ key: String(n), label: ru.dict.rooms(n) }))}
            value={answers.rooms === null ? null : String(answers.rooms)}
            onChange={(v) => set('rooms', Number(v))}
          />
          <Label>
            {t.areaLabel}: {answers.areaM2} м²
          </Label>
          <Slider
            min={15}
            max={150}
            step={5}
            value={[answers.areaM2]}
            onValueChange={([v]) => set('areaM2', v)}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <h1 className="text-2xl font-semibold">{t.step3Title}</h1>
          <Label>{t.cityLabel}</Label>
          <RegionCombobox value={answers.region} onChange={(r) => set('region', r)} />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <h1 className="text-2xl font-semibold">{t.step4Title}</h1>
          <TileGroup
            options={Object.entries(ru.dict.heating).map(([key, label]) => ({ key, label }))}
            value={answers.heating}
            onChange={(v) => set('heating', v)}
          />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-5">
          <h1 className="text-2xl font-semibold">{t.step5Title}</h1>
          {!answers.budgetUnknown && (
            <>
              <p className="text-xl font-medium">
                {((answers.budgetMinor ?? 0) / 100).toLocaleString('ru-RU')} {currencyLabel}
              </p>
              <Slider
                min={30_000_000}
                max={300_000_000}
                step={5_000_000}
                value={[answers.budgetMinor ?? 100_000_000]}
                onValueChange={([v]) => set('budgetMinor', v)}
              />
            </>
          )}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={answers.budgetUnknown}
              onCheckedChange={(c) => set('budgetUnknown', c === true)}
            />
            {t.budgetUnknown}
          </label>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" disabled={step === 1 || busy} onClick={() => setStep(step - 1)}>
          {t.back}
        </Button>
        <Button onClick={next} disabled={!canNext || busy}>
          {busy && <Loader2 className="animate-spin" />}
          {busy ? t.submitting : step === TOTAL_STEPS ? t.submit : t.next}
        </Button>
      </div>
    </div>
  );
}
