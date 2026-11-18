# ⚔️ Realm Companion

A browser app that reads your completed Todoist tasks and turns them into an RPG character whose
body shows what you can do, compared with everyone else.

- **Two sections: Calisthenics and Endurance.** Each is a list of exact feats (a muscle-up,
  a front lever, a sub-30 5 km, a marathon), and each feat carries the estimated share of all adults
  who can do it. Calisthenics is judged on skills, not volume. Your standing is a percentile of the population: "top 1.5% of adults". The figures
  are rough estimates, clearly labelled. See [docs/CRITERIA.md](docs/CRITERIA.md).
- **Your whole history.** The first sync reads Todoist's full activity log, recurring
  occurrences included, across all projects (The Realm, The Town, Sport, Barou, Inbox).
- **Private.** No server. The API token and history stay in your browser (localStorage +
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
             classify ─▶ detect feats ─▶ find feats ─▶ percentile standing ─▶ CharacterState ─▶ UI
```

The engine (`src/engine/`) is pure: the same events and config always produce the same character.
Changing a number in Settings re-scores the entire history instantly, so there's no stored state to
migrate.

| Path | What |
|---|---|
| `src/engine/catalog.ts` | The two feat ladders and the estimated share of adults for each feat |
| `src/engine/config.ts` | Stats, tier names, feats detected from task text, category mapping |
| `src/engine/classify.ts` | Task → stat (label > section > project > keyword > neutral) |
| `src/engine/feats.ts` | Automatic feat detection, assisted variants rejected, clean form required |
| `src/engine/engine.ts` | Feat detection, percentile standing, build tier, archetype |
| `src/todoist/` | API v1 client, normalisation, incremental sync |
| `src/ui/` | Pixel-art scene, unlocks, the two sections with a rarity ruler, history, settings |

## Roadmap

1. ✅ Todoist connection + full history import
2. ✅ Category mapping (labels, sections, projects, keywords)
3. ✅ Milestones, rounded tiers, overall level
4. ✅ Archetypes
5. ✅ Placeholder visuals (emoji scene)
6. ⏭ Calibrate numbers against the real history; replace estimated rarities with sourced data
7. Later: decay, real art, animations, achievements
