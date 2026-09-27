import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildConsent, displayHost, parseLegalEntity, planAttribution } from './helpers.ts';

// Реквизиты из окружения, хост источника планов и объект согласия (спека 006).
// Запуск: node --test src/lib/legal/helpers.test.ts

test('parseLegalEntity: строка через « | » — по части на строку, без пустых', () => {
  assert.deepEqual(
    parseLegalEntity('ИП Иванов И. И. | ИНН 1234567890 |  ОГРНИП 123 | г. Тверь, ул. Лесная, 1'),
    ['ИП Иванов И. И.', 'ИНН 1234567890', 'ОГРНИП 123', 'г. Тверь, ул. Лесная, 1'],
  );
  assert.deepEqual(parseLegalEntity('a | | b'), ['a', 'b']);
  assert.deepEqual(parseLegalEntity('   '), []);
  assert.deepEqual(parseLegalEntity(''), []);
  assert.deepEqual(parseLegalEntity('ООО «Дом»'), ['ООО «Дом»']);
});

test('displayHost: хост без www, мусор и пустота — пустая строка', () => {
  assert.equal(displayHost('https://www.tinyhousedesign.com/plans/cabin'), 'tinyhousedesign.com');
  assert.equal(displayHost('https://creativecommons.org/licenses/by-nc/3.0/us/'), 'creativecommons.org');
  assert.equal(displayHost('not a url'), '');
  assert.equal(displayHost(''), '');
});

test('planAttribution: snake_case строки БД → camelCase, null и отсутствие колонок → пустые строки', () => {
  assert.deepEqual(
    planAttribution({
      plan_author: 'Michael Janzen',
      plan_source_url: 'https://tinyhousedesign.com',
      plan_license: 'CC BY-NC 3.0',
      plan_license_url: 'https://creativecommons.org/licenses/by-nc/3.0/us/',
    }),
    {
      planAuthor: 'Michael Janzen',
      planSourceUrl: 'https://tinyhousedesign.com',
      planLicense: 'CC BY-NC 3.0',
      planLicenseUrl: 'https://creativecommons.org/licenses/by-nc/3.0/us/',
    },
  );
  assert.deepEqual(planAttribution({ plan_author: null }), {
    planAuthor: '',
    planSourceUrl: '',
    planLicense: '',
    planLicenseUrl: '',
  });
  assert.deepEqual(planAttribution({}), {
    planAuthor: '',
    planSourceUrl: '',
    planLicense: '',
    planLicenseUrl: '',
  });
});

test('buildConsent: оба флага, версия и ISO-дата момента согласия', () => {
  const at = new Date('2026-09-27T10:00:00Z');
  assert.deepEqual(buildConsent('2026-09-27', at), {
    disclaimer: true,
    offer: true,
    version: '2026-09-27',
    at: '2026-09-27T10:00:00.000Z',
  });
  const now = buildConsent('2026-09-27');
  assert.equal(now.version, '2026-09-27');
  assert.ok(!Number.isNaN(Date.parse(now.at)));
});
