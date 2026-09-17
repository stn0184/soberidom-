import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Screens } from './screens';

export const metadata: Metadata = {
  title: 'Прототип 004 — инструменты с вариантами',
  robots: { index: false, follow: false },
};

// Прототип этапа 004 «Инструменты с вариантами». Только режим разработки:
// в проде страницы не существует. Данные моковые, кнопки не работают.
export default function Prototype004Page() {
  if (process.env.NODE_ENV !== 'development') notFound();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-6 rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm">
        <p className="font-medium">Прототип 004 · инструменты с вариантами</p>
        <p className="text-muted-foreground">
          Так это будет выглядеть. Ничего не работает: карточки вариантов, фильтр и кнопки —
          картинка; выбор нарисован, а не сохраняется. Цены и названия вымышленные — образец,
          не прайс.
        </p>
      </div>
      <Screens />
    </div>
  );
}
