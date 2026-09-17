'use client';

// Прототип 004: админка «Этапы и шаги» → новая вкладка «Инструменты».
// Таблица потребностей; у «мембран» нарочно нет варианта «для новичка».
import { MoreHorizontal, Plus } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ru } from '@/lib/i18n/ru';
import { ADMIN_ROWS, ALL_STAGES, STAGE_NAMES, proto } from './mock';

const MAX_CHIPS = 3;

function stagesText(stages: string[]): string {
  if (stages.length === ALL_STAGES.length) return proto.allStages;
  const shown = stages.slice(0, MAX_CHIPS).map((code) => STAGE_NAMES[code] ?? code);
  const rest = stages.length - shown.length;
  return rest > 0 ? `${shown.join(', ')} + ${proto.moreStages(rest)}` : shown.join(', ');
}

export function AdminToolsPreview({ empty = false }: { empty?: boolean }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{ru.admin.nav.steps}</h1>

      <div className="max-w-sm">
        <Select value="p1" onValueChange={() => {}}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={ru.admin.common.selectProject} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p1">Homesteader&apos;s Cabin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value="tools" onValueChange={() => {}}>
        <TabsList>
          <TabsTrigger value="stages">{ru.admin.steps.tabSteps}</TabsTrigger>
          <TabsTrigger value="parts">{ru.admin.steps.tabParts}</TabsTrigger>
          <TabsTrigger value="options">{ru.admin.steps.tabOptions}</TabsTrigger>
          <TabsTrigger value="tools">{proto.adminTabTools}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex justify-end">
        <Button>
          <Plus />
          {proto.adminAdd}
        </Button>
      </div>

      {empty ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">{proto.adminEmptyTitle}</p>
          <p className="text-sm text-muted-foreground">{proto.adminEmptyText}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{proto.adminThName}</TableHead>
              <TableHead className="w-32">{proto.adminThCategory}</TableHead>
              <TableHead>{proto.adminThStages}</TableHead>
              <TableHead className="w-24">{proto.adminThVariants}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {ADMIN_ROWS.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{row.name}</span>
                    {row.beginnerCount !== 1 && (
                      <Badge variant="destructive">{proto.adminNoBeginner}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{ru.tools.categories[row.category]}</TableCell>
                <TableCell className="text-muted-foreground">{stagesText(row.stages)}</TableCell>
                <TableCell>{row.variantsCount}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal />
                    <span className="sr-only">{ru.admin.common.actions}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
