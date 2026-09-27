import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL_EMAIL, LEGAL_ENTITY } from '@/lib/constants';
import { parseLegalEntity } from '@/lib/legal/helpers';
import { LEGAL_DOCS, LEGAL_SLUGS, LEGAL_VERSION, type LegalSlug } from '@/lib/legal/texts';
import { formatDateRu } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

// Метаданные юр-страницы: индексируем (SPEC 5.9), заголовок — из ru.legal.
export function legalMetadata(slug: LegalSlug): Metadata {
  return {
    title: `${ru.legal.titles[slug]} — ${ru.common.appName}`,
    description: LEGAL_DOCS[slug].intro,
    robots: { index: true, follow: true },
  };
}

// Общая разметка /legal/* (спека 006): h1, «версия от дд.мм.гггг», разделы,
// реквизиты из окружения внизу, ссылки на две другие страницы. Server Component.
export function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = LEGAL_DOCS[slug];
  const entityLines = parseLegalEntity(LEGAL_ENTITY);
  const others = LEGAL_SLUGS.filter((s) => s !== slug);

  return (
    <article className="mx-auto w-full max-w-3xl space-y-10 px-4 py-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold sm:text-4xl">{ru.legal.titles[slug]}</h1>
        <p className="text-sm text-muted-foreground">
          {ru.legal.versionFrom(formatDateRu(LEGAL_VERSION))}
        </p>
        <p className="text-lg text-muted-foreground">{doc.intro}</p>
      </header>

      {doc.sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-xl font-semibold">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <section className="space-y-2 rounded-xl border p-4 text-sm">
        <h2 className="font-semibold">{ru.legal.entityTitle}</h2>
        {entityLines.length > 0 ? (
          entityLines.map((line) => <p key={line}>{line}</p>)
        ) : (
          <p className="text-muted-foreground">{ru.legal.entityFallback}</p>
        )}
        <p>
          {ru.legal.emailLabel}{' '}
          <a href={`mailto:${LEGAL_EMAIL}`} className="underline">
            {LEGAL_EMAIL}
          </a>
        </p>
      </section>

      <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{ru.legal.otherDocs}</span>
        {others.map((other) => (
          <Link key={other} href={`/legal/${other}`} className="underline hover:text-foreground">
            {ru.legal.titles[other]}
          </Link>
        ))}
      </nav>
    </article>
  );
}
