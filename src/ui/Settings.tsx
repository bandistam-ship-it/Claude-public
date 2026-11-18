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
  /** Running inside claude.ai with the Todoist connector: no token needed. */
  connector: boolean;
}

export function Settings({ settings, onChange, onSync, onReimport, onDemo, busy, connector }: Props) {
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
      {connector ? (
        <p>Connected through your claude.ai Todoist connector. No token needed.</p>
      ) : (<>
      <label>
        Personal API token
        <input
          id="token" type="password" autoComplete="off" value={settings.token} placeholder="Todoist → Settings → Integrations → Developer"
          onChange={(e) => set({ token: e.target.value.trim() })}
        />
      </label>
      <p className="muted small">Stored only in this browser.</p>
      </>)}
      <p className="muted small">The app only reads your completed tasks. It never changes anything in Todoist.</p>
      <div className="row">
        <button className="btn" disabled={(!connector && !settings.token) || busy} onClick={onSync}>Sync now</button>
        <button className="btn btn--ghost" disabled={(!connector && !settings.token) || busy} onClick={onReimport}>Re-import full history</button>
        <button className="btn btn--ghost" disabled={busy} onClick={onDemo}>Load demo data</button>
      </div>
      {!connector && <details>
        <summary className="muted small">Advanced: API proxy</summary>
        <label>
          API base URL (leave empty for https://api.todoist.com/api/v1)
          <input id="api-base" value={settings.apiBase} onChange={(e) => set({ apiBase: e.target.value.trim() })} />
        </label>
      </details>}

      <h3>Advanced: engine config</h3>
      <p className="muted small">
        JSON merged over the defaults (top-level keys), e.g. <code>{'{"imbalanceRatio": 10}'}</code> needs a bigger gap
        between your two sections before the character looks lopsided. Everything is recalculated instantly.
      </p>
      <textarea id="config-override" rows={6} value={override} onChange={(e) => setOverride(e.target.value)} spellCheck={false} />
      {overrideError && <p className="error">{overrideError}</p>}
      <div className="row">
        <button className="btn" onClick={applyOverride}>Apply</button>
        <button className="btn btn--ghost" onClick={() => setOverride(JSON.stringify(DEFAULT_CONFIG, null, 2))}>Show defaults</button>
      </div>
    </section>
  );
}
