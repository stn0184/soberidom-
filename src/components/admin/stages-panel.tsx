'use client';

import { useState } from 'react';
import { ListOrdered, MoreHorizontal, Plus } from 'lucide-react';
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
import { StageForm } from '@/components/admin/stage-form';
import { StepsPanel } from '@/components/admin/steps-panel';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { StageRow } from '@/lib/admin/types';
import { useAdminList } from '@/lib/admin/use-admin-list';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.stages;

export function StagesPanel({ projectId }: { projectId: string }) {
  const { data, error, loading, reload } = useAdminList<StageRow>(
    `/api/admin/stages?projectId=${projectId}`
  );
  const [openStage, setOpenStage] = useState<StageRow | null>(null); // просмотр шагов
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<StageRow | null>(null);
  const [deleting, setDeleting] = useState<StageRow | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await apiFetch(`/api/admin/stages/${deleting.id}`, { method: 'DELETE' });
      toast.success(ru.admin.common.deleted);
      void reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setDeleting(null);
    }
  }

  if (openStage) {
    return <StepsPanel stage={openStage} onBack={() => setOpenStage(null)} />;
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

      <ListStates loading={loading} error={error} empty={data?.length === 0} onRetry={reload}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">{t.thSort}</TableHead>
              <TableHead>{t.thCode}</TableHead>
              <TableHead>{t.thTitle}</TableHead>
              <TableHead className="w-20">{t.thWave}</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.sort}</TableCell>
                <TableCell className="font-mono text-xs">{row.code}</TableCell>
                <TableCell className="font-medium">{row.title}</TableCell>
                <TableCell>{row.delivery_wave}</TableCell>
                <TableCell className="flex items-center justify-end gap-1">
                  <Button variant="outline" size="sm" onClick={() => setOpenStage(row)}>
                    <ListOrdered />
                    {t.stepsBtn}
                  </Button>
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
            <StageForm
              projectId={projectId}
              stage={editing}
              nextSort={(data?.length ?? 0) + 1}
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
