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
  steps: BuildStep[];
};
