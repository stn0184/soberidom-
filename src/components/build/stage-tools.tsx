'use client';

import Link from 'next/link';
import { Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SuppliesTool } from '@/components/build/build-types';
import { SectionTitle } from '@/components/build/stage-supplies';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.build.stageStart;

// Аренда — итогом за весь срок потребности; ноль — «Бесплатно», а не «0 ₽».
function priceText(tool: SuppliesTool, currency: string): string {
  const { recommendation, priceMinor, rentDayMinor } = tool.variant;
  if (recommendation === 'rent' && rentDayMinor !== null) {
    return t.toolRent(
      formatMoneyMinor(rentDayMinor, currency),
      tool.daysNeeded,
      formatMoneyMinor(rentDayMinor * tool.daysNeeded, currency)
    );
  }
  if (priceMinor === null) return '';
  if (priceMinor === 0) return ru.tools.free;
  return ru.tools.buyPrice(formatMoneyMinor(priceMinor, currency));
}

function ToolRow({
  tool,
  currency,
  toolsHref,
}: {
  tool: SuppliesTool;
  currency: string;
  toolsHref: string;
}) {
  const isRent = tool.variant.recommendation === 'rent' && tool.variant.rentDayMinor !== null;

  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2.5 text-sm">
      <span className="font-medium">{tool.name}</span>
      <span className="text-muted-foreground">·</span>
      <span>{tool.variant.name}</span>
      <Badge variant={tool.variant.recommendation === 'buy' ? 'default' : 'secondary'}>
        {ru.tools.recommendation[tool.variant.recommendation]}
      </Badge>
      <span className="text-muted-foreground">{priceText(tool, currency)}</span>
      {isRent && <span className="text-xs text-muted-foreground">({t.toolRentHint})</span>}
      <span className="text-xs text-muted-foreground">
        {tool.isChosen ? t.toolChosen : t.toolAdvised}
      </span>
      {/* Выбирать не из чего — ссылку не показываем. */}
      {tool.variantCount > 1 && (
        <Link href={toolsHref} className="ml-auto shrink-0 text-xs text-primary hover:underline">
          {t.toolChooseOther}
        </Link>
      )}
    </li>
  );
}

// «И это понадобится» (ВИДЕНИЕ 2.4): строкой показываем только то, что нужно
// купить именно к этому этапу. Инструмент, купленный на прошлых этапах, —
// одной строкой напоминанием, чтобы не пугать списком из пятнадцати позиций.
export function StageTools({
  tools,
  stageId,
  currency,
  toolsHref,
}: {
  tools: SuppliesTool[];
  stageId: string;
  currency: string;
  toolsHref: string;
}) {
  const fresh = tools.filter((tool) => tool.firstStageId === stageId);
  const already = tools.filter((tool) => tool.firstStageId !== stageId);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle icon={<Wrench className="size-5" />}>{t.toolsTitle}</SectionTitle>
        <Link href={toolsHref} className="shrink-0 text-sm text-primary hover:underline">
          {t.toolsAll}
        </Link>
      </div>
      {fresh.length > 0 && (
        <ul className="divide-y">
          {fresh.map((tool) => (
            <ToolRow key={tool.id} tool={tool} currency={currency} toolsHref={toolsHref} />
          ))}
        </ul>
      )}
      {already.length > 0 && (
        <p className="pt-1 text-sm text-muted-foreground">
          {t.toolsAlreadyHave(already.map((tool) => tool.variant.name).join(', '))}
        </p>
      )}
    </section>
  );
}
