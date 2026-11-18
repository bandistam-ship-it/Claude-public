# How standing is calculated

The app has **two sections only: Calisthenics and Endurance.** Each is a list of exact feats, from
the most common to the rarest. Every feat carries the **estimated share of all adults who can do
it**. Your standing in a section is the share for your **rarest achieved feat**:

- rarest feat done by about 1.5% of adults → **top 1.5%**, the **98.5th percentile**
- nothing achieved yet → "No feat yet"; the easiest feat is shown as your next unlock

The **overall** standing under the character is the geometric mean of the two sections' shares, so
both count. It also sets the build of the pixel character (top 50% = tier 2 … top 0.2% = tier 7)
and the archetype (one section 5× rarer than the other makes you lopsided).

## Be careful with the numbers

**These shares are estimates, not measurements.** Almost no population survey measures these feats.
They are pooled across all adults, all ages and both sexes, so they flatter a young man and are
harsh on an older woman. Treat the percentiles as rough orders of magnitude.

How each group was estimated:

| Feats | Basis | Confidence |
|---|---|---|
| Push-ups, first pull-up | Informed estimates. Published pull-up figures range from about 6% to 17% of adults, with no authoritative survey, so I used 12% | Low |
| Dips, 10 and 20 pull-ups, L-sit, handstands, pistol squat | Extrapolation from the above and from how rare these are in training communities | Low |
| Muscle-up, HSPU, front lever, one-arm pull-up, planche | Guesses. No population data exists; these are "1 in 200" to "1 in 5,000" orders of magnitude | Very low |
| 5 km / 10 km non-stop | About 15% of adults run regularly (surveys say 5–16%), fewer can run 10 km | Medium-low |
| Race times (5 km, 10 km, half, marathon) | Share of adults who run × how runners' times are distributed (RunRepeat) | Low |
| Finished half marathon / marathon | Cumulative finishers per capita, about 2% and 0.5% of adults | Low |
| **VO₂max top 20% / 5% / 1%** | **Exact by definition**: percentiles of the FRIEND registry norms for your age and sex | High, but lab vs watch estimates differ |

You can change any share in [`src/engine/catalog.ts`](../src/engine/catalog.ts); everything is
recalculated.

## Detecting feats

A feat counts when it is **found in your Todoist history** or **ticked by you**. Calisthenics feats
found in tasks need proof of clean form: "strict" or "clean" in the task, or the `Clean` label.
Banded, assisted, negative, jumping and "attempt" or "test" tasks never count. Times and heart
rates cannot be seen in Todoist, so endurance feats are ticked by hand.

Feats are independent: a muscle-up does not imply a pull-up, because you either did it or you did
not.

## Ever achieved vs currently valid

Fitness fades. Each section has a window (Calisthenics 240 days, Endurance 120). A feat stays **ever
achieved** forever, and counts as **currently valid** only while you did it or confirmed it inside
the window. The app shows both: "Top 1.5% of adults" and, if it lapsed, "Right now: top 12%".
Your best never drops. Tap "I can still do this" to renew a ticked feat.

## What is not scored
Only calisthenics and running tasks count. Everything else (study, home, work, relationships) is
"not scored".

## Sources
- Pull-up prevalence (unverified, conflicting): [Biology Insights](https://biologyinsights.com/how-many-americans-can-do-a-pull-up/), [Infrared for Health](https://infraredforhealth.com/what-percentage-of-population-can-do-a-pull-up/)
- Race-time distributions among runners: [RunRepeat percentile calculator](https://runrepeat.com/how-do-you-masure-up-the-runners-percentile-calculator)
- Share of adults who run: [SalesFuel / Nielsen Scarborough](https://salesfuel.com/25-u-s-adults-run-regularly/), [AusPlay (run2.au)](https://run2.au/how-many-australian-adults-run-new-data-says-3-5-million-but-most-go-it-alone/)
- VO₂max norms by age and sex: [Kaminsky et al. 2015, FRIEND registry](https://pubmed.ncbi.nlm.nih.gov/26455884/)
