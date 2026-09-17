'use client';

// Прототип 003: блоки «Перед этапом купите» и «И это понадобится».
// Ничего не работает: галочки и кнопки — картинка, запросов нет.
import Link from 'next/link';
import { ChevronsUpDown, Info, ShoppingCart, Wrench } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';
import { CURRENCY, proto, type ProtoPosition, type ProtoTool } from './mock';

const te = ru.liveEstimate;
const tt = ru.tools;
const units = ru.admin.materials.units;

const REC_VARIANT: Record<ProtoTool['recommendation'], 'default' | 'secondary' | 'outline'> = {
  buy: 'default',
  rent: 'secondary',
  borrow_or_buy_cheap: 'outline',
};

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-semibold">
      <span className="text-primary">{icon}</span>
      {children}
    </h2>
  );
}

export function MaterialsBlock({ positions }: { positions: ProtoPosition[] }) {
  const done = positions.filter((p) => p.purchased).length;
  const totalMinor = positions.reduce((s, p) => s + p.amountMinor, 0);

  return (
    <section className="space-y-3">
      <SectionTitle icon={<ShoppingCart className="size-5" />}>{proto.suppliesTitle}</SectionTitle>
      <p className="text-sm text-muted-foreground">{proto.suppliesIntro}</p>

      <div className="max-w-md space-y-1.5">
        <Progress value={(done / positions.length) * 100} />
        <p className="text-sm text-muted-foreground">{proto.progress(done, positions.length)}</p>
      </div>

      <Table>
        <TableHeader>
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
          {positions.map((p) => (
            <TableRow key={p.materialId} className={p.purchased ? 'opacity-60' : undefined}>
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
                {p.priceMissing && (
                  <Badge variant="secondary" className="mt-0.5">
                    {te.priceMissing}
                  </Badge>
                )}
              </TableCell>
              <TableCell>{p.qty}</TableCell>
              <TableCell>{units[p.unit as keyof typeof units] ?? p.unit}</TableCell>
              <TableCell>
                <div>{formatMoneyMinor(p.priceMinor, CURRENCY)}</div>
                {p.pricePerM3Minor !== null && (
                  <div className="text-xs text-muted-foreground">
                    {proto.perM3((p.pricePerM3Minor / 100).toLocaleString('ru-RU'))}
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">
                {formatMoneyMinor(p.amountMinor, CURRENCY)}
              </TableCell>
              <TableCell>
                <Checkbox checked={p.purchased} aria-readonly />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="text-right text-sm font-medium">
        {proto.stageTotal(formatMoneyMinor(totalMinor, CURRENCY))}
      </p>
    </section>
  );
}

export function NeedRegionBlock() {
  return (
    <section className="space-y-3">
      <SectionTitle icon={<ShoppingCart className="size-5" />}>{proto.suppliesTitle}</SectionTitle>
      <div className="max-w-md space-y-3">
        <Alert>
          <AlertTitle>{proto.needRegionTitle}</AlertTitle>
          <AlertDescription>{proto.needRegionText}</AlertDescription>
        </Alert>
        <Label>{ru.project.regionLabel}</Label>
        {/* Вид RegionCombobox; в прототипе не открывается — в базу не ходим */}
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {proto.cityPlaceholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
        <Button disabled>{proto.save}</Button>
      </div>
    </section>
  );
}

export function ToolsBlock({ tools }: { tools: ProtoTool[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle icon={<Wrench className="size-5" />}>{proto.toolsTitle}</SectionTitle>
        <Link href="#" className="text-sm text-primary hover:underline">
          {proto.toolsAll}
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Card key={tool.name}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{tool.name}</CardTitle>
                <Badge variant={REC_VARIANT[tool.recommendation]}>
                  {tt.recommendation[tool.recommendation]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{tool.reason}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                {tt.price(formatMoneyMinor(tool.approxPriceMinor, CURRENCY))}
                {tool.approxRentDayMinor !== null && (
                  <>
                    {' · '}
                    {tt.rent(
                      formatMoneyMinor(tool.approxRentDayMinor, CURRENCY),
                      tool.daysNeeded
                    )}
                  </>
                )}
              </p>
              {tool.alternative && (
                <p className="text-muted-foreground">
                  {tt.alternative}: {tool.alternative}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function EmptyBlock() {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <p className="font-medium">{proto.emptyTitle}</p>
      <p className="mt-1 text-sm text-muted-foreground">{proto.emptyText}</p>
      <Link href="#" className="mt-3 inline-block text-sm text-primary hover:underline">
        {proto.estimateAll}
      </Link>
    </div>
  );
}
