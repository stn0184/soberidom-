import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CheckCircle2, ClipboardList, Hammer, Ruler } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectCard, type ProjectCardData } from '@/components/quiz/project-card';
import { createClient } from '@/lib/supabase/server';
import { ru } from '@/lib/i18n/ru';

const HOW_ICONS = [ClipboardList, Ruler, Hammer];

// Лендинг (SPEC 4.1): hero → как это работает → пример шага → проекты → FAQ → CTA.
export default async function HomePage() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data: projects } = await supabase
    .from('house_projects')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(3);

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
    <div className="mx-auto w-full max-w-6xl space-y-20 px-4 py-16">
      <section className="flex flex-col items-center gap-5 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{ru.home.heroTitle}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{ru.home.heroSubtitle}</p>
        <Button asChild size="lg">
          <Link href="/quiz">{ru.landing.heroCta}</Link>
        </Button>
      </section>

      <section id="how" className="space-y-6">
        <h2 className="text-center text-3xl font-semibold">{ru.landing.howTitle}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {ru.landing.how.map((item, index) => {
            const Icon = HOW_ICONS[index] ?? ClipboardList;
            return (
              <Card key={item.title}>
                <CardHeader>
                  <Icon className="size-8 text-primary" />
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{item.text}</CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-center text-3xl font-semibold">{ru.landing.exampleTitle}</h2>
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <p className="text-sm text-muted-foreground">{ru.landing.example.stepLabel}</p>
            <CardTitle>{ru.landing.example.stepTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="italic text-muted-foreground">{ru.landing.example.why}</p>
            <p>{ru.landing.example.take}</p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              {ru.landing.example.check}
            </p>
          </CardContent>
        </Card>
      </section>

      {cards.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold">{ru.landing.projectsTitle}</h2>
            <Button asChild variant="outline">
              <Link href="/projects">{ru.landing.allProjects}</Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <ProjectCard key={card.slug} project={card} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-center text-3xl font-semibold">{ru.landing.faqTitle}</h2>
        <Accordion type="single" collapsible className="mx-auto max-w-2xl">
          {ru.landing.faq.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-2xl bg-muted/50 p-12 text-center">
        <h2 className="text-3xl font-semibold">{ru.landing.finalTitle}</h2>
        <Button asChild size="lg">
          <Link href="/quiz">{ru.landing.heroCta}</Link>
        </Button>
      </section>
    </div>
  );
}
