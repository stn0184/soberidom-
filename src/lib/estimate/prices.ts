// Какая из цен материала попадает в смету (спека 005, SPEC 5.2 п.3).
// material_prices — таблица предложений: у материала в регионе их несколько.
// Правило одно на витрину (calc.ts) и кабинет (detailed.ts).
//
// Импорт констант относительный, а не через @/: файл гоняется тестом
// `node --test src/lib/estimate/prices.test.ts`, где алиаса бандлера нет.
import { PRICE_STALE_DAYS } from '../constants.ts';

export type PriceOffer = {
  id: string;
  regionId: string | null; // null = предложение «по всей стране»
  priceMinor: number;
  label: string;
  url: string;
  checkedAt: string; // ГГГГ-ММ-ДД
};

export type OfferView = {
  label: string;
  url: string;
  priceMinor: number;
  checkedAt: string;
  stale: boolean;
};

export type PickedPrice = {
  priceMinor: number;
  source: OfferView;
  offers: OfferView[]; // подходящие предложения по возрастанию цены
};

const DAY_MS = 24 * 60 * 60 * 1000;

const dayNumber = (isoDate: string): number =>
  Math.floor(Date.parse(`${isoDate.slice(0, 10)}T00:00:00Z`) / DAY_MS);

// «Давно» — строго старше порога: ровно 60 дней ещё считается проверенным.
export function isStale(checkedAt: string, today: string): boolean {
  const days = dayNumber(today) - dayNumber(checkedAt);
  return Number.isFinite(days) && days > PRICE_STALE_DAYS;
}

// Дешевле → свежее → меньший id. Последнее — чтобы порядок не зависел от
// того, в каком порядке строки вернула база.
function byPrice(a: PriceOffer, b: PriceOffer): number {
  return (
    a.priceMinor - b.priceMinor ||
    b.checkedAt.localeCompare(a.checkedAt) ||
    a.id.localeCompare(b.id)
  );
}

export function pickPrice(
  offers: PriceOffer[],
  regionId: string | null,
  today: string
): PickedPrice | null {
  // Точный регион важнее «всей страны», даже если по стране дешевле:
  // местная база ближе к правде, чем средняя цена сети.
  const regional = offers.filter((o) => o.regionId !== null && o.regionId === regionId);
  const pool = regional.length > 0 ? regional : offers.filter((o) => o.regionId === null);
  if (pool.length === 0) return null;

  const sorted = [...pool].sort(byPrice).map<OfferView>((o) => ({
    label: o.label,
    url: o.url,
    priceMinor: o.priceMinor,
    checkedAt: o.checkedAt,
    stale: isStale(o.checkedAt, today),
  }));
  return { priceMinor: sorted[0].priceMinor, source: sorted[0], offers: sorted };
}

// Строка material_prices, как её читают calc.ts и detailed.ts.
export type PriceRow = {
  id: string;
  material_id: string;
  region_id: string | null;
  price_minor: number;
  source_label: string;
  source_url: string;
  checked_at: string;
};

export const PRICE_OFFER_COLUMNS =
  'id, material_id, region_id, price_minor, source_label, source_url, checked_at';

// Предложения из базы → выбранная цена по каждому материалу.
export function pickPricesByMaterial(
  rows: PriceRow[],
  regionId: string,
  today: string
): Map<string, PickedPrice> {
  const byMaterial = new Map<string, PriceOffer[]>();
  for (const r of rows) {
    const list = byMaterial.get(r.material_id) ?? [];
    list.push({
      id: r.id,
      regionId: r.region_id,
      priceMinor: r.price_minor,
      label: r.source_label,
      url: r.source_url,
      checkedAt: r.checked_at,
    });
    byMaterial.set(r.material_id, list);
  }
  const picked = new Map<string, PickedPrice>();
  for (const [materialId, offers] of byMaterial) {
    const best = pickPrice(offers, regionId, today);
    if (best) picked.set(materialId, best);
  }
  return picked;
}

// Цена из прайса, как её выгружает Excel: «820», «820.50», «820,50»,
// «1 234,50» (в том числе с неразрывным пробелом). Не число — не цена.
export function parseMoneyToMinor(text: string): number | null {
  const normalized = text.replace(/[\s ]/g, '').replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

// Сегодняшняя дата UTC в виде ГГГГ-ММ-ДД — тем же календарём, что current_date
// в Postgres (спека 005: расхождение с МСК после 21:00 в один день принято).
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
