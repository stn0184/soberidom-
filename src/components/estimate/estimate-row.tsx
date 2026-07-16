'use client';

import { useState } from 'react';
import { ExternalLink, Info, UserPen } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { EstimatePosition } from '@/lib/estimate/detailed';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.liveEstimate;
const PRICE_LIMIT_MINOR = 100_000_000; // SPEC 5.1: > 1 млн ₽/ед. — «проверьте цену»

// Позиция живой сметы (US-009): inline-цена, «куплено», storage_tip, артикул.
export function EstimateRow({
  position,
  currency,
  purchaseId,
  onChanged,
}: {
  position: EstimatePosition;
  currency: string;
  purchaseId: string;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [priceText, setPriceText] = useState('');
  const [busy, setBusy] = useState(false);

  async function savePrice(minor: number | null) {
    if (minor !== null && (minor < 0 || minor > PRICE_LIMIT_MINOR)) {
      toast.error(t.priceLimit);
      return;
    }
    setBusy(true);
    try {
      await apiFetch('/api/my/prices', {
        method: 'PATCH',
        body: JSON.stringify({ purchaseId, materialId: position.materialId, priceMinor: minor }),
      });
      setEditing(false);
      onChanged();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setBusy(false);
    }
  }

  async function togglePurchased(purchased: boolean) {
    setBusy(true);
    try {
      await apiFetch(`/api/my/${purchaseId}/purchased`, {
        method: 'POST',
        body: JSON.stringify({ materialId: position.materialId, purchased }),
      });
      // Совет по хранению — в момент покупки (HANDOFF, «добрый проводник»).
      if (purchased && position.storageTip) {
        toast.info(t.storagePurchasedToast(position.storageTip));
      }
      onChanged();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <TableRow className={position.purchased ? 'opacity-60' : undefined}>
      <TableCell className="max-w-72">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium">{position.name}</span>
          {position.storageTip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-4 shrink-0 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                {t.storageTipTitle}: {position.storageTip}
              </TooltipContent>
            </Tooltip>
          )}
          {position.sku && position.sku.url && (
            <a href={position.sku.url} target="_blank" rel="noopener noreferrer" title={`${position.sku.retailer} · ${position.sku.sku}`}>
              <ExternalLink className="size-4 text-muted-foreground" />
            </a>
          )}
        </div>
        {position.priceMissing && (
          <Badge variant="secondary" className="mt-0.5">
            {t.priceMissing}
          </Badge>
        )}
      </TableCell>
      <TableCell>{position.qty}</TableCell>
      <TableCell>{ru.admin.materials.units[position.unit as keyof typeof ru.admin.materials.units] ?? position.unit}</TableCell>
      <TableCell>
        {editing ? (
          <Input
            autoFocus
            type="number"
            step="0.01"
            className="w-28"
            value={priceText}
            disabled={busy}
            onChange={(e) => setPriceText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void savePrice(Math.round(Number(priceText) * 100));
              if (e.key === 'Escape') setEditing(false);
            }}
            onBlur={() => setEditing(false)}
          />
        ) : (
          <button
            type="button"
            className="flex items-center gap-1 hover:underline"
            onClick={() => {
              setPriceText((position.priceMinor / 100).toString());
              setEditing(true);
            }}
          >
            {formatMoneyMinor(position.priceMinor, currency)}
            {position.isUserPrice && (
              <UserPen className="size-3.5 text-primary" aria-label={t.userPriceHint} />
            )}
          </button>
        )}
        {position.isUserPrice && !editing && (
          <Button
            variant="ghost"
            size="xs"
            className="ml-1"
            disabled={busy}
            onClick={() => void savePrice(null)}
          >
            {t.resetPrice}
          </Button>
        )}
      </TableCell>
      <TableCell className="font-medium">
        {formatMoneyMinor(position.amountMinor, currency)}
      </TableCell>
      <TableCell>
        <Checkbox
          checked={position.purchased}
          disabled={busy}
          onCheckedChange={(c) => void togglePurchased(c === true)}
        />
      </TableCell>
    </TableRow>
  );
}
