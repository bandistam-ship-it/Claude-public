# ⚔️ Realm Companion

A browser app that reads your completed Todoist tasks and turns them into an RPG character whose
body, mind and home evolve with **what** you do and **how balanced** it is.

- **Milestones, not XP.** Body (6 domains) and Mind (5 domains) are the heart of the app, with a
  light Upkeep (3). Each domain is a ladder of six exact milestones (a first strict pull-up, a
  muscle-up, a licență, B2 French). A tier needs a well-rounded profile, so Legendary means truly
  impressive across the whole area. You compete only with your own past: no population figures.
  Body milestones show both "ever achieved" and "currently valid". See
  [docs/CRITERIA.md](docs/CRITERIA.md).
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
                     config (mapping, domains, feats)  │
                                                      ▼
             classify ─▶ detect feats ─▶ evaluate milestones ─▶ rounded tiers ─▶ CharacterState ─▶ UI
```

The engine (`src/engine/`) is pure: the same events and config always produce the same character.
Changing a number in Settings re-scores the entire history instantly, so there's no stored state to
migrate.

| Path | What |
|---|---|
| `src/engine/catalog.ts` | The milestone ladders: Body, Mind and Upkeep domains × 6 milestones |
| `src/engine/config.ts` | Stats, tier names, feats detected from task text, category mapping |
| `src/engine/classify.ts` | Task → stat (label > section > project > keyword > neutral) |
| `src/engine/feats.ts` | Automatic feat detection, assisted variants rejected, clean form required |
| `src/engine/engine.ts` | Milestone detection, rounded tiers, level, archetype |
| `src/todoist/` | API v1 client, normalisation, incremental sync |
| `src/ui/` | Pixel-art scene, unlocks, stats with tickable milestones, history, settings |

## Roadmap

1. ✅ Todoist connection + full history import
2. ✅ Category mapping (labels, sections, projects, keywords)
3. ✅ Milestones, rounded tiers, overall level
4. ✅ Archetypes
5. ✅ Placeholder visuals (emoji scene)
6. ⏭ Calibrate numbers against the real history; replace estimated rarities with sourced data
7. Later: decay, real art, animations, achievements
