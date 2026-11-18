import { useState } from 'react';
import type { CharacterState, DomainState, StatState } from '../engine/types';

interface Props {
  state: CharacterState;
  onToggle: (milestoneId: string) => void;
  onConfirm: (milestoneId: string) => void;
}

function Domain({ d, onToggle, onConfirm }: { d: DomainState; onToggle: (id: string) => void; onConfirm: (id: string) => void }) {
  const fades = Boolean(d.def.decayDays);
  const lapsed = d.currentLevel < d.level;
  return (
    <section className="domain">
      <h4 className="domain__title">
        <span>{d.def.name}</span>
        <span className="domain__level" title="Best level ever reached">
          best L{d.level}{fades && <> · now <span className={lapsed ? 'lapsed' : ''}>L{d.currentLevel}</span></>}
        </span>
      </h4>
      {fades && (
        <p className="muted small">
          Counts as current for {d.def.decayDays} days after you last did or confirmed it. Your tier never goes down.
        </p>
      )}
      <ul className="ladder">
        {d.milestones.map((m) => {
          const locked = m.source === 'auto' || m.source === 'implied';
          const lapsedRung = m.achieved && !m.current && m.source !== 'implied';
          return (
            <li key={m.id} className={m.achieved ? 'rung rung--done' : 'rung'}>
              <label htmlFor={`ms-${m.id}`}>
                <input id={`ms-${m.id}`} type="checkbox" checked={m.achieved} disabled={locked} onChange={() => onToggle(m.id)} />
                <span className="rung__lv">L{m.level}</span>
                <span className="rung__text">{m.text}</span>
              </label>
              {m.source === 'auto' && <span className="rung__tag">found in your tasks{m.confirmedAt ? `, last on ${m.confirmedAt}` : ''}</span>}
              {m.source === 'implied' && <span className="rung__tag">implied by a higher milestone</span>}
              {m.source === 'claimed' && <span className="rung__tag">confirmed {m.confirmedAt}</span>}
              {lapsedRung && (
                <span className="rung__note">
                  Not confirmed recently.{' '}
                  {m.source === 'claimed' && <button className="link" onClick={() => onConfirm(m.id)}>I can still do this</button>}
                </span>
              )}
              {m.note && <span className="rung__note">{m.note}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function StatCard({ s, onToggle, onConfirm }: { s: StatState; onToggle: (id: string) => void; onConfirm: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const done = s.domains.reduce((n, d) => n + d.milestones.filter((m) => m.achieved).length, 0);
  const total = s.domains.reduce((n, d) => n + d.milestones.length, 0);
  const r = s.nextReq;
  return (
    <article className="stat">
      <button className="stat__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="stat__emoji">{s.def.emoji}</span>
        <span className="stat__name">{s.def.name}</span>
        <span className="stat__tier">T{s.tier} · {s.title}</span>
        <span className="stat__xp">{done}/{total}</span>
      </button>
      <div className="bar" role="progressbar" aria-valuenow={Math.round(s.progress * 100)} aria-valuemin={0} aria-valuemax={100}
        aria-label={`Progress to ${s.nextTitle ?? 'max tier'}`}>
        <div className="bar__fill" style={{ width: `${s.progress * 100}%` }} />
      </div>
      <div className="stat__sub">
        {r === null ? (
          <span>Legendary: capable in every domain.</span>
        ) : (
          <span className="muted">
            Next, T{r.level} {s.nextTitle}: {r.have} of {r.need} needed domains at level {r.level}
            {r.behind > 0 ? `, ${r.behind} below level ${r.level - 1}` : ''}.
          </span>
        )}
      </div>
      {open && (
        <div className="stat__detail">
          <div className="levels" aria-label="Level in each domain">
            {s.domains.map((d) => (
              <div key={d.def.id} className="levels__item">
                <span className="levels__bar"><span style={{ height: `${((d.level - 1) / 6) * 100}%` }} /></span>
                <span className="levels__n">L{d.level}</span>
                <span className="levels__name">{d.def.name}</span>
              </div>
            ))}
          </div>
          {s.nextNeeds.length > 0 && <ul className="needs">{s.nextNeeds.map((n) => <li key={n}>{n}</li>)}</ul>}
          <p className="muted small">
            A tier needs {r ? r.need : Math.ceil(s.domains.length * 0.6)} of the {s.domains.length} domains at that level, and none more than one level behind.
            {' '}{s.completions} matching tasks in your history.
          </p>
          {s.domains.map((d) => <Domain key={d.def.id} d={d} onToggle={onToggle} onConfirm={onConfirm} />)}
        </div>
      )}
    </article>
  );
}

export function Stats({ state, onToggle, onConfirm }: Props) {
  return (
    <section className="panel">
      <h2>Stats</h2>
      <p className="muted small">{state.milestonesDone} of {state.milestonesTotal} milestones. Tap a stat to see its domains and tick off milestones.</p>
      {state.stats.map((s) => <StatCard key={s.def.id} s={s} onToggle={onToggle} onConfirm={onConfirm} />)}
    </section>
  );
}

export function Feats({ state }: { state: CharacterState }) {
  if (!state.feats.length) return null;
  return (
    <section className="panel">
      <h2>Found in your tasks</h2>
      <ul className="feats">
        {state.feats.map((f) => (
          <li key={f.def.id} className={f.status === 'counted' ? 'feat feat--ok' : 'feat'}>
            <span>{f.status === 'counted' ? '🏅' : '⏳'} <strong>{f.def.name}</strong></span>
            <span className="muted small">
              {f.status === 'counted'
                ? `${new Date(f.event.completedAt).toLocaleDateString('en-GB')} · “${f.event.content}”`
                : `Found “${f.event.content}” but no proof of clean form. Add the Clean label in Todoist (or “strict”) to count it.`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
