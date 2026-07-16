import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConfigOptions } from '@/components/estimate/project-configurator';
import { createClient } from '@/lib/supabase/server';
import { ru } from '@/lib/i18n/ru';
import { BuyForm } from './buy-form';

type Ctx = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: `${ru.buy.title} — ${ru.common.appName}`,
};

// SPEC 4.5 /projects/[slug]/buy (доступ: user; гость → регистрация с возвратом, US-005).
export default async function BuyPage({ params }: Ctx) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/register?next=${encodeURIComponent(`/projects/${slug}/buy`)}`);

  const db = supabase as unknown as SupabaseClient;
  const { data: project } = await db
    .from('house_projects')
    .select('id, slug, title, price_minor, currency, is_free')
    .eq('slug', slug)
    .maybeSingle();
  if (!project) notFound();
  // Доступ к is_free-проектам открывается без покупки (кабинет — этап 5).
  if (project.is_free) redirect(`/projects/${slug}`);

  const { data: options } = await db
    .from('config_options')
    .select('group_key, option_key, label, is_default, sort')
    .eq('project_id', project.id)
    .order('sort');
  const configOptions: ConfigOptions = {};
  for (const o of options ?? []) {
    (configOptions[o.group_key] ??= []).push({
      key: o.option_key,
      label: o.label,
      isDefault: o.is_default,
    });
  }

  const { data: purchase } = await db
    .from('purchases')
    .select('code, status, amount_minor, currency')
    .eq('user_id', user.id)
    .eq('project_id', project.id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{ru.buy.title}</h1>
      <BuyForm
        project={{
          id: project.id,
          slug: project.slug,
          title: project.title,
          priceMinor: project.price_minor,
          currency: project.currency,
        }}
        configOptions={configOptions}
        initialPurchase={
          purchase
            ? {
                code: purchase.code,
                status: purchase.status,
                amountMinor: purchase.amount_minor,
                currency: purchase.currency,
              }
            : null
        }
      />
    </div>
  );
}
