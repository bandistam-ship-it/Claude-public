import type { Kind } from './demographics';
import type { Auto, RungDef, SectionDef } from './types';

/*
 * Two sections: Calisthenics and Endurance. Each is a list of exact feats ordered from the most
 * common to the rarest. Every feat carries `share`: the estimated fraction of ALL adults (pooled
 * across ages and sexes) who can do it. The app adjusts that for your age and sex (see
 * demographics.ts), so your standing reads "top 1% of men your age".
 *
 * Calisthenics is judged on SKILLS, not volume: a movement you either can or cannot do. Rep counts
 * (10 pull-ups, 30 push-ups) are not feats. Skills you obviously already have (crow stand, L-sit,
 * wall handstand, pistol squat) are deliberately left off the list.
 *
 * IMPORTANT: these shares are rough estimates. No population survey measures most of these feats.
 * Race feats are built from how many adults run times how runners' times are distributed; skill
 * feats are informed guesses. Only the VO₂max rungs are exact by definition (percentiles of the
 * FRIEND registry norms within your own age and sex). docs/CRITERIA.md explains each figure.
 * Each feat has a permanent `id`, which is what a tick is stored under, so reordering or
 * rewording never moves your ticks.
 */

const make = (kind: Kind) => (id: string, text: string, share: number, auto?: Auto): RungDef => ({ id, text, share, kind, auto });
const sk = make('skill');
const run = make('run');
const vo2 = make('exact');
const feat = (id: string): Auto => ({ feat: id });

export const SECTIONS: SectionDef[] = [
  {
    id: 'calisthenics', name: 'Calisthenics', emoji: '🤸', decayDays: 240,
    rungs: [
      sk('tuck-front-lever', 'Tuck front lever for 10 seconds', 0.01),
      sk('tuck-planche', 'Tuck planche for 10 seconds', 0.008),
      sk('tuck-back-lever', 'Tuck back lever for 10 seconds', 0.008),
      sk('straddle-press', 'Straddle press to handstand', 0.005),
      sk('muscle-up', 'First strict muscle-up', 0.005, feat('muscleup1')),
      sk('dragon-flag', 'Dragon flag', 0.004),
      sk('wall-hspu', 'Strict wall handstand push-up', 0.004, feat('hspu1')),
      sk('handstand-walk', 'Handstand walk for 10 metres', 0.003),
      sk('free-handstand', 'Freestanding handstand for 30 seconds', 0.003),
      sk('adv-tuck-front-lever', 'Advanced tuck front lever for 5 seconds', 0.002),
      sk('one-arm-push-up', 'One-arm push-up on each side', 0.002),
      sk('v-sit', 'V-sit for 5 seconds', 0.002),
      sk('back-lever', 'Full back lever for 5 seconds', 0.001),
      sk('straddle-front-lever', 'Straddle front lever for 5 seconds', 0.001),
      sk('human-flag', 'Human flag for 5 seconds', 0.0007),
      sk('front-lever', 'Full front lever for 5 seconds', 0.0005, feat('frontlever')),
      sk('straddle-planche', 'Straddle planche for 5 seconds', 0.0003),
      sk('tuck-planche-push-up', 'Tuck planche push-up', 0.0003),
      sk('free-hspu', 'Freestanding handstand push-up', 0.0003),
      sk('manna', 'Manna for 3 seconds', 0.0003),
      sk('ninety-push-up', '90° push-up', 0.0003),
      sk('one-arm-pull-up', 'One-arm pull-up', 0.0002, feat('oneArmPullup')),
      sk('front-lever-pull-up', 'Full front lever pull-up', 0.0002),
      sk('one-arm-handstand', 'One-arm handstand for 5 seconds', 0.0002),
      sk('full-planche', 'Full planche for 3 seconds', 0.0001, feat('planche')),
      sk('planche-push-up', 'Full planche push-up', 0.00005),
    ],
  },
  {
    id: 'endurance', name: 'Endurance', emoji: '🏃', decayDays: 120,
    rungs: [
      vo2('vo2-top20', 'VO₂max in the top 20% for your age and sex', 0.2),
      run('run-5k', 'Run 5 km without stopping', 0.15),
      run('run-10k', 'Run 10 km without stopping', 0.07),
      run('5k-30', '5 km in under 30:00', 0.05),
      vo2('vo2-top5', 'VO₂max in the top 5% for your age and sex', 0.05),
      run('10k-55', '10 km in under 55:00', 0.03),
      run('5k-25', '5 km in under 25:00', 0.02),
      run('half-finish', 'A finished half marathon', 0.02),
      run('half-2h', 'Half marathon in under 2:00', 0.01),
      vo2('vo2-top1', 'VO₂max in the top 1% for your age and sex', 0.01),
      run('10k-45', '10 km in under 45:00', 0.008),
      run('marathon-finish', 'A finished marathon', 0.005),
      run('half-1-45', 'Half marathon in under 1:45', 0.004),
      run('5k-20', '5 km in under 20:00', 0.002),
      run('marathon-3-30', 'Marathon in under 3:30', 0.0008),
      run('marathon-3-00', 'Marathon in under 3:00', 0.0002),
    ],
  },
];
