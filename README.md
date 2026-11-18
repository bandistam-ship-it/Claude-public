# ⚔️ Realm Companion

A browser app that reads your completed Todoist tasks and turns them into an RPG character whose
body, mind, home, spirit, career and bonds evolve with **what** you do and **how balanced** it is.

- **Realistic difficulty.** XP measures effort, but each tier also has a **hard gate** grounded in
  real life: how rare a feat is in the population (a first pull-up, a muscle-up), real milestones
  (licență, Barou), the Romanian wage distribution, or how long you have kept a habit. You can't
  grind easy tasks into "Legendary". See [docs/CRITERIA.md](docs/CRITERIA.md).
- **Your whole history.** The first sync reads Todoist's full activity log, recurring
  occurrences included, across all projects (The Realm, The Town, Sport, Barou, Inbox).
- **Private.** No server. The API token, wage and history stay in your browser (localStorage +
  IndexedDB). The app only reads from Todoist; it never changes anything.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # engine unit tests
npm run build    # static site in dist/ (deployable to any static host, e.g. GitHub Pages)
```

Then open **Settings** and paste your Todoist API token (Todoist → Settings → Integrations →
Developer). Or click **Load demo data** to look around first.

## How it works

```
Todoist API ─▶ sync (activity log + task lists) ─▶ IndexedDB
                                                      │
                     config (mapping, XP, gates, feats)│
                                                      ▼
             classify ─▶ detect feats ─▶ score + replay chronologically ─▶ CharacterState ─▶ UI
```

The engine (`src/engine/`) is pure: the same events and config always produce the same character.
Changing a number in Settings re-scores the entire history instantly, so there's no stored state to
migrate.

| Path | What |
|---|---|
| `src/engine/config.ts` | Stats, tier names, XP thresholds, gates, feats, category mapping |
| `src/engine/classify.ts` | Task → stat (label > section > project > keyword > neutral) |
| `src/engine/feats.ts` | Automatic feat detection, assisted variants rejected, clean form required |
| `src/engine/engine.ts` | XP formula, chronological replay, tiers, level, archetype |
| `src/todoist/` | API v1 client, normalisation, incremental sync |
| `src/ui/` | Character scene, stat bars with gate details, feats, history, settings |

## Roadmap

1. ✅ Todoist connection + full history import
2. ✅ Category mapping (labels, sections, projects, keywords)
3. ✅ XP, tiers with real-life gates, overall level
4. ✅ Archetypes
5. ✅ Placeholder visuals (emoji scene)
6. ⏭ Calibrate numbers against the real history; replace estimated rarities with sourced data
7. Later: decay, real art, animations, achievements
