// Конфигурация покупки и сметы из выбора покупателя (спека 009).
// Чистая функция без импортов: её зовут роуты сметы, покупки и бесплатного доступа,
// тест — node --test src/lib/estimate/config.test.ts.

export type ConfigOptionRow = {
  group_key: string;
  option_key: string;
  is_default: boolean;
  sort: number;
};

// Порядок вариантов группы — как на витрине: по sort, при равном sort — по option_key,
// чтобы результат не зависел от порядка строк из базы.
function byOrder(a: ConfigOptionRow, b: ConfigOptionRow): number {
  if (a.sort !== b.sort) return a.sort - b.sort;
  return a.option_key < b.option_key ? -1 : a.option_key > b.option_key ? 1 : 0;
}

// Для каждой группы проекта: присланный вариант, если он у проекта есть; иначе
// вариант по умолчанию; иначе первый по порядку. Группы, которых у проекта нет,
// и нестроковые значения отбрасываются. consent роут дописывает после.
export function resolveConfig(
  config: Record<string, unknown> | null | undefined,
  options: readonly ConfigOptionRow[]
): Record<string, string> {
  const groups = new Map<string, ConfigOptionRow[]>();
  for (const o of [...options].sort(byOrder)) {
    const list = groups.get(o.group_key);
    if (list) list.push(o);
    else groups.set(o.group_key, [o]);
  }

  const result: Record<string, string> = {};
  for (const [group, list] of groups) {
    const sent = config && Object.hasOwn(config, group) ? config[group] : undefined;
    const chosen =
      (typeof sent === 'string' && list.find((o) => o.option_key === sent)) ||
      list.find((o) => o.is_default) ||
      list[0];
    result[group] = chosen.option_key;
  }
  return result;
}
