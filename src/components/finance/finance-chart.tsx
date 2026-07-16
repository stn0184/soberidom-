'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

export type StageMoneyRow = {
  stageCode: string;
  title: string;
  planMinor: number;
  factMinor: number;
};

function compactRub(value: number): string {
  const rub = value / 100;
  if (rub >= 1_000_000) return `${(rub / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн`;
  if (rub >= 1_000) return `${Math.round(rub / 1_000)} тыс`;
  return String(Math.round(rub));
}

// План/факт по этапам (SPEC 4.10). Пара цветов валидирована (dataviz):
// тонкие бары, скруглённый верх 4px, приглушённая сетка, легенда + тултип.
export function FinanceChart({ rows, currency }: { rows: StageMoneyRow[]; currency: string }) {
  const data = rows.map((r) => ({
    name: r.title,
    plan: r.planMinor,
    fact: r.factMinor,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            interval={0}
            height={40}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickFormatter={compactRub}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--popover-foreground)',
            }}
            formatter={(value, name) => [
              formatMoneyMinor(Number(value ?? 0), currency),
              String(name) === 'plan' ? ru.finance.plan : ru.finance.fact,
            ]}
          />
          <Legend
            formatter={(value: string) => (
              <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>
                {value === 'plan' ? ru.finance.plan : ru.finance.fact}
              </span>
            )}
          />
          <Bar dataKey="plan" fill="var(--chart-plan)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="fact" fill="var(--chart-fact)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
