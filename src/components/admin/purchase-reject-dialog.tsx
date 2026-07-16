'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.purchases;

// Отклонение покупки с причиной — причина уходит в письмо (SPEC 3.16, 5.5).
export function PurchaseRejectDialog({
  open,
  onOpenChange,
  onConfirm,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  busy: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.rejectTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="reject-reason">{t.rejectReason}</Label>
          <Textarea
            id="reject-reason"
            rows={3}
            placeholder={t.rejectPlaceholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {ru.admin.common.cancel}
          </Button>
          <Button
            variant="destructive"
            disabled={busy || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            {busy && <Loader2 className="animate-spin" />}
            {t.reject}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
