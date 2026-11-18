// Age and sex adjustment. The catalog holds each feat's share of ALL adults (pooled). A man aged
// 22 is far more likely than the average adult to have a hard bar skill or a fast 5 km, so the
// same feat is rarer, and so more impressive, in a group where it is more common.
//
// The multipliers are ROUGH ESTIMATES, applied to the pooled share. VO₂max rungs are defined as
// percentiles within your own age and sex, so they never change.

export type Group = 'men' | 'women' | 'everyone';
export type Band = '20-29' | '30-39' | '40-49' | '50+';
export type Kind = 'skill' | 'run' | 'exact';

export interface Demographics {
  age: number | null;
  group: Group;
}

export const NO_DEMOGRAPHICS: Demographics = { age: null, group: 'everyone' };

export function bandOf(age: number): Band {
  if (age < 30) return '20-29';
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  return '50+';
}

/** How many times more common than in all adults. Pooled adults = 1. */
const MULT: Record<Exclude<Group, 'everyone'>, Record<Band, { skill: number; run: number }>> = {
  men: {
    '20-29': { skill: 2.4, run: 1.8 },
    '30-39': { skill: 2.0, run: 1.5 },
    '40-49': { skill: 1.2, run: 1.1 },
    '50+': { skill: 0.5, run: 0.6 },
  },
  women: {
    '20-29': { skill: 0.6, run: 0.9 },
    '30-39': { skill: 0.5, run: 0.8 },
    '40-49': { skill: 0.35, run: 0.7 },
    '50+': { skill: 0.15, run: 0.4 },
  },
};

export const isPersonal = (d: Demographics): boolean => d.group !== 'everyone' && d.age !== null;

export function adjustShare(share: number, kind: Kind, d: Demographics): number {
  if (kind === 'exact' || !isPersonal(d)) return share;
  const m = MULT[d.group as 'men' | 'women'][bandOf(d.age as number)][kind];
  return Math.min(0.95, share * m);
}

/** "men aged 20–29", "all adults". */
export function describeGroup(d: Demographics): string {
  if (!isPersonal(d)) return 'all adults';
  const band = bandOf(d.age as number);
  const range = band === '50+' ? '50 and over' : band.replace('-', '–');
  return `${d.group} aged ${range}`;
}
