import type { Auto, RungDef, SectionDef } from './types';

/*
 * Two sections: Calisthenics and Endurance. Each is a list of exact feats ordered from the most
 * common to the rarest. Every feat carries `share`: the estimated fraction of ALL adults (pooled
 * across ages and sexes, not only people who train) who can do it. Your standing is the share of
 * your rarest achieved feat: "top 1% of adults".
 *
 * IMPORTANT: these shares are rough estimates. No population survey measures most of these feats.
 * Race feats are built from how many adults run times how runners' times are distributed; strength
 * feats are informed guesses. Only the VO₂max rungs are exact by definition (they are percentiles
 * of the FRIEND registry norms). docs/CRITERIA.md explains each figure and its sources. Edit any
 * number here and everything is recalculated.
 */

const r = (text: string, share: number, auto?: Auto): RungDef => ({ text, share, auto });
const feat = (id: string): Auto => ({ feat: id });
const any = (...a: Auto[]): Auto => ({ any: a });

export const SECTIONS: SectionDef[] = [
  {
    id: 'calisthenics', name: 'Calisthenics', emoji: '🤸', decayDays: 240,
    rungs: [
      r('10 strict push-ups', 0.55, feat('pushups10')),
      r('25 strict push-ups', 0.25),
      r('First strict pull-up', 0.12, feat('pullup1')),
      r('L-sit for 10 seconds', 0.05),
      r('Chest-to-wall handstand for 30 seconds', 0.04),
      r('15 strict dips', 0.03, feat('dips15')),
      r('Pistol squat on each leg', 0.03),
      r('10 strict pull-ups', 0.015, feat('pullup10')),
      r('First strict muscle-up', 0.005, feat('muscleup1')),
      r('Strict wall handstand push-up', 0.004, feat('hspu1')),
      r('20 strict pull-ups', 0.003),
      r('Freestanding handstand for 30 seconds', 0.003),
      r('Full front lever for 5 seconds', 0.0005, feat('frontlever')),
      r('One-arm pull-up or full planche', 0.0002, any(feat('oneArmPullup'), feat('planche'))),
    ],
  },
  {
    id: 'endurance', name: 'Endurance', emoji: '🏃', decayDays: 120,
    rungs: [
      r('VO₂max in the top 20% for your age and sex', 0.2),
      r('Run 5 km without stopping', 0.15),
      r('Run 10 km without stopping', 0.07),
      r('5 km in under 30:00', 0.05),
      r('VO₂max in the top 5% for your age and sex', 0.05),
      r('10 km in under 55:00', 0.03),
      r('5 km in under 25:00', 0.02),
      r('A finished half marathon', 0.02),
      r('Half marathon in under 2:00', 0.01),
      r('VO₂max in the top 1% for your age and sex', 0.01),
      r('10 km in under 45:00', 0.008),
      r('A finished marathon', 0.005),
      r('Half marathon in under 1:45', 0.004),
      r('5 km in under 20:00', 0.002),
      r('Marathon in under 3:30', 0.0008),
      r('Marathon in under 3:00', 0.0002),
    ],
  },
];
