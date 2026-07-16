import { ru } from '@/lib/i18n/ru';

// Клиентский помощник для запросов к /api/* с единым форматом ошибок (SPEC Блок 3.0).
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      body?.error?.code ?? 'INTERNAL',
      body?.error?.message ?? ru.common.error
    );
  }
  return body as T;
}
