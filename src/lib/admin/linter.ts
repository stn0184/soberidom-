import { ru } from '@/lib/i18n/ru';

// Линтер контента шага (SPEC 5.10). Жаргон ищется по основе слова;
// слово считается пояснённым, если в ближайших ~60 символах после него есть «(».
const JARGON: ReadonlyArray<{ stem: string; word: string }> = [
  { stem: 'ригел', word: 'ригель' },
  { stem: 'укосин', word: 'укосина' },
  { stem: 'мауэрлат', word: 'мауэрлат' },
  { stem: 'контробрешётк', word: 'контробрешётка' },
  { stem: 'контробрешетк', word: 'контробрешётка' },
  { stem: 'ростверк', word: 'ростверк' },
  { stem: 'вылет', word: 'вылет' },
  { stem: 'свес', word: 'свес' },
  { stem: 'шпунт', word: 'шпунт' },
  // v1.5 (SPEC 5.10): дополнение словаря
  { stem: 'обвязк', word: 'обвязка' },
  { stem: 'лаг', word: 'лага' },
  { stem: 'стропил', word: 'стропила' },
];

const EXPLAIN_WINDOW = 60;

export type StepLintInput = {
  title: string;
  why_text: string;
  prep_text: string;
  actions: string[];
  self_check: string[];
  duration_min_solo: number | null;
  safety_text: string;
  weather_note: string;
  hint: string;
  common_mistake: string;
};

export function lintStep(step: StepLintInput): string[] {
  const t = ru.admin.linter;
  const errors: string[] = [];

  if (!step.why_text.trim()) errors.push(t.whyEmpty);
  if (step.self_check.filter((s) => s.trim()).length === 0) errors.push(t.selfCheckEmpty);
  if (step.duration_min_solo == null) errors.push(t.durationEmpty);
  if (step.actions.filter((a) => a.trim()).length > 8) errors.push(t.tooManyActions);

  const text = [
    step.title,
    step.why_text,
    step.prep_text,
    ...step.actions,
    step.safety_text,
    step.weather_note,
    step.hint,
    step.common_mistake,
  ]
    .join('\n')
    .toLowerCase();

  const flagged = new Set<string>();
  for (const { stem, word } of JARGON) {
    if (flagged.has(word)) continue;
    const re = new RegExp(`(?:^|[^а-яё])${stem}[а-яё]*`, 'g');
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const after = text.slice(match.index + match[0].length, match.index + match[0].length + EXPLAIN_WINDOW);
      if (!after.includes('(')) {
        errors.push(t.jargon(word));
        flagged.add(word);
        break;
      }
    }
  }

  return errors;
}
