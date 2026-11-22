# Dinastia ta

Joc de cucerit teritorii alimentat de Todoist (proiectul „The Realm”). Zero dependențe, Node 20+.

```
export TODOIST_TOKEN=...     # token API Todoist (doar citire, se folosesc doar GET)
npm start                    # http://localhost:8787
npm test
```

Fără `TODOIST_TOKEN` rulează în mod manual: introduci procentul pe domeniu la închiderea săptămânii.

- `config/territories.json` – teritoriile și țintele (le editezi tu; `proposed` = propus de mine).
- `config/config.json` – maparea secțiuni/etichete → domenii, formula scorului, praguri de pierdere/moarte.
- `data/state.json` – progresul (în .gitignore). Variabile: `PORT`, `HOST`, `STATE_FILE`.

Scorul săptămânii: puncte din task-urile bifate (etichetă XP Easy/Medium/Hard/Boss-fight, altfel prioritatea) față de ținta de 40 puncte, împărțită pe domenii. Îl poți suprascrie cu scorul raportului de duminică.
