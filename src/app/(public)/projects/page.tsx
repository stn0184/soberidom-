import type { Metadata } from 'next';
import { Suspense } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CatalogFilters } from '@/components/quiz/catalog-filters';
import { ProjectCard, type ProjectCardData } from '@/components/quiz/project-card';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/server';
import { ru } from '@/lib/i18n/ru';

export const metadata: Metadata = {
  title: `${ru.catalog.title} — ${ru.common.appName}`,
};

const BUILDING_TYPES = ['house', 'banya', 'hozblok', 'garage'];
const STYLES = ['classic', 'barnhouse', 'scandinavian', 'a_frame', 'chalet', 'mini'];

type Ctx = { searchParams: Promise<{ buildingType?: string; style?: string }> };

// Каталог всех проектов (маршрут /projects; данные — как SPEC 3.2).
export default async function CatalogPage({ searchParams }: Ctx) {
  const { buildingType, style } = await searchParams;
  const supabase = (await createClient()) as unknown as SupabaseClient;

  let query = supabase
    .from('house_projects')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (buildingType && BUILDING_TYPES.includes(buildingType)) {
    query = query.eq('building_type', buildingType);
  }
  if (style && STYLES.includes(style)) query = query.eq('style', style);
  const { data: projects } = await query;

  const cards: ProjectCardData[] = (projects ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    areaM2: Number(p.area_m2),
    rooms: p.rooms,
    floors: p.floors,
    coverImageUrl: p.cover_image_url,
    priceMinor: p.price_minor,
    currency: p.currency,
    isFree: p.is_free,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{ru.catalog.title}</h1>
      <Suspense fallback={<Skeleton className="h-9 w-96" />}>
        <CatalogFilters />
      </Suspense>
      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          {ru.catalog.empty}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <ProjectCard key={card.slug} project={card} />
          ))}
        </div>
      )}
    </div>
  );
}
