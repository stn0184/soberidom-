import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, House } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

export type ProjectCardData = {
  slug: string;
  title: string;
  areaM2: number;
  rooms: number;
  floors: number;
  coverImageUrl: string;
  priceMinor: number;
  currency: string;
  isFree: boolean;
  estimateMinor?: number;
  whyMatch?: string[];
};

// Карточка проекта: результаты подбора (SPEC 4.3), каталог, лендинг.
export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <Card className="overflow-hidden pt-0">
      <div className="relative aspect-video bg-muted">
        {project.coverImageUrl ? (
          <Image
            src={project.coverImageUrl}
            alt={project.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <House className="size-10" />
          </div>
        )}
        {project.isFree && (
          <Badge className="absolute left-3 top-3">{ru.results.free}</Badge>
        )}
      </div>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{ru.dict.area(project.areaM2)}</Badge>
          <Badge variant="secondary">{ru.dict.rooms(project.rooms)}</Badge>
          <Badge variant="secondary">{ru.dict.floors(project.floors)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {project.estimateMinor !== undefined && project.estimateMinor > 0 && (
          <p className="font-medium">
            {ru.results.estimate(formatMoneyMinor(project.estimateMinor, project.currency))}
          </p>
        )}
        {project.whyMatch && project.whyMatch.length > 0 && (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {project.whyMatch.map((reason) => (
              <li key={reason} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                {reason}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/projects/${project.slug}`}>{ru.results.view}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
