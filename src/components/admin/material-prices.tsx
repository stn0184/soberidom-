'use client';

import { Separator } from '@/components/ui/separator';
import { ListStates } from '@/components/admin/list-states';
import { PriceOfferForm } from '@/components/admin/price-offer-form';
import { PriceOfferRow } from '@/components/admin/price-offer-row';
import type { MaterialPriceRow, RegionRow, RetailerRow } from '@/lib/admin/types';
import { useAdminList } from '@/lib/admin/use-admin-list';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.materials;

// Предложения цены у материала (спека 005): страна + регион (null = вся
// страна) + источник с датой проверки. Строка и форма — отдельные файлы.
export function MaterialPrices({ materialId }: { materialId: string }) {
  const prices = useAdminList<MaterialPriceRow>(`/api/admin/prices?materialId=${materialId}`);
  const regions = useAdminList<RegionRow>('/api/admin/regions');
  const retailers = useAdminList<RetailerRow>('/api/admin/retailers');

  const regionName = (id: string | null) =>
    id === null ? t.priceRegionAll : (regions.data?.find((r) => r.id === id)?.name ?? id);

  return (
    <div className="space-y-4">
      <Separator />
      <h3 className="font-medium">{t.pricesTitle}</h3>

      <ListStates
        loading={prices.loading || regions.loading || retailers.loading}
        error={prices.error || regions.error || retailers.error}
        empty={false}
        onRetry={() => {
          void prices.reload();
          void regions.reload();
          void retailers.reload();
        }}
      >
        {prices.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noPrices}</p>
        ) : (
          <div className="space-y-2">
            {prices.data?.map((row) => (
              <PriceOfferRow
                key={row.id}
                row={row}
                regionName={regionName(row.region_id)}
                onChanged={() => void prices.reload()}
              />
            ))}
          </div>
        )}
      </ListStates>

      <PriceOfferForm
        materialId={materialId}
        regions={regions.data ?? []}
        retailers={retailers.data ?? []}
        onAdded={() => void prices.reload()}
      />
    </div>
  );
}
