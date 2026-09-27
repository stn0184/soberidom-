import Link from 'next/link';
import { LEGAL_SLUGS } from '@/lib/legal/texts';
import { ru } from '@/lib/i18n/ru';

// Три ссылки на юр-страницы для футера (спека 006): «Дисклеймер · Политика ПД · Оферта».
export function LegalLinks() {
  return (
    <p className="flex flex-wrap items-center gap-x-2">
      {LEGAL_SLUGS.map((slug, index) => (
        <span key={slug} className="flex items-center gap-x-2">
          {index > 0 && <span aria-hidden>·</span>}
          <Link href={`/legal/${slug}`} className="underline-offset-4 hover:underline">
            {ru.footer.links[slug]}
          </Link>
        </span>
      ))}
    </p>
  );
}
