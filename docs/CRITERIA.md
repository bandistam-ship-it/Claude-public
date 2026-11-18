# How standing is calculated

The app has **two sections only: Calisthenics and Endurance.** Each is a list of exact feats, from
the most common to the rarest. **Calisthenics is judged on skills, not volume**: a movement you
either can or cannot do (a muscle-up, a front lever, a handstand push-up). Rep counts such as 10
pull-ups or 30 push-ups are not scored. Every feat carries the **estimated share of all adults who can do
it**. Your standing in a section is the share for your **rarest achieved feat**:

- rarest feat done by about 1.5% of adults → **top 1.5%**, the **98.5th percentile**
- nothing achieved yet → "No feat yet"; the easiest feat is shown as your next unlock

The **overall** standing under the character is the geometric mean of the two sections' shares, so
both count. It also sets the build of the pixel character (top 50% = tier 2 … top 0.2% = tier 7)
and the archetype (one section 5× rarer than the other makes you lopsided).

## Be careful with the numbers

**These shares are estimates, not measurements.** Almost no population survey measures these feats.
The catalog stores each as a share of ALL adults (pooled across ages and sexes). Treat the
percentiles as rough orders of magnitude.

### Age and sex
Tell the app your age and who to compare you with (men, women, or everyone) and every share is
multiplied by a rough factor for your group, so "top 2.4% of men aged 20–29" replaces "top 1% of
all adults". The factors are estimates of how many times more (or less) common a feat is in your
group than in all adults, for 20–29 / 30–39 / 40–49 / 50+:

| Group | Bar skills | Running (participation and times) |
|---|---|---|
| Men | ×2.4 / 2.0 / 1.2 / 0.5 | ×1.8 / 1.5 / 1.1 / 0.6 |
| Women | ×0.6 / 0.5 / 0.35 / 0.15 | ×0.9 / 0.8 / 0.7 / 0.4 |

The VO₂max rungs are never adjusted: they are percentiles within your own age and sex by definition.
A share is capped at 95%. With no age or no chosen group, you are compared with all adults.

How each group was estimated:

| Feats | Basis | Confidence |
|---|---|---|
| Tuck levers and tuck planche, straddle press | Informed estimates, about 1 in 100 to 1 in 200 adults | Very low |
| Dragon flag, handstand walk, freestanding handstand, V-sit, one-arm push-up | Extrapolated from how rare these are in training communities, about 1 in 250 to 1 in 500 | Very low |
| Muscle-up, HSPU, full levers, human flag, planche, one-arm pull-up | Guesses. No population data exists; these are "1 in 200" to "1 in 5,000" orders of magnitude | Very low |
| 5 km / 10 km non-stop | About 15% of adults run regularly (surveys say 5–16%), fewer can run 10 km | Medium-low |
| Race times (5 km, 10 km, half, marathon) | Share of adults who run × how runners' times are distributed (RunRepeat) | Low |
| Finished half marathon / marathon | Cumulative finishers per capita, about 2% and 0.5% of adults | Low |
| **VO₂max top 20% / 5% / 1%** | **Exact by definition**: percentiles of the FRIEND registry norms for your age and sex | High, but lab vs watch estimates differ |

You can change any share in [`src/engine/catalog.ts`](../src/engine/catalog.ts); everything is
recalculated.

## Detecting feats

A feat counts when it is **found in your Todoist history** or **ticked by you**. Calisthenics skills
found in tasks (muscle-up, handstand push-up, front lever, one-arm pull-up, planche) need proof of clean form: "strict" or "clean" in the task, or the `Clean` label.
Banded, assisted, negative, jumping and "attempt" or "test" tasks never count. Times and heart
rates cannot be seen in Todoist, so endurance feats are ticked by hand.

Skills are independent: a muscle-up does not imply a crow stand, because you either can do it or
you cannot. Each feat has a permanent id, so rewording or reordering the list never moves a tick.

## Ever achieved vs currently valid

Fitness fades. Each section has a window (Calisthenics 240 days, Endurance 120). A feat stays **ever
achieved** forever, and counts as **currently valid** only while you did it or confirmed it inside
the window. The app shows both: "Top 1.5% of adults" and, if it lapsed, "Right now: top 12%".
Your best never drops. Tap "I can still do this" to renew a ticked feat.

## Your stats and your build
The **My stats** card holds your own numbers: height, weight, waist, max strict reps (pull-ups, dips,
push-ups) and running bests (5 km, 10 km, longest run, resting heart rate, VO₂max). Nothing is saved
until you press Save, and values outside a plausible range are rejected, so a typo cannot tick a feat.

- **Your build** (the body in the picture) comes from your max reps, never from your skill standing, so
  a strong person is not drawn as frail. Each exercise is scored on a ladder (pull-ups 1/3/6/10/15/20/25,
  dips 3/8/15/22/30/40/50, push-ups 5/15/30/45/60/80/100); the build tier is 1 plus the average rung you
  reach, rounded. For example 10 pull-ups and 15 dips is tier 5, Athletic. With no reps entered, the build
  falls back to your skill and endurance standing.
- **Reps are never ranked against other people.** Calisthenics standing is about skills, not volume.
- **Running bests tick endurance feats**, dated the day you save: a 5 km under 30:00 ticks "5 km in under
  30:00", a 12 km longest run ticks "Run 10 km without stopping", and so on. Ticks stay if you later
  change the number, so your timeline keeps the true date.
- A waist under half your height (waist ÷ height < 0.5) is flagged.

## Versus you
Every unlocked skill has the day you first did it (the day you ticked it, or the first matching
task). The app replays your standing from those dates: standing 1, 3, 6 and 12 months ago against
now, a chart over time, and a log of unlocks. History starts on your first dated unlock; earlier
months read "Before you started tracking".

## Backup and sync
Your ticks, your age and your notes live only on your device. Two ways to keep them safe:
- **Backup text:** copy it from Settings and paste it into another device to restore. It never
  contains your Todoist token. Restoring merges, so newer changes on a device are kept.
- **Sync through Todoist (opt-in):** keeps the same data in ONE comment on your Inbox project, marked
  "⚙️ realm-companion-state". Each device reads it, merges (the later change to each tick wins, so
  an un-tick on one device is not undone by another) and writes back only if something changed.
  It works in the claude.ai page and in the Android app, so they stay in step. Nothing else is
  written to Todoist.

## What is not scored
Skills you obviously already have (crow stand, L-sit, wall handstand, pistol squat) are left off the list. Only calisthenics and running tasks count. Everything else (study, home, work, relationships) is
"not scored".

## Sources
- Race-time distributions among runners: [RunRepeat percentile calculator](https://runrepeat.com/how-do-you-masure-up-the-runners-percentile-calculator)
- Share of adults who run: [SalesFuel / Nielsen Scarborough](https://salesfuel.com/25-u-s-adults-run-regularly/), [AusPlay (run2.au)](https://run2.au/how-many-australian-adults-run-new-data-says-3-5-million-but-most-go-it-alone/)
- VO₂max norms by age and sex: [Kaminsky et al. 2015, FRIEND registry](https://pubmed.ncbi.nlm.nih.gov/26455884/)
