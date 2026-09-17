// Действующий вариант инструмента и суммы «Купить ≈ / Арендовать ≈» (спека 004).
// Одна логика на экран /tools и на блок «И это понадобится» экрана этапа.

export type Recommendation = 'buy' | 'rent' | 'borrow_or_buy_cheap';

export type VariantLike = {
  id: string;
  recommendation: Recommendation;
  priceMinor: number | null;
  rentDayMinor: number | null;
  isBeginnerChoice: boolean;
  sort: number;
};

export type ToolLike = {
  daysNeeded: number;
  variants: VariantLike[];
  chosenVariantId: string | null;
};

const firstBySort = <V extends VariantLike>(list: V[]): V | null =>
  list.reduce<V | null>((best, v) => (best === null || v.sort < best.sort ? v : best), null);

// Выбор покупателя → пометка «для новичка» → первый по sort. Если в базе
// пометок 0 или 2 (форма админки такого не даст, но админ мог править базой),
// берём первого по sort среди помеченных, а при нуле — первого по sort вообще.
export function effectiveVariant<V extends VariantLike>(tool: {
  variants: V[];
  chosenVariantId: string | null;
}): V | null {
  const chosen = tool.variants.find((v) => v.id === tool.chosenVariantId);
  if (chosen) return chosen;
  return firstBySort(tool.variants.filter((v) => v.isBeginnerChoice)) ?? firstBySort(tool.variants);
}

// «Одолжить или купить дешёвый» — это всё же покупка: одолжить может быть не у
// кого. Аренда считается за весь срок потребности, пустая цена в сумму не идёт.
export function toolsSummary(tools: ToolLike[]): {
  buyTotalMinor: number;
  rentTotalMinor: number;
} {
  let buyTotalMinor = 0;
  let rentTotalMinor = 0;
  for (const tool of tools) {
    const variant = effectiveVariant(tool);
    if (variant === null) continue;
    if (variant.recommendation === 'rent') {
      if (variant.rentDayMinor !== null) rentTotalMinor += variant.rentDayMinor * tool.daysNeeded;
    } else if (variant.priceMinor !== null) {
      buyTotalMinor += variant.priceMinor;
    }
  }
  return { buyTotalMinor, rentTotalMinor };
}
