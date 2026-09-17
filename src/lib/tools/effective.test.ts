import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectiveVariant, toolsSummary, type ToolLike, type VariantLike } from './effective.ts';

// Отбор действующего варианта и суммы «Купить ≈ / Арендовать ≈» (спека 004).
// Запуск: node --test src/lib/tools/effective.test.ts

const variant = (over: Partial<VariantLike> & { id: string }): VariantLike => ({
  recommendation: 'buy',
  priceMinor: 1000,
  rentDayMinor: null,
  isBeginnerChoice: false,
  sort: 0,
  ...over,
});

const saw = variant({ id: 'saw', sort: 0, priceMinor: 80000 });
const beginner = variant({ id: 'circular', sort: 1, priceMinor: 650000, isBeginnerChoice: true });
const miter = variant({
  id: 'miter',
  sort: 2,
  recommendation: 'rent',
  priceMinor: null,
  rentDayMinor: 70000,
});

const tool = (over: Partial<ToolLike> = {}): ToolLike => ({
  daysNeeded: 41,
  variants: [saw, beginner, miter],
  chosenVariantId: null,
  ...over,
});

test('без выбора действует вариант «для новичка»', () => {
  assert.equal(effectiveVariant(tool())?.id, 'circular');
});

test('выбор покупателя важнее пометки «для новичка»', () => {
  assert.equal(effectiveVariant(tool({ chosenVariantId: 'miter' }))?.id, 'miter');
});

test('выбранного варианта больше нет — возвращаемся к «для новичка»', () => {
  assert.equal(effectiveVariant(tool({ chosenVariantId: 'deleted' }))?.id, 'circular');
});

test('никто не помечен — первый по sort', () => {
  const variants = [miter, saw].map((v) => ({ ...v, isBeginnerChoice: false }));
  assert.equal(effectiveVariant(tool({ variants }))?.id, 'saw');
});

test('помечены двое — первый по sort среди помеченных', () => {
  const variants = [
    { ...miter, isBeginnerChoice: true },
    { ...saw, isBeginnerChoice: true },
  ];
  assert.equal(effectiveVariant(tool({ variants }))?.id, 'saw');
});

test('потребность без вариантов действующего варианта не имеет', () => {
  assert.equal(effectiveVariant(tool({ variants: [] })), null);
});

test('покупка идёт в «Купить», аренда — ценой за сутки на дни потребности', () => {
  const sums = toolsSummary([tool(), tool({ chosenVariantId: 'miter', daysNeeded: 10 })]);
  assert.deepEqual(sums, { buyTotalMinor: 650000, rentTotalMinor: 700000 });
});

test('«одолжить или купить дешёвый» — это всё же покупка', () => {
  const cheap = variant({ id: 'cheap', recommendation: 'borrow_or_buy_cheap', priceMinor: 50000 });
  const sums = toolsSummary([tool({ variants: [cheap], chosenVariantId: 'cheap' })]);
  assert.deepEqual(sums, { buyTotalMinor: 50000, rentTotalMinor: 0 });
});

test('вариант без цены в сумму не входит', () => {
  const free = variant({ id: 'free', priceMinor: null, rentDayMinor: 100 });
  const rentOnly = variant({ id: 'r', recommendation: 'rent', priceMinor: 900, rentDayMinor: null });
  const sums = toolsSummary([
    tool({ variants: [free], chosenVariantId: 'free' }),
    tool({ variants: [rentOnly], chosenVariantId: 'r' }),
  ]);
  assert.deepEqual(sums, { buyTotalMinor: 0, rentTotalMinor: 0 });
});

test('потребность без вариантов сумму не ломает', () => {
  assert.deepEqual(toolsSummary([tool({ variants: [] })]), {
    buyTotalMinor: 0,
    rentTotalMinor: 0,
  });
});
