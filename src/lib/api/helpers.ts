import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { ZodError } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ru } from '@/lib/i18n/ru';

// Единый формат ошибок API (SPEC Блок 3.0).
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL'
  | 'UPSTREAM_UNAVAILABLE';

const STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  UPSTREAM_UNAVAILABLE: 503,
};

export function apiError(code: ApiErrorCode, message: string) {
  return NextResponse.json({ error: { code, message } }, { status: STATUS[code] });
}

export function validationError(error: ZodError) {
  const first = error.issues[0];
  const detail = first ? `${first.path.join('.')}: ${first.message}` : '';
  return apiError('VALIDATION_ERROR', detail ? `${ru.api.validation} (${detail})` : ru.api.validation);
}

// Postgres-ошибки → коды API. 23505 unique, 23503 foreign key (edge case 5).
export function dbError(error: { code?: string; message?: string }, fkMessage?: string) {
  if (error.code === '23505') return apiError('CONFLICT', ru.api.conflict);
  if (error.code === '23503') return apiError('CONFLICT', fkMessage ?? ru.api.conflict);
  return apiError('INTERNAL', ru.api.internal);
}

type AdminOk = { supabase: SupabaseClient; user: User };
type AdminFail = { error: NextResponse };

// Проверка admin для всех /api/admin/* (SPEC 3.16).
// Клиент возвращается без Database-генерика: таблицы этапа 2 появятся в
// сгенерированных типах после применения миграций (затем можно типизировать).
export async function requireAdmin(): Promise<AdminOk | AdminFail> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: apiError('UNAUTHORIZED', ru.api.unauthorized) };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return { error: apiError('FORBIDDEN', ru.api.forbidden) };

  return { supabase: supabase as unknown as SupabaseClient, user };
}

export async function parseJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
