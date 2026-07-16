'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { EstimatePanel } from '@/components/estimate/estimate-panel';
import { FoundationGuide } from '@/components/estimate/foundation-guide';
import { RegionCombobox, type RegionOption } from '@/components/quiz/region-combobox';
import type { EstimateConfig } from '@/lib/estimate/calc';
import { COUNTRY_CURRENCY, type CountryCode } from '@/lib/constants';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.project;

export type ConfigOptions = Record<
  string,
  Array<{ key: string; label: string; isDefault: boolean }>
>;

// Конфигуратор + sticky-смета + фундамент-гид (SPEC 4.4 п.4–5, US-003/US-004).
export function ProjectConfigurator({
  projectId,
  slug,
  priceMinor,
  currency,
  isFree,
  configOptions,
}: {
  projectId: string;
  slug: string;
  priceMinor: number;
  currency: string;
  isFree: boolean;
  configOptions: ConfigOptions;
}) {
  const defaults = useMemo(() => {
    const cfg: EstimateConfig = {};
    for (const [group, options] of Object.entries(configOptions)) {
      const def = options.find((o) => o.isDefault) ?? options[0];
      if (def) cfg[group] = def.key;
    }
    return cfg;
  }, [configOptions]);

  const [config, setConfig] = useState<EstimateConfig>(defaults);
  const [region, setRegion] = useState<RegionOption | null>(null);

  const estimateCurrency = region
    ? (COUNTRY_CURRENCY[region.countryCode as CountryCode] ?? currency)
    : currency;

  return (
    <>
      <section id="config" className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">{t.configTitle}</h2>
          <div className="max-w-sm space-y-1.5">
            <Label>{t.regionLabel}</Label>
            <RegionCombobox value={region} onChange={setRegion} />
          </div>
          {Object.entries(configOptions).map(([group, options]) => (
            <div key={group} className="space-y-2">
              <Label>{t.groups[group as keyof typeof t.groups] ?? group}</Label>
              <RadioGroup
                value={config[group]}
                onValueChange={(v) => setConfig((prev) => ({ ...prev, [group]: v }))}
                className="flex flex-wrap gap-2"
              >
                {options.map((option) => (
                  <label
                    key={option.key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-data-[state=checked]:border-primary"
                  >
                    <RadioGroupItem value={option.key} />
                    {option.label}
                  </label>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardContent className="space-y-4 pt-2">
              <EstimatePanel projectId={projectId} regionId={region?.id ?? null} config={config} />
              <Button asChild size="lg" className="w-full">
                <Link href={`/projects/${slug}/buy`}>
                  {isFree ? t.freeAccess : t.buy(formatMoneyMinor(priceMinor, currency))}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <FoundationGuide
        projectId={projectId}
        regionId={region?.id ?? null}
        currency={estimateCurrency}
        onApply={(foundation) => setConfig((prev) => ({ ...prev, foundation }))}
      />
    </>
  );
}
