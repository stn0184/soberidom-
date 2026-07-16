// Раскрой First Fit Decreasing (SPEC 3.10): детали каждого материала
// раскладываются по заготовкам 6000 мм, пропил 4 мм на рез.
export const STOCK_LENGTH_MM = 6000;
export const KERF_MM = 4;

export type CutPart = {
  partCode: string;
  color: string;
  lengthMm: number;
  qty: number;
};

export type CutSegment =
  | { kind: 'part'; partCode: string; color: string; lengthMm: number }
  | { kind: 'waste'; wasteMm: number };

export type BoardLayout = {
  boardCount: number; // одинаковых досок с такой раскладкой
  segments: CutSegment[];
};

export type FfdResult = { boardsNeeded: number; layouts: BoardLayout[] };

type Piece = { partCode: string; color: string; lengthMm: number };
type Board = { usedMm: number; cuts: Piece[] };

export function ffd(parts: CutPart[]): FfdResult {
  const pieces: Piece[] = [];
  for (const part of parts) {
    for (let i = 0; i < part.qty; i += 1) {
      pieces.push({ partCode: part.partCode, color: part.color, lengthMm: part.lengthMm });
    }
  }
  pieces.sort((a, b) => b.lengthMm - a.lengthMm);

  const boards: Board[] = [];
  for (const piece of pieces) {
    let placed = false;
    for (const board of boards) {
      // пропил перед каждым следующим куском на доске
      const need = piece.lengthMm + KERF_MM;
      if (board.usedMm + need <= STOCK_LENGTH_MM) {
        board.usedMm += need;
        board.cuts.push(piece);
        placed = true;
        break;
      }
    }
    if (!placed) {
      boards.push({ usedMm: Math.min(piece.lengthMm, STOCK_LENGTH_MM), cuts: [piece] });
    }
  }

  // Одинаковые раскладки схлопываются в boardCount (US-008: «36 досок с резом 2440×2»).
  const grouped = new Map<string, { count: number; board: Board }>();
  for (const board of boards) {
    const key = board.cuts.map((c) => `${c.partCode}:${c.lengthMm}`).join('|');
    const entry = grouped.get(key);
    if (entry) entry.count += 1;
    else grouped.set(key, { count: 1, board });
  }

  const layouts: BoardLayout[] = [...grouped.values()].map(({ count, board }) => {
    const segments: CutSegment[] = board.cuts.map((c) => ({
      kind: 'part',
      partCode: c.partCode,
      color: c.color,
      lengthMm: c.lengthMm,
    }));
    const waste = STOCK_LENGTH_MM - board.usedMm;
    if (waste > 0) segments.push({ kind: 'waste', wasteMm: waste }); // отход показываем (US-008)
    return { boardCount: count, segments };
  });

  return { boardsNeeded: boards.length, layouts };
}
