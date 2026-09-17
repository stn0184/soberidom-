'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ToolNeed } from '@/components/build/build-types';
import { ToolVariantCard } from '@/components/build/tool-variant-card';
import { effectiveVariant } from '@/lib/tools/effective';
import { ru } from '@/lib/i18n/ru';

const t = ru.tools;
const MAX_CHIPS = 4;

// Потребность на всех этапах проекта — один чип «На всей стройке»: пятнадцать
// одинаковых чипов ничего не сообщают. От пяти этапов — четыре и «ещё N».
function StageChips({ stages, stageCount }: { stages: string[]; stageCount: number }) {
  if (stageCount > 0 && stages.length >= stageCount) {
    return <Badge variant="secondary">{t.allStages}</Badge>;
  }
  const shown = stages.slice(0, MAX_CHIPS);
  const rest = stages.length - shown.length;
  return (
    <>
      {shown.map((stage) => (
        <Badge key={stage} variant="secondary">
          {stage}
        </Badge>
      ))}
      {rest > 0 && <Badge variant="outline">{t.moreStages(rest)}</Badge>}
    </>
  );
}

// Потребность («Пилить доски») с вариантами инструмента (спека 004).
export function ToolNeedCard({
  tool,
  currency,
  stageCount,
  busy,
  onChoose,
}: {
  tool: ToolNeed;
  currency: string;
  stageCount: number;
  busy: boolean;
  onChoose: (variantId: string) => void;
}) {
  const active = effectiveVariant(tool);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{tool.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{tool.reason}</p>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <StageChips stages={tool.stages} stageCount={stageCount} />
          <span className="text-xs text-muted-foreground">{t.daysNeeded(tool.daysNeeded)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tool.variants.map((variant) => (
            <ToolVariantCard
              key={variant.id}
              variant={variant}
              days={tool.daysNeeded}
              currency={currency}
              active={variant.id === active?.id}
              isChoice={variant.id === tool.chosenVariantId}
              disabled={busy}
              onSelect={() => onChoose(variant.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
