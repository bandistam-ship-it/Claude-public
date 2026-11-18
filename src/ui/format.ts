/** How common a feat is among all adults, in plain words. `share` is a fraction (0.015 = 1.5%). */
export function fmtShare(share: number): string {
  if (share >= 0.1) return `${Math.round(share * 100)}%`;
  if (share >= 0.01) return `${(share * 100).toFixed(1).replace(/\.0$/, '')}%`;
  return `1 in ${Math.round(1 / share).toLocaleString('en')}`;
}

/** Your standing as a headline: "Top 1.5% of adults". */
export function fmtStanding(share: number): string {
  if (share >= 1) return 'No feat yet';
  if (share >= 0.01) return `Top ${fmtShare(share)} of adults`;
  return `About ${fmtShare(share)} adults`;
}

/** Percentile: the share of adults you beat. */
export function fmtPercentile(share: number): string {
  if (share >= 1) return '';
  const p = 100 * (1 - share);
  const digits = share >= 0.1 ? 0 : share >= 0.01 ? 1 : 2;
  const n = Number(p.toFixed(digits));
  const whole = Number.isInteger(n);
  const suffix = !whole ? 'th' : n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10 < 4 ? n % 10 : 0];
  return `${n.toFixed(digits)}${suffix} percentile`;
}
