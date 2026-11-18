import type { EngineConfig, Gate, Requirement } from './types';

/*
 * Default configuration. Every number here is editable; changing it re-scores the whole history.
 *
 * Rarity figures are rough estimates of the share of adults who have a feat. They are
 * placeholders until replaced with sourced data — see docs/CRITERIA.md.
 */

// Tier 1..7 cumulative XP. At ~150 XP/week in one stat: T2 ≈ 2 wk, T3 ≈ 2 mo, T4 ≈ 6 mo,
// T5 ≈ 1.5 yr, T6 ≈ 4 yr, T7 ≈ 10 yr — mirroring how long a committed adult needs.
const TIER_XP = [0, 300, 1200, 4000, 12000, 32000, 80000];

const feat = (featId: string): Requirement => ({ type: 'feat', featId });
const streak = (weeks: number, minPerWeek: number): Requirement => ({ type: 'streak', weeks, minPerWeek });
const count = (min: number, pattern?: string): Requirement => ({ type: 'count', min, pattern });

/** Consistency ladder (habit research: ~66 days ≈ 10 weeks to form a habit). */
const consistencyGates = (noun: string): Gate[] => [
  { all: [count(3)], text: `3 ${noun} tasks done` },
  { all: [streak(4, 1)], text: `${noun} every week for 4 weeks in a row` },
  { all: [streak(10, 1)], text: `${noun} every week for 10 weeks (~66 days, habit formed)` },
  { all: [streak(13, 2)], text: `${noun} twice a week for 13 weeks (~90 days)` },
  { all: [streak(26, 2)], text: `${noun} twice a week for 26 weeks (6 months)` },
  { all: [streak(52, 2)], text: `${noun} twice a week for 52 weeks (a full year)` },
];

// Shared regex fragments (applied to lower-case text with diacritics stripped).
const ASSISTED =
  '\\b(band|banded|bands|elastic|assist|assisted|asistat|asistate|negative|negatives|negativ|negativa|jump|jumping|sarit|attempt|attempts|incercare|incercari|test|drill|drills|kipping|transition|scap|australian|inverted)\\b';
const SUCCESS = '(sustin|sustinut|sustinere|promovat|promovata|obtinut|obtinuta|absolvit|admis|admisa|reusit|passed|defended|graduated|diploma)';

export const DEFAULT_CONFIG: EngineConfig = {
  stats: [
    {
      id: 'body', name: 'Body', emoji: '💪',
      tiers: ['Frail', 'Weak', 'Average', 'Fit', 'Athletic', 'Powerful', 'Legendary'],
      archetype: { name: 'Dumb Brute', blurb: 'Big muscles, blank stare.' },
    },
    {
      id: 'mind', name: 'Mind', emoji: '🧠',
      tiers: ['Clueless', 'Curious', 'Informed', 'Smart', 'Scholar', 'Sage', 'Genius'],
      archetype: { name: 'Frail Bookworm', blurb: 'Skinny, thick glasses, never seen daylight.' },
    },
    {
      id: 'upkeep', name: 'Upkeep', emoji: '🏰',
      tiers: ['Pigsty', 'Messy', 'Livable', 'Tidy', 'Clean', 'Spotless', 'Palace'],
      archetype: { name: 'Obsessive Housekeeper', blurb: 'Spotless room, while he and the rest of his world fall apart.' },
    },
    {
      id: 'spirit', name: 'Spirit', emoji: '🔥',
      tiers: ['Hollow', 'Restless', 'Awake', 'Grounded', 'Serene', 'Luminous', 'Enlightened'],
      archetype: { name: 'Lost Mystic', blurb: 'Deep inner world, no grip on the outer one.' },
    },
    {
      id: 'career', name: 'Career', emoji: '📜',
      tiers: ['Jobless', 'Apprentice', 'Journeyman', 'Professional', 'Expert', 'Partner', 'Magnate'],
      archetype: { name: 'Workaholic', blurb: 'Sharp suit, empty flat, nobody to call.' },
    },
  ],

  tierXp: TIER_XP,

  gates: {
    body: [
      { all: [feat('pushups10')], text: '10 clean push-ups (~50% of adults)' },
      { all: [feat('pullup1')], text: 'First strict pull-up (~25%)' },
      { all: [feat('pullup10'), feat('dips15')], text: '10 strict pull-ups and 15 dips (~5–10%)' },
      { all: [feat('muscleup1')], text: 'First clean muscle-up (~1–2%)' },
      { any: [feat('hspu1'), feat('frontlever')], text: 'Strict handstand push-up or front lever (<0.5%)' },
      { any: [feat('oneArmPullup'), feat('planche')], text: 'One-arm pull-up or full planche (<0.05%)' },
    ],
    mind: [
      { all: [count(10)], text: '10 study or reading tasks done' },
      {
        all: [count(5, '\\b(licent|seminar|curs|examen|facultat|universit|filozof|filosof|drept|barou|lecture|exam|university)')],
        text: 'Enrolled in higher education (evidence: 5+ university tasks)',
      },
      { all: [feat('licenta')], text: 'Bachelor’s degree (licență) obtained' },
      { any: [feat('barou'), feat('languageC1')], text: 'Bar admission (Barou) or C1 language certificate' },
      { any: [feat('masters'), feat('phd')], text: 'Master’s or PhD defended (~1–7%)' },
      { all: [feat('published')], text: 'Published, recognised original work (~0.1%)' },
    ],
    upkeep: consistencyGates('Home chores'),
    spirit: [
      ...consistencyGates('Spirit practice').slice(0, 3),
      { all: [streak(13, 2), feat('creativeWork')], text: 'Practice twice a week for 13 weeks + a finished creative work' },
      ...consistencyGates('Spirit practice').slice(4),
    ],
    // Career = Duty. BOTH the wage and the position are required for each tier.
    career: [
      { all: [{ type: 'wage', minNetRon: 2699 }, { type: 'position', minRank: 1 }], text: 'Earn ≥ 2,699 RON net (minimum wage) AND have a first job' },
      { all: [{ type: 'wage', minNetRon: 4300 }, { type: 'position', minRank: 2 }], text: 'Earn ≥ 4,300 RON net (~median) AND be a trainee lawyer' },
      { all: [{ type: 'wage', minNetRon: 5717 }, { type: 'position', minRank: 3 }], text: 'Earn ≥ 5,717 RON net (national average) AND be a qualified lawyer' },
      { all: [{ type: 'wage', minNetRon: 10000 }, { type: 'position', minRank: 4 }], text: 'Earn ≥ 10,000 RON net (top ~5%) AND own practice / senior associate' },
      { all: [{ type: 'wage', minNetRon: 20000 }, { type: 'position', minRank: 5 }], text: 'Earn ≥ 20,000 RON net (top ~1%) AND partner' },
      { all: [{ type: 'wage', minNetRon: 40000 }, { type: 'position', minRank: 6 }], text: 'Earn ≥ 40,000 RON net (top ~0.1%) AND managing partner / authority' },
    ],
  },

  feats: [
    // ---- Body (clean form required; assisted variants never count) ----
    {
      id: 'pushups10', stat: 'body', name: '10 push-ups', rarity: 0.5,
      pattern: '\\b(push[- ]?ups?|flotari)\\b',
      disqualify: `${ASSISTED}|\\b(knee|knees|genunchi|incline|wall|perete)\\b`,
      proof: 'reps', minReps: 10, requiresCleanForm: true,
    },
    {
      id: 'pullup1', stat: 'body', name: 'First pull-up', rarity: 0.25,
      pattern: '\\b(pull[- ]?ups?|chin[- ]?ups?|tractiuni|tractiune)\\b',
      disqualify: ASSISTED, proof: 'reps', minReps: 1, requiresCleanForm: true,
    },
    {
      id: 'pullup10', stat: 'body', name: '10 pull-ups', rarity: 0.08,
      pattern: '\\b(pull[- ]?ups?|chin[- ]?ups?|tractiuni)\\b',
      disqualify: ASSISTED, proof: 'reps', minReps: 10, requiresCleanForm: true,
    },
    {
      id: 'dips15', stat: 'body', name: '15 dips', rarity: 0.1,
      pattern: '\\b(dips?|dipsuri)\\b',
      disqualify: `${ASSISTED}|\\b(bench|banca)\\b`, proof: 'reps', minReps: 15, requiresCleanForm: true,
    },
    {
      id: 'muscleup1', stat: 'body', name: 'First muscle-up', rarity: 0.015,
      pattern: '\\bmuscle[- ]?ups?\\b',
      disqualify: ASSISTED, proof: 'reps', minReps: 1, requiresCleanForm: true,
    },
    {
      id: 'hspu1', stat: 'body', name: 'Strict handstand push-up', rarity: 0.005,
      pattern: '\\b(handstand push[- ]?ups?|hspu)\\b',
      disqualify: `${ASSISTED}|\\b(pike|elevated|partial)\\b`, proof: 'reps', minReps: 1, requiresCleanForm: true,
    },
    {
      id: 'frontlever', stat: 'body', name: 'Front lever', rarity: 0.003,
      pattern: '\\bfront lever\\b',
      disqualify: `${ASSISTED}|\\b(tuck|straddle|raise|raises)\\b`, proof: 'milestone', requiresCleanForm: true,
    },
    {
      id: 'oneArmPullup', stat: 'body', name: 'One-arm pull-up', rarity: 0.0005,
      pattern: '\\b(one[- ]arm pull[- ]?ups?|tractiune pe o mana)\\b',
      disqualify: `${ASSISTED}|\\barcher\\b`, proof: 'reps', minReps: 1, requiresCleanForm: true,
    },
    {
      id: 'planche', stat: 'body', name: 'Full planche', rarity: 0.0003,
      pattern: '\\bfull planche\\b',
      disqualify: `${ASSISTED}|\\b(tuck|straddle|lean)\\b`, proof: 'milestone', requiresCleanForm: true,
    },

    // ---- Mind (milestones: an Achievement/Boss-fight task that states the result) ----
    {
      id: 'licenta', stat: 'mind', name: 'Bachelor’s degree (licență)', rarity: 0.2,
      pattern: `(licent.*${SUCCESS}|${SUCCESS}.*licent|bachelor.*${SUCCESS})`, proof: 'milestone', anyBucket: true,
    },
    {
      id: 'barou', stat: 'mind', name: 'Admitted to the Bar (Barou)', rarity: 0.002,
      pattern: `((barou|inppa|avocat|bar exam).*${SUCCESS}|${SUCCESS}.*(barou|inppa|avocat|bar exam))`, proof: 'milestone', anyBucket: true,
    },
    {
      id: 'languageC1', stat: 'mind', name: 'C1 language certificate', rarity: 0.05,
      pattern: `(\\b(c1|c2|cae|cpe|ielts|toefl|dalf|goethe)\\b.*${SUCCESS}|${SUCCESS}.*\\b(c1|c2|cae|cpe|ielts|toefl|dalf|goethe)\\b)`,
      proof: 'milestone', anyBucket: true,
    },
    {
      id: 'masters', stat: 'mind', name: 'Master’s degree', rarity: 0.07,
      pattern: `(\\b(master|masterat|disertatie|dissertation)\\b.*${SUCCESS}|${SUCCESS}.*\\b(master|masterat|disertatie)\\b)`,
      proof: 'milestone', anyBucket: true,
    },
    {
      id: 'phd', stat: 'mind', name: 'PhD', rarity: 0.01,
      pattern: `(\\b(doctorat|phd|teza de doctorat)\\b.*${SUCCESS}|${SUCCESS}.*\\b(doctorat|phd)\\b)`, proof: 'milestone', anyBucket: true,
    },
    {
      id: 'published', stat: 'mind', name: 'Published work', rarity: 0.001,
      pattern: '\\b(publicat|publicata|published)\\b', proof: 'milestone',
    },

    // ---- Spirit ----
    {
      id: 'creativeWork', stat: 'spirit', name: 'Finished creative work', rarity: 0.1,
      pattern: '\\b(terminat|terminata|finalizat|finalizata|finished|completed|lansat|publicat|expus|concert|recital)\\b',
      proof: 'milestone',
    },
  ],

  difficultyXp: { easy: 10, medium: 25, hard: 50, 'boss-fight': 100 },
  difficultyLevel: { easy: 2, medium: 4, hard: 5, 'boss-fight': 7 },
  defaultXp: 10,
  defaultLevel: 2,
  neutralXp: 5,
  challengeDecay: 0.6,
  dailySoftCap: 4,
  dailyOverCapFactor: 0.5,
  durationClamp: [0.5, 2],
  featBonusPerDecade: 50,
  imbalanceThreshold: 2,

  // First matching rule wins.
  mapping: [
    // Spending XP / reference cards never earn XP.
    { bucket: 'ignored', label: 'Rewards' },
    { bucket: 'ignored', section: 'rewards vault' },
    { bucket: 'ignored', section: 'season board' },
    { bucket: 'ignored', section: 'trophy hall' },
    // Explicit stat labels (The Realm).
    { bucket: 'career', label: 'Profesie' },
    { bucket: 'career', label: 'Duty' },
    { bucket: 'body', label: 'Body' },
    { bucket: 'mind', label: 'Mind' },
    { bucket: 'upkeep', label: 'Upkeep' },
    { bucket: 'spirit', label: 'Spirit' },
    // Relationships are deliberately not scored.
    { bucket: 'ignored', label: 'Bonds' },
    // Older / topical labels.
    { bucket: 'body', label: 'Health' },
    { bucket: 'spirit', label: 'MentalHealth' },
    { bucket: 'spirit', label: 'Scribe' },
    { bucket: 'ignored', label: 'Friends' },
    { bucket: 'ignored', label: 'family' },
    ...['Licenta', 'Barou', 'Civil', 'Penal', 'ProcCivila', 'ProcPenala', 'Grile'].map(
      (label) => ({ bucket: 'mind' as const, label }),
    ),
    // Sections (The Realm + The Town share names).
    { bucket: 'mind', section: 'library' },
    { bucket: 'body', section: 'barracks' },
    { bucket: 'upkeep', section: 'keep' },
    { bucket: 'upkeep', section: 'castle' },
    { bucket: 'ignored', section: 'tavern' },
    { bucket: 'spirit', section: 'bonfire' },
    { bucket: 'career', section: 'chancery' },
    { bucket: 'career', section: 'war' },
    // Whole projects.
    { bucket: 'body', project: 'sport' },
    { bucket: 'mind', project: 'barou' },
    // Keywords (Romanian + English) for Inbox and unlabelled tasks.
    { bucket: 'body', keywords: ['antrenament', 'sala', 'gym', 'alerg', 'run', 'pull', 'push', 'flotari', 'tractiun', 'calistenic', 'squat', 'genuflexiun', 'plank', 'handstand', 'muscle', 'workout', 'inot', 'swim', 'bicicl'] },
    { bucket: 'mind', keywords: ['citeste', 'citit', 'invata', 'studiu', 'studia', 'curs', 'examen', 'seminar', 'licent', 'carte', 'read', 'study', 'lectur', 'fisa', 'recapitul', 'grile'] },
    { bucket: 'upkeep', keywords: ['curat', 'spala', 'aspira', 'vase', 'rufe', 'calca', 'gunoi', 'plante', 'cumparatur', 'clean', 'laundry', 'ordine', 'dulap', 'frigider', 'tuns'] },
    { bucket: 'spirit', keywords: ['terapie', 'therapy', 'scrie', 'jurnal', 'journal', 'medit', 'muzica', 'chitara', 'pian', 'desen', 'picte', 'reflect'] },
    { bucket: 'career', keywords: ['factura', 'plateste', 'plata', 'mail', 'acte', 'dosar', 'banca', 'abonament', 'contract', 'cv', 'interviu', 'job', 'stagiu', 'avocat', 'anaf', 'formular'] },
    { bucket: 'ignored', keywords: ['ziua', 'cadou', 'suna', 'intalnire', 'prieten', 'familie', 'mama', 'tata', 'bunic', 'party', 'petrecere', 'botez', 'nunta', 'vizita'] },
  ],

  career: {
    positions: [
      'Student / no job',
      'First job or internship',
      'Trainee lawyer (avocat stagiar)',
      'Qualified lawyer (avocat definitiv)',
      'Own practice or senior associate',
      'Partner',
      'Managing partner / recognised authority',
    ],
  },
};

/** Tasks whose text matches this and that carry no difficulty label count as Easy (rest days, deloads). */
export const REST_PATTERN = '\\b(rest|odihna|pauza|deload|walk|plimbare)\\b';

/** Default difficulty for unlabelled tasks in these projects (session-based training plans). */
export const PROJECT_DEFAULT_DIFFICULTY: Record<string, string> = { sport: 'medium' };
