'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.regions;

type ImportResult = { inserted: number; updated: number; badLines: number[] };

// Импорт CSV регионов (SPEC 3.16, 4.14): name,country_code,mt,snow_region,wind_region.
export function RegionsImport({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runImport() {
    if (!csv.trim()) {
      setError(t.importEmpty);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const body = await apiFetch<{ data: ImportResult }>('/api/admin/import/regions', {
        method: 'POST',
        body: JSON.stringify({ csv }),
      });
      const { inserted, updated, badLines } = body.data;
      toast.success(t.importResult(inserted, updated));
      if (badLines.length > 0) toast.warning(t.importErrors(badLines.length));
      setCsv('');
      onOpenChange(false);
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.importTitle}</DialogTitle>
          <DialogDescription>{t.importHint}</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Textarea
          rows={10}
          placeholder={t.importPlaceholder}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {ru.admin.common.cancel}
          </Button>
          <Button disabled={busy} onClick={() => void runImport()}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? ru.common.pleaseWait : t.importRun}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
