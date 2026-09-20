import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMoneyToMinor, pickPrice, type PriceOffer } from './prices.ts';

// Выбор предложения в смету и разбор цены из прайса (спека 005).
// Запуск: node --test src/lib/estimate/prices.test.ts

const TODAY = '2026-09-20';
const TVER = 'region-tver';

const offer = (over: Partial<PriceOffer> & { id: string }): PriceOffer => ({
  regionId: null,
  priceMinor: 100_000,
  label: 'Лемана ПРО',
  url: '',
  checkedAt: TODAY,
  ...over,
});

test('в смету идёт самое дешёвое предложение региона', () => {
  const picked = pickPrice(
    [
      offer({ id: 'a', regionId: TVER, priceMinor: 82_000, label: 'База «Лесторг»' }),
      offer({ id: 'b', regionId: TVER, priceMinor: 91_000 }),
    ],
    TVER,
    TODAY
  );
  assert.equal(picked?.priceMinor, 82_000);
  assert.equal(picked?.source.label, 'База «Лесторг»');
});

test('предложение региона важнее более дешёвого «по всей стране»', () => {
  const picked = pickPrice(
    [
      offer({ id: 'country', priceMinor: 70_000, label: 'Средняя по стране' }),
      offer({ id: 'region', regionId: TVER, priceMinor: 82_000, label: 'База «Лесторг»' }),
    ],
    TVER,
    TODAY
  );
  assert.equal(picked?.priceMinor, 82_000);
  assert.equal(picked?.offers.length, 1); // предложения страны в список не подмешиваются
});

test('в регионе предложений нет — берётся самое дешёвое «по всей стране»', () => {
  const picked = pickPrice(
    [
      offer({ id: 'a', priceMinor: 95_000 }),
      offer({ id: 'b', priceMinor: 88_000, label: 'Петрович' }),
    ],
    TVER,
    TODAY
  );
  assert.equal(picked?.priceMinor, 88_000);
  assert.equal(picked?.source.label, 'Петрович');
});

test('предложений нет вовсе — цены нет', () => {
  assert.equal(pickPrice([], TVER, TODAY), null);
});

test('предложение чужого региона не подходит', () => {
  assert.equal(pickPrice([offer({ id: 'a', regionId: 'region-omsk' })], TVER, TODAY), null);
});

test('ровно 60 дней — ещё не «давно», 61 — уже «давно»', () => {
  const border = pickPrice([offer({ id: 'a', checkedAt: '2026-07-22' })], null, TODAY);
  assert.equal(border?.source.stale, false);
  const old = pickPrice([offer({ id: 'a', checkedAt: '2026-07-21' })], null, TODAY);
  assert.equal(old?.source.stale, true);
});

test('при равной цене побеждает проверенное позже', () => {
  const picked = pickPrice(
    [
      offer({ id: 'old', priceMinor: 82_000, checkedAt: '2026-08-01', label: 'Старое' }),
      offer({ id: 'new', priceMinor: 82_000, checkedAt: '2026-09-15', label: 'Свежее' }),
    ],
    null,
    TODAY
  );
  assert.equal(picked?.source.label, 'Свежее');
});

test('при равной цене и дате порядок задаёт id, а не база', () => {
  const rows = [
    offer({ id: 'b', label: 'Вторая' }),
    offer({ id: 'a', label: 'Первая' }),
  ];
  assert.equal(pickPrice(rows, null, TODAY)?.source.label, 'Первая');
  assert.equal(pickPrice([...rows].reverse(), null, TODAY)?.source.label, 'Первая');
});

test('offers отсортированы по возрастанию цены, первое — то, что в смете', () => {
  const picked = pickPrice(
    [
      offer({ id: 'a', priceMinor: 95_000, label: 'Дорого' }),
      offer({ id: 'b', priceMinor: 82_000, label: 'Дёшево' }),
      offer({ id: 'c', priceMinor: 88_000, label: 'Средне' }),
    ],
    null,
    TODAY
  );
  assert.deepEqual(picked?.offers.map((o) => o.label), ['Дёшево', 'Средне', 'Дорого']);
  assert.equal(picked?.source.label, picked?.offers[0].label);
});

test('цена из Excel: пробелы, неразрывные пробелы и запятая', () => {
  assert.equal(parseMoneyToMinor('820'), 82_000);
  assert.equal(parseMoneyToMinor('820.50'), 82_050);
  assert.equal(parseMoneyToMinor('820,50'), 82_050);
  assert.equal(parseMoneyToMinor('1 234,50'), 123_450);
  assert.equal(parseMoneyToMinor('1 234,50'), 123_450);
});

test('не число и отрицательная цена — не цена', () => {
  assert.equal(parseMoneyToMinor(''), null);
  assert.equal(parseMoneyToMinor('дорого'), null);
  assert.equal(parseMoneyToMinor('-10'), null);
});
