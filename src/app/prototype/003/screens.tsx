'use client';

// Прототип 003: три состояния экрана начала этапа на одной странице.
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StageStartPreview } from './stage-start-preview';

const VARIANTS = [
  { value: 'normal', label: 'Штатно' },
  { value: 'empty', label: 'Пусто' },
  { value: 'needRegion', label: 'Без региона' },
] as const;

export function Screens() {
  return (
    <Tabs defaultValue="normal" className="space-y-6">
      <TabsList>
        {VARIANTS.map((v) => (
          <TabsTrigger key={v.value} value={v.value}>
            {v.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {VARIANTS.map((v) => (
        <TabsContent key={v.value} value={v.value}>
          <StageStartPreview variant={v.value} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
