import { NextResponse } from 'next/server';
import { ru } from '@/lib/i18n/ru';

// SPEC 3.17: заготовка платёжного провайдера этапа 2 монетизации.
// Маршрут создаётся сразу, реализация — при переходе на yookassa.
export async function POST() {
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: ru.api.notImplemented } },
    { status: 501 }
  );
}
