import { useMemo, useState } from 'react';
import type { Bucket, CharacterState } from '../engine/types';

const BUCKET_EMOJI: Record<Bucket, string> = {
  body: '💪', mind: '🧠', upkeep: '🏰', spirit: '🔥', career: '📜', neutral: '▫️', ignored: '🚫',
};

export function History({ state }: { state: CharacterState }) {
  const [filter, setFilter] = useState<Bucket | 'all'>('all');
  const [limit, setLimit] = useState(50);
  const rows = useMemo(() => {
    const all = [...state.scored].reverse();
    return filter === 'all' ? all : all.filter((r) => r.bucket === filter);
  }, [state.scored, filter]);

  return (
    <section className="panel">
      <h2>History</h2>
      <div className="chips">
        {(['all', 'body', 'mind', 'upkeep', 'spirit', 'career', 'neutral', 'ignored'] as const).map((b) => (
          <button key={b} className={filter === b ? 'chip chip--on' : 'chip'} onClick={() => setFilter(b)}>
            {b === 'all' ? 'All' : `${BUCKET_EMOJI[b]} ${b === 'ignored' ? 'not scored' : b}`}
          </button>
        ))}
      </div>
      <ul className="history">
        {rows.slice(0, limit).map((r) => (
          <li key={r.event.id} className="history__row">
            <span className="history__emoji">{BUCKET_EMOJI[r.bucket]}</span>
            <span className="history__main">
              <span className="history__content">{r.event.content}</span>
              <span className="muted small">
                {new Date(r.event.completedAt).toLocaleDateString('en-GB')} · {r.reason} · {r.breakdown}
              </span>
            </span>
            <span className="history__xp">{r.xp > 0 ? `+${r.xp}` : '0'}</span>
          </li>
        ))}
      </ul>
      {rows.length > limit && (
        <button className="btn btn--ghost" onClick={() => setLimit(limit + 100)}>Show more ({rows.length - limit} left)</button>
      )}
      {!rows.length && <p className="muted">Nothing here.</p>}
    </section>
  );
}
