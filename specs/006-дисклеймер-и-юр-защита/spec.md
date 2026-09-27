# 006. Дисклеймер и юр-защита

**Статус:** запланировано
**Размер:** M
**Зависит от:** ничего
**Прототип:** не нужен
**Читать:** `ВИДЕНИЕ_и_ПРИОРИТЕТЫ.md` §4 («Дисклеймер и юр-защита») ·
`ТЕХПАСПОРТ_HomesteadersCabin.md` §7 (лицензия CC BY-NC 3.0) · `SPEC.md`
§0 таблица маршрутов (`/legal/*`) и «Глобальные правила» (дисклеймер),
§2.4 (`house_projects`), §2.6 (`purchases.config`), §3.6 (`POST
/api/purchases`, `disclaimerAccepted`), §4.1 (лендинг, footer), §4.4
(витрина), §4.5 (покупка), §4.6 (`/my`), §5.9 (sitemap), Блок 6 edge 20 ·
`techspec/00-adr.md` · `design.md` §1 · `UX_PRINCIPLES.md` §5
**Код:** правит — `src/app/(public)/layout.tsx` (footer),
`src/app/(public)/projects/[slug]/page.tsx`, `src/app/(cabinet)/my/[purchaseId]/page.tsx`,
`src/app/(cabinet)/my/my-projects.tsx`, `src/app/(public)/projects/[slug]/buy/buy-form.tsx`,
`src/app/api/purchases/route.ts`, `src/app/api/my/free-access/route.ts`,
`src/app/api/my/projects/route.ts` (`meta.freeProjects` + `plan_*`),
`src/lib/zod/purchase.ts`, `src/lib/zod/admin.ts`, `src/lib/admin/types.ts`,
`src/components/admin/project-form-fields.tsx`, `src/app/sitemap.ts`,
`src/lib/i18n/ru.ts`, `src/lib/constants.ts`, `.env.example`, `SPEC.md` §2.4,
`src/types/database.ts` (вручную в стиле генератора, как в 004/005);
заводит — `supabase/migrations/029_project_attribution.sql`,
`src/app/(public)/legal/disclaimer/page.tsx`, `src/app/(public)/legal/privacy/page.tsx`,
`src/app/(public)/legal/offer/page.tsx`, `src/lib/legal/texts.ts`,
`src/components/legal/legal-page.tsx`, `src/components/legal/consent-checkbox.tsx`,
`src/components/legal/project-attribution.tsx`,
`src/components/cabinet/free-access-dialog.tsx`; образцы —
`src/app/(public)/page.tsx` (Server Component публичной страницы),
`src/app/(auth)/auth/register/register-form.tsx` (чекбокс `pdConsent`),
`src/lib/api/helpers.ts`, `src/lib/admin/fetcher.ts`, `src/lib/utils.ts`

## Проблема

Продавать разбор нельзя: в SPEC заявлены три юридические страницы
(`/legal/disclaimer`, `/legal/privacy`, `/legal/offer`) — их нет, футер
ссылается в никуда, при регистрации человек соглашается с «политикой ПД»,
которой не существует. Чекбокс при покупке фиксируется в
`purchases.config` строкой `disclaimer: 'accepted'` без даты и версии
текста — в споре нечем доказать, с чем именно согласился человек.
Бесплатный эталон открывается вообще без согласия (`/api/my/free-access`).
Планы Homesteader's Cabin взяты по лицензии CC BY-NC 3.0 — она требует
указать автора (Michael Janzen, tinyhousedesign.com), а на сайте автора
нет нигде, и хранить его негде: у `house_projects` нет полей автора и
лицензии.

## Решение

**Тексты** — `src/lib/legal/texts.ts`: три документа (дисклеймер,
политика обработки персональных данных, публичная оферта) как
структурированный контент (заголовок, версия `LEGAL_VERSION = '2026-09-27'`,
дата, разделы `{ heading, paragraphs[] }`). Пишет исполнитель, простым
языком под РФ, без юридического жаргона без пояснения (UX §5):

- *Дисклеймер*: материалы информационные, не проектная документация, не
  заменяют инженера и изыскания; стройка на свой риск; ТБ обязательна;
  планы не проверены лицензированным инженером; адаптация под регион
  (снег, ветер, промерзание) — ответственность строящего; сервис не
  отвечает за ущерб; ссылка на лицензии проектов.
- *Политика ПД* (152-ФЗ): что собираем (имя, email, регион, прогресс,
  свои цены), зачем, где храним — честно: Supabase Cloud, проект
  `soberidom`, регион **eu-west-1 (Ирландия, ЕС)** по `HANDOFF.md` §5;
  для 152-ФЗ это трансграничное хранение — в бэклог «показать юристу»
  добавить вопрос локализации ПД (первичная база в РФ или перенос
  проекта в другой регион), кому
  передаём (Resend для писем), срок, права (удалить аккаунт — написать на
  почту), cookies (сессия), оператор — реквизиты.
- *Оферта*: предмет — доступ к разбору проекта; этап 1 — оплата
  переводом/донатом с активацией вручную, срок активации; что входит;
  бесплатные проекты; **возврат** (решение владельца 2026-09-27): до
  активации доступа — полный возврат по письму на `LEGAL_EMAIL`; после
  активации — полный возврат по письму в течение **14 календарных дней**
  с даты активации без объяснения причин, доступ закрывается
  (`status = 'refunded'`, SPEC 5.5); после 14 дней возврата нет; сроки
  возврата денег — до 10 рабочих дней тем же способом, каким платили;
  ответственность (ссылка на дисклеймер); реквизиты.

**Реквизиты** — единое место: `NEXT_PUBLIC_LEGAL_ENTITY` (ИП/ООО, ИНН,
ОГРН, адрес), `NEXT_PUBLIC_LEGAL_EMAIL` в `.env.example` и Vercel; в
`constants.ts` — `LEGAL_ENTITY`, `LEGAL_EMAIL` с фолбэком «Реквизиты
уточняются» / `support@…`. `NEXT_PUBLIC_LEGAL_ENTITY` — одна строка,
части через ` | ` («ИП Иванов И. И. | ИНН 1234567890 | ОГРНИП … | адрес»);
страница рендерит каждую часть отдельной строкой. Пока переменных нет — на страницах видна
эта заглушка, а в футере ничего не ломается.

**Страницы** `/legal/disclaimer`, `/legal/privacy`, `/legal/offer` —
Server Components на общем `legal-page.tsx` (h1, «версия от дд.мм.гггг»,
разделы, реквизиты внизу, ссылки на две другие страницы); `generateMetadata`;
`robots` — индексировать; в `sitemap.ts` — три адреса. Верстка —
`max-w-3xl`, `prose`-подобные отступы через токены, без внешних библиотек.

**Футер** (`(public)/layout.tsx`): под текстом дисклеймера — три ссылки
«Дисклеймер · Политика ПД · Оферта»; тексты — `ru.footer.*`.

**Согласие** — общий `consent-checkbox.tsx`: чекбокс + текст «Я понимаю,
что материалы носят информационный характер и не заменяют проектную
документацию, и принимаю условия оферты» со ссылками на
`/legal/disclaimer` и `/legal/offer` (открываются в новой вкладке).
Используется:

- в `buy-form.tsx` вместо нынешнего чекбокса; `POST /api/purchases`
  пишет в `purchases.config` объект `consent: { disclaimer: true,
  offer: true, version: LEGAL_VERSION, at: ISO-дата }` вместо строки
  `disclaimer: 'accepted'` (старые покупки не мигрируются — у них
  строка, код читать её не обязан). `config` при этом перестаёт быть
  плоским `Record<string,string>`: `appliesTo`/`EstimateConfig`
  (`src/lib/estimate/calc.ts`) сравнивают только ключи из `applies_when`,
  логика не меняется, но касты в роутах `build`, `cutting`, `delivery`,
  `estimate`, `supplies` проверить на TS strict (прецедент — ключ
  `disclaimer` там уже лежит);
- в новом `free-access-dialog.tsx`: кнопка «Открыть бесплатно» в
  `my-projects.tsx` открывает `Dialog` с коротким текстом («Это
  бесплатный проект-эталон. Планы — Michael Janzen…») — автор и лицензия
  **из данных проекта**: `GET /api/my/projects` отдаёт в
  `meta.freeProjects[]` поля `planAuthor`, `planSourceUrl`, `planLicense`,
  `planLicenseUrl` (select расширяется четырьмя `plan_*`), диалог
  показывает их тем же `project-attribution.tsx`; пустой автор — строки
  нет. Так второй бесплатный проект получит своего автора без кода.
  Диалог не показывается повторно, потому что `freeProjects` уже не
  содержит проекты с покупкой (регресс-проверка в приёмке), чекбоксом и
  кнопкой «Открыть»; `POST /api/my/free-access` получает
  `disclaimerAccepted: z.literal(true)` (Zod в `lib/zod/purchase.ts`) и
  пишет тот же `consent` в `config`. Без согласия — `VALIDATION_ERROR`.
- Регистрация: чекбокс `pdConsent` остаётся, его текст получает ссылку
  на `/legal/privacy` (`ru.auth.pdConsentLabel` → текст + отдельный ключ
  ссылки).

**Автор и лицензия проекта** — миграция `029_project_attribution.sql`
(+ `SPEC.md` §2.4): `house_projects.plan_author text not null default ''`,
`plan_source_url text not null default ''`, `plan_license text not null
default ''` («CC BY-NC 3.0»), `plan_license_url text not null default ''`;
бэкфилл эталона (`de300000-…-0100`): Michael Janzen /
`https://tinyhousedesign.com` / `CC BY-NC 3.0` /
`https://creativecommons.org/licenses/by-nc/3.0/us/`. Zod `projectSchema`
+ 4 поля, `ProjectRow`, форма админки — блок «Источник планов» из 4
инпутов в `project-form-fields.tsx` (файл 147 строк — влезает).
`project-attribution.tsx`: строка `text-sm text-muted-foreground`
«Планы: Michael Janzen (tinyhousedesign.com) · лицензия CC BY-NC 3.0 ·
не проверены лицензированным инженером — подробнее» (ссылки на источник,
лицензию и `/legal/disclaimer`); пустой `plan_author` — компонент не
рендерится. Показывается на витрине под описанием проекта и на хабе
кабинета под заголовком.

**Лимит 200 строк**: `buy-form.tsx` (218) и `my-projects.tsx` (213) уже
за пределом — этап выносит из них по одному подкомпоненту (чекбокс
согласия и диалог бесплатного доступа), после чего оба ≤200.

## Чего не делаем

- Не заказываем юридическую проверку и не утверждаем, что тексты
  «одобрены юристом»: черновики, версия и дата; перед первыми продажами
  владелец показывает их юристу и меняет `LEGAL_VERSION`.
- Не заводим хранение версий текстов в базе и историю согласий
  отдельной таблицей — версия фиксируется в `purchases.config`.
- Не делаем cookie-баннер: сторонних cookies нет (Метрика ещё не
  подключена — SPEC 5.9); при подключении — отдельный S-этап.
- Не мигрируем старые покупки (`disclaimer: 'accepted'`) и не просим
  повторного согласия у уже открытых бесплатных доступов.
- Не пишем пользовательское соглашение (terms) отдельно от оферты — три
  документа, как в SPEC.
- Не добавляем страницу «О нас» и контакты сверх реквизитов на
  юр-страницах.
- Не переписываем текст дисклеймера в футере и в письме (там уже есть
  формулировка из SPEC).

## Задачи

- [ ] `src/lib/legal/texts.ts` — три документа, `LEGAL_VERSION`; ключи
      `ru.legal.*` (заголовки страниц, «версия от», подписи ссылок);
      `LEGAL_ENTITY`/`LEGAL_EMAIL` в `constants.ts`, переменные в
      `.env.example`.
- [ ] `legal-page.tsx` + три страницы `/legal/*` с `generateMetadata`;
      `sitemap.ts` — три адреса.
- [ ] Футер: ссылки на три страницы; регистрация — ссылка на
      `/legal/privacy` в тексте согласия.
- [ ] `consent-checkbox.tsx`; `buy-form.tsx` на нём (вынос ≤200 строк);
      `POST /api/purchases` пишет `config.consent {…, version, at}`.
- [ ] `free-access-dialog.tsx`; `my-projects.tsx` открывает диалог (вынос
      ≤200 строк); `lib/zod/purchase.ts` — схема тела free-access с
      `disclaimerAccepted`; роут проверяет и пишет `consent`.
- [ ] Миграция `029_project_attribution.sql` + `SPEC.md` §2.4 + типы;
      бэкфилл эталона; Zod `projectSchema`, `ProjectRow`, блок «Источник
      планов» в форме админки.
- [ ] `project-attribution.tsx`; витрина и хаб кабинета показывают его.
- [ ] Документы по разделу ниже.

## Приёмка

- КОГДА посетитель открывает `/legal/disclaimer`, `/legal/privacy` или
  `/legal/offer`, страница ДОЛЖНА показать заголовок, «версия от
  дд.мм.гггг», разделы текста, реквизиты (или «Реквизиты уточняются»,
  если переменные окружения пусты) и ссылки на две другие страницы.
- КОГДА открыта любая публичная страница, футер ДОЛЖЕН содержать ссылки
  на три юр-страницы, и ни одна не ДОЛЖНА вести на 404.
- КОГДА покупатель оформляет покупку, кнопка «Получить доступ» ДОЛЖНА
  быть неактивна без галочки согласия, а после оформления в
  `purchases.config.consent` ДОЛЖНЫ лежать `version` и `at`.
- КОГДА пользователь открывает бесплатный проект из `/my`, ДОЛЖЕН
  появиться диалог с текстом, автором планов и чекбоксом; без галочки
  кнопка «Открыть» неактивна; `POST /api/my/free-access` без
  `disclaimerAccepted: true` ДОЛЖЕН ответить `VALIDATION_ERROR`.
- КОГДА у пользователя уже есть доступ к бесплатному проекту, диалог НЕ
  ДОЛЖЕН показываться повторно — сразу переход в кабинет.
- КОГДА в диалоге бесплатного доступа показан автор, он ДОЛЖЕН совпадать
  с `plan_author` проекта из базы, а не с текстом в коде.
- КОГДА открыта `/legal/offer`, раздел «Возврат» ДОЛЖЕН называть два
  правила: до активации — целиком, после — 14 календарных дней.
- КОГДА открыта витрина или хаб кабинета Homesteader's Cabin, под
  описанием ДОЛЖНА стоять строка с автором, ссылкой на источник,
  лицензией CC BY-NC 3.0 и ссылкой на дисклеймер.
- КОГДА у проекта `plan_author` пуст, строка автора НЕ ДОЛЖНА
  рендериться (ни пустой, ни с прочерком).
- КОГДА админ открывает форму проекта, в ней ДОЛЖЕН быть блок «Источник
  планов» из четырёх полей, и сохранённые значения ДОЛЖНЫ появиться на
  витрине без правки кода.
- КОГДА открыт `/sitemap.xml`, в нём ДОЛЖНЫ быть три адреса `/legal/*`.
- КОГДА текст согласия при регистрации показан, слова «политикой
  обработки персональных данных» ДОЛЖНЫ быть ссылкой на `/legal/privacy`.
- Ни одной русской строки в JSX новых компонентов: все — из `ru.ts` или
  `lib/legal/texts.ts`.

## Документы

- `SPEC.md` §2.4 — четыре поля атрибуции в `house_projects`; §3.6 —
  форма `config.consent`; §3 — тело `/api/my/free-access` с
  `disclaimerAccepted`.
- `techspec/00-adr.md`: «Согласие фиксируется версией и датой в
  `purchases.config.consent`», «Реквизиты — из окружения».
- `design.md` §3: `legal-page.tsx`, `consent-checkbox.tsx`,
  `project-attribution.tsx`, `free-access-dialog.tsx`.
- `specs/README.md`: строка бэклога «Дисклеймер и юр-защита» удаляется;
  в бэклог «до продаж» — «показать юр-тексты юристу (в т. ч. вопрос
  локализации ПД: база в Ирландии), заполнить `NEXT_PUBLIC_LEGAL_*`
  в Vercel»; SPEC v1.6 — §4.5/§4.6 (диалог
  бесплатного доступа), §4.4 (атрибуция); строка 006 → `archive/README.md`
  при закрытии.
