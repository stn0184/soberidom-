'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ListStates } from '@/components/admin/list-states';
import { PurchaseRejectDialog } from '@/components/admin/purchase-reject-dialog';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { useAdminList } from '@/lib/admin/use-admin-list';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.purchases;

type PurchaseRow = {
  id: string;
  code: string;
  status: 'pending' | 'active' | 'rejected' | 'refunded';
  provider: string;
  amountMinor: number;
  currency: string;
  createdAt: string;
  projectTitle: string;
  email: string;
};

const STATUS_VARIANT: Record<PurchaseRow['status'], 'secondary' | 'default' | 'destructive'> = {
  pending: 'secondary',
  active: 'default',
  rejected: 'destructive',
  refunded: 'destructive',
};

// Раздел «Покупки» (SPEC 4.14): фильтр pending, активация/отклонение с подтверждением.
export function PurchasesTable() {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const url = filter === 'pending' ? '/api/admin/purchases?status=pending' : '/api/admin/purchases';
  const { data, error, loading, reload } = useAdminList<PurchaseRow>(url);
  const [activating, setActivating] = useState<PurchaseRow | null>(null);
  const [rejecting, setRejecting] = useState<PurchaseRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function runAction(action: 'activate' | 'reject', row: PurchaseRow, reason?: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/purchases/${row.id}/${action}`, {
        method: 'POST',
        body: reason ? JSON.stringify({ reason }) : JSON.stringify({}),
      });
      toast.success(ru.admin.common.saved);
      setActivating(null);
      setRejecting(null);
      void reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{ru.admin.nav.purchases}</h1>
        <Select value={filter} onValueChange={(v) => setFilter(v as 'pending' | 'all')}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">{t.filterPending}</SelectItem>
            <SelectItem value="all">{t.filterAll}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ListStates loading={loading} error={error} empty={data?.length === 0} onRetry={reload}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.thCode}</TableHead>
              <TableHead>{t.thEmail}</TableHead>
              <TableHead>{t.thProject}</TableHead>
              <TableHead>{t.thAmount}</TableHead>
              <TableHead>{t.thDate}</TableHead>
              <TableHead>{t.thStatus}</TableHead>
              <TableHead className="w-52" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono font-medium">{row.code}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.projectTitle}</TableCell>
                <TableCell>{formatMoneyMinor(row.amountMinor, row.currency)}</TableCell>
                <TableCell>
                  {new Date(row.createdAt).toLocaleDateString('ru-RU')}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[row.status]}>{t.statuses[row.status]}</Badge>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  {row.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => setActivating(row)}>
                        {t.activate}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejecting(row)}
                      >
                        {t.reject}
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ListStates>

      <AlertDialog open={activating !== null} onOpenChange={(o) => !o && setActivating(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmActivateTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {activating ? t.confirmActivateText(activating.code) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ru.admin.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() => activating && void runAction('activate', activating)}
            >
              {t.activate}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PurchaseRejectDialog
        open={rejecting !== null}
        onOpenChange={(o) => !o && setRejecting(null)}
        busy={busy}
        onConfirm={(reason) => rejecting && void runAction('reject', rejecting, reason)}
      />
    </div>
  );
}
