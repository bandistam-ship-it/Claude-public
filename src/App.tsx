import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_CONFIG } from './engine/config';
import { computeState } from './engine/engine';
import type { EngineConfig } from './engine/types';
import { demoHistory } from './demo';
import {
  EMPTY_HISTORY, clearHistory, loadHistory, loadSettings, saveHistory, saveSettings,
  type History as Hist, type Settings as S,
} from './store';
import { enduranceRungsFromStats } from './engine/stats';
import type { PersonalStats } from './engine/types';
import { buildBlob, claimsOf, mergeBlobs, sameBlob, setClaim, type StateBlob } from './state/blob';
import { pickTransport, syncState } from './state/sync';
import { connectorBridge, connectorErrorMessage, syncViaConnector } from './todoist/connector';
import { sync } from './todoist/sync';
import { AboutYou } from './ui/AboutYou';
import { Character } from './ui/Character';
import { History } from './ui/History';
import { Settings } from './ui/Settings';
import { Feats, Sections } from './ui/Sections';
import { Situation } from './ui/Situation';
import { StatsCard } from './ui/StatsCard';
import { Unlocks } from './ui/Unlocks';
import { Versus } from './ui/Versus';

const SYNC_EVERY_MS = 5 * 60_000;
type Tab = 'character' | 'history' | 'settings';

function buildConfig(s: S): EngineConfig {
  let override: Partial<EngineConfig> = {};
  try {
    override = s.configOverride.trim() ? JSON.parse(s.configOverride) : {};
  } catch {
    /* validated in Settings */
  }
  return { ...DEFAULT_CONFIG, ...override };
}

const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [settings, setSettings] = useState<S>(loadSettings);
  const [history, setHistory] = useState<Hist>(EMPTY_HISTORY);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('character');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [stateStatus, setStateStatus] = useState({ error: '', syncing: false });
  // undefined = still checking; null = not inside claude.ai (use the API token instead).
  const [bridge, setBridge] = useState<Awaited<ReturnType<typeof connectorBridge>> | undefined>(undefined);
  useEffect(() => {
    connectorBridge().then(setBridge);
  }, []);
  const historyRef = useRef(history);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    loadHistory().then((h) => {
      setHistory(h);
      setLoaded(true);
    });
  }, []);

  const updateSettings = useCallback((s: S) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  const blob: StateBlob = useMemo(
    () => buildBlob(settings.claimLog, settings.profile, settings.situation, settings.stats),
    [settings.claimLog, settings.profile, settings.situation, settings.stats],
  );

  // ---- Todoist history ----
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

  useEffect(() => {
    if (!loaded || bridge === undefined || !canSync) return;
    runSync();
    const id = setInterval(() => runSync(), SYNC_EVERY_MS);
    return () => clearInterval(id);
  }, [loaded, bridge, canSync, runSync]);

  // ---- Ticks, age and notes: merged between devices through Todoist, when you opt in ----
  const syncedRef = useRef<StateBlob | null>(null);
  const runStateSync = useCallback(async () => {
    const cur = settingsRef.current;
    setStateStatus({ error: '', syncing: true });
    try {
      const transport = await pickTransport(cur.token, cur.apiBase);
      if (!transport) throw new Error('Connect Todoist to sync.');
      const local = buildBlob(cur.claimLog, cur.profile, cur.situation, cur.stats);
      const res = await syncState(local, transport);
      syncedRef.current = res.blob;
      const latest = settingsRef.current;
      const mine = buildBlob(latest.claimLog, latest.profile, latest.situation, latest.stats);
      // Take the merged copy unless you changed something while the sync was running.
      const next = sameBlob(mine, local) ? res.blob : mergeBlobs(mine, res.blob);
      updateSettings({ ...latest, claimLog: next.claimLog, profile: next.profile, situation: next.situation, stats: next.stats, lastSyncedAt: new Date().toISOString() });
      setStateStatus({ error: '', syncing: false });
    } catch (e) {
      const msg = bridge ? connectorErrorMessage(e) : (e as Error).message;
      setStateStatus({ error: `Sync failed: ${msg}`, syncing: false });
    }
  }, [bridge, updateSettings]);

  // Sync shortly after any change, when the copy on Todoist is behind this one.
  useEffect(() => {
    if (!loaded || bridge === undefined || !settings.syncEnabled) return;
    if (syncedRef.current && sameBlob(blob, syncedRef.current)) return;
    const id = setTimeout(() => runStateSync(), 1500);
    return () => clearTimeout(id);
  }, [loaded, bridge, settings.syncEnabled, blob, runStateSync]);

  // And pull in changes from your other devices now and then.
  useEffect(() => {
    if (!loaded || bridge === undefined || !settings.syncEnabled) return;
    const id = setInterval(() => runStateSync(), SYNC_EVERY_MS);
    return () => clearInterval(id);
  }, [loaded, bridge, settings.syncEnabled, runStateSync]);

  // ---- Who you are compared with, and the character ----
  const config = useMemo(() => buildConfig(settings), [settings]);
  const claims = useMemo(() => claimsOf(settings.claimLog), [settings.claimLog]);
  // The clock is read once per recalculation, outside of rendering.
  const [clock] = useState(() => Date.now());
  const state = useMemo(
    () => computeState(history.events, history.meta, config, claims, clock, { age: settings.profile.age, group: settings.profile.group }, settings.stats),
    [history, config, claims, clock, settings.profile.age, settings.profile.group, settings.stats],
  );

  const tick = (id: string, date: string | null) =>
    updateSettings({ ...settings, claimLog: setClaim(settings.claimLog, id, date, new Date().toISOString()) });
  const confirmClaim = (id: string) => tick(id, today());
  const toggleClaim = (id: string) => tick(id, claims[id] ? null : today());

  const restore = (b: StateBlob) => {
    const merged = mergeBlobs(blob, b);
    updateSettings({ ...settings, claimLog: merged.claimLog, profile: merged.profile, situation: merged.situation, stats: merged.stats });
  };

  /** Save your numbers, and tick (dated today) any running feat they now prove. Existing ticks are left alone. */
  const saveStats = (stats: PersonalStats) => {
    const at = new Date().toISOString();
    let log = settings.claimLog;
    for (const id of enduranceRungsFromStats(stats)) if (!claims[id]) log = setClaim(log, id, today(), at);
    updateSettings({ ...settings, stats, claimLog: log });
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
          <AboutYou
            profile={settings.profile} group={state.group}
            onChange={(profile) => updateSettings({ ...settings, profile })}
          />
          <StatsCard stats={settings.stats} tierTitle={state.tierTitle} buildBasis={state.buildBasis} onChange={saveStats} />
          <Unlocks state={state} />
          <Sections state={state} onToggle={toggleClaim} onConfirm={confirmClaim} />
          <Versus state={state} />
          <Situation situation={settings.situation} onChange={(situation) => updateSettings({ ...settings, situation })} />
          <Feats state={state} />
        </main>
      )}
      {tab === 'history' && <History state={state} />}
      {tab === 'settings' && (
        <Settings
          settings={settings} onChange={updateSettings} onSync={() => runSync()} onReimport={reimport}
          onDemo={loadDemo} busy={busy} connector={Boolean(bridge)}
          blob={blob} onRestore={restore} onSyncState={runStateSync} stateStatus={stateStatus}
        />
      )}
    </div>
  );
}
