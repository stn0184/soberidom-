import type { EstimatePosition } from '@/lib/estimate/detailed';
import { formatDateRu } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

// Экспорт списка покупок в CSV (US-009). Значения, начинающиеся с =,+,-,@,
// экранируются апострофом — защита от формул в Excel (edge 10).
function safeCell(value: string): string {
  const escaped = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${escaped.replace(/"/g, '""')}"`;
}

export function buildEstimateCsv(positions: EstimatePosition[], currency: string): string {
  const t = ru.liveEstimate;
  // «Источник» и «Проверено» — рядом с ценой и теми же значениями, что на
  // экране (спека 005): у своей цены — «ваша цена» и пустая дата.
  const header = [
    t.thMaterial,
    t.thQty,
    t.thUnit,
    t.thPrice,
    t.thSource,
    t.thChecked,
    t.thAmount,
    'Этап',
    t.thPurchased,
  ];
  const rows = positions.map((p) => [
    safeCell(p.name),
    String(p.qty),
    safeCell(p.unit),
    (p.priceMinor / 100).toFixed(2),
    safeCell(p.isUserPrice ? t.sourceUser : (p.source?.label ?? '')),
    p.isUserPrice || !p.source ? '' : formatDateRu(p.source.checkedAt),
    (p.amountMinor / 100).toFixed(2),
    safeCell(p.stageTitle),
    p.purchased ? '1' : '0',
  ]);
  return (
    '﻿' +
    [header.map(safeCell).join(';'), ...rows.map((r) => r.join(';'))].join('\r\n') +
    `\r\n;;;;;;${(positions.reduce((s, p) => s + p.amountMinor, 0) / 100).toFixed(2)};${safeCell(currency)};`
  );
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
