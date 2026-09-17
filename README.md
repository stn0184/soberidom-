# СобериДом

IKEA-инструкция для постройки каркасного дома своими руками: подбор
проекта по региону, бесплатная витрина с 3D и сметой, платный пошаговый
конструктор с раскроем, живой сметой и волнами доставки.
Прод — https://soberidom.vercel.app.

Документы: `PROJECT_IDEA.md` и `ВИДЕНИЕ_и_ПРИОРИТЕТЫ.md` (зачем) →
`SPEC.md` (что и как; единственный источник истины) → `techspec.md`
(указатель по разделам) → `design.md` + `UX_PRINCIPLES.md` (как выглядит).
Правила работы — `CLAUDE.md`. Очередь работ — `specs/README.md`. Визуал
большого изменения одобряется прототипом до кода — `prototype/README.md`.

## Запуск

```
npm install
cp .env.example .env.local      # заполнить ключи Supabase
npm run dev                     # http://localhost:3000
```

Проверка перед коммитом — ворота: `node scripts/gate.mjs`
(lint + build + состояние спек).

## Стек

Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui ·
three/react-three-fiber · Supabase (Postgres, Auth, RLS, Storage) ·
Vercel.
