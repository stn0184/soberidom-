'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Info, ShoppingCart, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SuppliesTool } from '@/components/build/build-types';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { EstimatePosition } from '@/lib/estimate/detailed';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.build.stageStart;
const te = ru.liveEstimate;
const units = ru.admin.materials.units;

export function SectionTitle({ icon, children }: { icon: React.ReactNode; children: string }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-semibold">
      <span className="text-primary">{icon}</span>
      {children}
    </h2>
  );
}

// «Перед этапом купите» (ВИДЕНИЕ 2.3): всё одной поездкой на базу.
// Галочка — тот же POST /purchased, что в смете: отметка глобальная по
// материалу и видна в смете и фин-отчёте (US-009, US-010).
export function SuppliesMaterials({
  materials,
  currency,
  purchaseId,
}: {
  materials: EstimatePosition[];
  currency: string;
  purchaseId: string;
}) {
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const isPurchased = (p: EstimatePosition) => marks[p.materialId] ?? p.purchased;
  const done = materials.filter(isPurchased).length;
  // Без цены — мимо итога; если цен нет ни у одной, итога нет вовсе.
  const missing = materials.filter((p) => p.priceMissing).length;
  const totalMinor = materials.reduce((sum, p) => (p.priceMissing ? sum : sum + p.amountMinor), 0);

  async function toggle(materialId: string, next: boolean) {
    setMarks((prev) => ({ ...prev, [materialId]: next })); // optimistic
    setBusy(materialId);
    try {
      await apiFetch(`/api/my/${purchaseId}/purchased`, {
        method: 'POST',
        body: JSON.stringify({ materialId, purchased: next }),
      });
    } catch (e) {
      setMarks((prev) => ({ ...prev, [materialId]: !next })); // сервер отверг — откат
      toast.error(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-3">
      <SectionTitle icon={<ShoppingCart className="size-5" />}>{t.suppliesTitle}</SectionTitle>
      <p className="text-sm text-muted-foreground">{t.suppliesIntro}</p>
      <div className="max-w-md space-y-1.5">
        {/* Шкала имеет смысл от двух позиций; счётчик показываем всегда. */}
        {materials.length > 1 && <Progress value={(done / materials.length) * 100} />}
        <p className="text-sm text-muted-foreground">{t.progress(done, materials.length)}</p>
      </div>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead>{te.thMaterial}</TableHead>
            <TableHead className="w-20">{te.thQty}</TableHead>
            <TableHead className="w-16">{te.thUnit}</TableHead>
            <TableHead className="w-40">{te.thPrice}</TableHead>
            <TableHead className="w-32">{te.thAmount}</TableHead>
            <TableHead className="w-20">{te.thPurchased}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((p) => (
            <TableRow key={p.materialId} className={isPurchased(p) ? 'opacity-60' : undefined}>
              <TableCell className="max-w-72">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">{p.name}</span>
                  {p.storageTip && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-4 shrink-0 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64">
                        {te.storageTipTitle}: {p.storageTip}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {p.priceMissing && <Badge variant="secondary">{te.priceMissing}</Badge>}
              </TableCell>
              <TableCell>{p.qty}</TableCell>
              <TableCell>{units[p.unit as keyof typeof units] ?? p.unit}</TableCell>
              <TableCell>
                {/* Цены нет — прочерк, а не «0 ₽»: цифра соврала бы (design.md §1). */}
                <div>{p.priceMissing ? t.noPrice : formatMoneyMinor(p.priceMinor, currency)}</div>
                {p.pricePerM3Minor !== null && (
                  <div className="text-xs text-muted-foreground">
                    {t.perM3(formatMoneyMinor(p.pricePerM3Minor, currency))}
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">
                {p.priceMissing ? t.noPrice : formatMoneyMinor(p.amountMinor, currency)}
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={isPurchased(p)}
                  disabled={busy === p.materialId}
                  onCheckedChange={(c) => void toggle(p.materialId, c === true)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {missing < materials.length && (
        <div className="flex items-baseline justify-end gap-2 text-sm">
          <span className="font-medium">{t.stageTotal(formatMoneyMinor(totalMinor, currency))}</span>
          {missing > 0 && <Badge variant="secondary">{t.totalApprox(missing)}</Badge>}
        </div>
      )}
    </section>
  );
}

// «Покупка: 6 000 ₽ · Аренда: 900 ₽/день × 3 дн.» — аренды может не быть.
function toolPrice(tool: SuppliesTool, currency: string): string {
  const buy = ru.tools.price(formatMoneyMinor(tool.approxPriceMinor, currency));
  if (tool.approxRentDayMinor === null) return buy;
  const rent = ru.tools.rent(formatMoneyMinor(tool.approxRentDayMinor, currency), tool.daysNeeded);
  return `${buy} · ${rent}`;
}

// «И это понадобится» (ВИДЕНИЕ 2.4): купить/арендовать/одолжить и чем обойтись.
export function SuppliesTools({
  tools,
  currency,
  toolsHref,
}: {
  tools: SuppliesTool[];
  currency: string;
  toolsHref: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle icon={<Wrench className="size-5" />}>{t.toolsTitle}</SectionTitle>
        <Link href={toolsHref} className="shrink-0 text-sm text-primary hover:underline">
          {t.toolsAll}
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Card key={tool.name}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{tool.name}</CardTitle>
                <Badge variant={tool.recommendation === 'buy' ? 'default' : 'secondary'}>
                  {ru.tools.recommendation[tool.recommendation]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{tool.reason}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{toolPrice(tool, currency)}</p>
              {tool.alternative && (
                <p className="text-muted-foreground">
                  {ru.tools.alternative}: {tool.alternative}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
