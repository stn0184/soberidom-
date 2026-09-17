// Прототип 004 «Инструменты с вариантами» — моки и строки. Только
// dev-маршрут /prototype/004; в базу не ходим, в ru.ts не лезем.
// Данные вымышленные: цены — ориентиры-образец, а не прайс.

export type Recommendation = 'buy' | 'rent' | 'borrow_or_buy_cheap';

export type ProtoVariant = {
  id: string;
  name: string;
  description: string;
  recommendation: Recommendation;
  priceMinor: number | null; // покупка; null — вариант только под аренду
  rentDayMinor: number | null; // аренда за сутки; null — только покупка
  speedNote: string;
  isBeginnerChoice: boolean;
};

export type ProtoTool = {
  id: string;
  name: string;
  category: 'measure' | 'hand' | 'power' | 'level' | 'safety' | 'special';
  reason: string;
  daysNeeded: number;
  stages: string[];
  variants: ProtoVariant[];
  chosenVariantId: string | null;
};

export const CURRENCY = 'RUB';

// Строки экрана — будущие ключи ru.tools.* и ru.admin.tools.*
export const proto = {
  title: 'Инструменты',
  intro:
    'Не скупайте весь магазин. У каждой работы — несколько инструментов на выбор: дешевле и дольше или дороже и быстрее. Отметьте свой вариант — суммы пересчитаются.',
  buyTotal: 'Купить ≈',
  rentTotal: 'Арендовать ≈',
  byYourChoice: 'по вашему выбору',
  filterAll: 'Все категории',
  chosen: 'Ваш выбор',
  advised: 'Советуем новичку',
  beginnerBadge: 'Для новичка',
  free: 'Бесплатно',
  buyPrice: (sum: string) => `Купить ${sum}`,
  rentPrice: (sum: string, days: number, total: string) =>
    `Аренда ${sum}/сут × ${days} дн. = ${total}`,
  daysNeeded: (days: number) => `нужен ≈ ${days} дн.`,
  allStages: 'На всей стройке',
  moreStages: (n: number) => `ещё ${n}`,
  emptyTitle: 'Список инструментов пока пуст',
  emptyText: 'Он появится вместе с содержанием проекта — мы сейчас его пишем.',
  // Экран начала этапа
  stageToolsTitle: 'И это понадобится',
  stageToolsAll: 'Все инструменты →',
  chooseOther: 'Выбрать другой →',
  yourChoiceShort: 'ваш выбор',
  advisedShort: 'советуем новичку',
  // Админка
  adminTabTools: 'Инструменты',
  adminThName: 'Потребность',
  adminThCategory: 'Категория',
  adminThStages: 'Этапы',
  adminThVariants: 'Вариантов',
  adminNoBeginner: 'нет варианта для новичка',
  adminAdd: 'Добавить',
  adminEmptyTitle: 'У проекта ещё нет инструментов',
  adminEmptyText: 'Добавьте первую потребность — например «Пилить доски».',
} as const;

// Человеческие названия этапов: сейчас чипы показывают коды (walls, roof).
export const STAGE_NAMES: Record<string, string> = {
  site_prep: 'Участок',
  foundation: 'Фундамент',
  floor: 'Пол',
  walls: 'Стены',
  loft: 'Лофт',
  roof: 'Крыша',
  porch: 'Крыльцо',
  windows_doors: 'Окна и двери',
  exterior: 'Фасад',
  interior: 'Отделка',
  utilities: 'Инженерка',
};

export const ALL_STAGES = Object.keys(STAGE_NAMES);
const NO_PREP = ALL_STAGES.filter((s) => s !== 'site_prep');

function v(
  id: string,
  name: string,
  recommendation: Recommendation,
  priceMinor: number | null,
  rentDayMinor: number | null,
  speedNote: string,
  description: string,
  isBeginnerChoice = false
): ProtoVariant {
  return { id, name, description, recommendation, priceMinor, rentDayMinor, speedNote, isBeginnerChoice };
}

export const TOOLS: ProtoTool[] = [
  {
    id: 't1',
    name: 'Пилить доски и брус',
    category: 'power',
    reason: 'Каркас — это доски, распиленные по размеру. Пилить придётся каждый день, кроме расчистки участка.',
    daysNeeded: 52,
    stages: NO_PREP,
    chosenVariantId: 't1c',
    variants: [
      v('t1a', 'Циркулярная пила', 'buy', 650000, null, 'быстро и ровно',
        'Главная рабочая пила: ведёте по линии — рез готов. Шумит, поэтому очки и наушники обязательны.', true),
      v('t1c', 'Ножовка по дереву', 'buy', 90000, null, 'в 5 раз медленнее, устают руки',
        'Обычная ручная пила. Стоит копейки и работает без электричества, но на сотом резе руки скажут спасибо не вам.'),
      v('t1b', 'Торцовочная пила', 'rent', null, 70000, 'идеальные торцы, но тяжёлая',
        'Пилит строго под прямым углом, торец выходит как на мебели. Занимает целый стол, и за 52 дня аренда выйдет дороже покупки.'),
    ],
  },
  {
    id: 't2',
    name: 'Забивать гвозди',
    category: 'hand',
    reason: 'Каркас держится на гвоздях — их в доме несколько тысяч.',
    daysNeeded: 25,
    stages: ['floor', 'walls', 'loft', 'roof', 'porch'],
    chosenVariantId: null,
    variants: [
      v('t2a', 'Молоток 500–600 г', 'buy', 120000, null, 'дёшево, но дольше',
        'Самый обычный молоток. Двух дней хватит, чтобы рука привыкла и гвоздь перестал гнуться.', true),
      v('t2b', 'Нейлер каркасный + компрессор', 'rent', null, 150000, 'в 10 раз быстрее, стоит денег',
        'Пистолет забивает гвоздь одним нажатием. Берут на неделю самых «гвоздевых» работ, а не на всю стройку.'),
    ],
  },
  {
    id: 't3',
    name: 'Крутить саморезы',
    category: 'power',
    reason: 'Обшивка, лаги, стропила — всё, что не на гвоздях, держится на саморезах.',
    daysNeeded: 55,
    stages: ALL_STAGES,
    chosenVariantId: null,
    variants: [
      v('t3a', 'Шуруповёрт аккумуляторный 18 В', 'buy', 550000, null, 'быстро',
        'Второй по важности инструмент после пилы. Берите с двумя аккумуляторами: один в работе, другой заряжается.', true),
      v('t3b', 'Отвёртка', 'borrow_or_buy_cheap', 30000, null, 'только на десяток саморезов',
        'Годится, если саморезов ровно десять. Дальше — мозоли и потерянный день.'),
    ],
  },
  {
    id: 't4',
    name: 'Мерить и размечать',
    category: 'measure',
    reason: 'Ошибка в разметке дороже ошибки в резе: короткую доску уже не удлинить.',
    daysNeeded: 55,
    stages: ALL_STAGES,
    chosenVariantId: null,
    variants: [
      v('t4a', 'Рулетка 5 м + столярный карандаш', 'buy', 70000, null, '',
        'Рулетка с фиксатором и плоский карандаш, который не скатывается с доски.', true),
    ],
  },
  {
    id: 't5',
    name: 'Проверять горизонталь и вертикаль',
    category: 'level',
    reason: 'Кривую стену видно всем, и дальше она перекосит крышу.',
    daysNeeded: 24,
    stages: ['foundation', 'floor', 'walls', 'roof'],
    chosenVariantId: null,
    variants: [
      v('t5a', 'Пузырьковый уровень 120 см', 'buy', 150000, null, '',
        'Метр двадцать — минимум: коротким уровнем стену не выставить, он «врёт» на длине.', true),
      v('t5b', 'Лазерный нивелир', 'rent', null, 50000, 'быстро на фундаменте, дальше не нужен',
        'Рисует ровную линию по всему участку. Незаменим на столбах, а потом лежит без дела.'),
      v('t5c', 'Гидроуровень — шланг с водой', 'borrow_or_buy_cheap', 40000, null, 'дедовский, но точный',
        'Вода сама встаёт на один уровень в обоих концах шланга. Нужен помощник и немного терпения.'),
    ],
  },
  {
    id: 't6',
    name: 'Проверять прямой угол',
    category: 'measure',
    reason: 'Если углы не прямые, дом выйдет ромбом — и это вылезет на крыше.',
    daysNeeded: 17,
    stages: ['foundation', 'floor', 'walls'],
    chosenVariantId: null,
    variants: [
      v('t6a', 'Угольник столярный 30 см', 'buy', 60000, null, '',
        'Прикладываете к доске — сразу видно, ровно ли отпилено.', true),
      v('t6b', 'Правило 3-4-5 рулеткой', 'borrow_or_buy_cheap', 0, null, 'бесплатно, на больших углах даже точнее',
        'Школьный треугольник: отмерили 3 и 4 метра по сторонам — диагональ должна выйти ровно 5. Ничего покупать не нужно.'),
    ],
  },
  {
    id: 't7',
    name: 'Копать ямы под опоры',
    category: 'hand',
    reason: 'Столбы фундамента стоят в ямах ниже глубины промерзания — их нужно 6–8 штук.',
    daysNeeded: 5,
    stages: ['foundation'],
    chosenVariantId: 't7b',
    variants: [
      v('t7a', 'Лопата штыковая + ручной бур 200 мм', 'buy', 250000, null, 'медленно, зато в одиночку',
        'Бур вкручивается в землю руками. На песке идёт легко, на глине придётся попотеть.', true),
      v('t7b', 'Мотобур', 'rent', null, 120000, 'за день все ямы, но тяжёлый',
        'Бензиновый бур проходит яму за пару минут. Вдвоём держать удобнее — в одиночку выкручивает руки.'),
    ],
  },
  {
    id: 't8',
    name: 'Мешать бетон',
    category: 'special',
    reason: 'Под столбы нужен бетон, а готовый миксер на 8 ям заказывать невыгодно.',
    daysNeeded: 5,
    stages: ['foundation'],
    chosenVariantId: null,
    variants: [
      v('t8a', 'Корыто + лопата', 'buy', 150000, null, 'медленно, но на 6–8 столбов хватит',
        'Мешают вдвоём по одному замесу. Корыто потом пригодится под раствор и мусор.', true),
      v('t8b', 'Бетономешалка 120 л', 'rent', null, 80000, 'замес за 3 минуты',
        'Крутит сама, бетон выходит однороднее. Нужна розетка на участке.'),
    ],
  },
  {
    id: 't9',
    name: 'Резать утеплитель',
    category: 'hand',
    reason: 'Плиты утеплителя подгоняют по месту — впритык между стойками, без щелей.',
    daysNeeded: 27,
    stages: ['floor', 'walls', 'roof', 'interior'],
    chosenVariantId: null,
    variants: [
      v('t9a', 'Нож с длинным лезвием 25 см', 'buy', 50000, null, '',
        'Режет мягкие плиты как масло. Лезвия тупятся — возьмите запасные.', true),
      v('t9b', 'Ножовка по утеплителю', 'buy', 120000, null, 'ровнее на толстых плитах',
        'Крупный зуб не рвёт вату. Имеет смысл, если утеплитель толще 100 мм.'),
    ],
  },
  {
    id: 't10',
    name: 'Резать листы OSB и фанеру',
    category: 'power',
    reason: 'Листы обшивки подрезают по краям и вырезают под окна и розетки.',
    daysNeeded: 33,
    stages: ['floor', 'walls', 'roof', 'exterior', 'interior'],
    chosenVariantId: null,
    variants: [
      v('t10a', 'Электролобзик', 'buy', 300000, null, 'единственный, кто пилит по кривой',
        'Нужен для вырезов под окна и розетки. Лист по прямой тоже режет, только медленнее пилы.', true),
      v('t10b', 'Циркулярная пила', 'buy', 650000, null, 'быстро по прямой',
        'Если уже взяли её для досок — докупать нечего. Но круглый вырез ею не сделать.'),
    ],
  },
  {
    id: 't11',
    name: 'Работать на высоте',
    category: 'special',
    reason: 'Верх стен, лофт и крыша — это два-три метра над землёй, с табуретки туда не дотянуться.',
    daysNeeded: 24,
    stages: ['walls', 'loft', 'roof', 'exterior'],
    chosenVariantId: null,
    variants: [
      v('t11a', 'Козлы самодельные + настил', 'buy', 100000, null, 'собираются на Этапе 0',
        'Две деревянные опоры и доска между ними. Делаются из тех же досок, что и дом, за полдня.', true),
      v('t11b', 'Стремянка 2,5 м', 'buy', 450000, null, 'быстро переставить',
        'Удобна на обшивке и окнах, но на крыше на ней не поработаешь — руки заняты.'),
      v('t11c', 'Леса рамные', 'rent', null, 60000, 'безопаснее всего на крыше',
        'Помост во всю стену: можно ходить и складывать инструмент. Занимают место и требуют ровной земли.'),
    ],
  },
  {
    id: 't12',
    name: 'Защита: очки, перчатки, наушники, обувь',
    category: 'safety',
    reason: 'Опилки в глазу и гвоздь в подошве останавливают стройку вернее дождя.',
    daysNeeded: 55,
    stages: ALL_STAGES,
    chosenVariantId: null,
    variants: [
      v('t12a', 'Комплект СИЗ', 'buy', 350000, null, 'не обсуждается',
        'Очки, перчатки, наушники и ботинки с жёсткой подошвой. Разбираем в Этапе 0 — без них к пиле не подходим.', true),
    ],
  },
  {
    id: 't13',
    name: 'Крепить мембраны и плёнки',
    category: 'hand',
    reason: 'Ветрозащита и пароизоляция прибиваются к каркасу скобами — сотнями.',
    daysNeeded: 25,
    stages: ['floor', 'walls', 'roof', 'exterior'],
    chosenVariantId: null,
    variants: [
      v('t13a', 'Степлер строительный + скобы', 'buy', 90000, null, '',
        'Механический, без электричества. Скобы берите 10 мм и сразу пачкой в 1000 штук.', true),
    ],
  },
  {
    id: 't14',
    name: 'Электричество на участке',
    category: 'special',
    reason: 'Пила и шуруповёрт требуют розетки, а она обычно далеко от будущего дома.',
    daysNeeded: 55,
    stages: ALL_STAGES,
    chosenVariantId: null,
    variants: [
      v('t14a', 'Удлинитель на катушке 30 м с УЗО', 'buy', 350000, null, '',
        'УЗО — это защита: при пробое выключит ток раньше, чем вы почувствуете. На улице без него нельзя.', true),
      v('t14b', 'Генератор 2 кВт', 'rent', null, 100000, 'если сети на участке нет',
        'Тянет пилу и шуруповёрт, но не бетономешалку. Шумит и просит бензина.'),
    ],
  },
  {
    id: 't15',
    name: 'Прижимать детали при сборке',
    category: 'hand',
    reason: 'Пока прикручиваете доску, её надо чем-то держать — третьей руки не бывает.',
    daysNeeded: 18,
    stages: ['floor', 'walls', 'loft', 'windows_doors'],
    chosenVariantId: null,
    variants: [
      v('t15a', 'Струбцины F-образные, 4 шт', 'borrow_or_buy_cheap', 160000, null, 'можно одолжить у соседа',
        'Зажимают доски намертво, пока вы крутите саморез. Четырёх штук хватает на весь дом.', true),
    ],
  },
];

// Действующий вариант: выбранный → «для новичка» → первый по порядку.
export function effectiveVariant(tool: ProtoTool): ProtoVariant {
  return (
    tool.variants.find((x) => x.id === tool.chosenVariantId) ??
    tool.variants.find((x) => x.isBeginnerChoice) ??
    tool.variants[0]
  );
}

// «Купить ≈» — покупка и «одолжить/дешёвый»; «Арендовать ≈» — аренда × дни.
export function summary(tools: ProtoTool[]) {
  let buyTotalMinor = 0;
  let rentTotalMinor = 0;
  for (const tool of tools) {
    const chosen = effectiveVariant(tool);
    if (chosen.recommendation === 'rent') {
      if (chosen.rentDayMinor !== null) rentTotalMinor += chosen.rentDayMinor * tool.daysNeeded;
    } else if (chosen.priceMinor !== null) {
      buyTotalMinor += chosen.priceMinor;
    }
  }
  return { buyTotalMinor, rentTotalMinor };
}

// Инструменты одного этапа — блок «И это понадобится» на экране начала этапа.
export const STAGE_CODE = 'walls';
export const STAGE_TOOLS = TOOLS.filter((t) => t.stages.includes(STAGE_CODE));

// Строки таблицы админки; у «мембран» нарочно нет варианта «для новичка».
export const ADMIN_ROWS = TOOLS.map((tool) => ({
  id: tool.id,
  name: tool.name,
  category: tool.category,
  stages: tool.stages,
  variantsCount: tool.variants.length,
  beginnerCount: tool.id === 't13' ? 0 : tool.variants.filter((x) => x.isBeginnerChoice).length,
}));
