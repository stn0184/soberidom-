'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/admin/form-field';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { ru } from '@/lib/i18n/ru';

const t = ru.finance;
const CUSTOM = 'custom';
const NO_STAGE = 'none';

export type ExpenseOption = { materialId: string; name: string };
export type StageOption = { id: string; title: string };

// Добавление траты (US-010): позиция из сметы или произвольная.
export function ExpenseDialog({
  purchaseId,
  open,
  onOpenChange,
  materials,
  stages,
  onSaved,
}: {
  purchaseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: ExpenseOption[];
  stages: StageOption[];
  onSaved: () => void;
}) {
  const [materialId, setMaterialId] = useState(CUSTOM);
  const [customTitle, setCustomTitle] = useState('');
  const [stageId, setStageId] = useState(NO_STAGE);
  const [qty, setQty] = useState('1');
  const [amount, setAmount] = useState('');
  const [spentOn, setSpentOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/my/${purchaseId}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          materialId: materialId === CUSTOM ? null : materialId,
          customTitle: materialId === CUSTOM ? customTitle.trim() : '',
          stageId: stageId === NO_STAGE ? null : stageId,
          qty: Number(qty) || 1,
          amountMinor: Math.round(Number(amount) * 100),
          spentOn,
          note,
        }),
      });
      onOpenChange(false);
      setCustomTitle('');
      setAmount('');
      setNote('');
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setBusy(false);
    }
  }

  const valid =
    Number(amount) >= 0 && amount !== '' && (materialId !== CUSTOM || customTitle.trim() !== '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.addExpense}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FormField label={t.itemLabel}>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CUSTOM}>{t.itemCustom}</SelectItem>
                {materials.map((m) => (
                  <SelectItem key={m.materialId} value={m.materialId}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {materialId === CUSTOM && (
            <FormField label={t.customTitleLabel} htmlFor="e-title">
              <Input id="e-title" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
            </FormField>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.qtyLabel} htmlFor="e-qty">
              <Input id="e-qty" type="number" min="0.001" step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
            </FormField>
            <FormField label={t.amountLabel} htmlFor="e-amount">
              <Input id="e-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </FormField>
          </div>
          <FormField label={t.stageLabel}>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_STAGE}>{t.stageNone}</SelectItem>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label={t.dateLabel} htmlFor="e-date">
            <Input
              id="e-date"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={spentOn}
              onChange={(e) => setSpentOn(e.target.value)}
            />
          </FormField>
          <FormField label={t.noteLabel} htmlFor="e-note">
            <Textarea id="e-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {ru.admin.common.cancel}
          </Button>
          <Button disabled={busy || !valid} onClick={() => void submit()}>
            {busy && <Loader2 className="animate-spin" />}
            {ru.admin.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
