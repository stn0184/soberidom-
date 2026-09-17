// Прототип 004: экран начала этапа — блок «И это понадобится» одной
// строкой на потребность. Меняется только он; таблица «Перед этапом
// купите» одобрена прототипом 003 и здесь показана заглушкой.
import Link from 'next/link';
import { Clock, ShoppingCart, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';
import {
  CURRENCY,
  STAGE_NAMES,
  STAGE_CODE,
  STAGE_TOOLS,
  effectiveVariant,
  proto,
  type ProtoTool,
} from './mock';

const t = ru.build.stageStart;

function priceText(tool: ProtoTool): string {
  const variant = effectiveVariant(tool);
  if (variant.recommendation === 'rent' && variant.rentDayMinor !== null) {
    return proto.rentPrice(
      formatMoneyMinor(variant.rentDayMinor, CURRENCY),
      tool.daysNeeded,
      formatMoneyMinor(variant.rentDayMinor * tool.daysNeeded, CURRENCY)
    );
  }
  if (variant.priceMinor === 0) return proto.free;
  if (variant.priceMinor === null) return '';
  return proto.buyPrice(formatMoneyMinor(variant.priceMinor, CURRENCY));
}

function ToolRow({ tool }: { tool: ProtoTool }) {
  const variant = effectiveVariant(tool);
  const isChoice = variant.id === tool.chosenVariantId;

  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2.5 text-sm">
      <span className="font-medium">{tool.name}</span>
      <span className="text-muted-foreground">·</span>
      <span>{variant.name}</span>
      <Badge variant={variant.recommendation === 'buy' ? 'default' : 'secondary'}>
        {ru.tools.recommendation[variant.recommendation]}
      </Badge>
      <span className="text-muted-foreground">{priceText(tool)}</span>
      <span className="text-xs text-muted-foreground">
        {isChoice ? proto.yourChoiceShort : proto.advisedShort}
      </span>
      {/* Выбирать не из чего — ссылку не показываем. */}
      {tool.variants.length > 1 && (
        <Link href="#" className="ml-auto shrink-0 text-xs text-primary hover:underline">
          {proto.chooseOther}
        </Link>
      )}
    </li>
  );
}

export function StageToolsPreview() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2.5 shrink-0 rounded-full bg-yellow-400" />
          <span>Этап 3 · {STAGE_NAMES[STAGE_CODE]}</span>
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            {t.duration(8)}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold">{STAGE_NAMES[STAGE_CODE]}</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Собираем стены на полу и поднимаем их — самый заметный день стройки: к вечеру
          у дома появляются стены.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <span className="text-primary">
            <ShoppingCart className="size-5" />
          </span>
          {t.suppliesTitle}
        </h2>
        <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
          Таблица материалов не меняется — она одобрена прототипом 003.
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <span className="text-primary">
              <Wrench className="size-5" />
            </span>
            {proto.stageToolsTitle}
          </h2>
          <Link href="#" className="shrink-0 text-sm text-primary hover:underline">
            {proto.stageToolsAll}
          </Link>
        </div>
        <ul className="divide-y">
          {STAGE_TOOLS.map((tool) => (
            <ToolRow key={tool.id} tool={tool} />
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t pt-6">
        <Button size="xl">{t.startStage}</Button>
        <Link href="#" className="text-sm text-primary hover:underline">
          {t.estimateAll}
        </Link>
      </div>
    </div>
  );
}
