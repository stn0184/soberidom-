// Глубина промерзания dfn = d0 × √Mt, округление до 0,1 м (SPEC 5.3, СП 22.13330).
export type Soil = 'clay' | 'loam' | 'sandy_loam' | 'sand' | 'peat' | 'unknown';

const D0: Record<Soil, number> = {
  clay: 0.23,
  loam: 0.23,
  unknown: 0.23,
  sandy_loam: 0.28,
  peat: 0.28,
  sand: 0.3,
};

export function freezingDepthM(soil: Soil, mt: number): number {
  return Math.round(D0[soil] * Math.sqrt(Math.max(mt, 0)) * 10) / 10;
}
