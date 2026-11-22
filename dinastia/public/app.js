const DOMAIN_COLOR = { drept: '#8c3b3b', filosofie: '#4b6a9b', sport: '#5d8a4a', casa: '#a8793a' };
const DOMAIN_NAME = { drept: 'Drept și Barou', filosofie: 'Filosofie și lectură', sport: 'Sport', casa: 'Casă' };
const STATUS = { conquered: 'cucerit', available: 'disponibil', locked: 'încă închis', lost: 'pierdut' };
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let data = null, selected = 'obor';

async function call(path, body) {
  const res = await fetch(path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (res.status === 401) { location.href = '/login.html'; return null; }
  const j = await res.json();
  if (!res.ok) { alert(j.error || 'Eroare'); return null; }
  return j;
}
async function load(path = '/api/state', body) { const j = await call(path, body); if (j) { data = j; render(); } }

// ---- harta: inele de sectoare, cate un inel pe treapta ----
const RINGS = { 1: [0, 70], 2: [80, 175], 3: [185, 265], 4: [275, 350] };
const pol = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
function sector(inner, outer, a0, a1) {
  if (inner === 0) return `M0 0 m${-outer} 0 a${outer} ${outer} 0 1 0 ${2 * outer} 0 a${outer} ${outer} 0 1 0 ${-2 * outer} 0`;
  const [x0, y0] = pol(outer, a0), [x1, y1] = pol(outer, a1), [x2, y2] = pol(inner, a1), [x3, y3] = pol(inner, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0} ${y0} A${outer} ${outer} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${inner} ${inner} 0 ${large} 0 ${x3} ${y3} Z`;
}
function fillFor(t) {
  const c = t.domain ? DOMAIN_COLOR[t.domain] : '#c8a24a';
  if (t.status === 'conquered') return { fill: c, opacity: 1 };
  if (t.status === 'lost') return { fill: '#7a1f1f', opacity: 0.95 };
  if (t.status === 'available') return { fill: c, opacity: 0.35 };
  return { fill: '#4a4234', opacity: 0.55 };
}
function renderMap() {
  const svg = $('map'); let out = '';
  const tiers = [...new Set(data.territories.map((t) => t.tier))];
  for (const tier of tiers) {
    const list = data.territories.filter((t) => t.tier === tier);
    const [inner, outer] = RINGS[tier] || [0, 0];
    if (!outer) continue;
    const gap = list.length > 1 ? 0.03 : 0;
    list.forEach((t, i) => {
      const a0 = -Math.PI / 2 + (i / list.length) * 2 * Math.PI + gap, a1 = -Math.PI / 2 + ((i + 1) / list.length) * 2 * Math.PI - gap;
      const f = fillFor(t); const mid = (a0 + a1) / 2, rm = (inner + outer) / 2;
      const [lx, ly] = tier === 1 ? [0, 0] : pol(rm, mid);
      const flag = t.status === 'conquered' ? '⚑ ' : t.status === 'lost' ? '✕ ' : '';
      out += `<path class="sector ${selected === t.id ? 'sel' : ''}" data-id="${t.id}" d="${sector(inner, outer, a0, a1)}" fill="${f.fill}" fill-opacity="${f.opacity}"><title>${esc(t.name)} — ${STATUS[t.status]}</title></path>`;
      out += `<text class="lbl ${list.length > 8 ? 'small' : ''}" x="${lx}" y="${ly}" dy="4">${flag}${esc(t.name)}</text>`;
    });
  }
  svg.innerHTML = out;
  svg.querySelectorAll('.sector').forEach((el) => el.addEventListener('click', () => { selected = el.dataset.id; render(); }));
}

function renderHeader() {
  const s = data.state;
  $('who').textContent = `${s.dynasty.name}, generația ${s.dynasty.generation}` + (s.dynasty.trait ? ` · moștenire: +${s.dynasty.trait.bonus} ${DOMAIN_NAME[s.dynasty.trait.domain]}` : '');
  const r = data.rank;
  $('rank').innerHTML = `<b>${esc(r.name)}</b><span class="sub">Următorul pas: ${esc(r.next)}${r.factorNext ? ` · dificultate ×${r.factorNext}` : ''}</span>`;
}

function renderTerritory() {
  const t = data.territories.find((x) => x.id === selected) || data.territories[0];
  const pct = t.goal ? Math.round((t.progress / t.goal) * 100) : 0;
  const unit = { streak: 'săptămâni', taskCount: 'task-uri', weeklyDomain: 'săptămâni' }[t.type];
  let h = `<h2>${esc(t.name)} <span class="sub">· ${t.domain ? DOMAIN_NAME[t.domain] : 'Țara întreagă'} · ${STATUS[t.status]}</span></h2>`;
  h += `<p>${esc(t.target)}</p>`;
  if (t.status === 'lost') h += `<p class="warn">Luat de ${esc(t.rival)}. Îl recucerești cu aceeași țintă.</p>`;
  if (unit) h += `<div class="sub">${t.progress} / ${t.goal} ${unit}</div><div class="bar"><i style="width:${pct}%"></i></div>`;
  if (t.type === 'tag' && t.status !== 'conquered' && t.status !== 'locked') h += `<p class="sub">Se cucerește când bifezi în Todoist un task cu <b>[${esc(t.name)}]</b> în titlu.</p>`;
  if (t.status === 'locked') h += `<p class="sub">Se deschide când ajungi la un rang mai mare.</p>`;
  $('territory').innerHTML = h;
}

function renderWeek() {
  const w = data.week;
  let h = `<h2>Săptămâna ${esc(w.key)}</h2>`;
  if (data.source === 'fara-token') h += '<p class="warn">Todoist nu e conectat: serverul pornește fără TODOIST_TOKEN.</p>';
  else if (w.error) h += `<p class="warn">Todoist: ${esc(w.error)}</p>`;
  else {
    h += `<div class="bar"><i style="width:${w.score * 10}%"></i></div><div>Scor până acum: <b>${w.score}/10</b></div>`;
    for (const d of data.domains) { const x = w.domains[d.id]; h += `<div class="sub">${d.name}: ${x.count} task-uri · ${Math.round(x.ratio * 100)}%</div>`; }
  }
  if (data.autoClose.enabled) h += `<p class="sub">Săptămâna se închide singură duminică la ${data.autoClose.hour}:00.</p>`;
  const hist = data.state.history.slice(-8).map((x) => x.score).join(' · ');
  if (hist) h += `<div class="sub" style="margin-top:8px">Ultimele scoruri: ${hist}</div>`;
  $('week').innerHTML = h;
}

function renderRecognition() {
  let h = '<h2>Recunoaștere</h2>';
  for (const d of data.domains) h += `<div class="sub">${d.name}: ${d.recognition}</div><div class="bar"><i style="width:${d.recognition}%;background:${DOMAIN_COLOR[d.id]}"></i></div>`;
  $('recognition').innerHTML = h;
}

function renderJournal() {
  const s = data.state;
  let h = '<h2>Jurnalul dinastiei</h2>';
  if (s.ancestors.length) h += `<div class="sub">Strămoși: ${s.ancestors.map((a) => `${esc(a.name)} (gen. ${a.generation})`).join(', ')}</div>`;
  const items = s.journal.slice(-25).reverse();
  h += items.length ? items.map((e) => `<div class="ev ${e.kind}">${esc(e.text)}<small>${new Date(e.at).toLocaleDateString('ro-RO')} · ${esc(e.rank)} · gen. ${e.generation}</small></div>`).join('') : '<p class="sub">Povestea începe când închizi prima săptămână.</p>';
  $('journal').innerHTML = h;
}

function render() { renderHeader(); renderMap(); renderTerritory(); renderWeek(); renderRecognition(); renderJournal(); }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
load();
setInterval(() => { if (!document.hidden) load(); }, 120000);
