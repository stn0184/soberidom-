// Помощники форм админки.

// Текст «пункт с новой строки» → массив строк.
export function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

// Поле applies_when: JSON-объект строка→строка (SPEC 2.4). null = невалидный ввод.
export function parseAppliesWhen(text: string): Record<string, string> | null {
  if (!text.trim()) return {};
  try {
    const value: unknown = JSON.parse(text);
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.values(value).every((v) => typeof v === 'string')
    ) {
      return value as Record<string, string>;
    }
  } catch {
    // невалидный JSON
  }
  return null;
}
