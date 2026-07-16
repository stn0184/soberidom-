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
import { ProjectForm } from '@/components/admin/project-form';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { ProjectRow } from '@/lib/admin/types';
import { useAdminList } from '@/lib/admin/use-admin-list';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.projects;

export function ProjectsTable() {
  const { data, error, loading, reload } = useAdminList<ProjectRow>('/api/admin/projects');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState<ProjectRow | null>(null);

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(row: ProjectRow) {
    setEditing(row);
    setSheetOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await apiFetch(`/api/admin/projects/${deleting.id}`, { method: 'DELETE' });
      toast.success(ru.admin.common.deleted);
      void reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{ru.admin.nav.projects}</h1>
        <Button onClick={openCreate}>
          <Plus />
          {ru.admin.common.add}
        </Button>
      </div>

      <ListStates loading={loading} error={error} empty={data?.length === 0} onRetry={reload}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.thTitle}</TableHead>
              <TableHead>{t.thType}</TableHead>
              <TableHead>{t.thArea}</TableHead>
              <TableHead>{t.thStatus}</TableHead>
              <TableHead>{t.thPrice}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.title}</TableCell>
                <TableCell>{t.buildingTypes[row.building_type]}</TableCell>
                <TableCell>{row.area_m2} м²</TableCell>
                <TableCell>
                  <Badge variant={row.status === 'published' ? 'default' : 'secondary'}>
                    {t.statuses[row.status]}
                  </Badge>
                </TableCell>
                <TableCell>{formatMoneyMinor(row.price_minor, row.currency)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal />
                        <span className="sr-only">{ru.admin.common.actions}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(row)}>
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
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editing ? t.editTitle : t.addTitle}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <ProjectForm
              project={editing}
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
