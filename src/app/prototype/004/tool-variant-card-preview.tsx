// Прототип 004: карточка варианта инструмента (будущий tool-variant-card.tsx).
// Радио-карточка неподвижна: выбор нарисован, клик ничего не делает.
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatMoneyMinor } from '@/lib/utils';
import { CURRENCY, proto, type ProtoVariant, type Recommendation } from './mock';
import { ru } from '@/lib/i18n/ru';

const REC_VARIANT: Record<Recommendation, 'default' | 'secondary' | 'outline'> = {
  buy: 'default',
  rent: 'secondary',
  borrow_or_buy_cheap: 'outline',
};

// Цена покупки: 0 ₽ — это «бесплатно», а не пустая цена (design.md §1).
function buyLine(variant: ProtoVariant): string | null {
  if (variant.priceMinor === null) return null;
  if (variant.priceMinor === 0) return proto.free;
  return proto.buyPrice(formatMoneyMinor(variant.priceMinor, CURRENCY));
}

function rentLine(variant: ProtoVariant, days: number): string | null {
  if (variant.rentDayMinor === null) return null;
  return proto.rentPrice(
    formatMoneyMinor(variant.rentDayMinor, CURRENCY),
    days,
    formatMoneyMinor(variant.rentDayMinor * days, CURRENCY)
  );
}

export function VariantCard({
  variant,
  days,
  active,
  isChoice,
}: {
  variant: ProtoVariant;
  days: number;
  active: boolean; // подсвечена: выбор человека или совет новичку
  isChoice: boolean; // подсветка именно из-за выбора человека
}) {
  const buy = buyLine(variant);
  const rent = rentLine(variant, days);

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10',
        active && 'ring-2 ring-primary'
      )}
    >
      <div className="flex items-start justify-between gap-2">
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
          {ru.tools.recommendation[variant.recommendation]}
        </Badge>
      </div>

      <div className="space-y-0.5 pl-6">
        {buy && <p className="font-medium">{buy}</p>}
        {rent && <p className={cn('font-medium', buy && 'text-muted-foreground')}>{rent}</p>}
        {variant.speedNote && <p className="text-muted-foreground">{variant.speedNote}</p>}
      </div>

      <p className="pl-6 text-muted-foreground">{variant.description}</p>

      <div className="mt-auto flex flex-wrap items-center gap-2 pl-6 pt-1">
        {variant.isBeginnerChoice && <Badge variant="outline">{proto.beginnerBadge}</Badge>}
        {active && (
          <span className="text-xs font-medium text-primary">
            {isChoice ? proto.chosen : proto.advised}
          </span>
        )}
      </div>
    </div>
  );
}
