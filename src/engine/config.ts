import { DOMAINS } from './catalog';
import type { EngineConfig } from './types';

/*
 * Default configuration: stat names and tier titles, the feats detected from task text, and how
 * Todoist projects, sections and labels map onto stats. The milestone ladders live in catalog.ts.
 * Percentages in `rarity` are rough estimates, to be replaced with sourced data (docs/CRITERIA.md).
 */

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

  domains: DOMAINS,
  // Tier T needs 3 of 5 domains at level T or above, and none below T-1.
  needDomainShare: 0.6,

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

  imbalanceThreshold: 2,

  // First matching rule wins.
  mapping: [
    // Rewards and reference cards are not progress.
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
