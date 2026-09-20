import { NextResponse } from 'next/server';
import { dbError, parseJson, requireAdmin, validationError } from '@/lib/api/helpers';
import { COUNTRY_CURRENCY, type CountryCode } from '@/lib/constants';
import { parseMoneyToMinor, todayIso } from '@/lib/estimate/prices';
import { priceOfferSchema, pricesImportSchema } from '@/lib/zod/admin';

// Импорт прайса из CSV (SPEC 3.16, спека 005). Разделитель «;», заголовок
// sku_internal;country;region;price;source_kind;source_label;source_url;checked_at.
// Upsert по ключу предложения: материал + страна + регион + подпись без
// регистра (уникальный индекс material_prices_offer_idx).
const key = (value: string) => value.trim().toLowerCase();

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const parsed = pricesImportSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const lines = parsed.data.csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Справочники — тремя запросами на весь файл, а не на каждую строку.
  const [{ data: materials }, { data: regions }, { data: retailers }] = await Promise.all([
    auth.supabase.from('materials').select('id, sku_internal'),
    auth.supabase.from('regions').select('id, name, country_code'),
    auth.supabase.from('retailers').select('id, name, country_code'),
  ]);
  const materialBySku = new Map(
    (materials ?? []).map((m) => [key(m.sku_internal), m.id as string])
  );
  const regionByName = new Map(
    (regions ?? []).map((r) => [`${key(r.country_code)}|${key(r.name)}`, r.id as string])
  );
  const retailerByName = new Map(
    (retailers ?? []).map((r) => [`${key(r.country_code)}|${key(r.name)}`, r.id as string])
  );

  let inserted = 0;
  let updated = 0;
  const badLines: number[] = [];

  for (const [index, line] of lines.entries()) {
    const cols = line.split(';').map((c) => c.trim());
    if (index === 0 && key(cols[0] ?? '') === 'sku_internal') continue; // строка-заголовок

    const materialId = materialBySku.get(key(cols[0] ?? ''));
    const country = (cols[1] ?? '').toUpperCase();
    const regionName = cols[2] ?? '';
    // Регион пустой — цена на всю страну; указан, но неизвестен — ошибка
    // строки: молча увезти цену на всю страну хуже, чем пропустить её.
    const regionId = regionName === '' ? null : regionByName.get(`${key(country)}|${key(regionName)}`);
    const priceMinor = parseMoneyToMinor(cols[3] ?? '');
    const sourceKind = cols[4] || 'manual';
    const sourceLabel = cols[5] ?? '';
    if (!materialId || regionId === undefined || priceMinor === null) {
      badLines.push(index + 1);
      continue;
    }

    const row = priceOfferSchema.safeParse({
      material_id: materialId,
      country_code: country,
      region_id: regionId,
      price_minor: priceMinor,
      currency: COUNTRY_CURRENCY[country as CountryCode],
      source_kind: sourceKind,
      // В CSV ритейлера нет — связываем по совпадению подписи с названием.
      retailer_id:
        sourceKind === 'retailer'
          ? (retailerByName.get(`${key(country)}|${key(sourceLabel)}`) ?? null)
          : null,
      source_label: sourceLabel,
      source_url: cols[6] ?? '',
      checked_at: cols[7] || todayIso(),
    });
    if (!row.success) {
      badLines.push(index + 1);
      continue;
    }

    const base = auth.supabase
      .from('material_prices')
      .select('id, source_label')
      .eq('material_id', row.data.material_id)
      .eq('country_code', row.data.country_code);
    const { data: siblings, error: findError } = await (row.data.region_id === null
      ? base.is('region_id', null)
      : base.eq('region_id', row.data.region_id));
    if (findError) return dbError(findError);
    const existing = (siblings ?? []).find(
      (s: { source_label: string }) => key(s.source_label) === key(row.data.source_label)
    );

    if (existing) {
      const { error } = await auth.supabase
        .from('material_prices')
        .update({
          price_minor: row.data.price_minor,
          currency: row.data.currency,
          source_kind: row.data.source_kind,
          retailer_id: row.data.retailer_id,
          source_url: row.data.source_url,
          checked_at: row.data.checked_at,
        })
        .eq('id', existing.id);
      if (error) return dbError(error);
      updated += 1;
    } else {
      const { error } = await auth.supabase.from('material_prices').insert(row.data);
      if (error) return dbError(error);
      inserted += 1;
    }
  }

  return NextResponse.json({ data: { inserted, updated, badLines } });
}
