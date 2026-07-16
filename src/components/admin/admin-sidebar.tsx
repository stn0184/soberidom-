'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, Home, ListChecks, MapPin, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const ITEMS = [
  { href: '/admin/projects', label: ru.admin.nav.projects, icon: Home },
  { href: '/admin/steps', label: ru.admin.nav.steps, icon: ListChecks },
  { href: '/admin/materials', label: ru.admin.nav.materials, icon: Package },
  { href: '/admin/regions', label: ru.admin.nav.regions, icon: MapPin },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent',
            pathname.startsWith(href) && 'bg-accent font-medium'
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
      <Link
        href="/"
        className="mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
      >
        <ExternalLink className="size-4" />
        {ru.admin.nav.backToSite}
      </Link>
    </nav>
  );
}
