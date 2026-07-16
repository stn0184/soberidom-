'use client';

import { useState, useSyncExternalStore } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createClient } from '@/lib/supabase/client';
import type { RegionRow } from '@/lib/admin/types';
import { cn } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

export type RegionOption = { id: string; name: string; countryCode: string };

// Кэш регионов на клиенте: справочник маленький, читается один раз (RLS: чтение всем).
let cache: RegionOption[] | null = null;
let cachePromise: PromiseLike<void> | null = null;
const listeners = new Set<() => void>();

function loadRegions() {
  cachePromise ??= createClient()
    .from('regions')
    .select('id, name, country_code')
    .order('country_code')
    .order('name')
    .then(({ data }) => {
      cache = ((data ?? []) as Pick<RegionRow, 'id' | 'name' | 'country_code'>[]).map((r) => ({
        id: r.id,
        name: r.name,
        countryCode: r.country_code.trim(),
      }));
      listeners.forEach((l) => l());
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  loadRegions();
  return () => listeners.delete(listener);
}

export function useRegions(): RegionOption[] | null {
  return useSyncExternalStore(
    subscribe,
    () => cache,
    () => null
  );
}

// Автокомплит города из таблицы regions (US-001 шаг 4, SPEC 4.2).
export function RegionCombobox({
  value,
  onChange,
}: {
  value: RegionOption | null;
  onChange: (region: RegionOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const regions = useRegions();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {value ? `${value.name} (${value.countryCode})` : ru.quiz.cityPlaceholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder={ru.quiz.cityPlaceholder} />
          <CommandList>
            <CommandEmpty>{ru.quiz.cityEmpty}</CommandEmpty>
            <CommandGroup>
              {(regions ?? []).map((region) => (
                <CommandItem
                  key={region.id}
                  value={`${region.name} ${region.countryCode}`}
                  onSelect={() => {
                    onChange(region);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn('mr-1', value?.id === region.id ? 'opacity-100' : 'opacity-0')}
                  />
                  {region.name}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {ru.countries[region.countryCode as keyof typeof ru.countries] ??
                      region.countryCode}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
