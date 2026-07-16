'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ListStates } from '@/components/admin/list-states';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { MaterialPriceRow, RegionRow } from '@/lib/admin/types';
import { useAdminList } from '@/lib/admin/use-admin-list';
import { COUNTRY_CODES, COUNTRY_CURRENCY, type CountryCode } from '@/lib/constants';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.materials;
const ALL_COUNTRY = 'all';

// Цены материала: страна + опциональный регион (null = вся страна), SPEC 2.3.
export function MaterialPrices({ materialId }: { materialId: string }) {
  const prices = useAdminList<MaterialPriceRow>(`/api/admin/prices?materialId=${materialId}`);
  const regions = useAdminList<RegionRow>('/api/admin/regions');
  const [country, setCountry] = useState<CountryCode>('RU');
  const [regionId, setRegionId] = useState(ALL_COUNTRY);
  const [priceText, setPriceText] = useState('');
  const [busy, setBusy] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const regionName = (id: string | null) =>
    id === null
      ? t.priceRegionAll
      : regions.data?.find((r) => r.id === id)?.name ?? id;

  async function addPrice() {
    const minor = Number(priceText);
    if (!priceText || !Number.isInteger(minor) || minor < 0) return;
    setBusy(true);
    try {
      await apiFetch('/api/admin/prices', {
        method: 'POST',
        body: JSON.stringify({
          material_id: materialId,
          country_code: country,
          region_id: regionId === ALL_COUNTRY ? null : regionId,
          price_minor: minor,
          currency: COUNTRY_CURRENCY[country],
        }),
      });
      toast.success(ru.admin.common.saved);
      setPriceText('');
      void prices.reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setBusy(false);
    }
  }

  async function savePrice(row: MaterialPriceRow) {
    const text = edits[row.id];
    if (text === undefined || text === String(row.price_minor)) return;
    const minor = Number(text);
    if (!Number.isInteger(minor) || minor < 0) return;
    try {
      await apiFetch(`/api/admin/prices/${row.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ price_minor: minor }),
      });
      toast.success(ru.admin.common.saved);
      void prices.reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    }
  }

  async function deletePrice(row: MaterialPriceRow) {
    try {
      await apiFetch(`/api/admin/prices/${row.id}`, { method: 'DELETE' });
      toast.success(ru.admin.common.deleted);
      void prices.reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    }
  }

  return (
    <div className="space-y-4">
      <Separator />
      <h3 className="font-medium">{t.pricesTitle}</h3>

      <ListStates
        loading={prices.loading || regions.loading}
        error={prices.error || regions.error}
        empty={false}
        onRetry={() => {
          void prices.reload();
          void regions.reload();
        }}
      >
        {prices.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noPrices}</p>
        ) : (
          <div className="space-y-2">
            {prices.data?.map((row) => (
              <div key={row.id} className="flex items-center gap-2 text-sm">
                <span className="w-10 shrink-0 font-mono">{row.country_code.trim()}</span>
                <span className="flex-1 truncate">{regionName(row.region_id)}</span>
                <Input
                  className="w-32"
                  type="number"
                  value={edits[row.id] ?? String(row.price_minor)}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [row.id]: e.target.value }))}
                  onBlur={() => void savePrice(row)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                />
                <span className="w-10 text-muted-foreground">{row.currency}</span>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => void deletePrice(row)}>
                  <Trash2 />
                  <span className="sr-only">{ru.admin.common.del}</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </ListStates>

      <div className="space-y-2 rounded-md border p-3">
        <Label>{t.addPrice}</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={country}
            onValueChange={(v) => {
              setCountry(v as CountryCode);
              setRegionId(ALL_COUNTRY);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_CODES.map((code) => (
                <SelectItem key={code} value={code}>
                  {ru.countries[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={regionId} onValueChange={setRegionId}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_COUNTRY}>{t.priceRegionAll}</SelectItem>
              {regions.data
                ?.filter((r) => r.country_code.trim() === country)
                .map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Input
            className="w-36"
            type="number"
            placeholder={t.priceValue}
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
          />
          <Button type="button" size="sm" disabled={busy} onClick={() => void addPrice()}>
            <Plus />
            {ru.admin.common.add}
          </Button>
        </div>
      </div>
    </div>
  );
}
