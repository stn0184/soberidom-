# 005. Цены с источником и датой

**Статус:** в работе
**Размер:** M
**Зависит от:** ничего
**Прототип:** не нужен
**Читать:** `techspec/00-adr.md` (строка «Откуда в смете цены (разведка)») ·
`SPEC.md` §2.3 (`material_prices`, `retailers`, `retailer_skus`), §3.11
(живая смета), §3.12 (своя цена), §3.16 (админ-роуты, импорт CSV), §4.4
(смета витрины), §4.9 (живая смета), §5.2 п.3 (порядок выбора цены) ·
`design.md` §1 (деньги) · `UX_PRINCIPLES.md` §5
**Код:** правит — `src/lib/estimate/calc.ts`, `src/lib/estimate/detailed.ts`,
`src/lib/estimate/csv.ts`, `src/components/estimate/estimate-row.tsx`,
`src/components/estimate/estimate-panel.tsx`,
`src/components/build/stage-supplies.tsx`, `src/components/admin/material-prices.tsx`,
`src/app/admin/materials/page.tsx`, `src/app/api/admin/prices/route.ts`,
`src/app/api/admin/prices/[id]/route.ts`, `src/lib/zod/admin.ts`,
`src/lib/admin/types.ts`, `src/lib/i18n/ru.ts`, `SPEC.md` §2.3,
`src/types/database.ts` (regen или вручную в стиле генератора, как в 004);
заводит — `supabase/migrations/028_price_sources.sql`,
`src/lib/estimate/prices.ts` + `prices.test.ts`,
`src/components/estimate/price-source.tsx`,
`src/components/admin/prices-import.tsx`,
`src/app/api/admin/import/prices/route.ts`; образцы —
`src/app/api/admin/import/regions/route.ts`, `src/components/admin/regions-import.tsx`,
`src/lib/tools/effective.ts` + `effective.test.ts` (чистая функция с тестом),
`src/lib/api/helpers.ts` (`requireAdmin`, `requireOwnerPurchase`, `apiError`,
`validationError`, `dbError`), `src/lib/admin/fetcher.ts`,
`src/lib/admin/use-admin-list.ts`, `src/lib/build/progress.ts`,
`src/lib/utils.ts` (`formatMoneyMinor`), `src/lib/constants.ts`
(`COUNTRY_CURRENCY`)

## Проблема

В смете стоит «820 ₽» — и ни покупатель, ни владелец не могут ответить,
откуда это число и когда оно было правдой. Владелец не принимает такую
смету («выдумано»), покупатель на базе увидит другую цену и решит, что
сайт врёт. Сейчас у цены (`material_prices`) нет ни источника, ни даты
проверки; артикул ритейлера (`retailer_skus`) живёт отдельно и в смету
попадает «первый попавшийся»; на материал может быть только одна цена
на регион, хотя предложений всегда несколько.

Разведка 2026-09-20 (ADR «Откуда в смете цены») решила: фаза А — цена с
источником и датой, несколько предложений, ручное и CSV-обновление. Этот
этап — фаза А.

## Решение

**Данные** — миграция `028_price_sources.sql` (+ `SPEC.md` §2.3 тем же
коммитом). `material_prices` становится таблицей **предложений**:

- новые колонки: `source_kind text not null default 'manual'` с check
  `('retailer','local_base','manual','ai_search')`; `retailer_id uuid null
  references retailers(id) on delete set null`; `source_label text not null
  default ''` («Лемана ПРО», «База «Лесторг», Тверь», «прайс с телефона»);
  `source_url text not null default ''`; `checked_at date not null default
  current_date` (дата UTC — как `current_date` в Postgres и `new Date()`
  на Vercel; «Проверено сегодня» тоже шлёт UTC-дату, расхождение с МСК
  после 21:00 в один день принято);
- **подпись обязательна**: `check (length(trim(source_label)) > 0)`, Zod
  `min(1)`; у вида `retailer` форма админки подставляет название
  ритейлера, если поле пустое, у `local_base`/`manual` требует ввести;
- ограничение `unique (material_id, country_code, region_id)` снимается;
  вместо него **уникальный индекс предложения**
  `unique (material_id, country_code, coalesce(region_id, uuid_nil()),
  lower(trim(source_label)))` — на материал в регионе несколько
  предложений, но каждая подпись одна; импорт и форма опираются на него;
- существующие строки получают `source_label = 'демо'`, `checked_at =
  updated_at::date` (старый unique гарантирует по одной такой строке на
  регион — новый индекс не нарушается);
- порог устаревания — одна константа `PRICE_STALE_DAYS = 60` в
  `src/lib/constants.ts`; ею пользуются `prices.ts`, админка и тексты
  `ru.ts` (число в строку подставляется, не дублируется);
- RLS не меняется (read_all + admin_write).

**Выбор цены** — чистая функция `pickPrice(offers, regionId, today)` в
`src/lib/estimate/prices.ts` с тестом на `node:test` (как
`lib/tools/effective.ts`): среди предложений **точного региона** берётся
**самое дешёвое**; нет ни одного — самое дешёвое среди предложений «вся
страна» (`region_id null`); нет ничего — `priceMissing`. При равной цене
побеждает более свежая `checked_at`, при равной дате — меньший `id`
(порядок детерминирован, не зависит от базы). Возвращает
`{ priceMinor, source, offers }`, где `offers` — все подходящие
предложения по возрастанию цены, у каждого `stale = checked_at < today −
60 дней`. Функцию используют и `calc.ts` (витрина), и `detailed.ts`
(кабинет) — сейчас у них два одинаковых куска кода «регион → страна».
`user_prices` по-прежнему главнее всего (SPEC 5.2 п.3) — своя цена
показывается с подписью «ваша цена».

**Контракты.** `EstimatePosition` получает `source: { label, url,
checkedAt, stale } | null` и `offers: Array<{ label, url, priceMinor,
checkedAt, stale }>`. `EstimateResult` (витрина, `/api/projects/[slug]/
estimate`) — `meta.pricesCheckedOldest: string | null` (самая старая дата
среди вошедших в смету цен) и `meta.staleCount`. Ответы `/api/my/[id]/
estimate` и `/supplies` отдают позиции с `source` и `offers`. `retailer_skus`
не трогаем: артикул по-прежнему показывается ссылкой, но если у выбранного
предложения есть `source_url`, ссылка ведёт на него.

**Экран покупателя** (`estimate-row.tsx`, тот же компонент
`price-source.tsx` в `stage-supplies.tsx`): под ценой строка `text-xs
text-muted-foreground` — «Лемана ПРО · 18.09.2026 ↗» (↗ — ссылка, если
есть `url`); у своей цены — «ваша цена»; у позиции без цены — бейдж
«цена уточняется», как сейчас. Цена старше 60 дней — подпись жёлтая с
текстом «проверено 12.06.2026 — давно» (токен `text-amber-600`, без hex).
Клик по подписи открывает `Popover` со всеми предложениями: источник,
цена, дата, ссылка; самое дешёвое помечено «в смете». Одно предложение —
Popover всё равно открывается (в нём одна строка и подсказка «добавьте
свою цену, если на вашей базе дешевле»).

**Витрина** (`estimate-panel.tsx`): под итогом — «Цены проверены до
18.09.2026»; если `staleCount > 0` — «N цен старше двух месяцев, итог
может отличаться». Формат дат — `дд.мм.гггг`, единый хелпер в `utils.ts`.

**CSV-экспорт** (`csv.ts`): две новые колонки — «Источник», «Проверено».

**Админка.** `material-prices.tsx` (у материала): строка предложения
показывает вид источника, ритейлера/подпись, дату, ссылку; форма
добавления — поля `source_kind` (select), `retailer_id` (select из
`retailers` страны, только при `retailer`), `source_label`, `source_url`,
`checked_at` (по умолчанию сегодня); у строки кнопка «Проверено сегодня»
(`PATCH { checked_at: today }`) и жёлтый бейдж «устарела» при > 60 дней.
Страница `/admin/materials`: над таблицей — «Цен старше 60 дней: N»
(`GET /api/admin/prices?stale=1` отдаёт `{ data: { count } }`) и блок
**импорта прайса** `prices-import.tsx` по образцу `regions-import.tsx`:
`POST /api/admin/import/prices`, CSV с разделителем `;` и заголовком
`sku_internal;country;region;price;source_kind;source_label;source_url;checked_at`
(`region` — имя региона из `regions` или пусто = вся страна; `price` — в
рублях/тенге с копейками, **как выгружает Excel**: «820», «820.50»,
«820,50», «1 234,50» — пробелы и неразрывные пробелы убираются, запятая
считается точкой, затем `Math.round(x * 100)`; не число — строка в
`badLines`; валюта не передаётся — `COUNTRY_CURRENCY[country]`;
`checked_at` — `ГГГГ-ММ-ДД`, пусто = сегодня; `source_label` пустая —
строка в `badLines`).
Upsert по ключу уникального индекса `(material, country, region,
lower(trim(source_label)))`: совпадение всегда не больше одного — обновить
цену, ссылку, дату, вид источника; нет — вставить. Ответ — `{ inserted, updated,
badLines }`, как у регионов. Zod: `priceSchema` расширяется новыми полями,
`priceUpdateSchema = partial()`, `pricesImportSchema`.

## Чего не делаем

- Не обновляем цены автоматически и не ходим по ссылкам (ритейлеры
  закрыты антибот-защитой — ADR); не ищем цены AI-поиском (фаза Б —
  следующий этап).
- Не заводим контент: материалы и цены эталонного проекта — отдельный
  этап уже в этот формат, с источником у каждой цены (черновик
  `.tmp/028_seed_materials_bom_homesteaders.DRAFT.sql` — сырьё, не сид).
- Не даём покупателю выбирать предложение «в смету»: считается самое
  дешёвое; хочет другое — «своя цена» (уже есть).
- Не трогаем `user_prices`, `retailer_skus` и порядок «своя цена главнее».
- Не считаем среднее и не взвешиваем по надёжности источника.
- Не делаем отдельную колонку «Где купить» и не меняем ширину таблицы.
- Не отправляем письмо-отчёт об устаревших ценах (cron SPEC 5.11 не
  реализован; счётчик в админке достаточен).

## Задачи

- [x] Миграция `028_price_sources.sql`: колонки источника, снятие
      unique, индекс, бэкфилл демо-строк; `SPEC.md` §2.3 тем же коммитом;
      `db push`; типы `material_prices` в `database.ts`.
- [x] `PRICE_STALE_DAYS = 60` в `src/lib/constants.ts`.
- [x] `src/lib/estimate/prices.ts` — `pickPrice` (регион → страна, самое
      дешёвое, при равенстве — свежее, `stale` по `PRICE_STALE_DAYS`) +
      `prices.test.ts` (красный до реализации): регион дешевле страны /
      только страна / пусто / порог ровно 60 дней / равные цены —
      побеждает свежее / сортировка offers.
- [x] `calc.ts` и `detailed.ts` на `pickPrice`; `EstimatePosition.source`,
      `.offers`; `EstimateResult.meta.pricesCheckedOldest`, `staleCount`;
      `/supplies` пробрасывает `source`/`offers`.
- [ ] Zod: `priceSchema` с новыми полями, `priceUpdateSchema`,
      `pricesImportSchema`; `MaterialPriceRow` в `lib/admin/types.ts`;
      ключи `ru.liveEstimate.*`, `ru.project.*`, `ru.admin.materials.*`.
- [ ] Хелпер даты `дд.мм.гггг` в `utils.ts`; `price-source.tsx` (подпись +
      Popover с предложениями, ≤200 строк); `estimate-row.tsx` и
      `stage-supplies.tsx` на нём; `estimate-panel.tsx` — строка «цены
      проверены до…».
- [ ] `csv.ts` — колонки «Источник», «Проверено».
- [ ] Админка: `material-prices.tsx` (поля источника, «Проверено сегодня»,
      бейдж «устарела»); `GET /api/admin/prices?stale=1`; `prices-import.tsx`
      + `POST /api/admin/import/prices`; счётчик и блок импорта на
      `/admin/materials`.
- [ ] Документы по разделу ниже.

## Приёмка

- КОГДА у материала в регионе покупки два предложения с датой не старше
  60 дней, в смете ДОЛЖНА стоять меньшая цена, а под ней — источник и
  дата этого предложения.
- КОГДА в регионе покупки предложений нет, а «вся страна» есть, в смету
  ДОЛЖНО войти самое дешёвое из «всей страны».
- КОГДА у покупателя задана своя цена, она ДОЛЖНА остаться в смете с
  подписью «ваша цена», а предложения — быть видны по клику.
- КОГДА покупатель кликает подпись под ценой, ДОЛЖЕН открыться список
  всех предложений по возрастанию цены с источником, датой и ссылкой,
  где вошедшее в смету помечено «в смете».
- КОГДА `checked_at` предложения старше 60 дней, подпись под ценой
  ДОЛЖНА быть жёлтой с текстом «проверено дд.мм.гггг — давно», а в
  админке у строки — бейдж «устарела».
- КОГДА открыта смета витрины, под итогом ДОЛЖНА стоять «Цены проверены
  до дд.мм.гггг»; при наличии устаревших — «N цен старше двух месяцев».
- КОГДА покупатель выгружает CSV, в нём ДОЛЖНЫ быть колонки «Источник»
  и «Проверено» с теми же значениями, что на экране.
- КОГДА админ добавляет предложение с видом «ритейлер», форма ДОЛЖНА
  требовать выбор ритейлера; с видом «местная база» — подпись.
- КОГДА админ нажимает «Проверено сегодня», `checked_at` строки ДОЛЖЕН
  стать сегодняшней датой без перезагрузки страницы.
- КОГДА админ загружает CSV прайса с двумя новыми и одной существующей
  (по `sku_internal;country;region;source_label`) строками, ответ ДОЛЖЕН
  сообщить `inserted: 2, updated: 1`, а строки с неизвестным
  `sku_internal`, регионом, пустой подписью или нечисловой ценой —
  попасть в `badLines`, не прервав импорт.
- КОГДА в CSV цена записана как «1 234,50», в базу ДОЛЖНО попасть
  123450 минорных единиц.
- КОГДА админ добавляет второе предложение с той же подписью для того же
  материала и региона, API ДОЛЖЕН ответить ошибкой валидации с понятным
  текстом, а не упасть.
- КОГДА два предложения имеют одинаковую цену, в смету ДОЛЖНО войти то,
  что проверено позже.
- КОГДА в базе есть цены старше 60 дней, страница `/admin/materials`
  ДОЛЖНА показать их число над таблицей.
- КОГДА у материала нет ни одного предложения, позиция ДОЛЖНА показать
  бейдж «цена уточняется» и не попасть в итог — как сейчас.
- Ни одной русской строки в JSX новых компонентов: все — из `ru.ts`.

## Документы

- `SPEC.md` §2.3 — DDL `material_prices` с полями источника, check на
  подпись и уникальный индекс предложения; §3.16 — роут импорта прайса;
  §5.2 п.3 — «самое дешёвое предложение региона → страны, при равенстве
  — свежее»; §3.4 — путь роута `/api/projects/[slug]/estimate`, как в
  коде (ADR «Роут сметы витрины»). Версия в
  шапке не меняется (правило «схема = миграция + SPEC»).
- `techspec/00-adr.md`: строка «material_prices = предложения, в смету —
  самое дешёвое; порог устаревания 60 дней».
- `design.md` §1: правило подписи под ценой (источник · дата, жёлтая при
  устаревании); §3: `price-source.tsx`, `prices-import.tsx`.
- `specs/README.md`: бэклог SPEC v1.6 — §3.11 (`source`, `offers` в
  позиции), §4.9 (подпись и Popover), §4.4 (строка «цены проверены до»);
  строка 005 → `archive/README.md` при закрытии.
