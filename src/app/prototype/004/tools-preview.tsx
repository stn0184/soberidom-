'use client';

// Прототип 004: экран /my/[id]/tools — потребность с вариантами и выбором.
// Ничего не работает: фильтр не фильтрует, карточки не кликаются.
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';
import { VariantCard } from './tool-variant-card-preview';
import {
  ALL_STAGES,
  CURRENCY,
  STAGE_NAMES,
  TOOLS,
  effectiveVariant,
  proto,
  summary,
  type ProtoTool,
} from './mock';

const MAX_CHIPS = 4;

function StageChips({ stages }: { stages: string[] }) {
  if (stages.length === ALL_STAGES.length) {
    return <Badge variant="secondary">{proto.allStages}</Badge>;
  }
  const shown = stages.slice(0, MAX_CHIPS);
  const rest = stages.length - shown.length;
  return (
    <>
      {shown.map((code) => (
        <Badge key={code} variant="secondary">
          {STAGE_NAMES[code] ?? code}
        </Badge>
      ))}
      {rest > 0 && <Badge variant="outline">{proto.moreStages(rest)}</Badge>}
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{proto.byYourChoice}</p>
      </CardContent>
    </Card>
  );
}

function ToolCard({ tool }: { tool: ProtoTool }) {
  const active = effectiveVariant(tool);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{tool.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{tool.reason}</p>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <StageChips stages={tool.stages} />
          <span className="text-xs text-muted-foreground">{proto.daysNeeded(tool.daysNeeded)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tool.variants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              days={tool.daysNeeded}
              active={variant.id === active.id}
              isChoice={variant.id === tool.chosenVariantId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ToolsPreview({ empty = false }: { empty?: boolean }) {
  const { buyTotalMinor, rentTotalMinor } = summary(TOOLS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{proto.title}</h1>
        <p className="max-w-3xl text-muted-foreground">{proto.intro}</p>
      </div>

      {empty ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">{proto.emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{proto.emptyText}</p>
        </div>
      ) : (
        <>
          <div className="grid max-w-xl gap-3 sm:grid-cols-2">
            <StatCard
              label={proto.buyTotal}
              value={formatMoneyMinor(buyTotalMinor, CURRENCY)}
            />
            <StatCard
              label={proto.rentTotal}
              value={formatMoneyMinor(rentTotalMinor, CURRENCY)}
            />
          </div>

          <Select value="all" onValueChange={() => {}}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={ru.tools.filterCategory} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{proto.filterAll}</SelectItem>
              {Object.entries(ru.tools.categories).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-4">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
