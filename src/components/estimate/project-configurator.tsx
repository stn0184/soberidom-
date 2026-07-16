'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { EstimatePanel } from '@/components/estimate/estimate-panel';
import { FoundationGuide } from '@/components/estimate/foundation-guide';
import { OptionCards, type ConfigOptionCard } from '@/components/estimate/option-cards';
import { RegionCombobox, type RegionOption } from '@/components/quiz/region-combobox';
import type { EstimateConfig } from '@/lib/estimate/calc';
import { COUNTRY_CURRENCY, type CountryCode } from '@/lib/constants';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.project;

export type ConfigOptions = Record<string, ConfigOptionCard[]>;

// Конфигуратор с человеческими карточками (UX_PRINCIPLES п.2–4) + sticky-смета.
// children — блок между комплектацией и фундамент-гидом (FAQ): воронка эмоций,
// тест грунта уходит в самый низ страницы.
export function ProjectConfigurator({
  projectId,
  slug,
  priceMinor,
  currency,
  isFree,
  configOptions,
  children,
}: {
  projectId: string;
  slug: string;
  priceMinor: number;
  currency: string;
  isFree: boolean;
  configOptions: ConfigOptions;
  children?: React.ReactNode;
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

  // Выбор пользователя переживает переход на /buy (sessionStorage).
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = sessionStorage.getItem('sd_region_v1');
        if (raw) setRegion(JSON.parse(raw) as RegionOption);
      } catch {
        // повреждённое значение игнорируем
      }
    });
  }, []);
  useEffect(() => {
    sessionStorage.setItem(`sd_config_${projectId}`, JSON.stringify(config));
  }, [config, projectId]);
  useEffect(() => {
    if (region) sessionStorage.setItem('sd_region_v1', JSON.stringify(region));
  }, [region]);

  const estimateCurrency = region
    ? (COUNTRY_CURRENCY[region.countryCode as CountryCode] ?? currency)
    : currency;

  return (
    <>
      <section id="config" className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{t.configTitle}</h2>
            <p className="text-muted-foreground">{t.configIntro}</p>
          </div>
          <div className="max-w-sm space-y-1.5">
            <Label>{t.regionLabel}</Label>
            <RegionCombobox value={region} onChange={setRegion} />
          </div>
          {Object.entries(configOptions).map(([group, options]) => (
            <div key={group} className="space-y-2">
              <Label className="text-base">
                {t.groups[group as keyof typeof t.groups] ?? group}
              </Label>
              <OptionCards
                options={options}
                value={config[group]}
                onChange={(key) => setConfig((prev) => ({ ...prev, [group]: key }))}
              />
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

      {children}

      <FoundationGuide
        projectId={projectId}
        regionId={region?.id ?? null}
        currency={estimateCurrency}
        onApply={(foundation) => setConfig((prev) => ({ ...prev, foundation }))}
      />
    </>
  );
}
