'use client';

import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { OfferView } from '@/lib/estimate/prices';
import { cn, formatDateRu, formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.liveEstimate;

// Подпись под ценой: откуда цена и когда проверена (спека 005).
// Клик по подписи открывает все предложения — покупатель видит, что число
// не выдумано, и может сравнить с ценником на своей базе.
export function PriceSource({
  source,
  offers,
  currency,
  isUserPrice = false,
}: {
  source: OfferView | null;
  offers: OfferView[];
  currency: string;
  isUserPrice?: boolean;
}) {
  // Своя цена главнее предложений (SPEC 5.2 п.3) — подпись про неё,
  // но сами предложения остаются видны по клику.
  const caption = isUserPrice
    ? t.sourceUser
    : source
      ? source.stale
        ? t.sourceStale(formatDateRu(source.checkedAt))
        : t.sourceLine(source.label, formatDateRu(source.checkedAt))
      : t.sourceNone;
  const stale = !isUserPrice && source !== null && source.stale;
  const captionClass = cn('text-xs', stale ? 'text-amber-600' : 'text-muted-foreground');

  if (offers.length === 0) {
    if (!isUserPrice && !source) return null; // цены нет вовсе — бейдж «цена уточняется»
    return <span className={captionClass}>{caption}</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={cn(captionClass, 'text-left hover:underline')}>
            {caption}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 space-y-2">
          <p className="text-sm font-medium">{t.offersTitle}</p>
          <ul className="space-y-1.5">
            {offers.map((offer) => (
              <li key={`${offer.label}-${offer.checkedAt}`} className="text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate">{offer.label}</span>
                  <span className="font-medium">
                    {formatMoneyMinor(offer.priceMinor, currency)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'text-xs',
                      offer.stale ? 'text-amber-600' : 'text-muted-foreground'
                    )}
                  >
                    {offer.stale
                      ? t.sourceStale(formatDateRu(offer.checkedAt))
                      : formatDateRu(offer.checkedAt)}
                  </span>
                  {offer.url && (
                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={t.offerLink}
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                  {/* «В смете» — самое дешёвое подходящее предложение; при своей
                      цене в смету не идёт ни одно, и метки нет. */}
                  {!isUserPrice && offer === offers[0] && (
                    <Badge variant="secondary">{t.offerInEstimate}</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{t.offersHint}</p>
        </PopoverContent>
      </Popover>
      {source?.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
          aria-label={t.offerLink}
        >
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  );
}
