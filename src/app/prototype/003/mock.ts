// Прототип 003 «Закупки перед этапом» — моки и строки. Только dev-маршрут
// /prototype/003; в базу не ходим, в ru.ts не лезем. Данные вымышленные:
// цены и названия правдоподобные, но это образец, а не прайс.
import type { BuildStage, BuildStep } from '@/components/build/build-types';
import type { EstimatePosition } from '@/lib/estimate/detailed';

// Планируемое расширение EstimatePosition (спека 003: detailed.ts).
export type ProtoPosition = EstimatePosition & { pricePerM3Minor: number | null };

export type ProtoTool = {
  name: string;
  recommendation: 'buy' | 'rent' | 'borrow_or_buy_cheap';
  reason: string;
  approxPriceMinor: number;
  approxRentDayMinor: number | null;
  daysNeeded: number;
  alternative: string;
};

export const CURRENCY = 'RUB';

// Строки экрана — будущие ключи ru.ts build.stageStart.*
export const proto = {
  stageHead: (n: number, name: string) => `Этап ${n} · ${name}`,
  duration: (days: number) => `≈ ${days} дн.`,
  suppliesTitle: 'Перед этапом купите',
  suppliesIntro:
    'Соберите это одной поездкой — чтобы не возвращаться на базу посреди стройки.',
  progress: (done: number, total: number) => `Куплено ${done} из ${total} позиций`,
  stageTotal: (sum: string) => `Итого по этапу: ${sum}`,
  perM3: (rub: string) => `≈ ${rub} ₽/м³`,
  toolsTitle: 'И это понадобится',
  toolsAll: 'Все инструменты →',
  startStage: 'Начать этап →',
  estimateAll: 'Смета целиком →',
  emptyTitle: 'Список закупок для этого этапа ещё не составлен',
  emptyText: 'Всё нужное есть в общей смете — загляните туда перед поездкой на базу.',
  needRegionTitle: 'Укажите город — покажем цены по вашему региону',
  needRegionText:
    'Цены на доску и крепёж сильно зависят от области. Выберите город — и список закупок посчитается.',
  cityPlaceholder: 'Выберите город',
  save: 'Сохранить',
} as const;

function step(id: string, title: string, done: boolean): BuildStep {
  return {
    id,
    title,
    why: '',
    prep: '',
    imageUrl: '',
    take: { parts: [], materials: [] },
    actions: [],
    tools: [],
    safety: '',
    durationMinSolo: null,
    durationMinPair: null,
    difficulty: 1,
    weatherNote: '',
    selfCheck: [],
    hint: '',
    commonMistake: '',
    helpersNeeded: 0,
    isPractice: false,
    isMandatory: false,
    done,
  };
}

// Сайдбар конструктора: этап 3 открыт, часть шагов уже пройдена.
export const STAGES: BuildStage[] = [
  {
    id: 's0',
    number: 0,
    code: 'prep',
    displayName: 'Подготовка',
    color: 'purple',
    intro: '',
    steps: [step('p1', 'Разметка участка', true), step('p2', 'Завоз материалов', true)],
  },
  {
    id: 's1',
    number: 1,
    code: 'foundation',
    displayName: 'Фундамент',
    color: 'red',
    intro: '',
    steps: [step('f1', 'Разметка свай', true), step('f2', 'Завинчивание', true), step('f3', 'Оголовки', true)],
  },
  {
    id: 's2',
    number: 2,
    code: 'floor',
    displayName: 'Пол',
    color: 'orange',
    intro: '',
    steps: [step('fl1', 'Обвязка', true), step('fl2', 'Лаги', true), step('fl3', 'Черновой пол', true)],
  },
  {
    id: 's3',
    number: 3,
    code: 'walls',
    displayName: 'Стены',
    color: 'green',
    intro:
      'Собираем каркас стен лёжа на полу и поднимаем готовые щиты. Самый зрелищный этап: вечером у вас будет дом, а не платформа.',
    steps: [
      step('w1', 'Разметка нижней обвязки', true),
      step('w2', 'Сборка первого щита', false),
      step('w3', 'Подъём и раскрепление', false),
      step('w4', 'Углы и перемычки', false),
      step('w5', 'Ветрозащита и обшивка', false),
    ],
  },
  {
    id: 's4',
    number: 4,
    code: 'loft',
    displayName: 'Лофт',
    color: 'yellow',
    intro: '',
    steps: [step('l1', 'Балки лофта', false), step('l2', 'Настил', false)],
  },
  {
    id: 's5',
    number: 5,
    code: 'roof',
    displayName: 'Крыша',
    color: 'blue',
    intro: '',
    steps: [step('r1', 'Стропила', false), step('r2', 'Обрешётка', false), step('r3', 'Кровля', false)],
  },
];

export const CURRENT_STAGE = STAGES[3];
export const STAGE_DURATION_DAYS = 6;

function position(p: {
  id: string;
  name: string;
  unit: string;
  qty: number;
  priceMinor: number;
  volumeM3?: number;
  storageTip?: string;
  purchased?: boolean;
  priceMissing?: boolean;
}): ProtoPosition {
  const amountMinor = p.priceMinor * p.qty;
  return {
    materialId: p.id,
    name: p.name,
    unit: p.unit,
    storageTip: p.storageTip ?? '',
    qty: p.qty,
    priceMinor: p.priceMinor,
    isUserPrice: false,
    priceMissing: p.priceMissing ?? false,
    sku: null,
    amountMinor,
    stageCode: 'walls',
    stageTitle: 'Стены',
    purchased: p.purchased ?? false,
    // round(priceMinor / volume_m3 / 100) * 100 — целые рубли (спека 003)
    pricePerM3Minor: p.volumeM3
      ? Math.round(p.priceMinor / p.volumeM3 / 100) * 100
      : null,
  };
}

export const POSITIONS: ProtoPosition[] = [
  position({
    id: 'm1',
    name: 'Доска 50×150×6000, хвоя, ест. влажности',
    unit: 'pcs',
    qty: 42,
    priceMinor: 119_000,
    volumeM3: 0.045,
    storageTip: 'Складывайте на прокладки под навесом — доска «ведёт» от солнца и дождя.',
    purchased: true,
  }),
  position({
    id: 'm2',
    name: 'Доска 50×100×6000, хвоя, ест. влажности',
    unit: 'pcs',
    qty: 18,
    priceMinor: 79_000,
    volumeM3: 0.03,
  }),
  position({
    id: 'm3',
    name: 'Плита OSB-3, 9 мм, 1250×2500',
    unit: 'pcs',
    qty: 24,
    priceMinor: 134_000,
    storageTip: 'Только плашмя и не на землю — торцы боятся влаги.',
  }),
  position({
    id: 'm4',
    name: 'Ветрозащитная мембрана, рулон 1,5×50 м',
    unit: 'pcs',
    qty: 3,
    priceMinor: 345_000,
    storageTip: 'Рулоны ставьте стоя в тени: на солнце плёнка теряет прочность за неделю.',
  }),
  position({
    id: 'm5',
    name: 'Саморезы по дереву 4,2×75, упак. 5 кг',
    unit: 'pack',
    qty: 4,
    priceMinor: 178_000,
    purchased: true,
  }),
  position({
    id: 'm6',
    name: 'Гвозди ершёные 3,1×80, упак. 5 кг',
    unit: 'pack',
    qty: 2,
    priceMinor: 0,
    priceMissing: true,
  }),
];

export const TOOLS: ProtoTool[] = [
  {
    name: 'Гвоздезабивной пистолет (нейлер)',
    recommendation: 'rent',
    reason: 'Нужен четыре дня из всей стройки — покупать невыгодно.',
    approxPriceMinor: 2_490_000,
    approxRentDayMinor: 85_000,
    daysNeeded: 4,
    alternative: 'молоток и ершёные гвозди — дольше на день, но так собирали каркасы сто лет',
  },
  {
    name: 'Уровень пузырьковый 1200 мм',
    recommendation: 'buy',
    reason: 'Стены ставятся по нему весь этап, и потом пригодится на крыше и отделке.',
    approxPriceMinor: 145_000,
    approxRentDayMinor: null,
    daysNeeded: 6,
    alternative: '',
  },
  {
    name: 'Струбцина F-образная 600 мм, 2 шт',
    recommendation: 'borrow_or_buy_cheap',
    reason: 'Держит щит, пока вы прикручиваете укосину, — заменяет вторую пару рук.',
    approxPriceMinor: 69_000,
    approxRentDayMinor: null,
    daysNeeded: 3,
    alternative: 'попросите помощника подержать — но вдвоём быстрее со струбцинами',
  },
];
