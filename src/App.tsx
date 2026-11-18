import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_CONFIG } from './engine/config';
import { computeState } from './engine/engine';
import type { EngineConfig } from './engine/types';
import { demoHistory } from './demo';
import {
  EMPTY_HISTORY, clearHistory, loadHistory, loadSettings, saveHistory, saveSettings,
  type History as Hist, type Settings as S,
} from './store';
import { connectorBridge, connectorErrorMessage, syncViaConnector } from './todoist/connector';
import { sync } from './todoist/sync';
import { Character } from './ui/Character';
import { History } from './ui/History';
import { Settings } from './ui/Settings';
import { Feats, Stats } from './ui/Stats';
import { Situation } from './ui/Situation';

const SYNC_EVERY_MS = 5 * 60_000;
type Tab = 'character' | 'history' | 'settings';

function buildConfig(s: S): EngineConfig {
  let override: Partial<EngineConfig> = {};
  try {
    override = s.configOverride.trim() ? JSON.parse(s.configOverride) : {};
  } catch {
    /* validated in Settings */
  }
  return { ...DEFAULT_CONFIG, ...override, imbalanceThreshold: s.imbalanceThreshold };
}

export default function App() {
  const [settings, setSettings] = useState<S>(loadSettings);
  const [history, setHistory] = useState<Hist>(EMPTY_HISTORY);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('character');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  // undefined = still checking; null = not inside claude.ai (use the API token instead).
  const [bridge, setBridge] = useState<Awaited<ReturnType<typeof connectorBridge>> | undefined>(undefined);
  useEffect(() => {
    connectorBridge().then(setBridge);
  }, []);
  const historyRef = useRef(history);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    loadHistory().then((h) => {
      setHistory(h);
      setLoaded(true);
    });
  }, []);

  const updateSettings = (s: S) => {
    setSettings(s);
    saveSettings(s);
  };

  const canSync = Boolean(bridge) || Boolean(settings.token);

  const runSync = useCallback(async (fresh = false) => {
    if (!bridge && !settings.token) return;
    setBusy(true);
    setError('');
    try {
      const base = fresh ? EMPTY_HISTORY : historyRef.current;
      const next = bridge
        ? await syncViaConnector(bridge, base, setStatus)
        : await sync(settings.token, settings.apiBase, base, setStatus);
      setHistory(next);
      await saveHistory(next);
    } catch (e) {
      setError(bridge ? connectorErrorMessage(e) : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [bridge, settings.token, settings.apiBase]);

  // Poll Todoist while the app is open.
  useEffect(() => {
    if (!loaded || bridge === undefined || !canSync) return;
    runSync();
    const id = setInterval(() => runSync(), SYNC_EVERY_MS);
    return () => clearInterval(id);
  }, [loaded, bridge, canSync, runSync]);

  const config = useMemo(() => buildConfig(settings), [settings]);
  const state = useMemo(
    () => computeState(history.events, history.meta, settings.profile, config, settings.claims),
    [history, settings.profile, config, settings.claims],
  );

  const toggleClaim = (id: string) => {
    const claims = { ...settings.claims };
    if (claims[id]) delete claims[id];
    else claims[id] = new Date().toISOString().slice(0, 10);
    updateSettings({ ...settings, claims });
  };

  const loadDemo = async () => {
    const h = demoHistory();
    setHistory(h);
    setStatus('Demo data loaded (not saved). Sync with a token to replace it.');
    setTab('character');
  };

  const reimport = async () => {
    await clearHistory();
    await runSync(true);
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>⚔️ Realm Companion</h1>
        <nav className="tabs">
          {(['character', 'history', 'settings'] as const).map((t) => (
            <button key={t} className={tab === t ? 'tab tab--on' : 'tab'} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      {(status || error) && (
        <div className={error ? 'notice notice--error' : 'notice'}>
          {error || status}
          {history.lastSync && !error && <span className="muted small"> · last sync {new Date(history.lastSync).toLocaleTimeString('en-GB')}</span>}
        </div>
      )}

      {loaded && bridge === null && !settings.token && !history.events.length && tab !== 'settings' && (
        <div className="panel welcome">
          <h2>Connect Todoist</h2>
          <p>Paste your personal API token in Settings to import your full history, or load demo data to look around.</p>
          <div className="row">
            <button className="btn" onClick={() => setTab('settings')}>Open Settings</button>
            <button className="btn btn--ghost" onClick={loadDemo}>Load demo data</button>
          </div>
        </div>
      )}

      {tab === 'character' && (
        <main className="grid">
          <Character state={state} />
          <Situation
            profile={settings.profile}
            situation={settings.situation}
            onChange={(profile, situation) => updateSettings({ ...settings, profile, situation })}
          />
          <Stats state={state} claims={settings.claims} onToggle={toggleClaim} />
          <Feats state={state} />
        </main>
      )}
      {tab === 'history' && <History state={state} />}
      {tab === 'settings' && (
        <Settings
          settings={settings} onChange={updateSettings} onSync={() => runSync()} onReimport={reimport}
          onDemo={loadDemo} busy={busy} connector={Boolean(bridge)}
        />
      )}
    </div>
  );
}
