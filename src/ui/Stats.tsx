import { useState } from 'react';
import type { CharacterState, StatState } from '../engine/types';

function StatCard({ s }: { s: StatState }) {
  const [open, setOpen] = useState(false);
  const nextGate = s.gates.find((g) => g.tier === s.tier + 1);
  return (
    <article className="stat">
      <button className="stat__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="stat__emoji">{s.def.emoji}</span>
        <span className="stat__name">{s.def.name}</span>
        <span className="stat__tier">T{s.tier} · {s.title}</span>
        <span className="stat__xp">{Math.round(s.xp).toLocaleString('en')} XP</span>
      </button>
      <div className="bar" title={s.nextTierXp ? `${Math.round(s.xp)} / ${s.nextTierXp} XP` : 'Max tier'}>
        <div className={`bar__fill ${s.gateLocked ? 'bar__fill--locked' : ''}`} style={{ width: `${s.progress * 100}%` }} />
      </div>
      <div className="stat__sub">
        {s.nextTierXp === null ? (
          <span>Max tier reached.</span>
        ) : s.gateLocked ? (
          <span className="locked">🔒 XP ready for T{s.xpTier}, gate locked: {nextGate?.text}</span>
        ) : (
          <span className="muted">
            {Math.max(0, s.nextTierXp - Math.round(s.xp)).toLocaleString('en')} XP to T{s.tier + 1} {s.def.tiers[s.tier]}
            {nextGate && !nextGate.passed ? ` · then gate: ${nextGate.text}` : ''}
          </span>
        )}
      </div>
      {open && (
        <div className="stat__detail">
          <p className="muted">{s.completions} completions · best weekly streak {s.bestStreakWeeks} weeks</p>
          <ol className="gates">
            {s.gates.map((g) => (
              <li key={g.tier} className={g.passed ? 'gate gate--ok' : 'gate'}>
                <strong>T{g.tier} {s.def.tiers[g.tier - 1]}</strong>: {g.text}
                <ul>{g.detail.map((d, i) => <li key={i} className="muted">{d}</li>)}</ul>
              </li>
            ))}
          </ol>
        </div>
      )}
    </article>
  );
}

export function Stats({ state }: { state: CharacterState }) {
  return (
    <section className="panel">
      <h2>Stats</h2>
      {state.stats.map((s) => <StatCard key={s.def.id} s={s} />)}
      <p className="muted small">Neutral (uncategorised) XP: {state.neutralXp.toLocaleString('en')}. It counts toward your level only.</p>
    </section>
  );
}

export function Feats({ state }: { state: CharacterState }) {
  if (!state.feats.length) {
    return (
      <section className="panel">
        <h2>Feats</h2>
        <p className="muted">No feats detected yet. They're found automatically in completed tasks, e.g. “Strict pull-ups – 2x5” or an Achievement task “Primul muscle up” with the Clean label.</p>
      </section>
    );
  }
  return (
    <section className="panel">
      <h2>Feats</h2>
      <ul className="feats">
        {state.feats.map((f) => (
          <li key={f.def.id} className={f.status === 'counted' ? 'feat feat--ok' : 'feat'}>
            <span>{f.status === 'counted' ? '🏅' : '⏳'} <strong>{f.def.name}</strong></span>
            <span className="muted small">
              {f.status === 'counted'
                ? `+${f.bonusXp} XP · ${new Date(f.event.completedAt).toLocaleDateString('en-GB')} · “${f.event.content}”`
                : `Found “${f.event.content}” but no proof of clean form. Add the Clean label in Todoist (or “strict”) to count it.`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
