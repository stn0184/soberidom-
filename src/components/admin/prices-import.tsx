'use client';

import { useEffect, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { PRICE_STALE_DAYS } from '@/lib/constants';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.materials;

type ImportResult = { inserted: number; updated: number; badLines: number[] };

// Импорт прайса и счётчик устаревших цен над таблицей материалов (спека 005):
// админ видит, сколько цен пора проверить, и обновляет их одной вставкой CSV.
export function PricesImport() {
  // Счётчик приезжает как { data: { count } }, а useAdminList ждёт список —
  // поэтому свой запрос; tick перезапрашивает его после импорта.
  const [staleCount, setStaleCount] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ data: { count: number } }>('/api/admin/prices?stale=1')
      .then((body) => {
        if (!cancelled) setStaleCount(body.data.count);
      })
      .catch(() => {
        if (!cancelled) setStaleCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  async function runImport() {
    if (!csv.trim()) {
      setError(t.importEmpty);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const body = await apiFetch<{ data: ImportResult }>('/api/admin/import/prices', {
        method: 'POST',
        body: JSON.stringify({ csv }),
      });
      const { inserted, updated, badLines } = body.data;
      toast.success(t.importResult(inserted, updated));
      if (badLines.length > 0) toast.warning(t.importErrors(badLines.length));
      setCsv('');
      setOpen(false);
      setTick((n) => n + 1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {staleCount === null ? '' : t.staleCount(PRICE_STALE_DAYS, staleCount)}
      </p>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload />
        {t.importPricesBtn}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.importPricesTitle}</DialogTitle>
            <DialogDescription>{t.importPricesHint}</DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Textarea
            rows={10}
            placeholder={t.importPricesPlaceholder}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {ru.admin.common.cancel}
            </Button>
            <Button disabled={busy} onClick={() => void runImport()}>
              {busy && <Loader2 className="animate-spin" />}
              {busy ? ru.common.pleaseWait : t.importRun}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
