import Link from 'next/link';
import { displayHost, type PlanAttribution } from '@/lib/legal/helpers';
import { cn } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const EXTERNAL = {
  target: '_blank',
  rel: 'noopener noreferrer',
  className: 'underline hover:text-foreground',
} as const;

// Строка «Планы: Michael Janzen (tinyhousedesign.com) · лицензия CC BY-NC 3.0 ·
// не проверены лицензированным инженером — подробнее» (спека 006). Это требование
// CC BY: автор и источник видны там, где показан проект. Пустой автор — ничего не
// рендерим: ни пустую строку, ни прочерк.
export function ProjectAttribution({
  attribution,
  className,
}: {
  attribution: PlanAttribution;
  className?: string;
}) {
  const { planAuthor, planSourceUrl, planLicense, planLicenseUrl } = attribution;
  if (!planAuthor) return null;
  const t = ru.legal.attribution;
  const host = displayHost(planSourceUrl);

  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {t.plans}{' '}
      {planSourceUrl ? (
        <a href={planSourceUrl} {...EXTERNAL}>
          {planAuthor}
        </a>
      ) : (
        planAuthor
      )}
      {host && ` (${host})`}
      {planLicense && (
        <>
          {' · '}
          {t.license}{' '}
          {planLicenseUrl ? (
            <a href={planLicenseUrl} {...EXTERNAL}>
              {planLicense}
            </a>
          ) : (
            planLicense
          )}
        </>
      )}
      {' · '}
      {t.notChecked}
      {' — '}
      <Link href="/legal/disclaimer" className="underline hover:text-foreground">
        {t.more}
      </Link>
    </p>
  );
}
