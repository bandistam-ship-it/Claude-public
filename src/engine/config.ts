import { SECTIONS } from './catalog';
import type { EngineConfig } from './types';

/*
 * Default configuration: the character's tier titles, the feats detected from task text, and how
 * Todoist projects, sections and labels map onto Body tasks. The feat ladders, with the estimated
 * share of adults who can do each, live in catalog.ts.
 */

// Shared regex fragments (applied to lower-case text with diacritics stripped).
const ASSISTED =
  '\\b(band|banded|bands|elastic|assist|assisted|asistat|asistate|negative|negatives|negativ|negativa|jump|jumping|sarit|attempt|attempts|incercare|incercari|test|drill|drills|kipping|transition|scap|australian|inverted)\\b';

export const DEFAULT_CONFIG: EngineConfig = {
  sections: SECTIONS,
  tiers: ['Frail', 'Weak', 'Average', 'Fit', 'Athletic', 'Powerful', 'Legendary'],
  imbalanceRatio: 5,

  feats: [
    // ---- Body (clean form required; assisted variants never count) ----
    {
      id: 'pushups10', name: '10 push-ups',
      pattern: '\\b(push[- ]?ups?|flotari)\\b',
      disqualify: `${ASSISTED}|\\b(knee|knees|genunchi|incline|wall|perete)\\b`,
      proof: 'reps', minReps: 10, requiresCleanForm: true,
    },
    {
      id: 'pullup1', name: 'First pull-up',
      pattern: '\\b(pull[- ]?ups?|chin[- ]?ups?|tractiuni|tractiune)\\b',
      disqualify: ASSISTED, proof: 'reps', minReps: 1, requiresCleanForm: true,
    },
    {
      id: 'pullup10', name: '10 pull-ups',
      pattern: '\\b(pull[- ]?ups?|chin[- ]?ups?|tractiuni)\\b',
      disqualify: ASSISTED, proof: 'reps', minReps: 10, requiresCleanForm: true,
    },
    {
      id: 'dips15', name: '15 dips',
      pattern: '\\b(dips?|dipsuri)\\b',
      disqualify: `${ASSISTED}|\\b(bench|banca)\\b`, proof: 'reps', minReps: 15, requiresCleanForm: true,
    },
    {
      id: 'muscleup1', name: 'First muscle-up',
      pattern: '\\bmuscle[- ]?ups?\\b',
      disqualify: ASSISTED, proof: 'reps', minReps: 1, requiresCleanForm: true,
    },
    {
      id: 'hspu1', name: 'Strict handstand push-up',
      pattern: '\\b(handstand push[- ]?ups?|hspu)\\b',
      disqualify: `${ASSISTED}|\\b(pike|elevated|partial)\\b`, proof: 'reps', minReps: 1, requiresCleanForm: true,
    },
    {
      id: 'frontlever', name: 'Front lever',
      pattern: '\\bfront lever\\b',
      disqualify: `${ASSISTED}|\\b(tuck|straddle|raise|raises)\\b`, proof: 'milestone', requiresCleanForm: true,
    },
    {
      id: 'oneArmPullup', name: 'One-arm pull-up',
      pattern: '\\b(one[- ]arm pull[- ]?ups?|tractiune pe o mana)\\b',
      disqualify: `${ASSISTED}|\\barcher\\b`, proof: 'reps', minReps: 1, requiresCleanForm: true,
    },
    {
      id: 'planche', name: 'Full planche',
      pattern: '\\bfull planche\\b',
      disqualify: `${ASSISTED}|\\b(tuck|straddle|lean)\\b`, proof: 'milestone', requiresCleanForm: true,
    },
  ],

  // First matching rule wins. Only Body tasks are scored; everything else is "not scored".
  mapping: [
    // Rewards and reference cards are not progress.
    { bucket: 'ignored', label: 'Rewards' },
    { bucket: 'ignored', section: 'rewards vault' },
    { bucket: 'ignored', section: 'season board' },
    { bucket: 'ignored', section: 'trophy hall' },
    // Body: explicit labels, sections and projects.
    { bucket: 'body', label: 'Body' },
    { bucket: 'body', label: 'Health' },
    { bucket: 'body', section: 'barracks' },
    { bucket: 'body', project: 'sport' },
    // Everything that is clearly something else.
    ...['Mind', 'Upkeep', 'Spirit', 'Duty', 'Profesie', 'Bonds', 'Friends', 'family', 'MentalHealth', 'Scribe',
      'Licenta', 'Barou', 'Civil', 'Penal', 'ProcCivila', 'ProcPenala', 'Grile'].map((label) => ({ bucket: 'ignored' as const, label })),
    ...['library', 'keep', 'castle', 'tavern', 'bonfire', 'chancery', 'war'].map((section) => ({ bucket: 'ignored' as const, section })),
    { bucket: 'ignored', project: 'barou' },
    // Keywords (Romanian + English) for the Inbox and unlabelled tasks.
    { bucket: 'body', keywords: ['antrenament', 'sala', 'gym', 'alerg', 'run', 'pull', 'push', 'flotari', 'tractiun', 'calistenic', 'squat', 'genuflexiun', 'plank', 'handstand', 'muscle', 'workout', 'inot', 'swim', 'bicicl', 'stretch', 'mobilitate', 'yoga'] },
  ],
};
