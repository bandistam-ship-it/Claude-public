import { useState } from 'react';
import { buildTierFromStats, formatDuration, parseDuration, waistToHeight } from '../engine/stats';
import type { PersonalStats } from '../engine/types';

interface Props {
  stats: PersonalStats;
  tierTitle: string;
  buildBasis: 'numbers' | 'standing';
  onChange: (stats: PersonalStats) => void;
}

type NumKey = 'heightCm' | 'weightKg' | 'waistCm' | 'pullUps' | 'dips' | 'pushUps' | 'longestRunKm' | 'restingHr' | 'vo2max';
type TimeKey = 'best5kSec' | 'best10kSec';

const NUMBERS: { group: string; fields: { key: NumKey; label: string; unit: string; step?: number }[] }[] = [
  { group: 'Body', fields: [
    { key: 'heightCm', label: 'Height', unit: 'cm' },
    { key: 'weightKg', label: 'Weight', unit: 'kg', step: 0.5 },
    { key: 'waistCm', label: 'Waist', unit: 'cm', step: 0.5 },
  ] },
  { group: 'Max strict reps in one set', fields: [
    { key: 'pullUps', label: 'Pull-ups', unit: '' },
    { key: 'dips', label: 'Dips', unit: '' },
    { key: 'pushUps', label: 'Push-ups', unit: '' },
  ] },
  { group: 'Running', fields: [
    { key: 'longestRunKm', label: 'Longest run', unit: 'km', step: 0.5 },
    { key: 'restingHr', label: 'Resting heart rate', unit: 'bpm' },
    { key: 'vo2max', label: 'VO₂max', unit: 'ml/kg/min', step: 0.5 },
  ] },
];

/** Your own numbers. They set how strong the character looks and tick the running feats they prove. */
// Plausible ranges, so a typo cannot tick a feat nobody could have done.
const LIMITS: Record<NumKey, [number, number]> = {
  heightCm: [100, 250], weightKg: [30, 300], waistCm: [40, 250], pullUps: [0, 100], dips: [0, 200], pushUps: [0, 500],
  longestRunKm: [0, 500], restingHr: [25, 140], vo2max: [10, 95],
};
const TIME_LIMITS: Record<TimeKey, [number, number]> = { best5kSec: [12 * 60, 2 * 3600], best10kSec: [26 * 60, 4 * 3600] };
const LABEL: Record<NumKey | TimeKey, string> = {
  heightCm: 'Height', weightKg: 'Weight', waistCm: 'Waist', pullUps: 'Pull-ups', dips: 'Dips', pushUps: 'Push-ups',
  longestRunKm: 'Longest run', restingHr: 'Resting heart rate', vo2max: 'VO₂max', best5kSec: 'Best 5 km', best10kSec: 'Best 10 km',
};

/** Your own numbers. They set how strong the character looks and tick the running feats they prove. */
export function StatsCard({ stats, tierTitle, buildBasis, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const startEdit = () => {
    const d: Record<string, string> = {};
    for (const g of NUMBERS) for (const f of g.fields) d[f.key] = stats[f.key] === null ? '' : String(stats[f.key]);
    d.best5kSec = formatDuration(stats.best5kSec);
    d.best10kSec = formatDuration(stats.best10kSec);
    setDraft(d);
    setErrors([]);
    setEditing(true);
  };

  // Nothing is saved, and no feat is ticked, until you press Save.
  const save = () => {
    const next: PersonalStats = { ...stats };
    const problems: string[] = [];
    for (const g of NUMBERS) {
      for (const f of g.fields) {
        const raw = (draft[f.key] ?? '').trim();
        if (raw === '') { next[f.key] = null; continue; }
        const n = Number(raw);
        const [lo, hi] = LIMITS[f.key];
        if (!Number.isFinite(n) || n < lo || n > hi) problems.push(`${LABEL[f.key]} should be between ${lo} and ${hi}.`);
        else next[f.key] = n;
      }
    }
    for (const k of ['best5kSec', 'best10kSec'] as TimeKey[]) {
      const raw = (draft[k] ?? '').trim();
      if (raw === '') { next[k] = null; continue; }
      const sec = parseDuration(raw);
      const [lo, hi] = TIME_LIMITS[k];
      if (sec === null) problems.push(`${LABEL[k]}: write the time like 27:30 or 1:05:10.`);
      else if (sec < lo || sec > hi) problems.push(`${LABEL[k]} should be between ${formatDuration(lo)} and ${formatDuration(hi)}.`);
      else next[k] = sec;
    }
    setErrors(problems);
    if (problems.length) return;
    onChange({ ...next, updatedAt: new Date().toISOString() });
    setEditing(false);
  };

  const ratio = waistToHeight(stats);
  const reps = buildTierFromStats(stats);
  const any = Object.entries(stats).some(([k, v]) => k !== 'updatedAt' && v !== null);

  return (
    <section className="panel mystats">
      <div className="situation__head">
        <h2>My stats</h2>
        {!editing && <button className="btn btn--ghost" onClick={startEdit}>Edit</button>}
      </div>

      {editing ? (
        <div className="mystats__form">
          {NUMBERS.map((g) => (
            <fieldset key={g.group}>
              <legend>{g.group}</legend>
              <div className="mystats__fields">
                {g.fields.map((f) => (
                  <label key={f.key} htmlFor={`stat-${f.key}`}>{f.label}{f.unit && <span className="muted small"> ({f.unit})</span>}
                    <input id={`stat-${f.key}`} type="number" inputMode="decimal" min={0} step={f.step ?? 1}
                      value={draft[f.key] ?? ''} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
                  </label>
                ))}
                {g.group === 'Running' && (['best5kSec', 'best10kSec'] as TimeKey[]).map((k) => (
                  <label key={k} htmlFor={`stat-${k}`}>{k === 'best5kSec' ? 'Best 5 km' : 'Best 10 km'}<span className="muted small"> (mm:ss)</span>
                    <input id={`stat-${k}`} type="text" inputMode="numeric" placeholder="27:30" value={draft[k] ?? ''} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {errors.length > 0 && <ul className="error small" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
          <div className="row">
            <button className="btn" onClick={save}>Save</button>
            <button className="btn btn--ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
          <p className="muted small">
            Press Save to apply. Your max reps set how strong the character looks, and your running bests tick the matching endurance feats, dated today.
            Reps are not ranked against other people; your skill standing is about skills.
          </p>
        </div>
      ) : !any ? (
        <p className="muted">Nothing here yet. Add your height, weight, max strict reps and running bests with Edit. Your max reps set how strong the character looks.</p>
      ) : (
        <>
          <dl className="situation__list mystats__list">
            {stats.heightCm !== null && (<><dt>Height</dt><dd>{stats.heightCm} cm</dd></>)}
            {stats.weightKg !== null && (<><dt>Weight</dt><dd>{stats.weightKg} kg</dd></>)}
            {stats.waistCm !== null && (<><dt>Waist</dt><dd>{stats.waistCm} cm{ratio !== null && <span className="muted"> · {ratio.toFixed(2)} of your height{ratio < 0.5 ? ', under 0.5' : ''}</span>}</dd></>)}
            {(stats.pullUps !== null || stats.dips !== null || stats.pushUps !== null) && (
              <><dt>Max reps</dt><dd>{[stats.pullUps !== null && `${stats.pullUps} pull-ups`, stats.dips !== null && `${stats.dips} dips`, stats.pushUps !== null && `${stats.pushUps} push-ups`].filter(Boolean).join(' · ')}</dd></>
            )}
            {stats.best5kSec !== null && (<><dt>Best 5 km</dt><dd>{formatDuration(stats.best5kSec)}</dd></>)}
            {stats.best10kSec !== null && (<><dt>Best 10 km</dt><dd>{formatDuration(stats.best10kSec)}</dd></>)}
            {stats.longestRunKm !== null && (<><dt>Longest run</dt><dd>{stats.longestRunKm} km</dd></>)}
            {stats.restingHr !== null && (<><dt>Resting HR</dt><dd>{stats.restingHr} bpm</dd></>)}
            {stats.vo2max !== null && (<><dt>VO₂max</dt><dd>{stats.vo2max} ml/kg/min</dd></>)}
          </dl>
          {buildBasis === 'numbers' && reps !== null && (
            <p className="muted small">Your build, <strong>{tierTitle}</strong>, comes from your max reps.</p>
          )}
        </>
      )}
    </section>
  );
}
