import type { EstimatePosition } from '@/lib/estimate/detailed';

// Типы ответа GET /api/my/[purchaseId]/build (SPEC 3.8).
export type BuildTakePart = {
  partCode: string;
  color: 'red' | 'green' | 'yellow' | 'blue' | 'orange' | 'purple';
  name: string;
  cutLengthMm: number;
  qty: number;
};

export type BuildTakeMaterial = { name: string; qty: number; unit: string };

export type BuildStep = {
  id: string;
  title: string;
  why: string;
  prep: string;
  imageUrl: string;
  take: { parts: BuildTakePart[]; materials: BuildTakeMaterial[] };
  actions: string[];
  tools: string[];
  safety: string;
  durationMinSolo: number | null;
  durationMinPair: number | null;
  difficulty: number;
  weatherNote: string;
  selfCheck: string[];
  hint: string;
  commonMistake: string;
  helpersNeeded: number;
  isPractice: boolean;
  isMandatory: boolean;
  done: boolean;
};

export type BuildStage = {
  id: string;
  number: number;
  code: string;
  displayName: string;
  color: string | null;
  intro: string;
  durationDays: number | null; // чип «≈ N дн.» на экране начала этапа (спека 003)
  steps: BuildStep[];
};

// Ответ GET /api/my/[purchaseId]/supplies (спека 003): закупки перед этапом.
// Инструмент — той же формы, что в ответе /tools (SPEC 3.14a).
export type SuppliesTool = {
  name: string;
  category: string;
  recommendation: 'buy' | 'rent' | 'borrow_or_buy_cheap';
  reason: string;
  approxPriceMinor: number;
  approxRentDayMinor: number | null;
  daysNeeded: number;
  alternative: string;
  stages: string[];
};

export type SuppliesResponse = {
  data: { materials: EstimatePosition[]; tools: SuppliesTool[]; currency: string };
  meta: { needRegion: boolean };
};

// Ответ GET /api/my/[purchaseId]/tools (SPEC 3.14a, спека 004): потребность
// с вариантами. sort едет на клиент — по нему считается вариант по умолчанию.
export type ToolVariant = {
  id: string;
  name: string;
  description: string;
  recommendation: 'buy' | 'rent' | 'borrow_or_buy_cheap';
  priceMinor: number | null;
  rentDayMinor: number | null;
  speedNote: string;
  isBeginnerChoice: boolean;
  sort: number;
};

export type ToolNeed = {
  id: string;
  name: string;
  category: string;
  reason: string;
  daysNeeded: number;
  stages: string[];
  variants: ToolVariant[];
  chosenVariantId: string | null;
};

export type ToolsResponse = {
  data: { summary: { buyTotalMinor: number; rentTotalMinor: number }; tools: ToolNeed[] };
  meta: { currency: string; stageCount: number };
};
