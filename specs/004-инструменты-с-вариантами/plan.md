# План этапа 004 — инструменты с вариантами

Порядок файлов и решения по неоднозначностям. Пишется до кода: ремонтный
заход стартует с чистым контекстом и иначе выведет план заново.

## Порядок коммитов

| # | Коммит | Файлы |
| --- | --- | --- |
| 1 | план | `plan.md`, статус «в работе» в спеке и `specs/README.md` |
| 2 | словари | `src/lib/i18n/ru.ts`: `ru.build.stageCodes`, новые `ru.tools.*`, `ru.build.stageStart.*`, `ru.admin.tools.*`, `ru.admin.steps.tabTools`. Старые `ru.tools.price/rent/alternative/approx` живут до коммита 8–9, иначе сборка красная в середине этапа |
| 3 | схема | `supabase/migrations/026_tool_variants.sql`, `SPEC.md` §2.4 и §2.6, `src/types/database.ts` (regen), применение через Supabase |
| 4 | контракты | `src/lib/zod/admin.ts` (`toolSchema`, `toolVariantSchema` + `Update`), `src/lib/zod/tools.ts` (тело `PUT /choice`), `src/lib/admin/types.ts` (`ToolRow`, `ToolVariantRow`) |
| 5 | админ-API | `src/app/api/admin/tools/route.ts`, `tools/[id]/route.ts`, `tool-variants/route.ts`, `tool-variants/[id]/route.ts` |
| 6 | админ-UI | `src/components/admin/tools-panel.tsx`, `tool-form.tsx`, `tool-variants-field.tsx`, вкладка в `steps-manager.tsx` |
| 7 | кабинет-API | `src/lib/tools/effective.ts` (+ тест), `src/app/api/my/[purchaseId]/tools/route.ts`, `tools/choice/route.ts` |
| 8 | экран `/tools` | `src/components/build/tool-variant-card.tsx`, `tool-need-card.tsx`, `tools-view.tsx` |
| 9 | экран этапа | `src/app/api/my/[purchaseId]/supplies/route.ts`, `src/components/build/build-types.ts`, `stage-tools.tsx`, `stage-supplies.tsx`, `stage-start.tsx` |
| 10 | контент | `supabase/migrations/027_seed_tools_homesteaders.sql` + применение |
| 11 | закрытие | документы, архив спеки и прототипа, удаление `src/app/prototype/004/` |

Галочка в разделе «Задачи» ставится тем же коммитом, что закрывает задачу.

## Решения по неоднозначностям

1. **`days_needed` в сиде — 41 день, а не 52.** Спека называет правило
   («сумма `duration_days` этапов потребности») и рядом приводит числа
   длительностей, которых в базе нет. Факт из `stages` эталонного
   проекта: site_prep 3, foundation 4, floor 3, walls 7, loft 2, roof 5,
   porch 2, windows_doors 2, exterior 4, interior 7, utilities 5 — вся
   стройка 44 дня, без подготовки участка 41. Правило первично, числа в
   спеке — ошибочная выписка. Смысл расчёта сохраняется: аренда торцовки
   700 ₽/сут × 41 дн. ≈ 28 700 ₽ против покупки пилы 6 500 ₽.
2. **Старые колонки `project_tools` получают DEFAULT.** `recommendation`,
   `approx_price_minor`, `reason` объявлены `not null` без значения по
   умолчанию, а новый код их не пишет — вставка потребности упала бы.
   Миграция 026 не удаляет колонки (спека это запрещает), но вешает на
   них `default`: `'buy'`, `0`, `''`. Это и есть «существующее не ломаем».
3. **`meta.stageCount` в ответе `GET /tools`.** Правило чипов «все этапы
   проекта → один чип „На всей стройке“» требует знать, сколько у проекта
   видимых этапов. Считать это на сервере по каждой потребности —
   дублировать флаг в каждой строке; отдаём одно число в `meta` рядом
   с `currency`.
4. **Чипы этапов: `display_name` из базы важнее словаря.** Так сказано в
   задаче спеки. На эталонном проекте это даёт длинные чипы («Четыре
   цветные стены» вместо «Стены» из прототипа) — расхождение с картинкой
   прототипа осознанное, правит текст спеки. Словарь `ru.build.stageCodes`
   работает для кодов, которых нет среди видимых этапов проекта.
5. **Два новых файла сверх списка «Код».** `src/components/build/tool-need-card.tsx`
   (карточка потребности с чипами и сеткой вариантов) и
   `src/components/build/stage-tools.tsx` (блок «И это понадобится»):
   без них `tools-view.tsx` и `stage-supplies.tsx` перевалили бы за
   200 строк — предел CLAUDE.md.
6. **Тест чистой функции — на `node:test`.** Отбор действующего варианта
   и суммы вынесены в `src/lib/tools/effective.ts` и покрыты тестом
   `effective.test.ts` (встроенный раннер Node 24, без новых зависимостей:
   ворота проекта — `lint` + `build`, тестового раннера в проекте нет).
   Запуск: `node --test src/lib/tools/effective.test.ts`. В `tsconfig.json`
   для этого включается `allowImportingTsExtensions` (безопасно при
   `noEmit: true`).
7. **Форма админки сохраняет варианты по одному.** `tool-form.tsx` держит
   черновики вариантов в состоянии, при сабмите сначала пишет потребность
   (POST или PATCH), затем разницу по вариантам: удалённые — DELETE,
   существующие — PATCH, новые — POST с `tool_id`. Правило «ровно один
   вариант для новичка» проверяется до отправки, как и требует спека:
   API-роуты вариантов его не знают.
8. **Пустое состояние вкладки админки — своё, не из `ListStates`.**
   Прототип одобрил текст «У проекта ещё нет инструментов» + «Добавьте
   первую потребность»; общий `ListStates` даёт безликий текст.
9. **Контент сида — тексты прототипа.** Таблица спеки задаёт состав,
   категории, этапы, рекомендации, цены и пометки скорости; «зачем» и
   описания вариантов берутся из `src/app/prototype/004/mock.ts` — их
   человек видел и одобрил вместе с визуалом.
10. **`user_tool_choices` пишется клиентом под RLS** (политика «своё» по
    `purchases.user_id`), upsert по `unique (purchase_id, tool_id)`;
    принадлежность варианта потребности и потребности проекту покупки
    роут проверяет сам до записи — RLS этого не видит.
