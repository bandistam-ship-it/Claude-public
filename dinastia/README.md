# Dinastia ta

O vizualizare de joc peste Todoist-ul tău („The Realm”). Nu se apasă nimic în aplicație: totul vine din ce bifezi în Todoist. Zero dependențe, Node 20+.

## Cum se cucerește un teritoriu
- Obor, Colentina, Floreasca, Giulești, Chitila: automat, din scorul săptămânal și din numărul de task-uri bifate pe domeniu.
- Restul (tip `tag`): bifezi în Todoist un task cu numele teritoriului între paranteze drepte în titlu, ex. `[Cotroceni] Seminar Filosofie`. Merge și `#cotroceni` sau o etichetă `cotroceni`.
- Săptămâna se închide singură duminică la 21:00 (și recuperează săptămâna trecută dacă serverul a fost oprit). Scorul, pierderile, evenimentele, moartea și moștenitorul se petrec fără intervenția ta.

## Rulare
```
export TODOIST_TOKEN=...   # doar citire (GET)
export APP_PASSWORD=...    # obligatoriu cand serverul e in retea
TZ=Europe/Bucharest npm start
npm test
```

## Pe telefon
Aplicația e un PWA: o pui pe un server mereu pornit (închiderea de duminică are nevoie de el), o deschizi pe telefon în Chrome/Safari și alegi „Adaugă pe ecranul principal”.
Cu `Dockerfile`-ul de aici merge pe orice găzduire de containere (Fly.io, Render, Railway, VPS). Montează un volum la `/data`, ca să nu pierzi progresul, și setează `TODOIST_TOKEN` și `APP_PASSWORD` ca secrete. Folosește HTTPS (platformele de mai sus îl dau implicit).

- `config/territories.json` – teritoriile și țintele.
- `config/config.json` – maparea secțiuni/etichete → domenii, formula scorului, ora închiderii, praguri.
