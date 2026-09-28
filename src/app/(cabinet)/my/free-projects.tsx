'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { House } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FreeAccessDialog,
  type FreeAccessProject,
} from '@/components/cabinet/free-access-dialog';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { ru } from '@/lib/i18n/ru';

const t = ru.my;

export type FreeProject = FreeAccessProject & { slug: string; coverImageUrl: string };

// Выбор с витрины этого проекта (sessionStorage, ключ — как в buy-form): только строковые
// значения. Нет или не разбирается — без config, сервер возьмёт варианты по умолчанию.
function showcaseConfig(projectId: string): Record<string, string> | undefined {
  try {
    const raw = sessionStorage.getItem(`sd_config_${projectId}`);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
    const config: Record<string, string> = {};
    for (const [group, value] of Object.entries(parsed)) {
      if (typeof value === 'string') config[group] = value;
    }
    return config;
  } catch {
    return undefined;
  }
}

// Раздел «Попробуйте бесплатно» на /my (v1.5): is_free-проекты без покупки.
// Кнопка открывает диалог согласия (спека 006); после согласия POST /api/my/free-access
// создаёт нулевую активную покупку с выбором витрины и уводит на хаб проекта.
export function FreeProjects({ projects }: { projects: FreeProject[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<FreeProject | null>(null);
  const [busy, setBusy] = useState(false);

  async function openFree(projectId: string) {
    setBusy(true);
    try {
      const body = await apiFetch<{ data: { purchaseId: string } }>('/api/my/free-access', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          config: showcaseConfig(projectId),
          disclaimerAccepted: true,
        }),
      });
      router.push(`/my/${body.data.purchaseId}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
      setBusy(false);
    }
  }

  if (projects.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{t.freeTitle}</h2>
        <p className="text-muted-foreground">{t.freeText}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <Card key={p.id} className="overflow-hidden pt-0">
            <div className="relative aspect-video bg-muted">
              {p.coverImageUrl ? (
                <Image src={p.coverImageUrl} alt={p.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <House className="size-10" />
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle>{p.title}</CardTitle>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" disabled={busy} onClick={() => setSelected(p)}>
                {t.freeOpen}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <FreeAccessDialog
        project={selected}
        busy={busy}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onConfirm={(id) => void openFree(id)}
      />
    </section>
  );
}
