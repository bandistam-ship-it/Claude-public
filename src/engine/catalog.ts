import type { Auto, DomainDef, MilestoneDef, StatId } from './types';

/*
 * The milestone catalog. Body and Mind are the heart of the app; Upkeep is a light supporting
 * section. Each domain is a ladder of six milestones for levels 2–7, written as exact, checkable
 * statements: either you can do it or you cannot, with no partial credit.
 *
 * A stat's tier comes from how rounded its domains are (see engine.ts), so a high tier means
 * being capable across the whole area. Milestones with `auto` are detected from your Todoist
 * history; any milestone can also be ticked by hand. `decayDays` makes a milestone lapse from
 * "currently valid" (never from "ever achieved") when you have not confirmed it for that long.
 */

const m = (text: string, auto?: Auto): MilestoneDef => ({ text, auto });
const streak = (weeks: number, perWeek: number, pattern?: string): Auto => ({ streak: { weeks, perWeek, pattern } });
const feat = (id: string): Auto => ({ feat: id });
const all = (...a: Auto[]): Auto => ({ all: a });
const any = (...a: Auto[]): Auto => ({ any: a });

const LAW = '(drept|civil|penal|proc|barou|inppa|grile|cod|lege|juridic|contract|licent)';
const PHILO = '(filozof|filosof|metafizic|modernitate|logic|etic|kant|aristotel|platon|epistem|ontolog|retoric)';
const READ = '(citeste|citit|lectur|carte|read|reading|pagini)';

export const DOMAINS: Record<StatId, DomainDef[]> = {
  // ───────────────────────────── BODY ─────────────────────────────
  body: [
    {
      id: 'skills', name: 'Skills', decayDays: 180,
      ladder: [
        m('L-sit for 10 seconds'),
        m('Chest-to-wall handstand for 30 seconds'),
        m('First strict muscle-up', feat('muscleup1')),
        m('First strict wall handstand push-up', feat('hspu1')),
        m('Full front lever for 5 seconds, or a 30 s freestanding handstand', any(feat('frontlever'))),
        m('One-arm pull-up or full planche', any(feat('oneArmPullup'), feat('planche'))),
      ],
    },
    {
      id: 'strength', name: 'Strength', decayDays: 270,
      ladder: [
        m('10 push-ups', feat('pushups10')),
        m('First strict pull-up', feat('pullup1')),
        m('10 strict pull-ups and 15 strict dips', all(feat('pullup10'), feat('dips15'))),
        m('20 strict pull-ups, 30 strict dips and a pistol squat on each leg'),
        m('A pull-up with 50% of your body weight added and a dip with 75%'),
        m('A pull-up and a dip each with 100% of your body weight added'),
      ],
    },
    {
      id: 'endurance', name: 'Endurance & cardio', decayDays: 120,
      ladder: [
        m('Run 5 km without stopping'),
        m('5 km in under 30:00, or a resting heart rate under 70 bpm'),
        m('10 km in under 55:00, or VO₂max in the “good” band for your age'),
        m('A half marathon in under 2:00, or 150 minutes of zone-2 cardio a week for 12 weeks'),
        m('A half marathon in under 1:45, or VO₂max in the “excellent” band for your age'),
        m('A marathon in under 3:30, or VO₂max in the “superior” band with a resting heart rate under 50 bpm'),
      ],
    },
    {
      id: 'mobility', name: 'Mobility', decayDays: 180,
      ladder: [
        m('Touch your toes standing with straight knees'),
        m('Hold a full-depth squat for 1 minute'),
        m('Hold a full squat for 2 minutes, and pass a shoulder-flexion wall test with arms fully overhead'),
        m('Front split on either leg'),
        m('Front split on both legs and a straddle fold with the chest to the floor'),
        m('Full front and middle splits and a bridge with straight arms and legs'),
      ],
    },
    {
      id: 'physique', name: 'Physique', decayDays: 120,
      ladder: [
        m('Weigh yourself and measure your waist every month for 3 months'),
        m('Waist under 0.55 of your height'),
        m('Waist under half your height, held for 6 months'),
        m('Athletic body fat for your sex (men 15% or less, women 22% or less), held for 6 months'),
        m('Lean body fat (men 12% or less, women 19% or less) held for 6 months while your strength stays level'),
        m('Athletic body fat held for 2 years'),
      ],
    },
    {
      id: 'health', name: 'Healthy life', decayDays: 365,
      ladder: [
        m('Dentist visit in the last 12 months'),
        m('Annual check-up with blood tests'),
        m('Average 7–9 hours of sleep for 4 weeks (tracked)'),
        m('7–9 hours of sleep for 90 days, and no smoking'),
        m('A full year of regular sleep, yearly check-ups and vaccinations up to date'),
        m('Three years of all of the above'),
      ],
    },
  ],

  // ───────────────────────────── MIND ─────────────────────────────
  mind: [
    {
      id: 'law', name: 'Law & reasoning',
      ladder: [
        m('Study law every week for 12 weeks', streak(12, 1, LAW)),
        m('Write a complete case analysis (caz practic) with correct reasoning'),
        m('Score 70% or more on past Bar-exam multiple-choice tests (grile) in a full timed run'),
        m('Score 85% or more on past Bar-exam tests, and argue a moot case'),
        m('Pass the Bar admission exam'),
        m('Win a real case, or have your legal writing published or cited'),
      ],
    },
    {
      id: 'philosophy', name: 'Philosophy & ideas',
      ladder: [
        m('Read one primary text (for example Plato’s Apology) and summarise its argument in writing'),
        m('Study philosophy every week for 8 weeks', streak(8, 1, PHILO)),
        m('Read and summarise a main work by three different philosophers'),
        m('Write a 3,000-word argued essay on a philosophical problem'),
        m('Work through a hard text with notes: a selection of Kant’s Critique or Aristotle’s Metaphysics'),
        m('Present or publish a philosophical paper'),
      ],
    },
    {
      id: 'languages', name: 'Languages',
      ladder: [
        m('English B1, and A1 in French or German'),
        m('English B2, and A2 in French or German'),
        m('English B2, B1 in one of French or German, and A2 in the other'),
        m('English C1, and B1 in both French and German'),
        m('English C1, B2 in one of French or German, and B1 in the other'),
        m('English C1 or above, and B2 in both French and German'),
      ],
    },
    {
      id: 'reading', name: 'Reading & depth',
      ladder: [
        m('Read every week for 4 weeks', streak(4, 1, READ)),
        m('Read every week for 12 weeks', streak(12, 1, READ)),
        m('24 books read in a year'),
        m('100 books read in total'),
        m('Read one hard book twice, annotate it and teach it to someone'),
        m('250 books read in total, with a written review of 25 of them'),
      ],
    },
    {
      id: 'education', name: 'Formal education',
      ladder: [
        m('Secondary school finished (bacalaureat)'),
        m('Enrolled at university', { count: { min: 5, pattern: '(licent|seminar|curs|examen|facultat|universit|filozof|filosof|drept|barou|lecture|exam|university)' } }),
        m('Bachelor’s degree (licență) obtained', feat('licenta')),
        m('Master’s degree or a professional qualification such as Bar admission', any(feat('masters'), feat('barou'))),
        m('Doctorate, or a second master’s or professional degree', feat('phd')),
        m('A peer-reviewed article, a book or a lectureship', feat('published')),
      ],
    },
  ],

  // ───────────────────────────── UPKEEP (light) ─────────────────────────────
  upkeep: [
    {
      id: 'cleanliness', name: 'Cleanliness & order',
      ladder: [
        m('Clean and tidy your space 3 times', { count: { min: 3, pattern: '(curat|clean|aspir|spal|vase|ordine|dulap|gunoi|rufe)' } }),
        m('Clean every week for 4 weeks in a row', streak(4, 1, '(curat|clean|aspir|spal|vase|ordine|dulap|gunoi|rufe)')),
        m('Clean every week for 10 weeks (about 66 days, a formed habit)', streak(10, 1, '(curat|clean|aspir|spal|vase|ordine|dulap|gunoi|rufe)')),
        m('Clean twice a week for 13 weeks', streak(13, 2, '(curat|clean|aspir|spal|vase|ordine|dulap|gunoi|rufe)')),
        m('Clean twice a week for 26 weeks', streak(26, 2, '(curat|clean|aspir|spal|vase|ordine|dulap|gunoi|rufe)')),
        m('Clean twice a week for a full year', streak(52, 2, '(curat|clean|aspir|spal|vase|ordine|dulap|gunoi|rufe)')),
      ],
    },
    {
      id: 'admin', name: 'Household admin',
      ladder: [
        m('Pay every bill on time for 3 months'),
        m('Bills on time for 12 months, documents filed in one place'),
        m('A yearly review of insurance, contracts and subscriptions'),
        m('An emergency kit and plan: first aid, copies of documents, spare keys'),
        m('A maintenance calendar kept for a full year'),
        m('Two years without a late payment or a lapsed document'),
      ],
    },
    {
      id: 'living', name: 'Plants, pets & space',
      ladder: [
        m('Keep a plant alive for 3 months'),
        m('Care for your plants and pets every week for 10 weeks', streak(10, 1, '(plante|plant|uda|water|pet|testoas|turtle)')),
        m('A real workspace, a reading spot and good lighting'),
        m('Declutter and deep-clean twice a year'),
        m('A space you are proud to show: everything has a place'),
        m('A home that runs itself: routines, systems and quality furnishings'),
      ],
    },
  ],
};
