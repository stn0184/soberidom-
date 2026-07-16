'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { BuildStep } from '@/components/build/build-types';
import { ru } from '@/lib/i18n/ru';

const t = ru.build;

const COLOR_DOT: Record<string, string> = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
};

// Блок «Возьмите» (US-007): детали с цветной маркировкой, крепёж, инструменты.
export function StepTake({ step }: { step: BuildStep }) {
  const { parts, materials } = step.take;
  if (parts.length === 0 && materials.length === 0 && step.tools.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.take}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {parts.length > 0 && (
          <ul className="space-y-1">
            {parts.map((part) => (
              <li key={part.partCode} className="flex items-center gap-2">
                <span className={cn('size-3 rounded-full', COLOR_DOT[part.color])} />
                <span className="font-mono font-medium">{part.partCode}</span>
                <span className="flex-1">
                  {part.name}, {t.cut(part.cutLengthMm)}
                </span>
                <span className="text-muted-foreground">{t.qty(part.qty)}</span>
              </li>
            ))}
          </ul>
        )}
        {materials.length > 0 && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t.takeMaterials}</p>
            <ul className="space-y-0.5">
              {materials.map((m) => (
                <li key={m.name} className="flex justify-between gap-2">
                  <span>{m.name}</span>
                  <span className="text-muted-foreground">
                    {m.qty} {m.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {step.tools.length > 0 && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t.takeTools}</p>
            <div className="flex flex-wrap gap-1.5">
              {step.tools.map((tool) => (
                <Badge key={tool} variant="secondary">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
