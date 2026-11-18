import { describe, expect, it } from 'vitest';
import { buildBlob, claimsOf, decodeBackup, encodeBackup, EMPTY_PROFILE, EMPTY_SITUATION, mergeBlobs, sameBlob, setClaim, type ClaimLog, type StateBlob } from './blob';
import { EMPTY_STATS } from '../engine/stats';
import { fromComment, MARKER, syncState, toComment, type Remote, type StateTransport } from './sync';

const T1 = '2026-11-01T10:00:00.000Z';
const T2 = '2026-11-02T10:00:00.000Z';
const T3 = '2026-11-03T10:00:00.000Z';
const blob = (log: ClaimLog, profileAt: string | null = null, age: number | null = null): StateBlob =>
  buildBlob(log, { ...EMPTY_PROFILE, age, group: age ? 'men' : 'everyone', updatedAt: profileAt }, EMPTY_SITUATION);

describe('ticks', () => {
  it('claims drop un-ticked entries', () => {
    let log: ClaimLog = setClaim({}, 'calisthenics.muscle-up', '2026-11-01', T1);
    log = setClaim(log, 'endurance.run-5k', '2026-11-01', T1);
    log = setClaim(log, 'endurance.run-5k', null, T2);
    expect(claimsOf(log)).toEqual({ 'calisthenics.muscle-up': '2026-11-01' });
  });
});

describe('merging two devices', () => {
  it('keeps ticks made on either device', () => {
    const phone = blob(setClaim({}, 'calisthenics.muscle-up', '2026-11-01', T1));
    const laptop = blob(setClaim({}, 'endurance.run-5k', '2026-11-02', T2));
    const merged = mergeBlobs(phone, laptop);
    expect(Object.keys(claimsOf(merged.claimLog)).sort()).toEqual(['calisthenics.muscle-up', 'endurance.run-5k']);
  });

  it('the later change to a tick wins, including an un-tick', () => {
    const a = blob(setClaim({}, 'calisthenics.muscle-up', '2026-11-01', T1));
    const b = blob(setClaim(a.claimLog, 'calisthenics.muscle-up', null, T3)); // unticked later
    expect(claimsOf(mergeBlobs(a, b).claimLog)).toEqual({});
    expect(claimsOf(mergeBlobs(b, a).claimLog)).toEqual({}); // order does not matter
    const c = blob(setClaim(b.claimLog, 'calisthenics.muscle-up', '2026-11-04', '2026-11-04T10:00:00.000Z')); // reticked even later
    expect(claimsOf(mergeBlobs(b, c).claimLog)).toEqual({ 'calisthenics.muscle-up': '2026-11-04' });
  });

  it('takes profile and notes from the newer copy', () => {
    const old = blob({}, T1, 22);
    const fresh = blob({}, T2, 23);
    expect(mergeBlobs(old, fresh).profile.age).toBe(23);
    expect(mergeBlobs(fresh, old).profile.age).toBe(23);
  });

  it('is idempotent', () => {
    const a = blob(setClaim({}, 'calisthenics.muscle-up', '2026-11-01', T1), T1, 22);
    expect(sameBlob(mergeBlobs(a, a), a)).toBe(true);
  });
});

describe('backup text', () => {
  it('round-trips', () => {
    const a = blob(setClaim({}, 'calisthenics.muscle-up', '2026-11-01', T1), T1, 22);
    const back = decodeBackup(encodeBackup(a));
    expect(sameBlob(back, a)).toBe(true);
  });
  it('rejects anything that is not a backup, with a readable message', () => {
    expect(() => decodeBackup('hello')).toThrow(/not a backup/);
    expect(() => decodeBackup('{"app":"other"}')).toThrow(/not a Realm Companion backup/);
  });
  it('drops malformed entries and clamps nonsense', () => {
    const b = decodeBackup(JSON.stringify({
      app: 'realm-companion', claimLog: { ok: { date: '2026-01-01', at: T1 }, bad: { date: 5 } }, profile: { age: 900, group: 'robots' }, situation: { focus: 'x'.repeat(5000) },
    }));
    expect(Object.keys(b.claimLog)).toEqual(['ok']);
    expect(b.profile.age).toBeNull();
    expect(b.profile.group).toBe('everyone');
    expect(b.situation.focus).toHaveLength(2000);
  });
  it('never contains the Todoist token', () => {
    expect(encodeBackup(blob({}))).not.toMatch(/token/i);
  });
});

describe('stats in backup and sync', () => {
  const withStats = (patch: Partial<typeof EMPTY_STATS>) => buildBlob({}, EMPTY_PROFILE, EMPTY_SITUATION, { ...EMPTY_STATS, ...patch });
  it('round-trips through a backup', () => {
    const a = withStats({ pullUps: 10, dips: 15, best5kSec: 1650, updatedAt: T2 });
    const back = decodeBackup(encodeBackup(a));
    expect(back.stats.pullUps).toBe(10);
    expect(back.stats.best5kSec).toBe(1650);
    expect(sameBlob(a, back)).toBe(true);
  });
  it('the newer copy of your stats wins when merging', () => {
    const old = withStats({ pullUps: 8, updatedAt: T1 });
    const fresh = withStats({ pullUps: 10, updatedAt: T2 });
    expect(mergeBlobs(old, fresh).stats.pullUps).toBe(10);
    expect(mergeBlobs(fresh, old).stats.pullUps).toBe(10);
  });
  it('an old backup without stats still restores, and nonsense values are dropped', () => {
    const b = decodeBackup(JSON.stringify({ app: 'realm-companion', claimLog: {}, stats: { pullUps: 9999, best5kSec: 5, heightCm: 180 } }));
    expect(b.stats.pullUps).toBeNull();
    expect(b.stats.best5kSec).toBeNull();
    expect(b.stats.heightCm).toBe(180);
    expect(decodeBackup('{"app":"realm-companion"}').stats).toEqual(EMPTY_STATS);
  });
});

describe('Todoist comment format', () => {
  it('round-trips through a comment and ignores other comments', () => {
    const a = blob(setClaim({}, 'calisthenics.muscle-up', '2026-11-01', T1), T1, 22);
    const text = toComment(a);
    expect(text.startsWith(MARKER)).toBe(true);
    expect(sameBlob(fromComment(text)!, a)).toBe(true);
    expect(fromComment('Buy milk')).toBeNull();
    expect(fromComment(`${MARKER}\n{not json`)).toBeNull();
  });
  it('refuses notes too long to fit in a comment', () => {
    const big: StateBlob = { ...blob({}), situation: { focus: '', goals: 'x'.repeat(2000), notes: 'y'.repeat(2000), updatedAt: T1 } };
    const log: ClaimLog = {};
    for (let i = 0; i < 400; i++) log[`calisthenics.skill-${i}`] = { date: '2026-11-01', at: T1 };
    expect(() => toComment({ ...big, claimLog: log })).toThrow(/too long/);
  });
});

describe('sync flow', () => {
  function fake(initial: StateBlob | null) {
    let stored = initial ? toComment(initial) : null;
    const writes: string[] = [];
    const t: StateTransport = {
      name: 'fake',
      async read(): Promise<Remote> { return { id: stored ? 'c1' : null, blob: stored ? fromComment(stored) : null }; },
      async write(_id, b) { stored = toComment(b); writes.push(stored); },
    };
    return { t, writes, get remote() { return stored ? fromComment(stored)! : null; } };
  }

  it('creates the comment the first time', async () => {
    const f = fake(null);
    const local = blob(setClaim({}, 'calisthenics.muscle-up', '2026-11-01', T1));
    const res = await syncState(local, f.t);
    expect(res.wrote).toBe(true);
    expect(claimsOf(f.remote!.claimLog)).toEqual({ 'calisthenics.muscle-up': '2026-11-01' });
  });

  it('pulls what another device added, and pushes what is new here', async () => {
    const f = fake(blob(setClaim({}, 'endurance.run-5k', '2026-11-02', T2)));
    const local = blob(setClaim({}, 'calisthenics.muscle-up', '2026-11-01', T1));
    const res = await syncState(local, f.t);
    expect(res.changedLocal).toBe(true);
    expect(res.wrote).toBe(true);
    expect(Object.keys(claimsOf(res.blob.claimLog)).sort()).toEqual(['calisthenics.muscle-up', 'endurance.run-5k']);
    expect(Object.keys(claimsOf(f.remote!.claimLog))).toHaveLength(2);
  });

  it('writes nothing when both copies already agree', async () => {
    const a = blob(setClaim({}, 'calisthenics.muscle-up', '2026-11-01', T1));
    const f = fake(a);
    const res = await syncState(a, f.t);
    expect(res.wrote).toBe(false);
    expect(f.writes).toHaveLength(0);
  });
});
