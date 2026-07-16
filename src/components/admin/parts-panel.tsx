'use client';

import { useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDelete } from '@/components/admin/confirm-delete';
import { ListStates } from '@/components/admin/list-states';
import { PartForm } from '@/components/admin/part-form';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { MaterialRow, PartRow } from '@/lib/admin/types';
import { useAdminList } from '@/lib/admin/use-admin-list';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.parts;

const COLOR_DOT: Record<PartRow['color'], string> = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
};

// Детали с цветной маркировкой (SPEC 2.4) — вкладка раздела «Этапы и шаги».
export function PartsPanel({ projectId }: { projectId: string }) {
  const { data, error, loading, reload } = useAdminList<PartRow>(
    `/api/admin/parts?projectId=${projectId}`
  );
  const materials = useAdminList<MaterialRow>('/api/admin/materials');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<PartRow | null>(null);
  const [deleting, setDeleting] = useState<PartRow | null>(null);

  const materialName = (id: string) =>
    materials.data?.find((m) => m.id === id)?.name ?? id;

  async function handleDelete() {
    if (!deleting) return;
    try {
      await apiFetch(`/api/admin/parts/${deleting.id}`, { method: 'DELETE' });
      toast.success(ru.admin.common.deleted);
      void reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
        >
          <Plus />
          {ru.admin.common.add}
        </Button>
      </div>

      <ListStates
        loading={loading || materials.loading}
        error={error || materials.error}
        empty={data?.length === 0}
        onRetry={() => {
          void reload();
          void materials.reload();
        }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.thCode}</TableHead>
              <TableHead>{t.thColor}</TableHead>
              <TableHead>{t.thMaterial}</TableHead>
              <TableHead>{t.thLength}</TableHead>
              <TableHead>{t.thQty}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono font-medium">{row.part_code}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span className={`size-3 rounded-full ${COLOR_DOT[row.color]}`} />
                    {t.colors[row.color]}
                  </span>
                </TableCell>
                <TableCell>{materialName(row.material_id)}</TableCell>
                <TableCell>{row.cut_length_mm}</TableCell>
                <TableCell>{row.qty}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal />
                        <span className="sr-only">{ru.admin.common.actions}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(row);
                          setSheetOpen(true);
                        }}
                      >
                        {ru.admin.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleting(row)}>
                        {ru.admin.common.del}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ListStates>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing ? t.editTitle : t.addTitle}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <PartForm
              projectId={projectId}
              part={editing}
              materials={materials.data ?? []}
              onSaved={() => {
                setSheetOpen(false);
                toast.success(ru.admin.common.saved);
                void reload();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDelete
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
