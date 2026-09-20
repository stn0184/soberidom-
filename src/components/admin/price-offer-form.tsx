'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { RegionRow, RetailerRow } from '@/lib/admin/types';
import { COUNTRY_CODES, COUNTRY_CURRENCY, type CountryCode } from '@/lib/constants';
import { todayIso } from '@/lib/estimate/prices';
import { PRICE_SOURCE_KINDS, priceSchema, type PriceInput } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.materials;
const ALL_COUNTRY = 'all';

// Новое предложение цены (спека 005): страна, регион, цена и обязательный
// источник. У вида «ритейлер» подпись подставляется из справочника.
export function PriceOfferForm({
  materialId,
  regions,
  retailers,
  onAdded,
}: {
  materialId: string;
  regions: RegionRow[];
  retailers: RetailerRow[];
  onAdded: () => void;
}) {
  const [country, setCountry] = useState<CountryCode>('RU');
  const [regionId, setRegionId] = useState(ALL_COUNTRY);
  const [priceText, setPriceText] = useState('');
  const [kind, setKind] = useState<PriceInput['source_kind']>('manual');
  const [retailerId, setRetailerId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [checkedAt, setCheckedAt] = useState(todayIso());
  const [busy, setBusy] = useState(false);

  const countryRetailers = retailers.filter((r) => r.country_code.trim() === country);

  async function addPrice() {
    const minor = Number(priceText);
    if (!priceText || !Number.isInteger(minor) || minor < 0) return;
    if (kind === 'retailer' && !retailerId) {
      toast.error(t.errRetailer);
      return;
    }
    // Подпись у ритейлера — его название, если админ не вписал своё.
    const retailerName = countryRetailers.find((r) => r.id === retailerId)?.name ?? '';
    const sourceLabel = label.trim() || (kind === 'retailer' ? retailerName : '');
    if (!sourceLabel) {
      toast.error(t.errSourceLabel);
      return;
    }
    const body = {
      material_id: materialId,
      country_code: country,
      region_id: regionId === ALL_COUNTRY ? null : regionId,
      price_minor: minor,
      currency: COUNTRY_CURRENCY[country],
      source_kind: kind,
      retailer_id: kind === 'retailer' ? retailerId : null,
      source_label: sourceLabel,
      source_url: url.trim(),
      checked_at: checkedAt,
    };
    const parsed = priceSchema.safeParse(body);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? ru.api.validation);
      return;
    }
    setBusy(true);
    try {
      await apiFetch('/api/admin/prices', { method: 'POST', body: JSON.stringify(parsed.data) });
      toast.success(ru.admin.common.saved);
      setPriceText('');
      setLabel('');
      setUrl('');
      onAdded();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label>{t.addPrice}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={country}
          onValueChange={(v) => {
            setCountry(v as CountryCode);
            setRegionId(ALL_COUNTRY);
            setRetailerId(null);
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
            {regions
              .filter((r) => r.country_code.trim() === country)
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
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={kind} onValueChange={(v) => setKind(v as PriceInput['source_kind'])}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t.priceSourceKind} />
          </SelectTrigger>
          <SelectContent>
            {PRICE_SOURCE_KINDS.map((value) => (
              <SelectItem key={value} value={value}>
                {t.priceSourceKinds[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {kind === 'retailer' && (
          <Select value={retailerId ?? ''} onValueChange={setRetailerId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t.priceRetailerNone} />
            </SelectTrigger>
            <SelectContent>
              {countryRetailers.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          className="w-52"
          placeholder={t.priceSourceLabel}
          title={t.priceSourceLabelHint}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Input
          className="w-56"
          placeholder={t.priceSourceUrl}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Input
          className="w-40"
          type="date"
          title={t.priceCheckedAt}
          value={checkedAt}
          onChange={(e) => setCheckedAt(e.target.value)}
        />
        <Button type="button" size="sm" disabled={busy} onClick={() => void addPrice()}>
          <Plus />
          {ru.admin.common.add}
        </Button>
      </div>
    </div>
  );
}
