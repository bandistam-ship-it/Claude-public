import { useState } from 'react';
import { DEFAULT_CONFIG } from '../engine/config';
import { decodeBackup, encodeBackup, type StateBlob } from '../state/blob';
import type { Settings as S } from '../store';

declare const __BUILD__: string;

interface Props {
  settings: S;
  onChange: (s: S) => void;
  onSync: () => void;
  onReimport: () => void;
  onDemo: () => void;
  busy: boolean;
  /** Running inside claude.ai with the Todoist connector: no token needed. */
  connector: boolean;
  /** Everything that can be backed up or synced. */
  blob: StateBlob;
  onRestore: (blob: StateBlob) => void;
  onSyncState: () => void;
  stateStatus: { error: string; syncing: boolean };
}

export function Settings({ settings, onChange, onSync, onReimport, onDemo, busy, connector, blob, onRestore, onSyncState, stateStatus }: Props) {
  const [override, setOverride] = useState(settings.configOverride);
  const [overrideError, setOverrideError] = useState('');
  const [restoreText, setRestoreText] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const canReachTodoist = connector || Boolean(settings.token);
  const backup = encodeBackup(blob);

  const copyBackup = async () => {
    try {
      await navigator.clipboard.writeText(backup);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      document.getElementById('backup-text')?.focus();
      (document.getElementById('backup-text') as HTMLTextAreaElement | null)?.select();
    }
  };
  const restore = () => {
    try {
      onRestore(decodeBackup(restoreText));
      setRestoreText('');
      setRestoreMsg('Restored. Anything newer on this device was kept.');
    } catch (e) {
      setRestoreMsg((e as Error).message);
    }
  };
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
      <p className="muted small">
        The app reads your completed tasks. It writes to Todoist only if you turn on sync below, and then only one comment on your Inbox.
      </p>
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

      <h3>Backup and sync</h3>
      <p className="muted small">
        Your ticked skills, your age and your notes live only on this device. Turn on sync to keep them the same on every
        device (the claude.ai page and the Android app), or copy a backup by hand.
      </p>
      <label className="check" htmlFor="sync-enabled">
        <input id="sync-enabled" type="checkbox" checked={settings.syncEnabled} disabled={!canReachTodoist}
          onChange={(e) => set({ syncEnabled: e.target.checked })} />
        <span>Sync through Todoist. This keeps one comment on your Inbox, starting “⚙️ realm-companion-state”. Nothing else is written.</span>
      </label>
      {!canReachTodoist && <p className="muted small">Connect Todoist above to turn this on.</p>}
      {settings.syncEnabled && (
        <div className="row">
          <button className="btn btn--ghost" disabled={stateStatus.syncing} onClick={onSyncState}>{stateStatus.syncing ? 'Syncing…' : 'Sync now'}</button>
          <span className="muted small">{settings.lastSyncedAt ? `Last synced ${new Date(settings.lastSyncedAt).toLocaleString('en-GB')}` : 'Not synced yet'}</span>
        </div>
      )}
      {stateStatus.error && <p className="error">{stateStatus.error}</p>}
      <label htmlFor="backup-text">Backup text (copy it somewhere safe)
        <textarea id="backup-text" rows={4} readOnly value={backup} spellCheck={false} />
      </label>
      <div className="row"><button className="btn btn--ghost" onClick={copyBackup}>{copied ? 'Copied' : 'Copy backup'}</button></div>
      <label htmlFor="restore-text">Restore from a backup
        <textarea id="restore-text" rows={3} value={restoreText} onChange={(e) => setRestoreText(e.target.value)} placeholder="Paste a backup here" spellCheck={false} />
      </label>
      <div className="row">
        <button className="btn btn--ghost" disabled={!restoreText.trim()} onClick={restore}>Restore</button>
        {restoreMsg && <span className="muted small" role="status">{restoreMsg}</span>}
      </div>

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
      <p className="muted small">Build {typeof __BUILD__ === 'string' ? __BUILD__ : 'dev'}</p>
    </section>
  );
}
