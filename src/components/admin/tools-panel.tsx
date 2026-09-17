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
import { ToolForm } from '@/components/admin/tool-form';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { StageRow, ToolWithVariants } from '@/lib/admin/types';
import { useAdminList } from '@/lib/admin/use-admin-list';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.tools;
const MAX_NAMES = 3;

// Инструменты проекта: потребность + её варианты (спека 004). Красный бейдж —
// у потребности не ровно один вариант «советуем новичку»: покупатель увидит
// не то, что задумал контентщик.
export function ToolsPanel({ projectId }: { projectId: string }) {
  const { data, error, loading, reload } = useAdminList<ToolWithVariants>(
    `/api/admin/tools?projectId=${projectId}`
  );
  const stages = useAdminList<StageRow>(`/api/admin/stages?projectId=${projectId}`);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ToolWithVariants | null>(null);
  const [deleting, setDeleting] = useState<ToolWithVariants | null>(null);

  function stagesText(codes: string[]): string {
    const all = stages.data ?? [];
    if (all.length > 0 && codes.length >= all.length) return ru.tools.allStages;
    const name = (code: string) =>
      all.find((s) => s.code === code)?.display_name ?? ru.build.stageCodes[code] ?? code;
    const shown = codes.slice(0, MAX_NAMES).map(name);
    const rest = codes.length - shown.length;
    return rest > 0 ? `${shown.join(', ')} + ${ru.tools.moreStages(rest)}` : shown.join(', ');
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await apiFetch(`/api/admin/tools/${deleting.id}`, { method: 'DELETE' });
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
        loading={loading || stages.loading}
        error={error || stages.error}
        empty={false}
        onRetry={() => {
          void reload();
          void stages.reload();
        }}
      >
        {data?.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="font-medium">{t.emptyTitle}</p>
            <p className="text-sm text-muted-foreground">{t.emptyText}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.thName}</TableHead>
                <TableHead className="w-32">{t.thCategory}</TableHead>
                <TableHead>{t.thStages}</TableHead>
                <TableHead className="w-24">{t.thVariants}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{row.name}</span>
                      {row.tool_variants.filter((v) => v.is_beginner_choice).length !== 1 && (
                        <Badge variant="destructive">{t.noBeginner}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{ru.tools.categories[row.category]}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {stagesText(row.stage_codes)}
                  </TableCell>
                  <TableCell>{row.tool_variants.length}</TableCell>
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
        )}
      </ListStates>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing ? t.editTitle : t.addTitle}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <ToolForm
              projectId={projectId}
              tool={editing}
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
