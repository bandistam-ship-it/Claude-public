import { useState } from 'react';
import { DEFAULT_CONFIG } from '../engine/config';
import type { Settings as S } from '../store';

interface Props {
  settings: S;
  onChange: (s: S) => void;
  onSync: () => void;
  onReimport: () => void;
  onDemo: () => void;
  busy: boolean;
}

export function Settings({ settings, onChange, onSync, onReimport, onDemo, busy }: Props) {
  const [override, setOverride] = useState(settings.configOverride);
  const [overrideError, setOverrideError] = useState('');
  const set = (patch: Partial<S>) => onChange({ ...settings, ...patch });

  const applyOverride = () => {
    if (override.trim()) {
      try {
        JSON.parse(override);
      } catch (e) {
        setOverrideError(`Invalid JSON: ${(e as Error).message}`);
        return;
      }
    }
    setOverrideError('');
    set({ configOverride: override });
  };

  return (
    <section className="panel settings">
      <h2>Settings</h2>

      <h3>Todoist connection</h3>
      <label>
        Personal API token
        <input
          type="password" autoComplete="off" value={settings.token} placeholder="Todoist → Settings → Integrations → Developer"
          onChange={(e) => set({ token: e.target.value.trim() })}
        />
      </label>
      <p className="muted small">Stored only in this browser. The app reads your completed tasks; it never changes anything in Todoist.</p>
      <div className="row">
        <button className="btn" disabled={!settings.token || busy} onClick={onSync}>Sync now</button>
        <button className="btn btn--ghost" disabled={!settings.token || busy} onClick={onReimport}>Re-import full history</button>
        <button className="btn btn--ghost" disabled={busy} onClick={onDemo}>Load demo data</button>
      </div>
      <details>
        <summary className="muted small">Advanced: API proxy</summary>
        <label>
          API base URL (leave empty for https://api.todoist.com/api/v1)
          <input value={settings.apiBase} onChange={(e) => set({ apiBase: e.target.value.trim() })} />
        </label>
      </details>

      <h3>Career (Todoist can't know these)</h3>
      <label>
        Net monthly wage (RON)
        <input
          type="number" min={0} step={100} value={settings.profile.netWageRon}
          onChange={(e) => set({ profile: { ...settings.profile, netWageRon: Number(e.target.value) || 0 } })}
        />
      </label>
      <label>
        Position
        <select
          value={settings.profile.positionRank}
          onChange={(e) => set({ profile: { ...settings.profile, positionRank: Number(e.target.value) } })}
        >
          {DEFAULT_CONFIG.career.positions.map((p, i) => <option key={p} value={i}>{p}</option>)}
        </select>
      </label>
      <p className="muted small">Each Career tier needs both the wage and the position.</p>

      <h3>Balance</h3>
      <label>
        Imbalance threshold (tier gap that makes you lopsided)
        <input
          type="number" min={1} max={6} value={settings.imbalanceThreshold}
          onChange={(e) => set({ imbalanceThreshold: Math.max(1, Number(e.target.value) || 2) })}
        />
      </label>
      <p className="muted small">Decay for neglected stats comes in a later version.</p>

      <h3>Advanced: engine config</h3>
      <p className="muted small">
        JSON merged over the defaults (top-level keys), e.g. <code>{'{"difficultyXp": {"easy": 8, "medium": 25, "hard": 60, "boss-fight": 120}}'}</code>.
        The whole history is re-scored instantly.
      </p>
      <textarea rows={6} value={override} onChange={(e) => setOverride(e.target.value)} spellCheck={false} />
      {overrideError && <p className="error">{overrideError}</p>}
      <div className="row">
        <button className="btn" onClick={applyOverride}>Apply</button>
        <button className="btn btn--ghost" onClick={() => setOverride(JSON.stringify(DEFAULT_CONFIG, null, 2))}>Show defaults</button>
      </div>
    </section>
  );
}
