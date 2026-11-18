import type { CharacterState, TimelinePoint } from '../engine/types';
import { fmtPercentile, fmtStanding } from './format';

const W = 320, H = 150, PAD = { l: 34, r: 8, t: 10, b: 22 };
// Vertical axis: how rare your standing is, from top 50% (bottom) to top 0.01% (top), on a log scale.
const y = (share: number) => {
  const rarity = Math.min(4, Math.max(0, -Math.log10(Math.max(share, 0.0001)))); // 0 = everyone, 4 = 1 in 10,000
  return PAD.t + (1 - rarity / 4) * (H - PAD.t - PAD.b);
};
const TICKS: [string, number][] = [['50%', 0.5], ['10%', 0.1], ['1%', 0.01], ['0.1%', 0.001]];

function Chart({ points, today }: { points: TimelinePoint[]; today: string }) {
  const t0 = Date.parse(points[0].date);
  const t1 = Math.max(Date.parse(today), t0 + 86_400_000);
  const x = (d: string) => PAD.l + ((Date.parse(d) - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
  // Step line: the standing holds until the next unlock, then jumps.
  const path = (pick: (p: TimelinePoint) => number) => {
    let d = `M${x(points[0].date).toFixed(1)},${y(pick(points[0])).toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L${x(points[i].date).toFixed(1)},${y(pick(points[i - 1])).toFixed(1)} L${x(points[i].date).toFixed(1)},${y(pick(points[i])).toFixed(1)}`;
    }
    return d;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Your standing over time" className="versus__chart">
      {TICKS.map(([label, v]) => (
        <g key={label}>
          <line className="versus__grid" x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} />
          <text className="versus__tick" x={PAD.l - 4} y={y(v) + 3} textAnchor="end">{label}</text>
        </g>
      ))}
      <path className="versus__line versus__line--cal" d={path((p) => p.calisthenics)} />
      <path className="versus__line versus__line--end" d={path((p) => p.endurance)} />
      <path className="versus__line versus__line--all" d={path((p) => p.combined)} />
      <text className="versus__tick" x={PAD.l} y={H - 6}>{points[0].date}</text>
      <text className="versus__tick" x={W - PAD.r} y={H - 6} textAnchor="end">today</text>
    </svg>
  );
}

/** You against you: standing then and now, a chart of it over time, and the log of unlocks. */
export function Versus({ state }: { state: CharacterState }) {
  const { today, group } = state;

  if (!state.trackingSince) {
    return (
      <section className="panel versus">
        <h2>Versus you</h2>
        <p className="muted">Nothing to compare yet. When you unlock your first skill, your history starts here, and you will see how far you have come.</p>
      </section>
    );
  }

  return (
    <section className="panel versus">
      <h2>Versus you</h2>
      <p className="muted small">Tracking since {state.trackingSince}. Your own past is the only comparison here.</p>
      <table className="versus__table">
        <thead>
          <tr><th scope="col">Then</th><th scope="col">Calisthenics</th><th scope="col">Endurance</th><th scope="col">Overall</th></tr>
        </thead>
        <tbody>
          {state.versus.map((v) => (
            <tr key={v.days}>
              <th scope="row">{v.label}</th>
              {v.then
                ? (['calisthenics', 'endurance', 'combined'] as const).map((k) => (
                    <td key={k}>{v.then![k] >= 1 ? 'No feat' : fmtPercentile(v.then![k])}</td>
                  ))
                : <td colSpan={3} className="muted">Before you started tracking</td>}
            </tr>
          ))}
          <tr className="versus__now">
            <th scope="row">Now</th>
            {(['calisthenics', 'endurance', 'combined'] as const).map((k) => (
              <td key={k}>{state.now[k] >= 1 ? 'No feat' : fmtPercentile(state.now[k])}</td>
            ))}
          </tr>
        </tbody>
      </table>
      {state.timeline.length > 1 && (
        <>
          <Chart points={state.timeline} today={today} />
          <p className="versus__legend small">
            <span className="versus__key versus__key--cal" /> Calisthenics
            <span className="versus__key versus__key--end" /> Endurance
            <span className="versus__key versus__key--all" /> Overall
            <span className="muted"> · higher is rarer, compared with {group}</span>
          </p>
        </>
      )}
      <h3>Unlock log</h3>
      <ul className="plain">
        {state.unlocks.slice(0, 12).map((u) => (
          <li key={u.rungId}>
            <span>{u.emoji} <strong>{u.text}</strong></span>
            <span className="muted small">{u.date} · {fmtStanding(u.share, group)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
