import type { Auto, DomainDef, MilestoneDef, StatId } from './types';

/*
 * The milestone catalog. Every stat is judged on five domains, each with six rungs (levels 2–7).
 * A stat's tier comes from how well-rounded those domains are (see engine.ts), so a Legendary stat
 * means being truly impressive across the whole area, not just in one corner.
 *
 * Percentages are rough estimates of how common each milestone is among adults, to calibrate how
 * hard it should be. They are placeholders until replaced with sourced data (docs/CRITERIA.md).
 * Milestones with `auto` are detected from your Todoist history; any milestone can also be ticked
 * by hand.
 */

const m = (text: string, auto?: Auto): MilestoneDef => ({ text, auto });
const streak = (weeks: number, perWeek: number, pattern?: string): Auto => ({ streak: { weeks, perWeek, pattern } });
const count = (min: number, pattern?: string): Auto => ({ count: { min, pattern } });
const feat = (id: string): Auto => ({ feat: id });
const all = (...a: Auto[]): Auto => ({ all: a });
const any = (...a: Auto[]): Auto => ({ any: a });

/** A habit ladder: 4 weeks, 10 weeks (~66 days, when a habit is formed on average), 13, 26, 52. */
const habit = (noun: string, pattern: string, first: string): MilestoneDef[] => [
  m(first),
  m(`${noun}: every week for 4 weeks in a row`, streak(4, 1, pattern)),
  m(`${noun}: every week for 10 weeks (~66 days, a formed habit)`, streak(10, 1, pattern)),
  m(`${noun}: twice a week for 13 weeks`, streak(13, 2, pattern)),
  m(`${noun}: twice a week for 26 weeks`, streak(26, 2, pattern)),
  m(`${noun}: twice a week for a full year`, streak(52, 2, pattern)),
];

const UNI = '(licent|seminar|curs|examen|facultat|universit|filozof|filosof|drept|barou|lecture|exam|university)';

export const DOMAINS: Record<StatId, DomainDef[]> = {
  // ───────────────────────────── BODY: a bit of everything that is health ─────────────────────────────
  body: [
    {
      id: 'strength', name: 'Strength',
      ladder: [
        m('10 push-ups (about half of adults)', feat('pushups10')),
        m('First strict pull-up (about 1 in 4)', feat('pullup1')),
        m('10 strict pull-ups and 15 strict dips (about 1 in 15)', all(feat('pullup10'), feat('dips15'))),
        m('First strict muscle-up (about 1 in 70)', feat('muscleup1')),
        m('Strict handstand push-up or front lever (under 1 in 200)', any(feat('hspu1'), feat('frontlever'))),
        m('One-arm pull-up or full planche (under 1 in 2,000)', any(feat('oneArmPullup'), feat('planche'))),
      ],
    },
    {
      id: 'endurance', name: 'Endurance',
      ladder: [
        m('Walk or jog 5 km without stopping'),
        m('Run 5 km non-stop (about 1 in 7)'),
        m('5 km in under 30:00'),
        m('10 km in under 55:00, or a finished half marathon (about 1 in 50)'),
        m('Half marathon in under 1:45, or a finished marathon (about 1 in 200)'),
        m('Marathon in under 3:30 (about 1 in 1,000)'),
      ],
    },
    {
      id: 'mobility', name: 'Mobility & balance',
      ladder: [
        m('Touch your toes standing, knees straight'),
        m('Hold a full-depth squat for 1 minute'),
        m('Full squat for 2 minutes and a 60 s wall handstand'),
        m('Front split on either leg'),
        m('Freestanding handstand for 30 seconds'),
        m('Full front and middle splits plus a 60 s freestanding handstand'),
      ],
    },
    {
      id: 'composition', name: 'Body & nutrition',
      ladder: [
        m('Weigh and measure your waist monthly for 3 months'),
        m('Waist under 0.55 of your height'),
        m('Waist under half your height, held for 6 months'),
        m('Waist under half your height for a year, and cook at home most days for 12 weeks'),
        m('Athletic body fat (men 15% or less, women 22% or less) held for 6 months'),
        m('Athletic body fat held for 2 years with a year of tracked, balanced nutrition'),
      ],
    },
    {
      id: 'recovery', name: 'Sleep & preventive care',
      ladder: [
        m('Dentist visit in the last 12 months'),
        m('Annual check-up with blood tests'),
        m('Average 7–9 hours of sleep for 4 weeks (tracked)'),
        m('7–9 hours of sleep for 90 days, and no smoking'),
        m('A full year of regular sleep, yearly check-ups and vaccinations up to date'),
        m('Three years of all of the above, resting heart rate under 60 bpm'),
      ],
    },
  ],

  // ───────────────────────────── MIND: how educated, all-round ─────────────────────────────
  mind: [
    {
      id: 'education', name: 'Formal education',
      ladder: [
        m('Secondary school finished (bacalaureat)'),
        m('Enrolled at university', count(5, UNI)),
        m('Bachelor’s degree (licență) obtained (about 1 in 5 adults in Romania)', feat('licenta')),
        m('Master’s degree or a professional qualification such as Bar admission (about 1 in 12)', any(feat('masters'), feat('barou'))),
        m('Doctorate, or a second master’s or professional degree (about 1 in 100)', feat('phd')),
        m('Recognised scholarly contribution: a peer-reviewed article, a book or a lectureship (about 1 in 1,000)', feat('published')),
      ],
    },
    {
      id: 'languages', name: 'Languages',
      ladder: [
        m('Basic conversation in a second language (A2)'),
        m('B2 in a second language'),
        m('C1 in a second language and B1 in a third'),
        m('C1 in two languages and B2 in a third'),
        m('C2 in a second language and C1 in a third (about 1 in 500)', feat('languageC1')),
        m('Work or study in four languages at C1 or above'),
      ],
    },
    {
      id: 'reading', name: 'Reading & breadth',
      ladder: [
        m('Read 6 books in a year'),
        m('Read 12 books in a year'),
        m('24 books in a year, across at least 3 fields'),
        m('100 books in total, including philosophy, history, science, literature and economics'),
        m('250 books in total across at least 6 fields'),
        m('500 books in total, with a written review of 50 of them'),
      ],
    },
    {
      id: 'science', name: 'Science & numeracy',
      ladder: [
        m('Comfortable with percentages, averages and reading a graph'),
        m('Completed a course in statistics or formal logic'),
        m('Calculus or linear algebra, and basic programming'),
        m('Analysed a real dataset and read a research paper end to end'),
        m('Built a model, study or application that other people use'),
        m('Original research, or mastery of a technical field good enough to teach it'),
      ],
    },
    {
      id: 'writing', name: 'Writing & reasoning',
      ladder: [
        m('Write a clear one-page argument'),
        m('Write every week for 12 weeks'),
        m('Give a 10-minute talk to an audience'),
        m('Write a long text: a thesis, a report or a 5,000-word essay'),
        m('Publish an essay or an article'),
        m('Publish a book or a peer-reviewed paper', feat('published')),
      ],
    },
  ],

  // ───────────────────────────── UPKEEP: running a home and a life ─────────────────────────────
  upkeep: [
    {
      id: 'cleanliness', name: 'Cleanliness & order',
      ladder: habit('Cleaning', '(curat|clean|aspir|spal|vase|ordine|dulap|gunoi|rufe)', 'Clean and tidy your space 3 times'),
    },
    {
      id: 'cooking', name: 'Cooking',
      ladder: [
        m('Cook 5 different meals from scratch'),
        m('Cook at home at least 4 days a week for 4 weeks'),
        m('Know 20 dishes and plan a week of meals ahead'),
        m('Cook a full meal for guests, and bake bread'),
        m('Cook most meals at home for 6 months, 50 dishes in your repertoire'),
        m('Cook almost anything from a recipe, host a dinner for ten, and keep home cooking going for a year'),
      ],
    },
    {
      id: 'repairs', name: 'Repairs & DIY',
      ladder: [
        m('Hang a shelf and change a bulb or a fuse'),
        m('Fix a leak or unclog a drain'),
        m('Assemble and repair furniture, patch and paint a wall'),
        m('Replace a socket or a tap safely'),
        m('Renovate a room'),
        m('Build furniture or carry out a major renovation yourself'),
      ],
    },
    {
      id: 'admin', name: 'Household admin',
      ladder: [
        m('Pay every bill on time for 3 months'),
        m('Bills on time for 12 months, documents filed in one place'),
        m('A yearly household review: insurance, contracts, subscriptions'),
        m('An emergency kit and plan: first aid, document copies, spare keys'),
        m('A maintenance calendar kept for a full year'),
        m('Two years without a single late payment or lapsed document'),
      ],
    },
    {
      id: 'living', name: 'Plants, pets & space',
      ladder: [
        m('Keep a plant alive for 3 months'),
        m('Care for a pet or five plants through a whole year', streak(10, 1, '(plante|plant|uda|water|pet|testoas)')),
        m('A real workspace, reading spot and good lighting'),
        m('Declutter and deep clean twice a year'),
        m('A space you are proud to show: everything has a place'),
        m('A home that runs itself: routines, systems and quality furnishings'),
      ],
    },
  ],

  // ───────────────────────────── SPIRIT: the inner life ─────────────────────────────
  spirit: [
    {
      id: 'mental', name: 'Mental health',
      ladder: [
        m('Start therapy or keep a journal for 4 weeks', streak(4, 1, '(terapie|therapy|jurnal|journal|reflect)')),
        m('Weekly therapy or journaling for 12 weeks', streak(12, 1, '(terapie|therapy|jurnal|journal|reflect)')),
        m('Half a year of regular therapy or reflection', streak(26, 1, '(terapie|therapy|jurnal|journal|reflect)')),
        m('A full year of it, with a clear grasp of your own patterns', streak(52, 1, '(terapie|therapy|jurnal|journal|reflect)')),
        m('Two years of steady practice, calm in a real crisis', streak(104, 1, '(terapie|therapy|jurnal|journal|reflect)')),
        m('Three years of steady practice, and able to help others through theirs', streak(156, 1, '(terapie|therapy|jurnal|journal|reflect)')),
      ],
    },
    {
      id: 'creative', name: 'Creative practice',
      ladder: [
        m('Make something creative every week for 4 weeks', streak(4, 1, '(scrie|desen|muzica|chitara|pian|picte|writing|draw|music|compun)')),
        m('Keep it up weekly for 12 weeks', streak(12, 1, '(scrie|desen|muzica|chitara|pian|picte|writing|draw|music|compun)')),
        m('Finish a piece: a song, a story, a painting', feat('creativeWork')),
        m('Share your work publicly: a show, a performance or a post'),
        m('A body of work: ten finished pieces shown to an audience'),
        m('Recognised: published, exhibited or performed professionally'),
      ],
    },
    {
      id: 'mindfulness', name: 'Stillness & reflection',
      ladder: [
        m('Meditate 10 minutes a day for 3 weeks'),
        m('Meditate or pray most days for 66 days'),
        m('A full day of silence or a retreat'),
        m('A year of a daily contemplative practice'),
        m('A silent retreat of a week'),
        m('Three years of daily practice, steady in hard times'),
      ],
    },
    {
      id: 'resilience', name: 'Discipline & resilience',
      ladder: [
        m('Keep a daily habit for 4 weeks'),
        m('Keep a habit for 66 days'),
        m('Finish something hard you feared, such as a long exam or a long race'),
        m('Quit or build a major habit and keep it for a year'),
        m('Go through a major setback with your routines intact'),
        m('Three years of unbroken keystone habits'),
      ],
    },
    {
      id: 'culture', name: 'Culture & awe',
      ladder: [
        m('Visit a museum or attend a concert'),
        m('Attend six cultural events in a year'),
        m('Travel abroad, or hike a mountain trail'),
        m('A multi-day trip plus twelve cultural events in a year'),
        m('Give a year of regular time or money to something larger than yourself'),
        m('A long-distance trek of 100 km or more, or an equivalent journey'),
      ],
    },
  ],

  // ───────────────────────────── CAREER: work, money and reliability ─────────────────────────────
  career: [
    {
      id: 'income', name: 'Income',
      ladder: [
        m('Net 2,699 RON a month, the minimum wage (about 4 in 10 employees earn close to it) [$1,900 PPP, near the global average]', { wage: 2699 }),
        m('Net 4,300 RON a month, about the Romanian median [$3,200 PPP]', { wage: 4300 }),
        m('Net 5,717 RON a month, the Romanian average (about 3 in 10) [$4,150 PPP, global top 10%]', { wage: 5717 }),
        m('Net 10,000 RON a month (about 1 in 20) [$7,500 PPP]', { wage: 10000 }),
        m('Net 20,000 RON a month (about 1 in 100) [$15,000 PPP]', { wage: 20000 }),
        m('Net 40,000 RON a month (about 1 in 1,000) [$30,000 PPP]', { wage: 40000 }),
      ],
    },
    {
      id: 'role', name: 'Role & seniority',
      ladder: [
        m('A first job or internship', { position: 1 }),
        m('Trainee lawyer (avocat stagiar)', { position: 2 }),
        m('Qualified lawyer (avocat definitiv)', { position: 3 }),
        m('Own practice or senior associate', { position: 4 }),
        m('Partner', { position: 5 }),
        m('Managing partner or a recognised authority', { position: 6 }),
      ],
    },
    {
      id: 'credentials', name: 'Credentials & craft',
      ladder: [
        m('A vocational or professional course finished'),
        m('Bachelor’s degree (licență)', feat('licenta')),
        m('Professional exam passed (Bar admission)', feat('barou')),
        m('A specialisation: an LL.M. or a recognised certificate'),
        m('Recognised specialist: invited to teach or publish professionally'),
        m('Leader of the field: author of a treatise, or argued before the highest court'),
      ],
    },
    {
      id: 'finance', name: 'Financial security',
      ladder: [
        m('Track your spending for 3 months'),
        m('An emergency fund of 3 months of expenses'),
        m('No consumer debt and a 6-month emergency fund'),
        m('Invested regularly for 2 years, with retirement contributions'),
        m('Savings and investments worth 5 years of your expenses'),
        m('Financially independent: investments worth 25 times your yearly expenses'),
      ],
    },
    {
      id: 'reliability', name: 'Paperwork & reliability',
      ladder: [
        m('10 admin or career tasks done', count(10)),
        m('A career or admin task done every week for 8 weeks', streak(8, 1)),
        m('100 admin or career tasks done', count(100)),
        m('A career or admin task done every week for 26 weeks', streak(26, 1)),
        m('250 admin or career tasks done', count(250)),
        m('A career or admin task done every week for a full year', streak(52, 1)),
      ],
    },
  ],
};
