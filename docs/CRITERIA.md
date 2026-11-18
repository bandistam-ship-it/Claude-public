# Progression criteria

**XP measures effort; tiers measure what you can actually do.** A stat enters tier *n* only when
its XP reaches the threshold **and** the gate for tier *n* is passed (hard gates). Gates must be
passed in order, but a rarer feat implies the easier ones in the same stat (a clean muscle-up
implies a pull-up).

## XP per completed task

`XP = difficulty × duration × challenge × daily cap` (+ a one-off feat bonus)

| Criterion | Rule | Why |
|---|---|---|
| Difficulty | Easy 10 · Medium 25 · Hard 50 · Boss-fight 100. Unlabelled: 10, Sport sessions Medium, rest days Easy, neutral tasks 5 | Your own estimate of the effort |
| Duration | × √hours, clamped to 0.5–2 | 3h of study > 30 min, but not 6× more |
| Challenge | Task trains at a level (Easy 2, Medium 4, Hard 5, Boss 7). Below your tier: × 0.6 per tier of gap | Beginners improve from anything; advanced people only from work at their level |
| Session | Subtasks of a parent completed the same day earn 0 | One workout is one workout |
| Daily cap | Over 4 completions in one stat on the same day: × 0.5 | Anti-farming |
| Feat bonus | 50 × log₁₀(1 / rarity): 1 in 10 → 50, 1 in 100 → 100, 1 in 1,000 → 150 | Rare achievements should feel rare |
| Priority | Not used | Your choice |

## Tier XP (cumulative)

| Tier | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|
| XP | 300 | 1,200 | 4,000 | 12,000 | 32,000 | 80,000 |
| At ~150 XP/week | ~2 wk | ~2 mo | ~6 mo | ~1.5 yr | ~4 yr | ~10 yr |

## Gates

### Body: feats, clean form only
Detected automatically from completed tasks. A set like "Strict pull-ups – 2x4" proves 4
pull-ups. Banded/assisted, negatives, jumping, drills, "attempts" and "tests" never count. A
body feat counts only if the task says **strict** or **clean**, or carries the **`Clean`** label.

| Tier | Gate | Share of adults (estimate) |
|---|---|---|
| 2 Weak | 10 push-ups | ~50% |
| 3 Average | First strict pull-up | ~25% |
| 4 Fit | 10 strict pull-ups **and** 15 dips | ~5–10% |
| 5 Athletic | First clean muscle-up | ~1–2% |
| 6 Powerful | Strict handstand push-up **or** front lever | <0.5% |
| 7 Legendary | One-arm pull-up **or** full planche | <0.05% |

### Mind: education milestones
Milestones are completed tasks labelled Achievement/Boss-fight (or "primul/first") that state the
result, e.g. "Licență susținută", "Admis la Barou".

| Tier | Gate |
|---|---|
| 2 Curious | 10 study/reading tasks |
| 3 Informed | Enrolled in higher education (5+ university tasks) |
| 4 Smart | Licență obtained |
| 5 Scholar | Barou admission **or** C1 language certificate |
| 6 Sage | Master's **or** PhD |
| 7 Genius | Published, recognised original work |

### Career (= Duty): wage **and** position, both required
Wage and position are entered in Settings (Todoist can't know them). Net monthly wages in RON; in
brackets, the rough global equivalent in 2021 PPP dollars (ILO).

| Tier | Net wage | Share of RO employees | Position |
|---|---|---|---|
| 2 Apprentice | 2,699 (minimum wage from 1 Jul 2026) | most; ~40% earn near the minimum (≈ $1,900, about the global average of $1,728) | First job / internship |
| 3 Journeyman | 4,300 (≈ median, estimate) | ~50% (≈ $3,200) | Trainee lawyer (avocat stagiar) |
| 4 Professional | 5,717 (national average, Sep 2026) | ~30%, estimate (≈ $4,150, the global top-10% line) | Qualified lawyer (avocat definitiv) |
| 5 Expert | 10,000 | ~5% (≈ $7,500) | Own practice / senior associate |
| 6 Partner | 20,000 | ~1%, estimate (≈ $15,000) | Partner |
| 7 Magnate | 40,000 | ~0.1%, estimate (≈ $30,000) | Managing partner / authority |

### Upkeep, Spirit, Bonds: consistency
Habits take ~66 days (≈ 10 weeks) to form on average (Lally et al., 2010).

| Tier | Gate |
|---|---|
| 2 | 3 tasks done |
| 3 | Every week for 4 weeks in a row |
| 4 | Every week for 10 weeks (~66 days) |
| 5 | Twice a week for 13 weeks (~90 days). Spirit also needs a finished creative work |
| 6 | Twice a week for 26 weeks |
| 7 | Twice a week for 52 weeks |

## Archetype
Tier gap between the highest and lowest stat, compared with the imbalance threshold (default 2):
- All tiers ≤ 2 → **Basement Nerd**
- All tiers ≥ 4 and gap ≤ 1 → **Renaissance Hero**
- Gap ≥ threshold → the dominant stat's archetype: Dumb Brute (Body), Frail Bookworm (Mind),
  Obsessive Housekeeper (Upkeep), Lost Mystic (Spirit), Workaholic (Career), Party Animal (Bonds)
- Otherwise → **Wandering Adventurer**

## Data quality and sources
- Solid: Romanian minimum and average wage (INS releases); ILO global wage figures.
- Estimates, to be replaced with sourced data: the RO median and wage shares (INS doesn't publish
  a monthly median), all body-feat prevalences, education shares, and the PPP conversion (~1.95 RON
  per international $, third-party figure).

Sources:
- INS average net wage, Sep 2026: [Știrile ProTV](https://stirileprotv.ro/stiri/financiar/salariul-mediu-net-a-ajuns-la-5-717-lei-in-septembrie-2026-ce-domenii-ofera-cele-mai-mari-castiguri-in-romania.html), [Digi24](https://www.digi24.ro/stiri/economie/salariul-mediu-net-a-crescut-la-5-717-lei-dar-nu-a-tinut-pasul-cu-inflatia-cat-a-pierdut-puterea-de-cumparare-4032903)
- Minimum wage 4,325 gross / 2,699 net from 1 Jul 2026: [Capital](https://www.capital.ro/guvernul-a-aprobat-cresterea-salariului-minim-se-vor-plati-4-325-de-lei-brut-din-1-iulie-cat-este-majorarea-neta.html)
- ~40% earn near the minimum wage: [Romania Insider](https://www.romania-insider.com/romanian-employees-minimum-wage-august-2025)
- 5.5% earn over 10,000 RON (eJobs survey): [Romania Insider](https://www.romania-insider.com/ejobs-highest-paid-employees-romania-2023)
- Median estimates: [Undelucram](https://www.undelucram.ro/en/cumlucram/the-minimum-wage-has-increased-as-of-july-1st-but-how-much-do-most-romanian-employees-actually-earn-2392)
- ILO Global Wage Report 2024–25: [PDF](https://www.ilo.org/sites/default/files/2024-11/GWR-2024_Layout_E_RGB_Web.pdf)
- PPP conversion factor: [World Bank](https://data.worldbank.org/indicator/PA.NUS.PPP?t=0), [historysaid](https://historysaid.com/compare/romania-vs-st-kitts-and-nevis/ppp-conversion-factor)
- Habit formation: Lally, P. et al. (2010), *How are habits formed*, European Journal of Social Psychology 40(6).
