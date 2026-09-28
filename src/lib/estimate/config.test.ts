import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveConfig, type ConfigOptionRow } from './config.ts';

// Выбор покупателя → конфигурация покупки и сметы (спека 009).
// Запуск: node --test src/lib/estimate/config.test.ts

const opt = (
  group_key: string,
  option_key: string,
  sort: number,
  is_default = false
): ConfigOptionRow => ({ group_key, option_key, sort, is_default });

const OPTIONS: ConfigOptionRow[] = [
  opt('lumber', 'natural', 1, true),
  opt('lumber', 'dry', 2),
  opt('subfloor', 'plywood', 2),
  opt('subfloor', 'osb', 1, true),
];

test('валидный вариант сохраняется', () => {
  assert.deepEqual(resolveConfig({ lumber: 'dry', subfloor: 'plywood' }, OPTIONS), {
    lumber: 'dry',
    subfloor: 'plywood',
  });
});

test('неизвестный вариант → вариант по умолчанию', () => {
  assert.deepEqual(resolveConfig({ lumber: 'oak', subfloor: 'osb' }, OPTIONS), {
    lumber: 'natural',
    subfloor: 'osb',
  });
});

test('вариант чужой группы не принимается', () => {
  assert.deepEqual(resolveConfig({ lumber: 'plywood' }, OPTIONS), {
    lumber: 'natural',
    subfloor: 'osb',
  });
});

test('нестроковое значение — как неизвестный вариант', () => {
  assert.deepEqual(resolveConfig({ lumber: 1, subfloor: { key: 'plywood' } }, OPTIONS), {
    lumber: 'natural',
    subfloor: 'osb',
  });
});

test('лишняя группа отбрасывается, согласие роут дописывает сам', () => {
  const out = resolveConfig(
    { lumber: 'dry', roofing: 'ondulin', consent: { version: '1' } },
    OPTIONS
  );
  assert.deepEqual(out, { lumber: 'dry', subfloor: 'osb' });
  assert.equal(Object.hasOwn(out, 'roofing'), false);
  assert.equal(Object.hasOwn(out, 'consent'), false);
});

test('нет присланной конфигурации → все умолчания', () => {
  const expected = { lumber: 'natural', subfloor: 'osb' };
  assert.deepEqual(resolveConfig(undefined, OPTIONS), expected);
  assert.deepEqual(resolveConfig(null, OPTIONS), expected);
  assert.deepEqual(resolveConfig({}, OPTIONS), expected);
});

test('группа без is_default → первый по sort, а не по порядку в массиве', () => {
  const options = [opt('roofing', 'ondulin', 3), opt('roofing', 'proflist', 2), opt('roofing', 'metal_tile', 5)];
  assert.deepEqual(resolveConfig({}, options), { roofing: 'proflist' });
});

test('равный sort → по option_key, от порядка строк из базы не зависит', () => {
  const a = [opt('roofing', 'ondulin', 1), opt('roofing', 'metal_tile', 1)];
  const b = [opt('roofing', 'metal_tile', 1), opt('roofing', 'ondulin', 1)];
  assert.deepEqual(resolveConfig({}, a), { roofing: 'metal_tile' });
  assert.deepEqual(resolveConfig({}, b), { roofing: 'metal_tile' });
});

test('два варианта по умолчанию → первый из них по sort', () => {
  const options = [opt('lumber', 'dry', 2, true), opt('lumber', 'natural', 1, true)];
  assert.deepEqual(resolveConfig({}, options), { lumber: 'natural' });
});

test('проект без вариантов → пустая конфигурация', () => {
  assert.deepEqual(resolveConfig({ lumber: 'dry' }, []), {});
});

test('входные данные не меняются', () => {
  const options = [opt('roofing', 'ondulin', 3), opt('roofing', 'proflist', 2)];
  const snapshot = JSON.stringify(options);
  const input = { roofing: 'x' };
  resolveConfig(input, options);
  assert.equal(JSON.stringify(options), snapshot);
  assert.deepEqual(input, { roofing: 'x' });
});
