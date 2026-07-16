'use client';

import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.buy;

// Инструкция оплаты (SPEC 4.5): сумма, ссылка на донат-сервис, код с Copy, шаги 1-2-3.
export function PayCard({
  code,
  amountMinor,
  currency,
  url,
}: {
  code: string;
  amountMinor: number;
  currency: string;
  url: string;
}) {
  async function copyCode() {
    await navigator.clipboard.writeText(code);
    toast.success(t.copied);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.payTitle}</CardTitle>
        <CardDescription>{t.payAmount(formatMoneyMinor(amountMinor, currency))}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t.payCodeLabel}</p>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border bg-muted px-4 py-2 font-mono text-2xl font-bold tracking-wider">
              {code}
            </span>
            <Button variant="outline" size="icon" onClick={() => void copyCode()}>
              <Copy />
              <span className="sr-only">{t.copy}</span>
            </Button>
          </div>
        </div>

        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {t.paySteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        {url && (
          <Button asChild size="lg" className="w-full">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              {t.payLink}
            </a>
          </Button>
        )}

        <p className="text-xs text-muted-foreground">{t.payNote}</p>
      </CardContent>
    </Card>
  );
}
