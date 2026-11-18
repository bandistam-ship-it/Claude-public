import type { Auto, RungDef, SectionDef } from './types';

/*
 * Two sections: Calisthenics and Endurance. Each is a list of exact feats ordered from the most
 * common to the rarest. Every feat carries `share`: the estimated fraction of ALL adults (pooled
 * across ages and sexes, not only people who train) who can do it. Your standing is the share of
 * your rarest achieved feat: "top 1% of adults".
 *
 * Calisthenics is judged on SKILLS, not volume. A skill is a movement you either can or cannot do:
 * a muscle-up, a front lever, a handstand push-up. Rep counts (10 pull-ups, 30 push-ups) are not
 * feats here, because endurance at a movement you already own says little about the skills you
 * can perform.
 *
 * IMPORTANT: these shares are rough estimates. No population survey measures most of these
 * feats. Race feats are built from how many adults run times how runners' times are distributed;
 * skill feats are informed guesses. Only the VO₂max rungs are exact by definition (they are
 * percentiles of the FRIEND registry norms). docs/CRITERIA.md explains each figure and its
 * sources. Edit any number here and everything is recalculated. Each feat has a permanent `id`,
 * which is what a tick is stored under, so reordering or rewording never moves your ticks.
 */

const r = (id: string, text: string, share: number, auto?: Auto): RungDef => ({ id, text, share, auto });
const feat = (id: string): Auto => ({ feat: id });
const any = (...a: Auto[]): Auto => ({ any: a });

export const SECTIONS: SectionDef[] = [
  {
    id: 'calisthenics', name: 'Calisthenics', emoji: '🤸', decayDays: 240,
    rungs: [
      r('crow', 'Crow or frog stand for 10 seconds', 0.08),
      r('lsit', 'L-sit for 10 seconds', 0.05),
      r('wall-handstand', 'Chest-to-wall handstand for 30 seconds', 0.04),
      r('pistol', 'Pistol squat on each leg', 0.03),
      r('tuck-front-lever', 'Tuck front lever for 10 seconds', 0.01),
      r('tuck-planche', 'Tuck planche for 10 seconds', 0.008),
      r('tuck-back-lever', 'Tuck back lever for 10 seconds', 0.008),
      r('muscle-up', 'First strict muscle-up', 0.005, feat('muscleup1')),
      r('dragon-flag', 'Dragon flag', 0.004),
      r('wall-hspu', 'Strict wall handstand push-up', 0.004, feat('hspu1')),
      r('free-handstand', 'Freestanding handstand for 30 seconds', 0.003),
      r('adv-tuck-front-lever', 'Advanced tuck front lever for 5 seconds', 0.002),
      r('one-arm-push-up', 'One-arm push-up on each side', 0.002),
      r('back-lever', 'Full back lever for 5 seconds', 0.001),
      r('human-flag', 'Human flag for 5 seconds', 0.0007),
      r('front-lever', 'Full front lever for 5 seconds', 0.0005, feat('frontlever')),
      r('straddle-planche', 'Straddle planche for 5 seconds', 0.0003),
      r('free-hspu', 'Freestanding handstand push-up', 0.0003),
      r('oap-planche', 'One-arm pull-up or full planche', 0.0002, any(feat('oneArmPullup'), feat('planche'))),
    ],
  },
  {
    id: 'endurance', name: 'Endurance', emoji: '🏃', decayDays: 120,
    rungs: [
      r('vo2-top20', 'VO₂max in the top 20% for your age and sex', 0.2),
      r('run-5k', 'Run 5 km without stopping', 0.15),
      r('run-10k', 'Run 10 km without stopping', 0.07),
      r('5k-30', '5 km in under 30:00', 0.05),
      r('vo2-top5', 'VO₂max in the top 5% for your age and sex', 0.05),
      r('10k-55', '10 km in under 55:00', 0.03),
      r('5k-25', '5 km in under 25:00', 0.02),
      r('half-finish', 'A finished half marathon', 0.02),
      r('half-2h', 'Half marathon in under 2:00', 0.01),
      r('vo2-top1', 'VO₂max in the top 1% for your age and sex', 0.01),
      r('10k-45', '10 km in under 45:00', 0.008),
      r('marathon-finish', 'A finished marathon', 0.005),
      r('half-1-45', 'Half marathon in under 1:45', 0.004),
      r('5k-20', '5 km in under 20:00', 0.002),
      r('marathon-3-30', 'Marathon in under 3:30', 0.0008),
      r('marathon-3-00', 'Marathon in under 3:00', 0.0002),
    ],
  },
];
