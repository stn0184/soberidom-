'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ru } from '@/lib/i18n/ru';

const ALL = 'all';

// Фильтры каталога — через query-параметры (SPEC 3.2).
export function CatalogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === ALL) params.delete(key);
    else params.set(key, value);
    router.push(`/projects?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={searchParams.get('buildingType') ?? ALL}
        onValueChange={(v) => setParam('buildingType', v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder={ru.catalog.filterType} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{ru.catalog.filterAll}</SelectItem>
          {Object.entries(ru.dict.buildingTypes).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get('style') ?? ALL}
        onValueChange={(v) => setParam('style', v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder={ru.catalog.filterStyle} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{ru.catalog.filterAll}</SelectItem>
          {Object.entries(ru.dict.styles).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
