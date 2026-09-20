// Справочные константы из SPEC 2.2 (countries).
export const COUNTRY_CODES = ['RU', 'KZ', 'BY'] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

export const COUNTRY_CURRENCY: Record<CountryCode, string> = {
  RU: 'RUB',
  KZ: 'KZT',
  BY: 'BYN',
};

// Средняя стоимость доставки по стране, минорные единицы (SPEC 5.7).
export const DELIVERY_AVG_COST: Record<CountryCode, number> = {
  RU: 600_000,
  KZ: 2_500_000,
  BY: 15_000,
};

// Цена, проверенная давнее этого, показывается жёлтой подписью «— давно»
// и считается устаревшей в админке (спека 005). Одно число на весь проект.
export const PRICE_STALE_DAYS = 60;

export const CURRENCY_COUNTRY: Record<string, CountryCode> = {
  RUB: 'RU',
  KZT: 'KZ',
  BYN: 'BY',
};
