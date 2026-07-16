import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Lightbulb } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ProjectConfigurator,
  type ConfigOptions,
} from '@/components/estimate/project-configurator';
import { Project3d } from '@/components/three/project-3d';
import { createClient } from '@/lib/supabase/server';
import type { LayoutNote } from '@/lib/admin/types';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ slug: string }> };

async function fetchProject(slug: string) {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data: project } = await supabase
    .from('house_projects')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!project) return null;
  const { data: options } = await supabase
    .from('config_options')
    .select('*')
    .eq('project_id', project.id)
    .order('sort');
  const configOptions: ConfigOptions = {};
  for (const o of options ?? []) {
    (configOptions[o.group_key] ??= []).push({
      key: o.option_key,
      label: o.label,
      isDefault: o.is_default,
      imageUrl: o.image_url,
      humanDescription: o.human_description,
      priceHint: o.price_hint,
      isBeginnerChoice: o.is_beginner_choice,
      beginnerAdvice: o.beginner_advice,
    });
  }
  return { project, configOptions };
}

// SEO (SPEC 5.9): title/description из данных проекта, OpenGraph cover.
export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchProject(slug);
  if (!result) return {};
  const { project } = result;
  const notes = (project.layout_notes ?? []) as LayoutNote[];
  return {
    title: `Проект ${project.title} — смета и инструкция | ${ru.common.appName}`,
    description: notes.map((n) => n.text).join(' ').slice(0, 160) || project.description.slice(0, 160),
    openGraph: project.cover_image_url ? { images: [project.cover_image_url] } : undefined,
  };
}

export default async function ProjectPage({ params }: Ctx) {
  const { slug } = await params;
  const result = await fetchProject(slug);
  if (!result) notFound();
  const { project, configOptions } = result;
  const notes = (project.layout_notes ?? []) as LayoutNote[];
  const gallery = (project.gallery_urls ?? []) as string[];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold sm:text-4xl">{project.title}</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{ru.dict.buildingTypes[project.building_type as keyof typeof ru.dict.buildingTypes]}</Badge>
          <Badge variant="secondary">{ru.dict.styles[project.style as keyof typeof ru.dict.styles]}</Badge>
          <Badge variant="secondary">{project.footprint}</Badge>
          <Badge variant="secondary">{ru.dict.area(Number(project.area_m2))}</Badge>
          <Badge variant="secondary">{ru.dict.rooms(project.rooms)}</Badge>
          <Badge variant="secondary">{ru.dict.floors(project.floors)}</Badge>
          {project.sp_compliant && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge>{ru.project.spBadge}</Badge>
              </TooltipTrigger>
              <TooltipContent>{ru.project.spTooltip}</TooltipContent>
            </Tooltip>
          )}
          {project.is_free && <Badge>{ru.results.free}</Badge>}
        </div>
        {project.description && (
          <p className="max-w-3xl text-muted-foreground">{project.description}</p>
        )}
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        {gallery.length > 0 && (
          <Carousel className="w-full">
            <CarouselContent>
              {gallery.map((url) => (
                <CarouselItem key={url}>
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                    <Image src={url} alt={project.title} fill className="object-cover" unoptimized />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        )}
        <div className={gallery.length === 0 ? 'lg:col-span-2' : ''}>
          <Project3d
            modelUrl={project.model_glb_url}
            fallbackUrl={project.isometric_fallback_url || project.cover_image_url}
            title={project.title}
          />
        </div>
      </section>

      {notes.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">{ru.project.layoutTitle}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {notes.map((note) => (
              <li key={note.title} className="flex gap-3 rounded-xl border p-4">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">{note.title}</p>
                  <p className="text-sm text-muted-foreground">{note.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Воронка эмоций (UX_PRINCIPLES п.4): комплектация → FAQ → фундамент-гид в самом низу. */}
      <ProjectConfigurator
        projectId={project.id}
        slug={project.slug}
        priceMinor={project.price_minor}
        currency={project.currency}
        isFree={project.is_free}
        configOptions={configOptions}
      >
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">{ru.project.buyFaqTitle}</h2>
          <Accordion type="single" collapsible className="max-w-3xl">
            {ru.project.buyFaq.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </ProjectConfigurator>
    </div>
  );
}
