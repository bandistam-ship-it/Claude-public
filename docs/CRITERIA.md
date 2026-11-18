# Progression criteria

There is **no XP**. Progress is milestones: concrete things you have done or can do.

## How a tier is decided

Each stat (Body, Mind, Upkeep, Spirit, Career) is judged on **five domains**. Each domain is a
ladder of **six milestones** for levels 2–7, so a stat has 30 milestones. A domain's level is the
highest milestone reached (the rungs below it are implied).

A stat reaches **tier T** when
1. at least **3 of its 5 domains** are at level T or above, **and**
2. **no domain is below level T−1.**

So being elite at one thing barely helps. A 7 in pull-ups and a 1 in everything else is still a
tier-1 body. **Legendary (T7)** needs every domain at level 6 or higher and three at level 7.

A milestone counts when it is **detected from your Todoist history** or **ticked by you** (the
checkbox in the app). Auto-detected body feats need proof of clean form: "strict" or "clean" in the
task, or the `Clean` label. Banded, assisted, negative, jumping and "attempt" or "test" tasks never
count.

**Overall level** = the sum of the five tiers, shifted so five tier-1 stats are level 1 (range 1–31).

## The ladders

Percentages are rough estimates of how common each milestone is among adults. They calibrate the
difficulty and are placeholders until replaced with sourced data. The full wording of every
milestone is in [`src/engine/catalog.ts`](../src/engine/catalog.ts); the headline rungs:

### Body: a bit of everything that is health
| Domain | L2 → L7 |
|---|---|
| Strength | 10 push-ups · first strict pull-up · 10 strict pull-ups + 15 strict dips · first strict muscle-up · strict HSPU or front lever · one-arm pull-up or planche |
| Endurance | 5 km non-stop walk/jog · run 5 km · 5 km < 30:00 · 10 km < 55:00 or half marathon · half < 1:45 or a marathon · marathon < 3:30 |
| Mobility & balance | toe touch · 1 min deep squat · 2 min squat + 60 s wall handstand · front split · 30 s freestanding handstand · full splits + 60 s handstand |
| Body & nutrition | measure monthly · waist < 0.55 height · < 0.5 for 6 months · 1 year + home cooking · athletic body fat 6 months · 2 years with tracked nutrition |
| Sleep & preventive care | dentist · annual blood tests · 7–9 h sleep for 4 weeks · 90 days + no smoking · a year + vaccines · three years, resting HR < 60 |

### Mind: how educated you are, all-round
| Domain | L2 → L7 |
|---|---|
| Formal education | bacalaureat · enrolled · licență · master's or Bar admission · doctorate / second master's · scholarly contribution |
| Languages | A2 · B2 · C1 + B1 in a third · C1 ×2 + B2 · C2 + C1 · four languages at C1+ |
| Reading & breadth | 6 books/yr · 12 · 24 across 3 fields · 100 lifetime across five fields · 250 across six · 500 with 50 reviews |
| Science & numeracy | percentages and graphs · statistics or logic course · calculus and programming · analysed a dataset · built something others use · original research or teaching |
| Writing & reasoning | one-page argument · write weekly for 12 weeks · 10-minute talk · 5,000-word text · publish an essay · publish a book or paper |

### Upkeep: running a home and a life
Cleanliness & order (habit streaks: 4 weeks → a year, detected from your tasks) · Cooking · Repairs &
DIY · Household admin · Plants, pets & space.

### Spirit: the inner life
Mental health (therapy or journaling streaks) · Creative practice · Stillness & reflection ·
Discipline & resilience · Culture & awe.

### Career: work, money and reliability
| Domain | L2 → L7 |
|---|---|
| Income (net RON/month, from your profile) | 2,699 minimum wage · 4,300 median · 5,717 average · 10,000 · 20,000 · 40,000 |
| Role & seniority (from your profile) | first job · trainee lawyer · qualified lawyer · own practice / senior associate · partner · managing partner |
| Credentials & craft | course · licență · Bar admission · specialisation · recognised specialist · leader of the field |
| Financial security | track spending · 3-month emergency fund · no debt + 6 months · invest 2 years · 5 years of expenses · financial independence (25×) |
| Paperwork & reliability | admin and career task counts and weekly streaks, from your tasks |

Habit ladders use ~66 days (about 10 weeks) as the point where a habit is formed on average
(Lally et al., 2010). Relationships are deliberately not scored.

## Archetype
Tier gap between the highest and lowest stat, against the imbalance threshold (default 2):
- all tiers ≤ 2 → **Basement Nerd**
- all tiers ≥ 4 and gap ≤ 1 → **Renaissance Hero**
- gap ≥ threshold → the dominant stat's archetype: Dumb Brute (Body), Frail Bookworm (Mind),
  Obsessive Housekeeper (Upkeep), Lost Mystic (Spirit), Workaholic (Career)
- otherwise → **Wandering Adventurer**

## Data quality and sources
- Solid: Romanian minimum and average wage (INS releases); ILO global wage figures.
- Estimates, to be replaced with sourced data: every "1 in N" figure, the Romanian median and
  wage shares, and the PPP conversion (~1.95 RON per international $, a third-party figure).

Sources:
- INS average net wage, Sep 2026: [Știrile ProTV](https://stirileprotv.ro/stiri/financiar/salariul-mediu-net-a-ajuns-la-5-717-lei-in-septembrie-2026-ce-domenii-ofera-cele-mai-mari-castiguri-in-romania.html)
- Minimum wage 4,325 gross / 2,699 net from 1 Jul 2026: [Capital](https://www.capital.ro/guvernul-a-aprobat-cresterea-salariului-minim-se-vor-plati-4-325-de-lei-brut-din-1-iulie-cat-este-majorarea-neta.html)
- About 40% earn near the minimum wage: [Romania Insider](https://www.romania-insider.com/romanian-employees-minimum-wage-august-2025)
- 5.5% earn over 10,000 RON (eJobs survey): [Romania Insider](https://www.romania-insider.com/ejobs-highest-paid-employees-romania-2023)
- ILO Global Wage Report 2024–25: [PDF](https://www.ilo.org/sites/default/files/2024-11/GWR-2024_Layout_E_RGB_Web.pdf)
- Habit formation: Lally, P. et al. (2010), *How are habits formed*, European Journal of Social Psychology 40(6).
