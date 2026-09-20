'use client';

import { useState } from 'react';
import { CalendarCheck, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { MaterialPriceRow } from '@/lib/admin/types';
import { isStale, todayIso } from '@/lib/estimate/prices';
import { formatDateRu } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.materials;

// Одно предложение цены в админке (спека 005): цена правится на месте,
// «Проверено сегодня» обновляет дату без перезагрузки страницы.
export function PriceOfferRow({
  row,
  regionName,
  onChanged,
}: {
  row: MaterialPriceRow;
  regionName: string;
  onChanged: () => void;
}) {
  const [priceText, setPriceText] = useState(String(row.price_minor));
  const [busy, setBusy] = useState(false);
  const stale = isStale(row.checked_at, todayIso());

  async function send(init: RequestInit, message: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/prices/${row.id}`, init);
      toast.success(message);
      onChanged();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setBusy(false);
    }
  }

  async function savePrice() {
    const minor = Number(priceText);
    if (!Number.isInteger(minor) || minor < 0 || minor === row.price_minor) return;
    await send(
      { method: 'PATCH', body: JSON.stringify({ price_minor: minor }) },
      ru.admin.common.saved
    );
  }

  return (
    <div className="space-y-1 rounded-md border p-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-10 shrink-0 font-mono">{row.country_code.trim()}</span>
        <span className="flex-1 truncate">{regionName}</span>
        <Input
          className="w-32"
          type="number"
          disabled={busy}
          value={priceText}
          onChange={(e) => setPriceText(e.target.value)}
          onBlur={() => void savePrice()}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        <span className="w-10 text-muted-foreground">{row.currency}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={busy}
          title={t.priceCheckedToday}
          onClick={() =>
            void send(
              { method: 'PATCH', body: JSON.stringify({ checked_at: todayIso() }) },
              ru.admin.common.saved
            )
          }
        >
          <CalendarCheck />
          <span className="sr-only">{t.priceCheckedToday}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={busy}
          onClick={() => void send({ method: 'DELETE' }, ru.admin.common.deleted)}
        >
          <Trash2 />
          <span className="sr-only">{ru.admin.common.del}</span>
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>{t.priceSourceKinds[row.source_kind]}</span>
        <span className="truncate">{row.source_label}</span>
        {row.source_url && (
          <a
            href={row.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
            aria-label={t.priceSourceUrl}
          >
            <ExternalLink className="size-3.5" />
          </a>
        )}
        <span className={stale ? 'text-amber-600' : undefined}>
          {t.priceCheckedAt}: {formatDateRu(row.checked_at)}
        </span>
        {stale && <Badge variant="secondary">{t.priceStale}</Badge>}
      </div>
    </div>
  );
}
