# СобериДом — IKEA-инструкция для постройки каркасного дома

## Обзор
Веб-сервис для людей без опыта стройки: подбор проекта каркасного дома по параметрам и местности, бесплатная витрина с 3D и предварительной сметой, платный пошаговый конструктор сборки. Единственный источник истины — SPEC.md (v1.5) в корне репозитория. При любом противоречии между кодом, этим файлом и SPEC.md побеждает SPEC.md.

Ключевые функции:
- Анкета-подбор + рекомендация фундамента по региону (формула СП 22.13330)
- Витрина: 3D (GLB, слои), конфигуратор материалов, предварительная смета
- Конструктор сборки: этапы → шаги с анатомией (зачем/подготовь/сделай/проверь себя), тренировки, ТБ
- Живая смета (свои цены, артикулы ритейлеров), фин-отчёт план/факт, волны доставки
- Инструменты купить/арендовать, скрипты переговоров, AI-«Добрый прораб» (Anthropic API)

## Стек технологий
- Frontend: Next.js 16 (App Router, Turbopack), TypeScript strict, Tailwind CSS v4, shadcn/ui, Lucide
- 3D: three + @react-three/fiber + @react-three/drei (только в клиентских компонентах, dynamic import)
- Backend: Supabase (PostgreSQL 15, Auth email+password, RLS, Storage)
- AI: Anthropic Messages API (claude-sonnet-4-6), только серверные роуты
- Письма: Resend. Платежи этап 1: ManualProvider (донат + активация админом)
- Деплой: Vercel; Supabase Cloud

## Архитектура
```
src/
├── app/
│   ├── (public)/            # лендинг, quiz, projects/[slug], legal
│   ├── (auth)/auth/         # login, register, reset
│   ├── (cabinet)/my/        # [purchaseId]/{build,cutting,estimate,finance,delivery,tools,scripts,foreman}
│   ├── admin/               # CRUD контента, активация покупок
│   └── api/                 # роуты из SPEC.md Блок 3
├── components/              # ui/ (shadcn), quiz/, three/, build/, estimate/, finance/, foreman/, admin/
├── lib/
│   ├── supabase/            # client.ts, server.ts, middleware.ts (@supabase/ssr)
│   ├── estimate/calc.ts     # расчёт сметы (SPEC 5.2)
│   ├── foundation/          # freezing.ts (dfn=d0·√Mt), rules.ts
│   ├── cutting/ffd.ts       # раскрой First Fit Decreasing, пропил 4 мм
│   ├── delivery/waves.ts    # волны, транспорт
│   ├── foreman/prompt.ts    # system prompt прораба (запреты — SPEC 5.6)
│   ├── payments/            # provider.ts (интерфейс), manual.ts
│   ├── zod/                 # общие схемы (клиент+сервер одни и те же)
│   └── i18n/ru.ts           # ВСЕ строки UI только здесь
└── types/database.ts        # генерируется из Supabase
supabase/migrations/         # SQL из SPEC.md Блок 2, файлы 001..010
```

## Работа с Supabase
- Изменения схемы — ТОЛЬКО через миграции в supabase/migrations/ (SQL уже написан в SPEC.md Блок 2 — копировать оттуда, не сочинять заново)
- RLS обязательна на каждой таблице; service_role — только в серверном коде, НИКОГДА в клиенте
- Типы после миграций: npx supabase gen types typescript --linked > src/types/database.ts
- snake_case для таблиц/колонок; деньги INTEGER минорные единицы + currency char(3); все id UUID

## Правила кодирования
- TypeScript strict, запрещён any; ошибки API — единый формат { error: { code, message } } (SPEC 3.0)
- Server Components по умолчанию; 'use client' только для интерактива; three — только dynamic(() => import(...), { ssr: false })
- Один компонент = один файл, максимум 200 строк; импорты через @/
- Все тексты интерфейса — из lib/i18n/ru.ts, хардкод русских строк в JSX запрещён
- Каждый экран: состояния Loading (Skeleton) / Empty / Error (Alert + Retry) — без исключений
- Zod-валидация на клиенте И сервере из одной схемы (lib/zod/)
- Секреты только в .env.local; в коммиты не попадают (.gitignore); .env.example поддерживать актуальным

## MCP
- Context7: ВСЕГДА проверять актуальную документацию перед кодом с Next.js 16, Tailwind v4, Supabase, react-three-fiber
- Supabase MCP: миграции, list_tables, проверка RLS
- GitHub MCP: коммиты, PR

## Субагенты
- database-architect (Opus) — миграции из SPEC Блок 2, RLS, индексы, seed
- backend-engineer (Sonnet) — API-роуты SPEC Блок 3, calc/ffd/waves/foundation, платёжный модуль
- frontend-developer (Sonnet) — экраны SPEC Блок 4, shadcn, 3D-вьюер, состояния
- qa-reviewer (Sonnet) — сверка со SPEC, edge cases Блок 6, безопасность RLS, линтер контента

## Команды
- npm run dev — разработка (Turbopack)
- npm run build && npm run lint — сборка и линт (перед каждым коммитом)
- npx supabase db push — применить миграции
- npx supabase gen types typescript --linked > src/types/database.ts — обновить типы

## Порядок работы
- Сборка строго по этапам из SPEC.md Приложение В (1→7); не начинать следующий этап, пока текущий не собран и не проходит build+lint
- После каждого этапа — коммит с осмысленным сообщением на русском: "этап 3: витрина и смета"
- Ничего не выдумывать сверх SPEC.md; вопросы и противоречия — фиксировать комментарием и спрашивать, а не решать молча
