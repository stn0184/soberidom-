// Мелкие чистые помощники юр-страниц и фиксации согласия (спека 006).
// Без импортов через «@/» — файл гоняется node --test напрямую.

// NEXT_PUBLIC_LEGAL_ENTITY — одна строка, части через « | »:
// «ИП Иванов И. И. | ИНН 1234567890 | ОГРНИП … | адрес». Страница рендерит
// каждую часть отдельной строкой; пустые части (двойной разделитель) выбрасываются.
export function parseLegalEntity(raw: string): string[] {
  return raw
    .split('|')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

// Хост ссылки для подписи «(tinyhousedesign.com)»; мусор вместо URL — пустая строка,
// и подпись просто не показывается.
export function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Согласие в purchases.config.consent: с чем согласился человек (дисклеймер и оферта),
// какая версия текста действовала и когда — в споре это единственное, что можно показать.
export type LegalConsent = {
  disclaimer: true;
  offer: true;
  version: string;
  at: string; // ISO-дата момента согласия
};

export function buildConsent(version: string, at: Date = new Date()): LegalConsent {
  return { disclaimer: true, offer: true, version, at: at.toISOString() };
}

// Атрибуция планов проекта (CC BY): строка house_projects → поля для компонента.
// Колонок может не быть в выборке (или в базе до миграции 029) — тогда пустые
// строки, и ProjectAttribution просто не рендерится.
export type PlanAttribution = {
  planAuthor: string;
  planSourceUrl: string;
  planLicense: string;
  planLicenseUrl: string;
};

type PlanRow = {
  plan_author?: string | null;
  plan_source_url?: string | null;
  plan_license?: string | null;
  plan_license_url?: string | null;
};

export function planAttribution(row: PlanRow): PlanAttribution {
  return {
    planAuthor: row.plan_author ?? '',
    planSourceUrl: row.plan_source_url ?? '',
    planLicense: row.plan_license ?? '',
    planLicenseUrl: row.plan_license_url ?? '',
  };
}
