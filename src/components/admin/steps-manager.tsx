'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListStates } from '@/components/admin/list-states';
import { OptionsPanel } from '@/components/admin/options-panel';
import { PartsPanel } from '@/components/admin/parts-panel';
import { StagesPanel } from '@/components/admin/stages-panel';
import type { ProjectRow } from '@/lib/admin/types';
import { useAdminList } from '@/lib/admin/use-admin-list';
import { ru } from '@/lib/i18n/ru';

// Раздел «Этапы и шаги»: выбор проекта → этапы → шаги; вкладка «Детали» (SPEC 4.14, этап 2).
export function StepsManager() {
  const { data: projects, error, loading, reload } = useAdminList<ProjectRow>('/api/admin/projects');
  const [selected, setSelected] = useState('');
  // Производное значение вместо эффекта: по умолчанию — первый проект.
  const projectId = selected || (projects?.[0]?.id ?? '');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{ru.admin.nav.steps}</h1>

      <ListStates loading={loading} error={error} empty={false} onRetry={reload}>
        {projects?.length === 0 ? (
          <Alert>
            <AlertDescription>{ru.admin.common.noProjects}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="max-w-sm">
              <Select value={projectId} onValueChange={setSelected}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={ru.admin.common.selectProject} />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {projectId && (
              <Tabs defaultValue="stages">
                <TabsList>
                  <TabsTrigger value="stages">{ru.admin.steps.tabSteps}</TabsTrigger>
                  <TabsTrigger value="parts">{ru.admin.steps.tabParts}</TabsTrigger>
                  <TabsTrigger value="options">{ru.admin.steps.tabOptions}</TabsTrigger>
                </TabsList>
                <TabsContent value="stages">
                  <StagesPanel projectId={projectId} />
                </TabsContent>
                <TabsContent value="parts">
                  <PartsPanel projectId={projectId} />
                </TabsContent>
                <TabsContent value="options">
                  <OptionsPanel projectId={projectId} />
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </ListStates>
    </div>
  );
}
