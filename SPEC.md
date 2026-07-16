# СобериДом — Техническая спецификация

> Версия: 1.5 | Дата: 2026-07-16 | Статус: Production-ready
> Источник требований: PROJECT_IDEA.md v1.4 | v1.1: реальные форматы домов; анатомия шага «как у прораба»; Этап 0 (быт и подготовка) | v1.2: тренировки для новичков, обязательный шаг ТБ, инструменты купить/арендовать | v1.3: is_admin() создаётся в 2.1 после profiles (иначе ошибка при check_function_bodies=on); добавлен маршрут /auth/confirm (обработчик ссылок из писем Supabase) | v1.5: is_free-проекты (бесплатный эталон витрины, доступ как у активной покупки); US-015 PDF-экспорт всего проекта; человеческий язык: stages.display_name + color, служебный code скрыт, словарь линтера расширен; флагманский бесплатный проект — тини-хаус-трансформер; усилен Этап 0 (верстак-стол — первый учебный проект)
> Аудитория документа: AI-агенты (Claude Code). Максимальная конкретность, без TODO.

---

## БЛОК 0: Обзор проекта

### Что это
СобериДом — веб-сервис «IKEA-инструкция для каркасного дома»: подбор проекта по параметрам и местности (включая рекомендацию фундамента), бесплатная витрина с 3D и предварительной сметой, платный интерактивный конструктор сборки с раскроем, живой сметой, фин-отчётом «план/факт», организацией доставки, скриптами переговоров и AI-помощником «Добрый прораб».

### Стек
- **Frontend:** Next.js 16 (App Router), TypeScript 5, Tailwind CSS v4, shadcn/ui, Lucide React
- **3D:** three@0.16x + @react-three/fiber + @react-three/drei (просмотр GLB-моделей со слоями)
- **Backend:** Supabase (PostgreSQL 15, Auth (email+password), RLS, Storage — GLB-модели и схемы шагов)
- **AI:** Anthropic Messages API, модель `claude-sonnet-4-6` («Добрый прораб»)
- **Деплой:** Vercel (фронт+API) или VPS (Node 20 + pm2 + nginx); Supabase — облако
- **Платежи (этап 1):** внешний донат-сервис (ссылка) + ручная/промокодная активация; модуль абстрактный, провайдер `manual` → позже `yookassa`
- **Валидация:** Zod во всех API-роутах

### Роли пользователей

| Роль | Описание | Доступ |
|------|----------|--------|
| guest | Незарегистрированный посетитель | Лендинг, анкета, витрина, 3D, конфигуратор, предварительная смета |
| user | Зарегистрированный | То же + покупка, купленные конструкторы, фин-отчёт, прораб, скрипты |
| admin | Администратор контента | Всё + CRUD проектов/этапов/шагов/материалов/цен, активация покупок |

Роль хранится в `profiles.role` ('user' | 'admin'), по умолчанию 'user'.

### Маршруты

| Путь | Экран | Доступ |
|------|-------|--------|
| / | Лендинг | Публичный |
| /quiz | Анкета подбора (мультишаг) | Публичный |
| /quiz/results | Результаты подбора (2–4 проекта) | Публичный |
| /projects | Каталог всех проектов | Публичный |
| /projects/[slug] | Витрина проекта: 3D, планировки, конфигуратор, фундамент, предсмета | Публичный |
| /projects/[slug]/buy | Оформление покупки | user |
| /auth/login, /auth/register, /auth/reset | Аутентификация | Публичный |
| /auth/confirm | Обработчик ссылок из писем Supabase (подтверждение email, восстановление пароля): verifyOtp/exchangeCodeForSession → автологин и возврат по next | Публичный |
| /my | Мои проекты (купленные) | user |
| /my/[purchaseId] | Хаб купленного проекта | user (владелец) |
| /my/[purchaseId]/build | Конструктор сборки (этапы→шаги) | user (владелец) |
| /my/[purchaseId]/cutting | Карта раскроя | user (владелец) |
| /my/[purchaseId]/estimate | Живая смета + список покупок | user (владелец) |
| /my/[purchaseId]/finance | Фин-отчёт план/факт | user (владелец) |
| /my/[purchaseId]/delivery | Волны доставки | user (владелец) |
| /my/[purchaseId]/tools | Инструменты: купить/арендовать | user (владелец) |
| /my/[purchaseId]/scripts | Скрипты переговоров | user (владелец) |
| /my/[purchaseId]/foreman | Чат «Добрый прораб» | user (владелец) |
| /settings | Профиль, регион | user |
| /admin | Админ-панель: контент, цены, активация покупок | admin |
| /legal/disclaimer, /legal/privacy, /legal/offer | Юридические страницы | Публичный |

### Глобальные правила
- Все деньги — INTEGER в минорных единицах (копейки/тиыны), поле `currency` (char(3): 'RUB','KZT','BYN').
- Все id — UUID (`gen_random_uuid()`).
- Все таблицы с изменяемыми данными — `created_at timestamptz default now()`, `updated_at` + триггер moddatetime.
- Дисклеймер «Материалы носят информационный характер и не заменяют проектную документацию» — в футере каждой страницы и перед оплатой (чекбокс согласия).
- Язык интерфейса: русский; все строки UI — в `src/lib/i18n/ru.ts` (готовность к переводу).

---

## БЛОК 1: User Stories

### US-001: Прохождение анкеты подбора
**Как** посетитель без опыта стройки, **я хочу** ответить на простые вопросы, **чтобы** получить подходящие мне проекты.
**Сценарий:**
1. Гость открывает /quiz с лендинга (CTA «Подобрать мой дом»).
2. Шаг 1: тип постройки (дом / баня / хозблок) и формат дома — иллюстрированные плитки с силуэтом: классический с двускатной крышей / барнхаус / скандинавский с панорамными окнами / А-фрейм (треугольный) / шале / мини-дом (дубль-дом) / не важно. Под каждой плиткой — 1 строка сути («Барнхаус: минимализм, односкатная кровля, проще и дешевле в сборке»).
3. Шаг 2: этажность (1 / 2-мансарда / не важно), число комнат (1–5+), желаемая площадь (слайдер 15–150 м²).
4. Шаг 3: страна и город (автокомплит из таблицы regions).
5. Шаг 4: доступное отопление (магистральный газ / электричество / твёрдое топливо / не решил).
6. Шаг 5: бюджет на материалы (слайдер 300 тыс.–3 млн в валюте страны / «не знаю»).
7. Нажимает «Подобрать» → POST /api/quiz/match → редирект на /quiz/results с 2–4 карточками и объяснением «почему подходит».
**Ошибка:** если подходящих проектов 0 — показываются 2 ближайших с пометкой «немного больше вашей площади/бюджета» (пустого результата не бывает).
**Критерии приёмки:**
- [ ] Анкета проходится за ≤ 2 минуты, каждый шаг — один вопрос на экран
- [ ] Ответы сохраняются в sessionStorage (перезагрузка не сбрасывает)
- [ ] Результат ≥ 2 проектов всегда

### US-002: Витрина проекта с 3D и объяснениями
**Как** посетитель, **я хочу** покрутить 3D-модель и понять, почему планировка хороша, **чтобы** влюбиться в «свой» дом.
**Сценарий:**
1. Открывает /projects/[slug] из результатов подбора.
2. Видит: галерею, 3D-вьюер (GLB из Supabase Storage) с переключателями слоёв: каркас / кровля+водосток / отделка снаружи / отделка внутри.
3. Ниже — планы этажей с блоком «Почему эта планировка удачна» (3–5 пунктов из layout_notes).
4. Бейдж «Конструктив соответствует СП 31-105-2002».
5. Прокручивает к конфигуратору и предварительной смете.
**Ошибка:** 3D-модель не загрузилась за 10 с → fallback: статичная изометрия (PNG) + кнопка «Повторить».
**Критерии приёмки:**
- [ ] 3D крутится мышью/пальцем, слои включаются чекбоксами
- [ ] На мобильном 3D грузится лениво (по кнопке «Показать 3D»)

### US-003: Конфигуратор и предварительная смета
**Как** посетитель, **я хочу** переключать комплектацию и видеть цену, **чтобы** понять бюджет до оплаты.
**Сценарий:**
1. В карточке проекта выбирает: пиломатериал (естественной влажности / сухая строганая), кровля (металлочерепица / ондулин / профлист), отделка снаружи (имитация бруса / сайдинг / планкен), отделка внутри (вагонка / имитация бруса / под покраску), фундамент (из рекомендации US-004 или вручную).
2. Каждый переключатель → GET /api/projects/[id]/estimate?config=... → смета пересчитывается ≤ 1 c.
3. Смета показана разбивкой по этапам (фундамент, пол, стены, кровля, отделка, инженерка, расходка) с итогом в валюте региона пользователя.
**Критерии приёмки:**
- [ ] Пересчёт без перезагрузки страницы
- [ ] Разбивка сворачивается/разворачивается; итог виден всегда (sticky)

### US-004: Рекомендация фундамента по местности
**Как** посетитель, **я хочу** получить тип фундамента под мой участок, **чтобы** не платить геологу на старте.
**Сценарий:**
1. В карточке проекта блок «Какой фундамент нужен именно вам» → указывает город (или подтягивается из анкеты).
2. Мини-гид «Определи свой грунт за 20 минут»: 4 иллюстрированных вопроса (тест «колбаска» → глина/суглинок/супесь/песок/торф/не знаю; вода в яме 1 м весной → да/нет/не знаю; рельеф → ровный/уклон; соседи строились на → лента/сваи/плита/не знаю).
3. POST /api/foundation/recommend → ответ: тип (свайно-винтовой / МЗЛФ / столбчатый), глубина промерзания для города, объяснение 3 пунктами, дельта к смете.
4. Кнопка «Применить к смете».
**Ошибка:** город не найден в справочнике → берётся ближайший областной центр с пометкой.
**Критерии приёмки:**
- [ ] «Не знаю» на всё → консервативная рекомендация (свайно-винтовой) с советом проверить грунт
- [ ] Всегда показан дисклеймер о проектной документации

### US-005: Регистрация и вход
**Как** посетитель, готовый купить, **я хочу** зарегистрироваться по email, **чтобы** получить доступ к конструктору.
**Сценарий:**
1. С витрины жмёт «Купить полный разбор» → если гость, редирект на /auth/register?next=/projects/[slug]/buy.
2. Вводит имя, email, пароль (мин. 8 символов, ≥1 цифра); чекбокс согласия с политикой ПД (обязателен).
3. Supabase Auth создаёт пользователя, триггер создаёт profiles-запись; письмо подтверждения.
4. После подтверждения — автологин и возврат по `next`.
**Ошибка:** email занят → «Этот email уже зарегистрирован» + ссылка на вход и восстановление.
**Критерии приёмки:**
- [ ] Без согласия с ПД кнопка неактивна
- [ ] Восстановление пароля работает через Supabase reset

### US-006: Покупка (этап 1 — донат + активация)
**Как** user, **я хочу** оплатить разбор проекта, **чтобы** открыть конструктор.
**Сценарий:**
1. На /projects/[slug]/buy видит: итоговую конфигурацию, цену разбора (price_minor проекта), чекбокс дисклеймера.
2. POST /api/purchases → создаётся purchase (status='pending', provider='manual', уникальный код вида SD-7F3K9Q).
3. Экран: «Переведите N ₽ по ссылке [донат-сервис], в комментарии укажите код SD-7F3K9Q. Доступ откроем в течение 2 часов, придёт письмо.»
4. Админ в /admin видит pending-покупки, сверяет поступление, жмёт «Активировать» → status='active', email пользователю.
5. Альтернатива: пользователь вводит промокод → мгновенная активация (для тестов и партнёров).
**Ошибка:** повторная покупка того же проекта тем же user → блокируется: «У вас уже есть доступ» (или «покупка ожидает активации»).
**Критерии приёмки:**
- [ ] Код покупки уникален, показан и в письме
- [ ] После активации проект появляется в /my ≤ 1 мин (realtime или refetch)

### US-007: Конструктор сборки
**Как** покупатель без опыта, **я хочу** идти по шагам с картинками, маркировкой и объяснением «зачем», **чтобы** собрать дом, поняв всё с первого раза — включая то, о чём новичок даже не догадается спросить.

**Обязательные этапы каждого проекта (порядок):**
0. **Подготовка участка и быта** — этап, который отличает нас от всех «калькуляторов». Открывается шагом **«Техника безопасности» (обязательный для всех, пропустить нельзя)**: очки при любом резе, перчатки, обувь с жёстким носком, правило одной руки при работе с циркуляркой, «электроинструмент + дождь = никогда», аптечка в зоне вытянутой руки, телефон заряжен, кто-то знает, что вы на стройке. Далее — **тренировочные шаги для новичков** (помечены «Тренировка», можно пропустить, если опыт есть): забейте 20 гвоздей в обрезок доски (правильный хват, добивание заподлицо); сделайте 5 резов ножовкой и 5 циркуляркой по карандашной линии (допуск ±2 мм); закрутите 10 саморезов без срыва шлица; финальный экзамен — **соберите козелки и верстак-стол для распила** (столешница из доски 50 мм на козелках) — первый учебный проект и «первая победа» новичка (v1.5): он тренируется пилить и забивать и получает вещь, нужную всю стройку. Затем быт: план площадки (где штабель леса, где раскроечный стол, где проход машины с материалом — схема с размерами); штабель для пиломатериала (прокладки через 1 м, зазор от земли 30 см, укрыть от дождя, НЕ плёнкой наглухо — сгниёт, а навесом с продухом); организация рабочего места (v1.5): верстак-стол для распила из доски 50 мм на козелках (первое, что строим, — уже собран на тренировке) и схема «что где лежит»; хранение инструмента (ящик/контейнер с замком, правило «инструмент домой или в ящик — на земле не ночует»); электричество (удлинитель на катушке 30–50 м с УЗО / генератор от 2 кВт — когда что); вода и туалет; аптечка и СИЗ (очки при резке — не обсуждается, перчатки, наушники); распорядок («не работайте болгаркой и на высоте уставшим — 80% травм после 6 часов работы»).
1. Разметка и фундамент → 2. Обвязка → 3. Платформа пола → 4. Стены S1..Sn (сборка на платформе лёжа → подъём) → 5. Верхняя обвязка и перекрытие → 6. Стропильная система → 7. Кровля + водосток → 8. Окна и двери → 9. Контур: мембраны и утепление → 10. Отделка снаружи → 11. Отделка внутри → 12. Инженерка.

**Анатомия каждого шага (все поля обязательны при создании контента):**
- **Зачем этот шаг** (1–2 предложения: «Диагонали проверяем, чтобы дом был прямоугольным — иначе кровельные листы не лягут, а двери будут открываться сами»)
- **Подготовьте** (что сделать ДО: «накануне дождя не начинайте — понадобится сухих 4 часа»; «попросите помощника на 17:00 — одному стену не поднять»)
- **Возьмите**: детали с цветом (● красный B-12: доска 50×150, рез 2440 — 4 шт), крепёж, инструмент
- **Сделайте**: нумерованные действия языком «для ребёнка» — один глагол на пункт, без жаргона (не «смонтируйте укосину», а «прибейте доску-раскос от угла к середине — она не даст стене сложиться»)
- **Безопасность** (если есть риск: высота, электроинструмент, тяжесть — конкретное правило)
- **Время**: «≈ 2 часа одному / 1 час вдвоём», **Сложность**: 1–3 молотка, **Погода**: если критична
- **Проверьте себя** — чек-лист приёмки собственной работы («Диагонали различаются ≤ 5 мм?», «Все гвозди добиты заподлицо?») — отметить всё, только потом «Готово»
- **Подсказка**, **Частая ошибка**, **Нужен помощник ×N**

**Сценарий:**
1. Открывает /my/[purchaseId]/build: список этапов с прогресс-барами; Этап 0 первым, с бейджем «Начните отсюда — сэкономит недели».
2. Входит в этап → интро этапа («Что построим и почему в этом порядке») → шаги «Шаг 2 из 14» с анатомией выше.
3. Проходит чек-лист «Проверьте себя» → жмёт «Готово» → прогресс сохраняется, авто-переход.
4. Кнопка «Спросить прораба» — чат с контекстом шага.
**Ошибка:** офлайн при отметке шага → отметка в localStorage, синк при сети (optimistic UI).
**Критерии приёмки:**
- [ ] Возврат в конструктор открывает первый незавершённый шаг
- [ ] Все изображения lazy, вес шага ≤ 500 КБ
- [ ] Ни один шаг не публикуется без «Зачем», «Проверьте себя» и оценки времени (валидация в админке)
- [ ] Текст шага проходит тест читабельности: без строительного жаргона либо жаргон объяснён в скобках при первом употреблении

### US-008: Карта раскроя
**Как** покупатель, **я хочу** схему нарезки досок с цветами, **чтобы** нарезать всё за день без ошибок.
**Сценарий:**
1. /my/[purchaseId]/cutting: фильтр по этапу; список закупаемых длинномеров (доска 50×150×6000 — 84 шт) → для каждой доски-заготовки визуальная полоса: сегменты с длиной, номером детали (B-12) и цветом маркировки.
2. Сводка: «Красным маркером отметьте 36 досок — это стойки 2440 мм», и т.д. по цветам.
3. Кнопка «Печать/PDF» (браузерная печать со стилями @media print). Полный визуальный PDF всего проекта — US-015 (v1.5).
**Критерии приёмки:**
- [ ] Отходы по каждой заготовке показаны (серым)
- [ ] Деталь кликабельна → в каком шаге используется

### US-009: Живая смета, свои цены, список покупок
**Как** покупатель, **я хочу** править цены и видеть список покупок с артикулами, **чтобы** купить всё по своему региону.
**Сценарий:**
1. /my/[purchaseId]/estimate: таблица позиций (материал, кол-во, ед., цена, сумма, поставщик/артикул если есть).
2. Клик по цене → inline-редактирование → PATCH /api/my/prices (user_price перекрывает дефолт) → итог пересчитан.
3. Переключатель «Группировать: по этапам / список покупок» (агрегация одинаковых материалов по всему проекту).
4. Чекбокс «куплено» у позиции — синхронизируется с фин-отчётом (создаёт expense по факту, редактируемый).
**Критерии приёмки:**
- [ ] Пользовательская цена помечена значком и кнопкой «вернуть дефолт»
- [ ] Экспорт списка покупок в CSV

### US-010: Фин-отчёт план/факт
**Как** покупатель, **я хочу** вносить реальные траты, **чтобы** контролировать бюджет.
**Сценарий:**
1. /my/[purchaseId]/finance: сводка «План / Факт / Разница» по этапам + итог; график-бар по этапам.
2. «Добавить трату»: позиция из сметы (автокомплит) или произвольная («бензин до базы»), сумма, дата, комментарий.
3. Разница подсвечена: экономия зелёным, перерасход красным.
**Критерии приёмки:**
- [ ] Произвольные траты попадают в категорию «Прочее»
- [ ] Итог факта = сумма всех expenses, обновляется мгновенно

### US-011: Волны доставки
**Как** покупатель, **я хочу** сгруппированные закупки с объёмом и весом, **чтобы** заплатить за 2 доставки вместо 5.
**Сценарий:**
1. /my/[purchaseId]/delivery: волны (Волна 1 «Фундамент», Волна 2 «Каркас+кровля», Волна 3 «Отделка+инженерка») — материалы, суммарный объём (м³), вес (кг), рекомендация транспорта (по таблице: ≤1,5 т — газель борт 3 м; ≤5 т/6 м — манипулятор 5 т; больше — длинномер) и советы («доски 6 м не влезут в газель», «заказывайте манипулятор с выгрузкой за забор»).
**Критерии приёмки:**
- [ ] Объём/вес считаются из материалов (volume_m3, weight_kg на единицу)
- [ ] Волна привязана к этапам (delivery_wave у этапа)

### US-012: «Добрый прораб»
**Как** покупатель, **я хочу** задать вопрос на любом шаге, **чтобы** не остаться один на один со стройкой.
**Сценарий:**
1. /my/[purchaseId]/foreman или кнопка на шаге. История сообщений сохраняется.
2. Пишет: «доску повело винтом, что делать?» → POST /api/foreman/chat → серверный роут собирает контекст (проект, конфигурация, текущий этап/шаг, последние 20 сообщений) → Anthropic API → ответ простым языком, ≤ 300 слов, доброжелательный тон.
3. Лимит: 50 сообщений/сутки на пользователя; при превышении — мягкое сообщение и сброс в 00:00 МСК.
**Ошибка:** Anthropic недоступен → «Прораб отошёл на объект, попробуйте через минуту», сообщение пользователя не теряется (сохранено, retry-кнопка).
**Критерии приёмки:**
- [ ] Прораб не даёт советов за пределами стройки (system prompt) и при вопросах о несущих изменениях отвечает «это изменение конструктива — нужен инженер»
- [ ] Стриминг ответа (SSE)

### US-013: Скрипты переговоров
**Как** покупатель, **я хочу** чек-лист разговора с продавцом досок, **чтобы** меня не обманули.
**Сценарий:**
1. /my/[purchaseId]/scripts: карточки по категориям (лесная база, фундаментная бригада, септик, доставка, электрик).
2. Внутри: «Вопросы», «Хорошие ответы», «Красные флаги», «Ориентир цен», «Как проверить на месте» (для леса — формула кубатуры и проверка рулеткой).
3. Скрипт также показывается контекстно на связанном этапе конструктора.
**Критерии приёмки:**
- [ ] Скрипты — контент из БД (negotiation_scripts), редактируются админом

### US-014: Админ — контент и активация
**Как** admin, **я хочу** управлять проектами, шагами, материалами, ценами и активировать покупки, **чтобы** развивать контент без программиста.
**Сценарий:**
1. /admin: разделы Проекты / Этапы и шаги / Материалы и цены / Покупки / Скрипты / Регионы.
2. CRUD-формы (shadcn Table + Sheet); загрузка изображений и GLB в Storage.
3. Покупки: список pending с кодами, кнопка «Активировать» / «Отклонить».
**Критерии приёмки:**
- [ ] Доступ только role='admin' (RLS + проверка в layout)
- [ ] Изменение цены материала мгновенно влияет на предсметы (без деплоя)

### US-015: PDF-экспорт всего проекта (v1.5)
**Как** покупатель (или пользователь is_free-проекта), **я хочу** скачать весь проект одним PDF, **чтобы** пользоваться инструкцией на бумаге и без интернета.
**Требования:**
1. PDF визуальный, не текстовый: цветная маркировка деталей сохраняется.
2. Пошаговая структура: этап → шаг → «возьмите/сделайте».
3. Карта раскроя с цветными полосами (как в US-008).
4. Смета и список покупок.
5. Единый фирменный стиль документа.
**Доступ:** купленные проекты (status='active') и проекты is_free.
**Примечание:** расширяет печать/PDF раскроя из US-008 на весь проект.

---

## БЛОК 2: Data Model

Все скрипты готовы к выполнению в Supabase SQL Editor, порядок — как написано.

Поля v1.5 для баз, созданных до v1.5 (миграции 001–007 уже применены), добавляются отдельной миграцией 008:
```sql
alter table house_projects add column is_free boolean not null default false;
alter table stages add column display_name text not null default '';
alter table stages add column color text null check (color in ('red','green','yellow','blue','orange','purple'));
```

### 2.0 Расширения и служебное

```sql
create extension if not exists moddatetime schema extensions;
-- Хелпер is_admin() создаётся в 2.1 после таблицы profiles: функция ссылается на
-- profiles, и при check_function_bodies=on (значение по умолчанию) её создание
-- до таблицы завершится ошибкой.
```

### 2.1 profiles — профили пользователей

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'user' check (role in ('user','admin')),
  country_code char(2) not null default 'RU',
  region_id uuid null, -- FK добавляется после создания regions
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on profiles
  for each row execute procedure extensions.moddatetime(updated_at);

-- Автосоздание профиля при регистрации
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Хелпер: текущий пользователь admin? Создаётся после profiles (функция ссылается
-- на таблицу) и до RLS-политик ниже (политики ссылаются на функцию).
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
-- insert делает триггер (security definer), delete каскадом от auth.users
```

### 2.2 countries, regions — география и климат

```sql
create table countries (
  code char(2) primary key,           -- 'RU','KZ','BY'
  name text not null,
  currency char(3) not null            -- 'RUB','KZT','BYN'
);
insert into countries values ('RU','Россия','RUB'),('KZ','Казахстан','KZT'),('BY','Беларусь','BYN');

create table regions (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references countries(code),
  name text not null,                  -- 'Москва', 'Алматы'
  mt numeric(5,1) not null,            -- сумма |отрицательных среднемесячных t°|, СП 131.13330 табл.5.1
  snow_region smallint not null check (snow_region between 1 and 8),  -- СП 20.13330
  wind_region smallint not null check (wind_region between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_regions_country on regions(country_code);
create trigger set_updated_at before update on regions
  for each row execute procedure extensions.moddatetime(updated_at);
alter table regions enable row level security;
create policy "regions_read_all" on regions for select using (true);
create policy "regions_admin_write" on regions for all using (is_admin()) with check (is_admin());

alter table profiles add constraint fk_profiles_region foreign key (region_id) references regions(id) on delete set null;
-- Сид (минимум для старта; полный список грузится админом CSV-импортом):
insert into regions (country_code,name,mt,snow_region,wind_region) values
 ('RU','Москва',37.1,3,1),('RU','Санкт-Петербург',24.8,3,2),('RU','Екатеринбург',49.0,3,1),
 ('RU','Новосибирск',63.3,4,3),('RU','Краснодар',5.0,2,4),('RU','Казань',44.9,4,2),
 ('KZ','Алматы',18.0,2,1),('KZ','Астана',60.0,3,3),('BY','Минск',20.0,2,1);
```

### 2.3 retailers, materials, цены и артикулы

```sql
create table retailers (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references countries(code),
  name text not null,                  -- 'Лемана ПРО'
  website text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on retailers
  for each row execute procedure extensions.moddatetime(updated_at);
alter table retailers enable row level security;
create policy "retailers_read_all" on retailers for select using (true);
create policy "retailers_admin_write" on retailers for all using (is_admin()) with check (is_admin());
insert into retailers (country_code,name,website) values
 ('RU','Лемана ПРО','https://lemanapro.ru'),('RU','СТД Петрович','https://petrovich.ru'),
 ('RU','Строительный Двор','https://sdvor.com'),('RU','ВсеИнструменты.ру','https://vseinstrumenti.ru'),
 ('KZ','Мегастрой','https://megastroy.kz'),('KZ','12 месяцев','https://12.kz'),
 ('BY','ОМА','https://oma.by'),('BY','Материк','https://materik.by');

create table materials (
  id uuid primary key default gen_random_uuid(),
  sku_internal text not null unique,   -- 'LMB-50150-6000-NAT'
  name text not null,                  -- 'Доска обрезная 50×150×6000, ест. влажности, сорт 1-2'
  category text not null check (category in ('lumber','sheet','insulation','roofing','fasteners','membrane','foundation','finish_ext','finish_int','engineering','tools','other')),
  unit text not null check (unit in ('pcs','m','m2','m3','kg','pack','set')),
  volume_m3 numeric(10,5) not null default 0,  -- объём единицы (для доставки)
  weight_kg numeric(10,3) not null default 0,  -- вес единицы
  lumber_moisture text null check (lumber_moisture in ('natural','dry')), -- только для category='lumber'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_materials_category on materials(category);
create trigger set_updated_at before update on materials
  for each row execute procedure extensions.moddatetime(updated_at);
alter table materials enable row level security;
create policy "materials_read_all" on materials for select using (true);
create policy "materials_admin_write" on materials for all using (is_admin()) with check (is_admin());

-- Дефолтные цены по странам (позже можно детализировать до региона: region_id nullable)
create table material_prices (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  country_code char(2) not null references countries(code),
  region_id uuid null references regions(id) on delete set null, -- null = вся страна
  price_minor integer not null check (price_minor >= 0),
  currency char(3) not null,
  updated_at timestamptz not null default now(),
  unique (material_id, country_code, region_id)
);
create index idx_prices_material on material_prices(material_id);
create trigger set_updated_at before update on material_prices
  for each row execute procedure extensions.moddatetime(updated_at);
alter table material_prices enable row level security;
create policy "prices_read_all" on material_prices for select using (true);
create policy "prices_admin_write" on material_prices for all using (is_admin()) with check (is_admin());

create table retailer_skus (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  retailer_id uuid not null references retailers(id) on delete cascade,
  sku text not null,
  product_url text not null default '',
  unique (material_id, retailer_id)
);
alter table retailer_skus enable row level security;
create policy "skus_read_all" on retailer_skus for select using (true);
create policy "skus_admin_write" on retailer_skus for all using (is_admin()) with check (is_admin());
```

### 2.4 house_projects, конфигурация, этапы, шаги, детали, BOM

```sql
create table house_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,           -- 'dom-6x8-odnoetazhny'
  title text not null,                 -- 'Дом 6×8 одноэтажный «Старт»'
  building_type text not null check (building_type in ('house','banya','hozblok','garage')),
  style text not null default 'classic' check (style in ('classic','barnhouse','scandinavian','a_frame','chalet','mini')),
  -- classic: двускатная классика; barnhouse: барн с односкатной/асимметричной кровлей;
  -- scandinavian: сканди с панорамным остеклением; a_frame: треугольный;
  -- chalet: шале с широкими свесами; mini: мини-дом/дубль-дом до 40 м²
  floors smallint not null check (floors in (1,2)),
  area_m2 numeric(6,1) not null,
  rooms smallint not null,
  footprint text not null,             -- '6×8 м'
  heating_options text[] not null default '{electric,solid_fuel}', -- допустимые: gas, electric, solid_fuel
  max_snow_region smallint not null default 5,  -- проект рассчитан до этого снегового района включительно
  layout_notes jsonb not null default '[]',
  -- пример: [{"title":"Мокрые зоны рядом","text":"Санузел и кухня на одной стене — короткая разводка воды"}]
  description text not null default '',
  price_minor integer not null,        -- цена полного разбора
  currency char(3) not null default 'RUB',
  cover_image_url text not null default '',
  gallery_urls text[] not null default '{}',
  model_glb_url text not null default '',      -- Supabase Storage, слои по именам узлов: frame/roof/exterior/interior
  isometric_fallback_url text not null default '',
  status text not null default 'draft' check (status in ('draft','published')),
  sp_compliant boolean not null default true,   -- бейдж СП 31-105-2002
  is_free boolean not null default false,       -- v1.5: полностью бесплатный проект-эталон; доступ ко всем разделам как при активной покупке
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_projects_status on house_projects(status);
create trigger set_updated_at before update on house_projects
  for each row execute procedure extensions.moddatetime(updated_at);
alter table house_projects enable row level security;
create policy "projects_read_published" on house_projects for select using (status='published' or is_admin());
create policy "projects_admin_write" on house_projects for all using (is_admin()) with check (is_admin());

-- Группы опций конфигуратора и опции
create table config_options (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references house_projects(id) on delete cascade,
  group_key text not null check (group_key in ('lumber','roofing','finish_ext','finish_int','foundation')),
  option_key text not null,            -- 'natural','dry','metal_tile','ondulin','proflist','imitation','siding','planken','vagonka','paint_ready','piles','mzlf','columnar'
  label text not null,                 -- 'Сухая строганая доска'
  is_default boolean not null default false,
  sort smallint not null default 0,
  unique (project_id, group_key, option_key)
);
alter table config_options enable row level security;
create policy "cfg_read_all" on config_options for select using (true);
create policy "cfg_admin_write" on config_options for all using (is_admin()) with check (is_admin());

create table stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references house_projects(id) on delete cascade,
  sort smallint not null,
  code text not null,                  -- 'foundation','frame_floor','wall_s1',...; служебный код, пользователю НЕ показывается (v1.5)
  title text not null,                 -- 'Этап 3. Стена S1 (фасад с окном)' — рабочее название для админки
  display_name text not null default '',  -- v1.5: человеческое имя для пользователя, напр. «Жёлтая стена (к дороге)»
  color text null check (color in ('red','green','yellow','blue','orange','purple')),  -- v1.5: цветовая маркировка этапа (как у parts)
  intro text not null default '',      -- простое объяснение, что будет на этапе
  delivery_wave smallint not null default 2 check (delivery_wave between 1 and 5),
  applies_when jsonb not null default '{}',  -- условие показа, напр. {"foundation":"mzlf"}; {} = всегда
  unique (project_id, code)
);
create index idx_stages_project on stages(project_id, sort);
alter table stages enable row level security;
create policy "stages_read_all" on stages for select using (true);
create policy "stages_admin_write" on stages for all using (is_admin()) with check (is_admin());

create table steps (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references stages(id) on delete cascade,
  sort smallint not null,
  title text not null,                       -- 'Соберите нижнюю обвязку'
  why_text text not null default '',         -- «Зачем этот шаг» — обязателен для публикации
  prep_text text not null default '',        -- «Подготовьте» (накануне/до начала)
  image_url text not null default '',        -- схема шага
  actions jsonb not null default '[]',       -- ["Разложите доски A-1 и A-2 на ровной площадке", ...]
  tools text[] not null default '{}',        -- ['молоток','угольник','шуруповёрт']
  safety_text text not null default '',      -- правило безопасности, если есть риск
  duration_min_solo smallint null,           -- минуты одному
  duration_min_pair smallint null,           -- минуты вдвоём
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  weather_note text not null default '',     -- 'Не начинайте перед дождём: нужно 4 сухих часа'
  self_check jsonb not null default '[]',    -- ["Диагонали различаются ≤ 5 мм?", "Гвозди добиты заподлицо?"]
  hint text not null default '',             -- Подсказка
  common_mistake text not null default '',   -- Частая ошибка
  helpers_needed smallint not null default 0,
  is_practice boolean not null default false,   -- тренировочный шаг (можно пропустить кнопкой «У меня есть опыт»)
  is_mandatory boolean not null default false,  -- нельзя пропустить (шаг «Техника безопасности»)
  applies_when jsonb not null default '{}'
);
-- Валидация публикации (админ-линтер, 5.10): why_text<>'', self_check не пуст, duration задан.
create index idx_steps_stage on steps(stage_id, sort);
alter table steps enable row level security;
create policy "steps_read_all" on steps for select using (true);
create policy "steps_admin_write" on steps for all using (is_admin()) with check (is_admin());

-- Детали (доски с маркировкой) — для раскроя и блока «Возьмите» в шаге
create table parts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references house_projects(id) on delete cascade,
  part_code text not null,             -- 'B-12'
  color text not null check (color in ('red','green','yellow','blue','orange','purple')),
  material_id uuid not null references materials(id),  -- из какой заготовки режется
  cut_length_mm integer not null,      -- 2440
  qty integer not null check (qty > 0),
  applies_when jsonb not null default '{}',   -- напр. {"lumber":"dry"} — если детали различаются по опции
  unique (project_id, part_code)
);
alter table parts enable row level security;
create policy "parts_read_all" on parts for select using (true);
create policy "parts_admin_write" on parts for all using (is_admin()) with check (is_admin());

-- Инструменты проекта: купить или арендовать
create table project_tools (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references house_projects(id) on delete cascade,
  name text not null,                    -- 'Циркулярная пила'
  category text not null check (category in ('measure','hand','power','level','safety','special')),
  recommendation text not null check (recommendation in ('buy','rent','borrow_or_buy_cheap')),
  reason text not null,                  -- 'Нужна каждый день 2 месяца — аренда выйдет дороже покупки'
  approx_price_minor integer not null,   -- ориентир покупки
  approx_rent_day_minor integer null,    -- ориентир аренды/сутки (null = не арендуют)
  days_needed smallint not null,         -- на сколько дней реально нужен
  alternative text not null default '',  -- 'Нет циркулярки — ножовка: медленнее в 5 раз, но работает'
  stage_codes text[] not null default '{}',
  sort smallint not null default 0
);
alter table project_tools enable row level security;
create policy "ptools_read_all" on project_tools for select using (true);
create policy "ptools_admin" on project_tools for all using (is_admin()) with check (is_admin());
-- Читается всеми: список инструмента показываем и на витрине (это продаёт), детали buy/rent — в кабинете.

-- Связка шаг ↔ детали и крепёж
create table step_parts (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references steps(id) on delete cascade,
  part_id uuid not null references parts(id) on delete cascade,
  qty integer not null check (qty > 0)
);
create table step_materials (           -- крепёж/расходники прямо в шаге
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references steps(id) on delete cascade,
  material_id uuid not null references materials(id),
  qty numeric(10,3) not null check (qty > 0)
);
alter table step_parts enable row level security;
alter table step_materials enable row level security;
create policy "sp_read_all" on step_parts for select using (true);
create policy "sp_admin" on step_parts for all using (is_admin()) with check (is_admin());
create policy "sm_read_all" on step_materials for select using (true);
create policy "sm_admin" on step_materials for all using (is_admin()) with check (is_admin());

-- BOM: полная потребность материалов по этапам с условиями конфигурации
create table bom_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references house_projects(id) on delete cascade,
  stage_id uuid not null references stages(id) on delete cascade,
  material_id uuid not null references materials(id),
  qty numeric(12,3) not null check (qty > 0),
  applies_when jsonb not null default '{}'
  -- пример: {"roofing":"metal_tile"} — позиция входит в смету только при этой опции
);
create index idx_bom_project on bom_items(project_id);
alter table bom_items enable row level security;
create policy "bom_read_all" on bom_items for select using (true);
create policy "bom_admin_write" on bom_items for all using (is_admin()) with check (is_admin());
```

### 2.5 foundation_rules — матрица рекомендаций фундамента

```sql
create table foundation_rules (
  id uuid primary key default gen_random_uuid(),
  soil text not null check (soil in ('clay','loam','sandy_loam','sand','peat','unknown')),
  high_water text not null check (high_water in ('yes','no','unknown')),
  relief text not null check (relief in ('flat','slope')),
  weight_class text not null check (weight_class in ('light','standard')), -- light: hozblok/banya ≤35м², standard: дома
  foundation text not null check (foundation in ('piles','mzlf','columnar')),
  reason_points jsonb not null   -- ["Высокая вода — лента будет мокнуть", "Сваи ставятся за 1 день без бетона", ...]
);
alter table foundation_rules enable row level security;
create policy "fr_read_all" on foundation_rules for select using (true);
create policy "fr_admin" on foundation_rules for all using (is_admin()) with check (is_admin());
-- Сид (полная матрица; правила применяются первым совпадением сверху вниз по этому порядку вставки):
insert into foundation_rules (soil,high_water,relief,weight_class,foundation,reason_points) values
 ('peat','yes','flat','standard','piles','["Торф не держит нагрузку — сваи проходят его до плотного грунта","Бетонная лента на торфе треснет","Монтаж за 1–2 дня без бетонных работ"]'),
 ('peat','yes','flat','light','piles','["Торф не держит нагрузку","Для лёгкой постройки хватит коротких свай"]'),
 ('peat','no','flat','standard','piles','["Торф ненадёжен даже сухой","Сваи проходят его до плотного слоя"]'),
 ('peat','no','flat','light','piles','["Торф ненадёжен","Короткие сваи решают вопрос за день"]'),
 ('peat','yes','slope','standard','piles','["Торф + уклон: только сваи разной длины"]'),
 ('peat','no','slope','standard','piles','["Уклон на торфе выравнивается сваями разной длины"]'),
 ('peat','unknown','flat','standard','piles','["Торф: консервативно — сваи"]'),
 ('clay','yes','flat','standard','piles','["Глина + высокая вода = сильное пучение зимой","Лента потребует дренажа и утепления — дорого и сложно новичку","Сваи ниже глубины промерзания не выпучит"]'),
 ('clay','yes','flat','light','piles','["Пучинистая мокрая глина поднимет столбики","Сваи надёжнее для любой постройки"]'),
 ('clay','no','flat','standard','mzlf','["Сухая глина несёт каркасник уверенно","МЗЛФ с утеплённой отмосткой — классика по СП","Дешевле свай при ровном участке"]'),
 ('clay','no','flat','light','columnar','["Для лёгкой постройки хватит столбчатого","Самый дешёвый вариант","День работы без спецтехники"]'),
 ('clay','unknown','flat','standard','piles','["Неизвестная вода на глине — берём надёжный вариант","Проверите грунт — можно пересчитать"]'),
 ('loam','yes','flat','standard','piles','["Суглинок с водой пучит","Сваи не зависят от пучения"]'),
 ('loam','no','flat','standard','mzlf','["Суглинок без воды — хорошее основание","МЗЛФ дешевле и жёстче для дома"]'),
 ('loam','no','flat','light','columnar','["Лёгкая постройка на сухом суглинке — столбики","Минимум денег и работы"]'),
 ('loam','unknown','flat','standard','piles','["Вода неизвестна — консервативно сваи"]'),
 ('sandy_loam','no','flat','standard','mzlf','["Супесь дренирует воду — пучение слабое","МЗЛФ оптимален по цене/жёсткости"]'),
 ('sandy_loam','yes','flat','standard','piles','["Высокая вода — сваи проще и суше"]'),
 ('sand','no','flat','standard','mzlf','["Песок — лучшее основание: не пучит","МЗЛФ мелкого заложения, экономия бетона"]'),
 ('sand','yes','flat','standard','mzlf','["Песок дренирует — вода не критична","МЗЛФ с подушкой работает и тут"]'),
 ('sand','no','flat','light','columnar','["Лёгкая постройка на песке — столбики, дешевле некуда"]'),
 ('unknown','unknown','flat','standard','piles','["Грунт неизвестен — сваи работают почти везде","Совет: закажите пробное завинчивание одной сваи — это и есть экспресс-геология"]'),
 ('unknown','unknown','flat','light','piles','["Неизвестный грунт — сваи безопаснее"]'),
 ('unknown','unknown','slope','standard','piles','["Уклон: сваи разной длины вместо дорогой планировки участка"]');
-- Правило по коду: если relief='slope' и точного совпадения нет → 'piles'.
```

### 2.6 purchases, user_prices, user_progress, user_expenses

```sql
create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  project_id uuid not null references house_projects(id),
  code text not null unique,           -- 'SD-7F3K9Q'
  status text not null default 'pending' check (status in ('pending','active','rejected','refunded')),
  provider text not null default 'manual' check (provider in ('manual','promo','yookassa')),
  amount_minor integer not null,
  currency char(3) not null,
  config jsonb not null default '{}',  -- зафиксированная конфигурация на момент покупки: {"lumber":"dry","roofing":"metal_tile","finish_ext":"imitation","finish_int":"vagonka","foundation":"piles"}
  region_id uuid null references regions(id),
  activated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, project_id)
);
create index idx_purchases_user on purchases(user_id);
create index idx_purchases_status on purchases(status);
create trigger set_updated_at before update on purchases
  for each row execute procedure extensions.moddatetime(updated_at);
alter table purchases enable row level security;
create policy "purch_select_own" on purchases for select using (user_id = auth.uid() or is_admin());
create policy "purch_insert_own" on purchases for insert with check (user_id = auth.uid() and status = 'pending');
create policy "purch_update_admin" on purchases for update using (is_admin()) with check (is_admin());
-- Пользователь может менять только config своей активной покупки:
create policy "purch_update_own_config" on purchases for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and status = (select status from purchases p where p.id = purchases.id));

create table promo_codes (
  code text primary key,
  project_id uuid null references house_projects(id), -- null = любой проект
  uses_left integer not null default 1 check (uses_left >= 0),
  expires_at timestamptz null
);
alter table promo_codes enable row level security;
create policy "promo_admin_all" on promo_codes for all using (is_admin()) with check (is_admin());
-- Гашение промокода — только через серверный роут с service_role.

create table user_prices (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  material_id uuid not null references materials(id),
  price_minor integer not null check (price_minor >= 0),
  updated_at timestamptz not null default now(),
  unique (purchase_id, material_id)
);
create trigger set_updated_at before update on user_prices
  for each row execute procedure extensions.moddatetime(updated_at);
alter table user_prices enable row level security;
create policy "uprices_own" on user_prices for all
  using (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()))
  with check (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()));

create table user_progress (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  step_id uuid not null references steps(id) on delete cascade,
  done_at timestamptz not null default now(),
  unique (purchase_id, step_id)
);
alter table user_progress enable row level security;
create policy "uprog_own" on user_progress for all
  using (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()))
  with check (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()));

create table user_expenses (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  material_id uuid null references materials(id),  -- null = произвольная трата
  custom_title text not null default '',
  stage_id uuid null references stages(id),
  qty numeric(12,3) not null default 1,
  amount_minor integer not null check (amount_minor >= 0),
  currency char(3) not null,
  spent_on date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (material_id is not null or custom_title <> '')
);
create index idx_expenses_purchase on user_expenses(purchase_id);
create trigger set_updated_at before update on user_expenses
  for each row execute procedure extensions.moddatetime(updated_at);
alter table user_expenses enable row level security;
create policy "uexp_own" on user_expenses for all
  using (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()))
  with check (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()));
```

### 2.7 negotiation_scripts, foreman (чат прораба)

```sql
create table negotiation_scripts (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('lumber_base','foundation_crew','septic','delivery','electrician','windows')),
  title text not null,
  questions jsonb not null,      -- ["Какая влажность доски? Чем меряете?", ...]
  good_answers jsonb not null,   -- ["Есть влагомер, покажем при вас: 18–22% для ЕВ", ...]
  red_flags jsonb not null,      -- ["«Кубатуру не считаем, продаём пачками» — уходите", ...]
  price_hints text not null default '',
  field_check text not null default '',  -- 'Кубатура: толщина×ширина×длина×кол-во. 50×150×6000 = 0,045 м³/шт...'
  stage_codes text[] not null default '{}',  -- на каких этапах показывать контекстно
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on negotiation_scripts
  for each row execute procedure extensions.moddatetime(updated_at);
alter table negotiation_scripts enable row level security;
-- Скрипты — платный контент: читают только владельцы активных покупок и админ
create policy "scripts_paid_read" on negotiation_scripts for select
  using (is_admin() or exists (select 1 from purchases p where p.user_id = auth.uid() and p.status='active'));
create policy "scripts_admin_write" on negotiation_scripts for all using (is_admin()) with check (is_admin());

create table foreman_messages (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  step_id uuid null references steps(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_foreman_purchase on foreman_messages(purchase_id, created_at);
alter table foreman_messages enable row level security;
create policy "foreman_own" on foreman_messages for select
  using (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()) or is_admin());
create policy "foreman_insert_own" on foreman_messages for insert
  with check (role='user' and exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid() and p.status='active'));
-- assistant-сообщения пишет только сервер (service_role, минуя RLS).
```

### 2.8 Диаграмма связей (ASCII)

```
countries ─< regions ─< profiles
countries ─< retailers ─< retailer_skus >─ materials ─< material_prices
house_projects ─< config_options
house_projects ─< stages ─< steps ─< step_parts >─ parts >─ materials
                         └────────< step_materials >─ materials
house_projects ─< parts
house_projects ─< bom_items >─ materials, stages
house_projects ─< project_tools
foundation_rules (справочник без FK)
profiles ─< purchases >─ house_projects, regions
purchases ─< user_prices >─ materials
purchases ─< user_progress >─ steps
purchases ─< user_expenses >─ materials?, stages?
purchases ─< foreman_messages >─ steps?
promo_codes >─ house_projects?
```

---

## БЛОК 3: API Endpoints

Все роуты — Next.js App Router: `src/app/api/<resource>/route.ts`. Формат ошибок единый:
```json
{ "error": { "code": "NOT_FOUND", "message": "Проект не найден" } }
```
Коды: VALIDATION_ERROR(400), UNAUTHORIZED(401), FORBIDDEN(403), NOT_FOUND(404), CONFLICT(409), RATE_LIMITED(429), INTERNAL(500), UPSTREAM_UNAVAILABLE(503).
Пагинация: `{ "data": [], "meta": { "total": 128, "page": 1, "per_page": 20 } }`.
Аутентификация: Supabase session cookie (`@supabase/ssr`); публичные роуты помечены.
Роуты с пометкой «(auth, владелец, active)» равно доступны для проектов с is_free=true — доступ как при активной покупке (v1.5).

### 3.1 POST /api/quiz/match — подбор проектов (публичный)

Zod:
```ts
const QuizSchema = z.object({
  buildingType: z.enum(['house','banya','hozblok','garage']),
  style: z.enum(['classic','barnhouse','scandinavian','a_frame','chalet','mini','any']).default('any'),
  floors: z.union([z.literal(1), z.literal(2), z.literal(0)]).default(0), // 0 = не важно
  rooms: z.number().int().min(1).max(10).optional(),
  areaM2: z.number().min(10).max(400),
  regionId: z.string().uuid(),
  heating: z.enum(['gas','electric','solid_fuel','undecided']).default('undecided'),
  budgetMinor: z.number().int().positive().nullable().default(null)
});
```
Request:
```json
{ "buildingType":"house","style":"any","floors":1,"rooms":3,"areaM2":50,
  "regionId":"e6f1c2aa-9b1d-4f0e-8c3a-2f5d7b9e1a44","heating":"electric","budgetMinor":120000000 }
```
Response 200:
```json
{ "data": [
  { "id":"a1b2c3d4-0000-4000-8000-000000000001","slug":"dom-6x8-start","title":"Дом 6×8 «Старт»",
    "areaM2":48,"rooms":3,"floors":1,"style":"classic","coverImageUrl":"https://.../start.webp",
    "estimateMinor":98500000,"currency":"RUB","priceMinor":990000,
    "matchScore":0.94,
    "whyMatch":["Площадь 48 м² — как вы хотели (50)","Рассчитан на электроотопление: утепление 200 мм","Подходит для снегового района 3 (Москва)"] }
], "meta": { "total": 3, "relaxed": false } }
```
Логика: фильтр по building_type, style (если не any), floors (если не 0), heating (heating_options содержит выбранное или undecided), max_snow_region >= snow_region региона; скоринг: 0.5×близость площади + 0.3×близость бюджета к estimate + 0.2×совпадение комнат; сортировка по score, максимум 4. Если после фильтров < 2 — снять фильтры бюджета и площади (флаг `relaxed:true`, у карточек `whyMatch` дополняется «немного больше вашей площади»).

### 3.2 GET /api/projects — каталог (публичный)
Query: `?buildingType=house&style=barn&page=1&per_page=20`. Response 200 — как data выше без matchScore/whyMatch, с meta-пагинацией.

### 3.3 GET /api/projects/[slug] — карточка (публичный)
Response 200:
```json
{ "data": {
  "id":"a1b2c3d4-0000-4000-8000-000000000001","slug":"dom-6x8-start","title":"Дом 6×8 «Старт»",
  "buildingType":"house","style":"classic","floors":1,"areaM2":48,"rooms":3,"footprint":"6×8 м",
  "heatingOptions":["electric","solid_fuel"],"spCompliant":true,
  "layoutNotes":[{"title":"Окна на юг","text":"Гостиная получает свет весь день — меньше расходов на освещение"}],
  "description":"...","priceMinor":990000,"currency":"RUB",
  "modelGlbUrl":"https://.../start.glb","isometricFallbackUrl":"https://.../start-iso.webp",
  "galleryUrls":["https://.../1.webp"],
  "configOptions":{
    "lumber":[{"key":"natural","label":"Доска естественной влажности","isDefault":true},{"key":"dry","label":"Сухая строганая","isDefault":false}],
    "roofing":[{"key":"metal_tile","label":"Металлочерепица","isDefault":true},{"key":"ondulin","label":"Ондулин","isDefault":false}],
    "finish_ext":[{"key":"imitation","label":"Имитация бруса","isDefault":true}],
    "finish_int":[{"key":"vagonka","label":"Вагонка","isDefault":true}],
    "foundation":[{"key":"piles","label":"Свайно-винтовой","isDefault":true},{"key":"mzlf","label":"Лента МЗЛФ","isDefault":false},{"key":"columnar","label":"Столбчатый","isDefault":false}]
  }
} }
```
404: `{"error":{"code":"NOT_FOUND","message":"Проект не найден"}}`.

### 3.4 GET /api/projects/[id]/estimate — предварительная смета (публичный)
Query: `?lumber=dry&roofing=metal_tile&finish_ext=imitation&finish_int=vagonka&foundation=piles&regionId=<uuid>`
Zod: все ключи enum по config_options проекта; неизвестная опция → 400 VALIDATION_ERROR.
Response 200:
```json
{ "data": {
  "currency":"RUB",
  "totalMinor":112340000,
  "byStage":[
    {"stageCode":"foundation","title":"Фундамент","subtotalMinor":14890000},
    {"stageCode":"frame_floor","title":"Платформа пола","subtotalMinor":11020000},
    {"stageCode":"walls","title":"Стены","subtotalMinor":32410000},
    {"stageCode":"roof","title":"Крыша и кровля","subtotalMinor":24630000},
    {"stageCode":"finish","title":"Отделка","subtotalMinor":21100000},
    {"stageCode":"engineering","title":"Инженерка","subtotalMinor":5620000},
    {"stageCode":"consumables","title":"Расходка","subtotalMinor":2680000}
  ]
} }
```
Логика: выбрать bom_items проекта, где applies_when ⊆ config (пустой {} проходит всегда); цены: material_prices точного региона → страны; qty×price; группировка по stage.

### 3.5 POST /api/foundation/recommend (публичный)
Zod:
```ts
const FoundationSchema = z.object({
  regionId: z.string().uuid(),
  soil: z.enum(['clay','loam','sandy_loam','sand','peat','unknown']),
  highWater: z.enum(['yes','no','unknown']),
  relief: z.enum(['flat','slope']),
  projectId: z.string().uuid()
});
```
Response 200:
```json
{ "data": {
  "foundation":"piles","label":"Свайно-винтовой",
  "freezingDepthM":1.4,
  "reasonPoints":["Глина + высокая вода = сильное пучение зимой","Лента потребует дренажа — дорого и сложно новичку","Сваи ниже глубины промерзания не выпучит"],
  "estimateDeltaMinor":-3200000,
  "disclaimer":"Рекомендация носит информационный характер и не заменяет инженерно-геологические изыскания."
} }
```
Логика: weight_class = light если building_type in (hozblok,banya,garage) и area ≤ 35, иначе standard; d0 по грунту (clay/loam 0.23, sandy_loam 0.28, sand 0.30, peat 0.28, unknown 0.23); dfn = round(d0×sqrt(Mt),1); правило из foundation_rules по (soil,highWater,relief,weight_class), при отсутствии точного — fallback 'piles'; delta = смета с рекомендованным фундаментом − смета с дефолтным.

### 3.6 POST /api/purchases (auth)
Zod:
```ts
const PurchaseSchema = z.object({
  projectId: z.string().uuid(),
  config: z.record(z.string(), z.string()),
  regionId: z.string().uuid(),
  promoCode: z.string().trim().toUpperCase().optional(),
  disclaimerAccepted: z.literal(true)
});
```
Response 201 (без промокода):
```json
{ "data": { "purchaseId":"9c1e...","code":"SD-7F3K9Q","status":"pending",
  "amountMinor":990000,"currency":"RUB",
  "payInstructions":{"url":"https://pay.cloudtips.ru/p/XXXXXX","comment":"SD-7F3K9Q",
    "note":"Укажите код в комментарии платежа. Доступ откроем в течение 2 часов."} } }
```
Response 201 (с валидным промокодом): `"status":"active"` сразу. Ошибки: 409 CONFLICT «У вас уже есть доступ к этому проекту»; 400 «Промокод недействителен или исчерпан». Код генерируется: 'SD-' + 6 симв. из A-Z0-9 без похожих (без O,0,I,1), проверка уникальности.

### 3.7 GET /api/my/projects (auth)
Response 200: покупки пользователя со статусом, названием проекта, прогрессом:
```json
{ "data":[ {"purchaseId":"9c1e...","status":"active","project":{"slug":"dom-6x8-start","title":"Дом 6×8 «Старт»","coverImageUrl":"..."},
  "progress":{"doneSteps":37,"totalSteps":214,"currentStage":"Стены"},"activatedAt":"2026-07-20T10:12:00Z"} ] }
```

### 3.8 GET /api/my/[purchaseId]/build (auth, владелец, active)
Возвращает этапы (fильтрованные по applies_when ⊆ purchase.config) с шагами, деталями и прогрессом. Фрагмент шага:
```json
{ "id":"st-...","title":"Соберите нижнюю обвязку","imageUrl":"https://.../step-3-2.webp",
  "why":"Обвязка — «рамка», на которой стоит весь дом. Если она кривая, кривым будет всё выше.",
  "prep":"Понадобится 3 сухих часа и помощник на переноску досок. Проверьте, что сваи обрезаны в уровень (шаг 1.6).",
  "take":{"parts":[{"partCode":"A-1","color":"red","name":"Доска 50×150","cutLengthMm":5890,"qty":2}],
          "materials":[{"name":"Гвоздь ершёный 90 мм","qty":24,"unit":"pcs"}]},
  "actions":["Разложите доски A-1 (красные) по длинной стороне фундамента","Проверьте диагонали рулеткой: разница ≤ 5 мм","Скрепите углы по 3 гвоздя"],
  "tools":["молоток","рулетка 10 м","угольник"],
  "safety":"Доска 6 м весит ~28 кг — носите вдвоём или волоком, спина скажет спасибо.",
  "durationMinSolo":180,"durationMinPair":90,"difficulty":2,
  "weatherNote":"Не начинайте перед дождём: нужно 3–4 сухих часа.",
  "selfCheck":["Диагонали различаются ≤ 5 мм?","Углы скреплены по 3 гвоздя?","Обвязка не качается при нажатии ногой?"],
  "hint":"Диагонали проверяйте ДО крепежа — потом не исправить без выдирания гвоздей",
  "commonMistake":"Крепить обвязку к сваям до проверки диагоналей",
  "helpersNeeded":1,"done":false }
```
403 FORBIDDEN если покупка не active или не принадлежит пользователю.

### 3.9 POST /api/my/[purchaseId]/progress (auth, владелец)
Body: `{ "stepId":"st-...","done":true }` → 200 `{ "data":{"doneSteps":38,"totalSteps":214} }`. done:false удаляет отметку.

### 3.10 GET /api/my/[purchaseId]/cutting (auth, владелец)
Response 200 (фрагмент):
```json
{ "data":{ "stockPlans":[
  { "material":{"name":"Доска 50×150×6000 ест.вл.","unit":"pcs"},"boardsNeeded":84,
    "layouts":[ {"boardCount":36,"segments":[{"partCode":"B-12","color":"red","lengthMm":2440},{"partCode":"B-12","color":"red","lengthMm":2440},{"wasteMm":1120}]} ] } ],
  "markerSummary":[{"color":"red","instruction":"Красным отметьте 72 детали B-12 — стойки стен, рез 2440 мм"}] } }
```
Логика раскроя: жадный FFD (First Fit Decreasing) по деталям каждого материала на стандартную длину заготовки 6000 мм, пропил 4 мм на рез.

### 3.11 GET /api/my/[purchaseId]/estimate (auth, владелец) — живая смета
Как 3.4, но цены с учётом user_prices (перекрытие) и с полями позиций:
```json
{ "material":{"id":"m-...","name":"Доска 50×150×6000 сухая","unit":"pcs"},
  "qty":84,"priceMinor":98000,"isUserPrice":true,
  "sku":{"retailer":"Лемана ПРО","sku":"81952317","url":"https://lemanapro.ru/product/81952317"},
  "amountMinor":8232000,"stageCode":"walls","purchased":true }
```

### 3.12 PATCH /api/my/prices (auth) — своя цена
Body: `{ "purchaseId":"9c1e...","materialId":"m-...","priceMinor":95000 }` (null → удалить перекрытие). 200 → новая позиция+итог.

### 3.13 CRUD /api/my/[purchaseId]/expenses (auth, владелец)
POST body:
```json
{ "materialId":"m-...", "customTitle":"", "stageId":"stg-...", "qty":84, "amountMinor":7980000, "spentOn":"2026-07-25", "note":"База «Лесторг», скидка за объём" }
```
GET response — список + сводка `{"planMinor":112340000,"factMinor":41230000,"byStage":[{"stageCode":"walls","planMinor":32410000,"factMinor":29800000}]}`. PATCH/DELETE по id.

### 3.14 GET /api/my/[purchaseId]/delivery (auth, владелец)
Response 200 (фрагмент):
```json
{ "data":{ "waves":[
  { "wave":1,"title":"Фундамент","volumeM3":1.8,"weightKg":2140,
    "transport":{"type":"Манипулятор 5 т","why":"Сваи 2,5 м + оголовки: тяжело, но компактно"},
    "tips":["Закажите завинчивание и доставку у одной фирмы — дешевле"] } ] } }
```
Правила транспорта: weight≤1500 кг и maxLen<4 м → «Газель борт»; ≤5000 кг или длинномеры 6 м → «Манипулятор 5 т (борт 6 м)»; больше → «Длинномер/фура + разгрузка». maxLen из материалов волны.

### 3.14a GET /api/my/[purchaseId]/tools (auth, владелец)
Response 200 (фрагмент):
```json
{ "data":{ "summary":{"buyTotalMinor":3240000,"rentTotalMinor":840000},
  "tools":[
   {"name":"Циркулярная пила","category":"power","recommendation":"buy",
    "reason":"Нужна каждый день 2 месяца — аренда выйдет дороже покупки",
    "approxPriceMinor":650000,"approxRentDayMinor":50000,"daysNeeded":45,
    "alternative":"Ножовка: медленнее в 5 раз, но работает","stages":["frame_floor","walls","roof"]},
   {"name":"Нивелир лазерный","category":"level","recommendation":"rent",
    "reason":"Нужен 3 дня на фундаменте и обвязке — аренда 1 500 ₽ против покупки 25 000 ₽",
    "approxPriceMinor":2500000,"approxRentDayMinor":50000,"daysNeeded":3,
    "alternative":"Гидроуровень (шланг с водой) за 500 ₽ — дедовский, но точный","stages":["foundation"]}
  ] } }
```

### 3.15 POST /api/foreman/chat (auth, владелец, active) — SSE-стрим
Body: `{ "purchaseId":"9c1e...","message":"Доску повело винтом, что делать?","stepId":"st-..." }`
Поток SSE `text/event-stream`, завершается `event: done` с `{"messageId":"fm-..."}`. 429 при >50 сообщений/сутки. 503 UPSTREAM_UNAVAILABLE при недоступности Anthropic (сообщение пользователя сохранено).

### 3.16 Админ-роуты (auth, admin)
- `GET/POST/PATCH/DELETE /api/admin/projects[/id]`, `/api/admin/stages`, `/api/admin/steps`, `/api/admin/parts`, `/api/admin/materials`, `/api/admin/prices`, `/api/admin/scripts`, `/api/admin/regions` — стандартный CRUD, Zod-схемы зеркалят таблицы.
- `POST /api/admin/purchases/[id]/activate` → status='active', отправка письма (Supabase SMTP), 200 `{ "data":{"status":"active"} }`.
- `POST /api/admin/purchases/[id]/reject` body `{ "reason":"Платёж не найден" }`.
- `POST /api/admin/import/regions` — CSV (name,country_code,mt,snow_region,wind_region), upsert.
Все админ-роуты: проверка is_admin на сервере, иначе 403.

### 3.17 Заготовка платёжного провайдера (этап 2)
`POST /api/webhooks/yookassa` — маршрут создаётся сразу, возвращает 501 `{"error":{"code":"NOT_IMPLEMENTED","message":"Провайдер появится позже"}}`. Интерфейс в коде: `PaymentProvider { createPayment(purchase): PayInstructions; handleWebhook(req): PurchaseStatusUpdate }`, реализация этапа 1 — `ManualProvider`.

---

## БЛОК 4: UI/UX

Общее: цветовая схема нейтральная (slate + один акцент amber-600 «строительный»), шрифт Inter, радиусы 12px. Каждый экран обязан иметь три состояния: **Loading** (skeleton), **Empty** (иллюстрация + CTA), **Error** (inline-alert + «Повторить»). Иконки — Lucide. Компоненты — shadcn/ui. Responsive: desktop ≥1024, tablet 640–1023, mobile <640 (mobile-first, на стройке пользуются телефоном).

### 4.1 / — Лендинг
Layout: public (header: лого, «Проекты», «Как это работает», «Войти»; footer: дисклеймер, legal-ссылки).
Секции: Hero (заголовок «Собери свой дом. Как конструктор.», подзаголовок, CTA Button lg «Подобрать мой дом» → /quiz, фон — изометрия дома); «Как это работает» (3 Card: Подбор → Смета → Стройка по шагам); Пример шага (скрин конструктора); Проекты (3 карточки из published); Вопросы (Accordion, 6 вопросов); финальный CTA.
Mobile: колонка, hero-изображение под текстом.

### 4.2 /quiz — Анкета
Layout: минимальный (лого + Progress). Компоненты: Progress, RadioGroup крупными плитками (иконка+подпись), Slider (площадь, бюджет), Combobox (город, поиск по regions), Button «Далее»/«Назад».
Состояния: Loading — только при финальном сабмите (спиннер на кнопке «Подбираем…»); Error — toast «Не удалось подобрать, попробуйте ещё раз».
Поведение: один вопрос на экран, Enter = далее, ответы в sessionStorage (ключ sd_quiz_v1). Mobile: плитки 2 колонки.

### 4.3 /quiz/results — Результаты
Компоненты: Card проекта (cover, title, чипы: м², комнаты, этажи; estimate «Материалы ≈ 985 000 ₽»; список whyMatch с CheckCircle2; Button «Смотреть проект»). Баннер при relaxed=true (Alert amber): «Точных совпадений мало — показали ближайшие».
Empty: невозможно (см. US-001). Error: Alert + «Пройти заново».

### 4.4 /projects/[slug] — Витрина
Блоки сверху вниз:
1. Заголовок + чипы + Badge «СП 31-105-2002» (Tooltip с пояснением).
2. Галерея (карусель) | 3D-вьюер: Canvas r3f, OrbitControls; панель слоёв (Switch ×4: Каркас/Кровля и водосток/Отделка снаружи/Отделка внутри — включение = visible узлов GLB по именам frame|roof|exterior|interior). Mobile: 3D за кнопкой «Показать 3D» (ленивая загрузка three). Fallback: изометрия PNG.
3. «Почему планировка удачна» — список layout_notes (иконка Lightbulb).
4. Конфигуратор: группы RadioGroup (пиломатериал/кровля/отделка×2/фундамент); справа sticky-панель сметы: итог крупно, byStage в Collapsible, Button «Купить полный разбор за 9 900 ₽».
5. «Какой фундамент нужен именно вам»: Combobox город + 4 вопроса мини-гида (иллюстрированные RadioGroup, у каждого «Как определить?» — Sheet с картинками теста «колбаска» и ямы) → результат Card: тип, глубина промерзания, 3 причины, Button «Применить к смете», текст дисклеймера (muted).
6. FAQ покупки + повторный CTA.
Состояния: смета Loading — Skeleton строк; Error сметы — Alert в панели «Не удалось посчитать» + Retry; 3D Error — fallback-изометрия.

### 4.5 /projects/[slug]/buy — Покупка
Компоненты: Summary Card (проект, конфигурация списком, цена), Input промокода + «Применить», Checkbox дисклеймера (обязателен), Button «Получить доступ».
После POST: экран инструкции оплаты — Card с суммой, кнопка-ссылка на донат-сервис (внешн., target=_blank), код SD-XXXXXX крупно с Copy-кнопкой, шаги 1-2-3, note «Доступ в течение 2 часов, письмо придёт на email». Statuses: если уже active → редирект в /my/[purchaseId].

### 4.6 /my — Мои проекты
Card на покупку: cover, title, статус (Badge: «Ожидает оплаты» amber / «Активен» green), Progress бар «37 из 214 шагов», Button «Продолжить стройку» (→ /build) или «Инструкция по оплате». Empty: «У вас пока нет проектов» + CTA «Подобрать дом». 

### 4.7 /my/[purchaseId]/build — Конструктор
Layout: сайдбар этапов (цветовой маркер, display_name — человеческое имя этапа, mini-progress; служебный code не показывается (v1.5); текущий подсвечен; блокировок нет — этапы открыты все) + контент шага.
Контент шага (порядок сверху вниз): Breadcrumb (Этап 3 · Жёлтая стена (к дороге)), h1 title, строка мета-чипов (Clock «≈3 ч одному / 1,5 ч вдвоём» · Hammer×2 сложность · Users «помощник ×1» · CloudRain weather_note если есть), блок «Зачем» (muted, italic, 1–2 строки — читается первым), Alert «Подготовьте» (amber, если prep_text), изображение (aspect-video, zoom по клику — Dialog), блок «Возьмите» (Card: детали с цветным кружком ●, code, размер, кол-во; крепёж; инструменты чипами), блок «Сделайте» (нумерованный список), Alert «Безопасность» (red, ShieldAlert, если safety_text), Alert «Подсказка» (blue), Alert «Частая ошибка» (orange), блок «Проверьте себя» — чек-лист Checkbox'ов; кнопка «Готово, дальше →» disabled, пока не отмечены все пункты self_check (state локальный, в БД не пишется). Тренировочные шаги (is_practice): Badge «Тренировка» + ghost-кнопка «У меня есть опыт — пропустить» (пишет progress как done c пометкой skipped в localStorage-очереди; в user_progress отдельного флага нет — считается пройденным). Шаг «Техника безопасности» (is_mandatory): кнопки пропуска нет, self_check обязателен.
Низ: Button «Готово, дальше →» (primary lg, фиксирован снизу на mobile), «← Назад», ghost-Button «Спросить прораба» (MessageCircle) — открывает Sheet с чатом, контекст шага передаётся.
Состояния: Loading — skeleton шага; офлайн-отметка — optimistic + иконка CloudOff в углу до синка; Error загрузки — Alert+Retry.

### 4.8 /my/[purchaseId]/cutting — Раскрой
Фильтр Select по этапу («Все»). Для каждого материала: заголовок (название, всего заготовок), список полос: div-визуализация доски (flex, сегменты с width пропорц. длине, цвет фона = color детали, подпись «B-12 · 2440», отход — серый штрих). Сводка маркеров: цветные Card «Красный: 72 детали — стойки 2440 мм». Button «Печать» (window.print, @media print: полосы по 100% ширины, разрыв страниц по материалу). Клик по сегменту → Popover «Используется: Этап 4, шаги 2, 5» с ссылками.

### 4.9 /my/[purchaseId]/estimate — Живая смета
Tabs: «По этапам» / «Список покупок». Table: Материал (с sku-ссылкой ExternalLink, если есть), Кол-во, Ед., Цена (клик → Input inline, Enter=сохранить; иконка UserPen если isUserPrice + ghost «вернуть»), Сумма, Checkbox «куплено». Групповые subtotals, sticky итог. Toolbar: Button «Экспорт CSV», Select поставщика-приоритета (влияет какой sku показывать). Empty невозможен; Error — Alert+Retry.

### 4.10 /my/[purchaseId]/finance — Фин-отчёт
Верх: 3 Stat-Card (План / Факт / Разница ±, цвет по знаку). Recharts BarChart: этапы × (план, факт). Table трат: дата, позиция, этап, кол-во, сумма, note, actions (Edit/Trash). Button «Добавить трату» → Dialog: Combobox позиции сметы ИЛИ Input произвольного названия, Select этапа, Input суммы (маска руб/коп), DatePicker, Textarea note. Empty: «Пока нет трат — добавьте первую покупку».

### 4.11 /my/[purchaseId]/delivery — Доставка
Card на волну: заголовок «Волна 2 · Каркас и кровля», чипы (Объём 6,4 м³ · Вес 4 210 кг · Манипулятор 5 т), Collapsible список материалов, блок «Советы» (список с Truck icon). Итоговый Alert: «Итого 2 доставки вместо 5 — экономия ~18 000 ₽» (оценка: (5−N)×средняя стоимость доставки по стране, константа в конфиге).

### 4.12 /my/[purchaseId]/foreman — Прораб
Чат-стандарт: список сообщений (assistant слева с аватаром HardHat, user справа), Markdown-рендер ответов, стриминг с курсором. Input снизу + Send. Chips-подсказки при пустой истории: «С чего начать?», «Проверь мой инструмент», «Как хранить доски?». Лимит-плашка при 429. Error отправки: сообщение остаётся в поле, toast + Retry.

### 4.12a /my/[purchaseId]/tools — Инструменты
Верх: 2 Stat-Card («Купить: ≈ 32 400 ₽», «Арендовать: ≈ 8 400 ₽»). Табы по категориям. Card инструмента: название + иконка категории, Badge рекомендации (Купить green / Аренда blue / Одолжить или дешёвый amber), reason, цены (покупка vs аренда×дни), «Альтернатива» (muted), чипы этапов. Фильтр «Показать только для этапа N». В конструкторе на первом шаге этапа — ссылка «Инструменты этого этапа».

### 4.13 /my/[purchaseId]/scripts — Скрипты
Grid Card по категориям (иконки: Trees=лесная база, Anchor=фундамент, Droplets=септик, Truck=доставка, Zap=электрик). Внутри (Dialog или страница): секции Questions (нумерованные), GoodAnswers (green Check), RedFlags (red Flag), PriceHints (muted), FieldCheck (Card с формулой кубатуры). 

### 4.14 /admin — Админка
Layout: сайдбар разделов. Каждый раздел: Table + поиск + Button «Добавить» → Sheet-форма. Покупки: Table (код, email, проект, сумма, дата, статус) + фильтр pending, Button «Активировать» (confirm-Dialog) / «Отклонить». Загрузка файлов: input → Supabase Storage (bucket 'public-assets': изображения; 'models': glb), после — URL в форму. Регионы: кнопка «Импорт CSV».

### 4.15 Auth-экраны
Стандартные shadcn-формы. Register: name, email, password + Checkbox ПД (обязателен). Ошибки инлайн под полями. После register — экран «Проверьте почту».

---

## БЛОК 5: Business Logic

### 5.1 Валидация форм (клиент+сервер, Zod единые схемы)
| Форма | Поле | Правила | При нарушении |
|---|---|---|---|
| Регистрация | name | 2–60 симв. | «Введите имя (от 2 символов)» |
| | email | email() | «Проверьте email» |
| | password | ≥8, ≥1 цифра | «Минимум 8 символов и хотя бы одна цифра» |
| | pd_consent | literal(true) | кнопка disabled |
| Анкета | areaM2 | 10–400 | слайдер не даёт выйти |
| Своя цена | priceMinor | int ≥0, ≤ 100 000 000 (1 млн ₽/ед.) | «Цена выглядит нереальной — проверьте» |
| Трата | amountMinor | int ≥0 ≤ 1 000 000 000 | то же |
| | spentOn | не в будущем | «Дата не может быть в будущем» |
| Промокод | code | /^[A-Z0-9-]{4,20}$/ | «Неверный формат кода» |
| Прораб | message | 1–2000 симв. | счётчик, disable Send |

### 5.2 Расчёт сметы (единая функция calcEstimate)
1. Вход: projectId, config (map group→option), regionId, purchaseId? (для user_prices).
2. bom = bom_items where project_id and applies_when ⊆ config (сравнение: каждый ключ applies_when существует в config с тем же значением).
3. Цена позиции: user_prices(purchase,material) → material_prices(material, region) → material_prices(material, country, region null). Если цены нет нигде — позиция включается с price=0 и флагом `priceMissing:true` (админ видит отчёт «материалы без цен»).
4. amount = ceil(qty) для unit='pcs' (доски не бывают дробными), иначе qty; ×price.
5. Валюта — по стране региона; кросс-валютных смет нет (материал без цены в валюте страны = priceMissing).

### 5.3 Глубина промерзания и фундамент
dfn = d0 × √Mt; d0: clay/loam/unknown 0.23, sandy_loam/peat 0.28, sand 0.30. Округление до 0,1 м. Правило из foundation_rules по точному совпадению (soil, high_water, relief, weight_class); нет совпадения → ('piles', ["Универсальный вариант для неопределённых условий"]). Ответ всегда содержит disclaimer-строку.

### 5.4 Аутентификация
Регистрация: Supabase signUp(email, password, data:{name}) → триггер профиля → confirm email (обязателен) → redirect next. Вход: signInWithPassword; 5 неудач подряд → пауза 15 мин (Supabase rate limit по умолчанию + сообщение). Восстановление: resetPasswordForEmail → /auth/reset с новым паролем. Сессии: @supabase/ssr, middleware обновляет токен, приватные layout проверяют session, /admin дополнительно роль.

### 5.5 Покупка и доступ
- Уникальность (user, project) — на уровне БД.
- Активная покупка = status 'active'. Все /my/[purchaseId]/* роуты: purchase.user_id=uid AND status='active' (кроме страницы инструкции по оплате — доступна при pending).
- Промокод: серверный роут service_role: select for update, uses_left>0, not expired, project match → decrement, purchase active. 
- Email-уведомления: при создании (инструкция+код), при активации, при отклонении (с reason). Отправка — Supabase Auth SMTP (кастомные письма через edge-совместимый nodemailer на VPS недоступен на Vercel — используем Resend free tier, 100 писем/день, ключ RESEND_API_KEY).
- Возвраты: вручную (status='refunded' админом), доступ закрывается.
- v1.5: проект с is_free=true доступен целиком без покупки (эталонная демо-витрина): конструктор, смета, раскрой, PDF, «Добрый прораб» — как при активной покупке. Проверки «владелец активной покупки» в API и RLS дополняются условием is_free.

### 5.6 «Добрый прораб» — интеграция Anthropic
- Модель claude-sonnet-4-6, max_tokens 1024, streaming.
- System prompt (константа FOREMAN_SYSTEM в src/lib/foreman/prompt.ts): роль опытного доброжелательного прораба; отвечать просто, шагами, ≤300 слов; хвалить прогресс; безопасность труда упоминать при работе на высоте/с электричеством; ЗАПРЕЩЕНО: советовать изменения несущих конструкций (ответ-шаблон «это изменение конструктива — нужен инженер»), темы вне стройки (вежливый возврат к теме), выдумывать цены.
- Контекст запроса: title проекта, конфигурация, текущий этап/шаг (title, actions), последние 20 сообщений истории.
- Лимит 50 msg/сутки: count foreman_messages(role='user', created_at > date_trunc('day', now() at time zone 'Europe/Moscow')).
- Retry-стратегия: 1 повтор при 5xx через 2 c; затем 503 пользователю, user-сообщение уже сохранено.
- Ключ ANTHROPIC_API_KEY — только сервер.

### 5.7 Волны доставки
Материалы группируются по stages.delivery_wave (агрегация qty по волне с учётом applies_when ⊆ config). volume = Σ qty×volume_m3, weight = Σ qty×weight_kg, maxLen — из справочника длин (материалы lumber 6000 мм). Транспорт по правилам 3.14. Экономия = (wavesIfPerStage − waves)×DELIVERY_AVG_COST[country] (константы: RU 600000, KZ 2500000 тиынов, BY 15000 коп. BYN).

### 5.8 Безопасность
- RLS на всех таблицах (см. Блок 2); service_role только в серверных роутах, никогда в клиенте.
- CORS: same-origin (Next.js API по умолчанию), внешних потребителей нет.
- Rate limiting: quiz/match и foundation/recommend — 30 req/мин на IP (in-memory LRU на VPS / Vercel KV на Vercel: ключ ip+route); foreman — лимит 5.6.
- Sanitization: весь пользовательский текст рендерится как текст (React экранирует); Markdown прораба — через react-markdown без rehype-raw (HTML запрещён).
- Uploads (админ): только admin, mime-whitelist (image/webp,png,jpeg; model/gltf-binary), ≤ 20 МБ.
- Секреты: .env.local, в .gitignore; в репозитории — .env.example с пустыми ключами.

### 5.9 SEO и аналитика
- Каждая витрина: generateMetadata (title «Проект {title} — смета и инструкция | СобериДом», description из layout_notes), OpenGraph cover.
- sitemap.xml: /, /projects, все published-витрины; robots.txt.
- Аналитика: самостоятельная таблица событий не создаётся — Яндекс.Метрика (счётчик в layout, цель на «Купить» и «Подобрать»).

### 5.10 Стандарт контента шагов и обязательный «Этап 0»
- Каждый проект обязан содержать этап с code='site_prep' (Этап 0 «Подготовка участка и быта»), sort=0, delivery_wave=1. Минимальный состав шагов Этапа 0 (шаблон, копируется в новый проект админ-кнопкой «Создать из шаблона»): план площадки и организация рабочего места (схема, что где — v1.5); штабель пиломатериала (прокладки, продух, навес); верстак-стол для распила (доска 50 мм на козелках) — первый учебный проект, «первая победа» новичка (v1.5); хранение инструмента; электричество на участке; вода/туалет; аптечка и СИЗ; правила распорядка и усталости.
- Язык шагов: «как ребёнку» — один глагол на действие, жаргон объясняется в скобках при первом употреблении («укосина (доска-раскос, не даёт стене сложиться)»), числа вместо оценок («ровно» → «разница ≤ 5 мм»).
- Публикация шага блокируется линтером админки, если: why_text пуст, self_check пуст, duration_min_solo не задан, в actions >8 пунктов (шаг надо делить) или в тексте встречается запрещённый жаргон без расшифровки (словарь: ригель, укосина, мауэрлат, контробрешётка, ростверк, вылет, свес, шпунт; v1.5: + обвязка, лага, стропила — проверка «слово есть, скобки с пояснением рядом нет»; словарь пополняется по мере наполнения контента).
- v1.5 «человеческий язык»: пользователь везде видит display_name этапа («Жёлтая стена (к дороге)») и его цвет; служебный code (S1, foundation…) — только для админки и внутренних связей. Сообщения линтера ссылаются на display_name этапа.
- Тон: доброжелательный, подбадривающий; безопасность — конкретными правилами, не абстрактным «будьте осторожны».

### 5.11 Cron-задачи
Этап 1 — одна: ежедневно 03:00 МСК «отчёт админу» (pending-покупки старше 24 ч, материалы без цен) письмом. Реализация: Vercel Cron (vercel.json schedule) → GET /api/cron/daily с секретом CRON_SECRET в header; ошибки — в лог, не ретраится (придёт завтра).

---

## БЛОК 6: Edge Cases

| # | Категория | Ситуация | Триггер | Ожидаемое поведение |
|---|-----------|----------|---------|---------------------|
| 1 | Сеть | Пользователь на стройке без интернета отмечает шаги | offline + клик «Готово» | Optimistic UI, очередь отметок в localStorage (sd_progress_queue), синк при online-событии; иконка CloudOff |
| 2 | Сеть | 3D-модель (15 МБ) на мобильном интернете | медленная загрузка GLB | Прогресс-бар загрузки; >10 c — предложение fallback-изометрии; на mobile 3D только по кнопке |
| 3 | Сеть | Anthropic API таймаут | стрим оборвался | Частичный ответ сохраняется с пометкой «ответ оборвался», кнопка «Продолжить» отправляет follow-up |
| 4 | Данные | В смете материал без цены для региона KZ | добавлен материал, цену не занесли | Позиция с price=0 + бейдж «цена уточняется», итог помечен «≈ без N позиций»; админ-отчёт в cron |
| 5 | Данные | Админ удаляет материал, который есть в BOM | delete material | Запрещено FK (restrict по умолчанию references) → админке показать «Материал используется в N проектах» |
| 6 | Данные | Пользователь ввёл цену 0 или абсурдную | inline-edit | 0 допустим (подарили доски), >1 млн ₽/ед. — валидация «проверьте цену» |
| 7 | Данные | Конкурентное редактирование: два устройства отмечают шаги | одна покупка, телефон+ПК | unique(purchase,step) + upsert: конфликт невозможен, последний синк побеждает |
| 8 | Данные | Пустая история чата прораба | первый вход | Empty-состояние с chips-подсказками, приветствие ассистента рендерится клиентски (не тратит API) |
| 9 | Безопасность | Подмена purchaseId в URL | ручной ввод чужого id | RLS вернёт 0 строк → страница 404 (не 403, не раскрываем существование) |
| 10 | Безопасность | XSS в note траты / имени | `<script>` в тексте | React экранирует; Markdown прораба без HTML; note в CSV-экспорте экранируется формульно (=,+,-,@ → префикс ') |
| 11 | Безопасность | Промокод перебором | 100 попыток | Rate limit 10/мин на пользователя, формат-валидация до запроса в БД |
| 12 | Лимиты | Проект на 214 шагов, все изображения | открытие /build | Виртуализация списка этапов не нужна (≤20), шаги грузятся по этапу (ленивая подгрузка), изображения lazy+webp |
| 13 | Лимиты | Пользователь внёс 3000 трат | годовая стройка | Пагинация expenses по 50, сводка считается SQL-агрегатом, не на клиенте |
| 14 | Платежи | Человек оплатил, но не указал код | донат без комментария | Админ-интерфейс: поиск pending по сумме и дате; SLA ручной сверки — до 24 ч; в инструкции код продублирован крупно |
| 15 | Платежи | Двойной перевод по одному коду | пользователь ошибся | Покупка одна; админ видит дубль в донат-сервисе → ручной возврат, регламент в админ-доке |
| 16 | Платежи | Оплатил и сразу купил второй раз тот же проект | повторный POST | 409 CONFLICT «У вас уже есть доступ/ожидает активации» |
| 17 | Время | Регион сменился после покупки (переехал) | смена региона в настройках | Смета покупки держит region_id покупки; кнопка «Пересчитать под новый регион» меняет purchase.region_id явно |
| 18 | Время | Полночь МСК и лимит прораба | 49-е сообщение в 23:59 | Счётчик по дню МСК; сообщение до полуночи проходит, поле сброса показано в плашке |
| 19 | Контент | Шаг ссылается на деталь, скрытую applies_when | конфиг dry, деталь natural | Выборка деталей шага фильтруется тем же ⊆-правилом; админ-линтер контента: «шаг без деталей после фильтра» — предупреждение |
| 20 | Юр. | Пользователь строит и повредил имущество | претензия | Дисклеймер в футере, на витрине фундамента и чекбоксом при покупке (юр. фиксация согласия: поле disclaimer в purchases.config + timestamp created_at) |

---

## Приложение А: Переменные окружения (.env.example)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
CRON_SECRET=
NEXT_PUBLIC_DONATE_URL=
NEXT_PUBLIC_METRIKA_ID=
```

## Приложение Б: Структура каталогов

```
src/
  app/
    (public)/            # лендинг, quiz, projects, legal
    (auth)/auth/         # login, register, reset
    (cabinet)/my/        # купленные проекты и подстраницы
    admin/
    api/                 # роуты из Блока 3
  components/ui/         # shadcn
  components/quiz/ three/ build/ estimate/ finance/ foreman/ admin/
  lib/
    supabase/ (client.ts, server.ts, middleware.ts)
    estimate/calc.ts     # 5.2
    foundation/ (freezing.ts, rules.ts)
    cutting/ffd.ts       # 3.10
    delivery/waves.ts
    foreman/prompt.ts
    payments/ (provider.ts, manual.ts)
    i18n/ru.ts
    zod/                 # общие схемы
supabase/
  migrations/            # SQL из Блока 2 по файлам 001..010
  seed.sql
```

## Приложение В: Этапы сборки (для Claude Code)

1. **Каркас приложения:** Next.js 16 + Tailwind v4 + shadcn init, layout'ы, i18n/ru.ts, миграции 2.0–2.3, auth-экраны, middleware. 
2. **Контент-ядро:** миграции 2.4–2.5, админка (проекты, этапы, шаги, детали, материалы, цены, регионы, импорт CSV), Storage-бакеты.
3. **Витрина:** каталог, карточка, конфигуратор, calcEstimate, фундамент-рекомендатор, 3D-вьюер с fallback, квиз+результаты, лендинг, SEO.
4. **Покупка:** purchases, промокоды, письма Resend, админ-активация, страница инструкции оплаты.
5. **Кабинет:** build (конструктор+прогресс+офлайн-очередь), cutting (FFD), estimate (user_prices, CSV), finance, delivery.
6. **Прораб и скрипты:** foreman SSE-роут + чат-UI, negotiation_scripts + UI, лимиты.
7. **Полировка:** edge cases 1–20, cron-отчёт, метрика, print-стили раскроя, e2e smoke (Playwright: quiz→витрина→покупка promo→шаг→готово).

Контент флагманского бесплатного проекта (v1.5) — **тини-хаус-трансформер** (is_free=true, эталон витрины): маленький дом с панорамными окнами и удобствами (туалет), в котором можно жить во время стройки основного дома, а затем переделать в баню. Требование к контенту: мокрая зона (гидроизоляция, слив, вентиляция) закладывается заранее под будущую парную. Создаётся через админку после этапа 2 — параллельно разработке этапов 3–5. Хозблок 3×4 — второй проект наполнения.

---
*Конец спецификации. Единственный источник истины для сборки. Изменения — только через обновление этого файла (версионирование в шапке).*
