type RopeBaseline = { readonly hookHeightM: number | null; readonly ropeLengthM: number | null };

export function hookRopeScale(heightM: number, baseline: RopeBaseline): number | null {
  if (baseline.hookHeightM === null || baseline.ropeLengthM === null || baseline.ropeLengthM <= 0)
    return null;
  const lengthM = baseline.ropeLengthM - (heightM - baseline.hookHeightM);
  return lengthM > 0 ? lengthM / baseline.ropeLengthM : null;
}
