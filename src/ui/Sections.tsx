import type { CharacterState, RungState, SectionState } from '../engine/types';
import { fmtPercentile, fmtShare, fmtStanding } from './format';

interface Props {
  state: CharacterState;
  onToggle: (rungId: string) => void;
  onConfirm: (rungId: string) => void;
}

// Log scale: 50% at the left, 0.01% at the right.
const pos = (share: number) => Math.max(0, Math.min(100, (Math.log10(share) / -4) * 100));
const TICKS: [string, number][] = [['50%', 0.5], ['10%', 0.1], ['1%', 0.01], ['0.1%', 0.001], ['0.01%', 0.0001]];

/** A ruler of rarity: every feat is a dot, your standing is the marker. Rarer is further right. */
function Ruler({ s }: { s: SectionState }) {
  return (
    <div className="ruler" aria-hidden="true">
      <div className="ruler__track">
        {s.rungs.map((r) => (
          <span key={r.id} className={r.achieved ? 'ruler__dot ruler__dot--on' : 'ruler__dot'} style={{ left: `${pos(r.share)}%` }} />
        ))}
        {s.share < 1 && <span className="ruler__you" style={{ left: `${pos(s.share)}%` }} />}
      </div>
      <div className="ruler__ticks">
        {TICKS.map(([label, v]) => <span key={label} style={{ left: `${pos(v)}%` }}>{label}</span>)}
      </div>
    </div>
  );
}

function Rung({ r, onToggle, onConfirm }: { r: RungState; onToggle: (id: string) => void; onConfirm: (id: string) => void }) {
  const locked = r.source === 'auto';
  const lapsed = r.achieved && !r.current;
  return (
    <li className={r.achieved ? 'rung rung--done' : 'rung'}>
      <label htmlFor={`ms-${r.id}`}>
        <input id={`ms-${r.id}`} type="checkbox" checked={r.achieved} disabled={locked} onChange={() => onToggle(r.id)} />
        <span className="rung__text">{r.text}</span>
        <span className="rung__share">{fmtShare(r.share)}</span>
      </label>
      {r.source === 'auto' && <span className="rung__tag">found in your tasks{r.confirmedAt ? `, last on ${r.confirmedAt}` : ''}</span>}
      {r.source === 'claimed' && <span className="rung__tag">confirmed {r.confirmedAt}</span>}
      {lapsed && (
        <span className="rung__note">
          Not confirmed recently.{' '}
          {r.source === 'claimed' && <button className="link" onClick={() => onConfirm(r.id)}>I can still do this</button>}
        </span>
      )}
      {r.note && <span className="rung__note">{r.note}</span>}
    </li>
  );
}

function Section({ s, onToggle, onConfirm }: { s: SectionState; onToggle: (id: string) => void; onConfirm: (id: string) => void }) {
  const done = s.rungs.filter((r) => r.achieved).length;
  const lapsed = s.currentShare > s.share;
  return (
    <section className="panel section">
      <h2>{s.def.emoji} {s.def.name}</h2>
      <p className="standing">
        <strong>{fmtStanding(s.share)}</strong>
        {s.share < 1 && <span className="muted"> · {fmtPercentile(s.share)}</span>}
      </p>
      {s.best ? (
        <p className="muted small">Your rarest: {s.best.text}{s.best.confirmedAt ? ` (${s.best.confirmedAt})` : ''}.</p>
      ) : (
        <p className="muted small">Nothing ticked yet. {s.next ? `The easiest feat: ${s.next.text}, which about ${fmtShare(s.next.share)} of adults can do.` : ''}</p>
      )}
      {lapsed && (
        <p className="lapsed small">
          Right now: {fmtStanding(s.currentShare)}. Your rarest feat has not been confirmed in {s.def.decayDays} days. Your best never drops.
        </p>
      )}
      <Ruler s={s} />
      <details className="domain" open>
        <summary className="domain__title">
          <span>Feats</span>
          <span className="domain__level">{done} of {s.rungs.length}</span>
        </summary>
        <p className="muted small">From the most common to the rarest. The figure is the estimated share of all adults who can do it.</p>
        <ul className="ladder">
          {s.rungs.map((r) => <Rung key={r.id} r={r} onToggle={onToggle} onConfirm={onConfirm} />)}
        </ul>
      </details>
    </section>
  );
}

export function Sections({ state, onToggle, onConfirm }: Props) {
  return (
    <>
      {state.sections.map((s) => <Section key={s.def.id} s={s} onToggle={onToggle} onConfirm={onConfirm} />)}
      <p className="muted small footnote">
        Shares are rough estimates for all adults, pooled across ages and sexes. See the criteria for how each was estimated.
      </p>
    </>
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
