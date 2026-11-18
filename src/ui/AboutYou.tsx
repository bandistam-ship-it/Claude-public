import { useState } from 'react';
import type { Group } from '../engine/demographics';
import type { Profile } from '../state/blob';

interface Props {
  profile: Profile;
  group: string;
  onChange: (profile: Profile) => void;
}

/** Who your standing is compared with. Asked once; stays on this device (and syncs if you turn sync on). */
export function AboutYou({ profile, group, onChange }: Props) {
  const unset = profile.age === null || profile.group === 'everyone';
  const [editing, setEditing] = useState(false);
  const set = (patch: Partial<Profile>) => onChange({ ...profile, ...patch, updatedAt: new Date().toISOString() });
  const open = editing || unset;

  return (
    <section className={unset ? 'panel about about--prompt' : 'panel about'}>
      <div className="situation__head">
        <h2>About you</h2>
        {!unset && <button className="btn btn--ghost" onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button>}
      </div>
      {!open ? (
        <p>Your standing compares you with <strong>{group}</strong>.</p>
      ) : (
        <>
          {unset && <p className="muted">Tell me your age and who to compare you with, and every percentile becomes fair for you. Without it, you are compared with all adults.</p>}
          <div className="about__fields">
            <label htmlFor="about-age">Age
              <input id="about-age" type="number" inputMode="numeric" min={10} max={110} value={profile.age ?? ''}
                onChange={(e) => set({ age: e.target.value === '' ? null : Math.round(Number(e.target.value)) })} />
            </label>
            <label htmlFor="about-group">Compare me with
              <select id="about-group" value={profile.group} onChange={(e) => set({ group: e.target.value as Group })}>
                <option value="everyone">All adults</option>
                <option value="men">Men my age</option>
                <option value="women">Women my age</option>
              </select>
            </label>
          </div>
          <p className="muted small">Saved on this device only. The age and sex adjustments are rough estimates.</p>
        </>
      )}
    </section>
  );
}
