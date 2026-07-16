'use client';

import { useState } from 'react';
import { ArrowLeft, MoreHorizontal, Plus } from 'lucide-react';
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
import { StepForm } from '@/components/admin/step-form';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { lintStep } from '@/lib/admin/linter';
import type { StageRow, StepRow } from '@/lib/admin/types';
import { useAdminList } from '@/lib/admin/use-admin-list';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.steps;

export function StepsPanel({ stage, onBack }: { stage: StageRow; onBack: () => void }) {
  const { data, error, loading, reload } = useAdminList<StepRow>(
    `/api/admin/steps?stageId=${stage.id}`
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<StepRow | null>(null);
  const [deleting, setDeleting] = useState<StepRow | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await apiFetch(`/api/admin/steps/${deleting.id}`, { method: 'DELETE' });
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft />
            {t.backToStages}
          </Button>
          <h2 className="font-medium">{t.stepsOf(stage.title)}</h2>
        </div>
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
              <TableHead>{t.thTitle}</TableHead>
              <TableHead className="w-48">{t.thLint}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((row) => {
              const issues = lintStep(row);
              return (
                <TableRow key={row.id}>
                  <TableCell>{row.sort}</TableCell>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={issues.length > 0 ? 'destructive' : 'secondary'}
                      title={issues.join('; ')}
                    >
                      {issues.length > 0 ? t.lintFail : t.lintOk}
                    </Badge>
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
              );
            })}
          </TableBody>
        </Table>
      </ListStates>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editing ? t.editTitle : t.addTitle}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <StepForm
              stageId={stage.id}
              step={editing}
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
