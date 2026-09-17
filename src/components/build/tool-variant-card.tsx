'use client';

import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ToolVariant } from '@/components/build/build-types';
import { cn, formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.tools;

const REC_VARIANT: Record<ToolVariant['recommendation'], 'default' | 'secondary' | 'outline'> = {
  buy: 'default',
  rent: 'secondary',
  borrow_or_buy_cheap: 'outline',
};

// Цена покупки: 0 — это «Бесплатно», а не «0 ₽» и не прочерк (design.md §1).
function buyLine(variant: ToolVariant, currency: string): string | null {
  if (variant.priceMinor === null) return null;
  if (variant.priceMinor === 0) return t.free;
  return t.buyPrice(formatMoneyMinor(variant.priceMinor, currency));
}

// Аренда — итогом за весь срок потребности: её и сравнивают с покупкой.
function rentLine(variant: ToolVariant, days: number, currency: string): string | null {
  if (variant.rentDayMinor === null) return null;
  return t.rentPrice(
    formatMoneyMinor(variant.rentDayMinor, currency),
    days,
    formatMoneyMinor(variant.rentDayMinor * days, currency)
  );
}

// Вариант инструмента под потребность: радио-карточка с ценой, скоростью и
// объяснением (спека 004). Подсвечена — выбор человека или совет новичку.
export function ToolVariantCard({
  variant,
  days,
  currency,
  active,
  isChoice,
  disabled,
  onSelect,
}: {
  variant: ToolVariant;
  days: number;
  currency: string;
  active: boolean;
  isChoice: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const buy = buyLine(variant, currency);
  const rent = rentLine(variant, days, currency);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'flex flex-col gap-2 rounded-xl bg-card p-4 text-left text-sm ring-1 ring-foreground/10',
        'transition hover:ring-foreground/25 disabled:opacity-60',
        active && 'ring-2 ring-primary hover:ring-primary'
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span
            className={cn(
              'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
              active ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
            )}
          >
            {active && <Check className="size-3" />}
          </span>
          <span className="font-medium">{variant.name}</span>
        </div>
        <Badge variant={REC_VARIANT[variant.recommendation]} className="shrink-0">
          {t.recommendation[variant.recommendation]}
        </Badge>
      </div>

      <div className="space-y-0.5 pl-6">
        {buy && <p className="font-medium">{buy}</p>}
        {rent && <p className={cn('font-medium', buy && 'text-muted-foreground')}>{rent}</p>}
        {variant.speedNote && <p className="text-muted-foreground">{variant.speedNote}</p>}
      </div>

      <p className="pl-6 text-muted-foreground">{variant.description}</p>

      <div className="mt-auto flex flex-wrap items-center gap-2 pl-6 pt-1">
        {variant.isBeginnerChoice && <Badge variant="outline">{t.beginnerBadge}</Badge>}
        {active && (
          <span className="text-xs font-medium text-primary">
            {isChoice ? t.chosen : t.advised}
          </span>
        )}
      </div>
    </button>
  );
}
