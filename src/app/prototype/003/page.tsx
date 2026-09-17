import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Screens } from './screens';

export const metadata: Metadata = {
  title: 'Прототип 003 — закупки перед этапом',
  robots: { index: false, follow: false },
};

// Прототип этапа 003 «Закупки перед этапом». Только режим разработки:
// в проде страницы не существует. Данные моковые, кнопки не работают.
export default function Prototype003Page() {
  if (process.env.NODE_ENV !== 'development') notFound();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-6 rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm">
        <p className="font-medium">Прототип 003 · экран начала этапа</p>
        <p className="text-muted-foreground">
          Так это будет выглядеть. Ничего не работает: галочки, кнопки и ссылки — картинка,
          данные вымышленные (цены и названия — образец, не прайс).
        </p>
      </div>
      <Screens />
    </div>
  );
}
