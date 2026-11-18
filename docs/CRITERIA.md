# Progression criteria

There is **no XP and no comparison with other people**. Progress is milestones: exact things you
have done or can do, measured against your own past.

## Sections

| Section | Weight | Domains |
|---|---|---|
| **Body** | ×2 | Skills · Strength · Endurance & cardio · Mobility · Physique · Healthy life |
| **Mind** | ×2 | Law & reasoning · Philosophy & ideas · Languages · Reading & depth · Formal education |
| **Upkeep** | ×1 (light) | Cleanliness & order · Household admin · Plants, pets & space |

Career and Spirit are not part of the app. Tasks labelled for them, and relationship tasks, are
"not scored".

## How a tier is decided

Each domain is a ladder of **six milestones** for levels 2–7, written as exact statements: either
you can do it or you cannot. A domain's level is the highest milestone reached; the rungs below it
are implied.

A stat reaches **tier T** when
1. at least **60% of its domains** (4 of 6 for Body, 3 of 5 for Mind, 2 of 3 for Upkeep) are at
   level T or above, **and**
2. **no domain is below level T−1.**

Being elite at one thing barely helps: a 7 in strength with everything else at 1 is still a tier-1
body. **Legendary (T7)** needs every domain at level 6 or higher and at least 60% at level 7.

**Overall level** = 2×Body + 2×Mind + Upkeep tiers, shifted so all-tier-1 is level 1 (range 1–31).

## Detecting milestones

A milestone counts when it is **found in your Todoist history** or **ticked by you**.
- Body feats found in tasks need proof of clean form: "strict" or "clean" in the task text, or the
  `Clean` label. Banded, assisted, negative, jumping and "attempt" or "test" tasks never count.
- Habit and study streaks (cleaning, law, philosophy, reading) are read from task completions.
- Measured things that Todoist cannot see (a 5 km time, a language level, a body measurement) are
  ticked by hand.

## Ever achieved vs currently valid

Fitness and skills fade; knowledge does not. Each Body domain has a window (Skills 180 days,
Strength 270, Endurance 120, Mobility 180, Physique 120, Healthy life 365). A milestone stays
**ever achieved** forever. It counts as **currently valid** only while you did it or confirmed it
within that window. Both are shown ("best L4 · now L2"). **Your tier never drops**, it always uses
"ever achieved". Mind and Upkeep milestones do not fade.

## The ladders (headline rungs, L2 → L7)

### Body
| Domain | Milestones |
|---|---|
| Skills | L-sit 10 s · chest-to-wall handstand 30 s · **first strict muscle-up** · **strict wall HSPU** · full front lever 5 s or a 30 s freestanding handstand · one-arm pull-up or full planche |
| Strength | 10 push-ups · first strict pull-up · **10 strict pull-ups and 15 strict dips** · 20 pull-ups, 30 dips, pistol squats · +50% BW pull-up and +75% dip · +100% BW on both |
| Endurance & cardio | run 5 km · 5 km < 30:00 or resting HR < 70 · 10 km < 55:00 or VO₂max "good" · half < 2:00 or zone-2 150 min/week × 12 weeks · half < 1:45 or VO₂max "excellent" · marathon < 3:30 or VO₂max "superior" with RHR < 50 |
| Mobility | toe touch · 1 min deep squat · 2 min squat + overhead wall test · front split · both-leg splits + straddle fold · full splits + bridge |
| Physique | measure monthly · waist < 0.55 height · < 0.5 for 6 months · athletic body fat 6 months · lean 6 months with strength level · athletic 2 years |
| Healthy life | dentist · blood tests · 7–9 h sleep 4 weeks · 90 days + no smoking · a full year of care · three years |

### Mind (jurist-first, all-round)
| Domain | Milestones |
|---|---|
| Law & reasoning | study law weekly for 12 weeks · a full case analysis · 70% on timed Bar-exam tests · 85% + a moot case · Bar admission · a won real case or published legal writing |
| Philosophy & ideas | one primary text summarised · weekly for 8 weeks · three philosophers' main works · a 3,000-word argued essay · a hard text with notes (Kant, Aristotle) · a presented or published paper |
| Languages | English B1 + A1 in French or German · B2 + A2 · B2, B1, A2 · C1 + B1 in both · C1, B2, B1 · C1+ and B2 in both |
| Reading & depth | weekly for 4 weeks · 12 weeks · 24 books in a year · 100 books · one hard book read twice and taught · 250 books with 25 reviews |
| Formal education | bacalaureat · enrolled · licență · master's or Bar admission · doctorate or second degree · peer-reviewed article, book or lectureship |

### Upkeep (light)
Cleaning habit streaks from 3 times up to twice a week for a year · household admin from three
months of on-time bills to two years without a lapse · plants, pets and space from a plant kept
alive to a home that runs itself.

Habit ladders use ~66 days (about 10 weeks) as the point where a habit forms on average
(Lally et al., 2010).

## Archetype
Tier gap between the highest and lowest stat, against the imbalance threshold (default 2):
- all tiers ≤ 2 → **Basement Nerd**
- all tiers ≥ 4 and gap ≤ 1 → **Renaissance Hero**
- gap ≥ threshold → the dominant stat's archetype: Dumb Brute (Body), Frail Bookworm (Mind),
  Obsessive Housekeeper (Upkeep)
- otherwise → **Wandering Adventurer**

## Notes on calibration
Thresholds are my judgement of what is hard but fair, not statistics. They are all in
[`src/engine/catalog.ts`](../src/engine/catalog.ts) and can be changed.
