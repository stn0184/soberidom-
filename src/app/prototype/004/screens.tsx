'use client';

// Прототип 004: экраны этапа на одной странице — переключатель сверху.
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminToolsPreview } from './admin-tools-preview';
import { StageToolsPreview } from './stage-tools-preview';
import { ToolsPreview } from './tools-preview';

export function Screens() {
  return (
    <Tabs defaultValue="tools" className="space-y-6">
      <TabsList>
        <TabsTrigger value="tools">Инструменты</TabsTrigger>
        <TabsTrigger value="stage">Экран этапа</TabsTrigger>
        <TabsTrigger value="admin">Админка</TabsTrigger>
        <TabsTrigger value="empty">Пусто</TabsTrigger>
      </TabsList>

      <TabsContent value="tools">
        <ToolsPreview />
      </TabsContent>
      <TabsContent value="stage">
        <StageToolsPreview />
      </TabsContent>
      <TabsContent value="admin">
        <AdminToolsPreview />
      </TabsContent>
      <TabsContent value="empty" className="space-y-10">
        <ToolsPreview empty />
        <AdminToolsPreview empty />
      </TabsContent>
    </Tabs>
  );
}
