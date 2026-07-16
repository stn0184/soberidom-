import type { MetadataRoute } from 'next';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// SEO (SPEC 5.9): /, /projects и все published-витрины.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data: projects } = await supabase
    .from('house_projects')
    .select('slug, updated_at')
    .eq('status', 'published');

  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/projects`, changeFrequency: 'weekly', priority: 0.8 },
    ...(projects ?? []).map((p) => ({
      url: `${base}/projects/${p.slug}`,
      lastModified: new Date(p.updated_at as string),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
