'use client';

import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { ConfigOptions } from '@/components/estimate/project-configurator';
import { ru } from '@/lib/i18n/ru';

// Сводка выбранной конфигурации на экране покупки (SPEC 4.5): группа → выбранная опция.
// null — конфигурация ещё читается из sessionStorage витрины, показываем скелет.
export function ConfigSummary({
  config,
  configOptions,
}: {
  config: Record<string, string> | null;
  configOptions: ConfigOptions;
}) {
  return (
    <div className="space-y-2">
      <Label>{ru.buy.configTitle}</Label>
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
  );
}
