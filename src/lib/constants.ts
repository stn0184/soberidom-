// Справочные константы из SPEC 2.2 (countries).
export const COUNTRY_CODES = ['RU', 'KZ', 'BY'] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

export const COUNTRY_CURRENCY: Record<CountryCode, string> = {
  RU: 'RUB',
  KZ: 'KZT',
  BY: 'BYN',
};
