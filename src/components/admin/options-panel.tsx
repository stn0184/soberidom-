'use client';

import { useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import { OptionForm } from '@/components/admin/option-form';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { ConfigOptionRow } from '@/lib/admin/types';
import { useAdminList } from '@/lib/admin/use-admin-list';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.options;

// Вкладка «Опции конфигуратора»: владелец наполняет человеческие карточки (UX_PRINCIPLES).
export function OptionsPanel({ projectId }: { projectId: string }) {
  const { data, error, loading, reload } = useAdminList<ConfigOptionRow>(
    `/api/admin/options?projectId=${projectId}`
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ConfigOptionRow | null>(null);
  const [deleting, setDeleting] = useState<ConfigOptionRow | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await apiFetch(`/api/admin/options/${deleting.id}`, { method: 'DELETE' });
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

      <ListStates loading={loading} error={error} empty={data?.length === 0} onRetry={reload}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.thGroup}</TableHead>
              <TableHead>{t.thKey}</TableHead>
              <TableHead>{t.thLabel}</TableHead>
              <TableHead>{t.thFlags}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{ru.project.groups[row.group_key]}</TableCell>
                <TableCell className="font-mono text-xs">{row.option_key}</TableCell>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell className="space-x-1">
                  {row.is_default && <Badge variant="secondary">{t.badgeDefault}</Badge>}
                  {row.is_beginner_choice && <Badge>{t.badgeBeginner}</Badge>}
                </TableCell>
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
            <OptionForm
              projectId={projectId}
              option={editing}
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
