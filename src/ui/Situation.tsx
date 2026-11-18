import { useState } from 'react';
import { DEFAULT_CONFIG } from '../engine/config';
import type { Profile } from '../engine/types';
import type { Situation as Sit } from '../store';

interface Props {
  profile: Profile;
  situation: Sit;
  onChange: (profile: Profile, situation: Sit) => void;
}

/** "Where I am now": what Todoist can't know. Career tiers read the position and wage from here. */
export function Situation({ profile, situation, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const empty = !situation.focus && !situation.goals && !situation.notes && !profile.netWageRon && profile.positionRank === 0;
  const position = DEFAULT_CONFIG.career.positions[profile.positionRank] ?? '?';
  const setSit = (patch: Partial<Sit>) => onChange(profile, { ...situation, ...patch, updatedAt: new Date().toISOString() });
  const setProfile = (patch: Partial<Profile>) => onChange({ ...profile, ...patch }, { ...situation, updatedAt: new Date().toISOString() });

  return (
    <section className="panel situation">
      <div className="situation__head">
        <h2>My situation</h2>
        <button className="btn btn--ghost" onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button>
      </div>

      {editing ? (
        <div className="situation__form">
          <label htmlFor="sit-position">Position
            <select id="sit-position" value={profile.positionRank} onChange={(e) => setProfile({ positionRank: Number(e.target.value) })}>
              {DEFAULT_CONFIG.career.positions.map((p, i) => <option key={p} value={i}>{p}</option>)}
            </select>
          </label>
          <label htmlFor="sit-wage">Net monthly wage (RON)
            <input id="sit-wage" type="number" min={0} step={100} value={profile.netWageRon}
              onChange={(e) => setProfile({ netWageRon: Number(e.target.value) || 0 })} />
          </label>
          <label htmlFor="sit-focus">Current focus
            <input id="sit-focus" value={situation.focus} maxLength={160} placeholder="What you are working on right now"
              onChange={(e) => setSit({ focus: e.target.value })} />
          </label>
          <label htmlFor="sit-goals">Goals this season
            <textarea id="sit-goals" rows={3} value={situation.goals} placeholder="One per line"
              onChange={(e) => setSit({ goals: e.target.value })} />
          </label>
          <label htmlFor="sit-notes">Notes
            <textarea id="sit-notes" rows={3} value={situation.notes} placeholder="Anything the numbers can't show"
              onChange={(e) => setSit({ notes: e.target.value })} />
          </label>
          <p className="muted small">Saved on this device only. Your Career income and role milestones read the position and wage.</p>
        </div>
      ) : empty ? (
        <p className="muted">Nothing here yet. Add your position, wage, current focus and goals with Edit. Your income and role milestones read these.</p>
      ) : (
        <dl className="situation__list">
          <dt>Position</dt><dd>{position}</dd>
          <dt>Net wage</dt><dd>{profile.netWageRon ? `${profile.netWageRon.toLocaleString('en')} RON / month` : 'none'}</dd>
          {situation.focus && (<><dt>Focus</dt><dd>{situation.focus}</dd></>)}
          {situation.goals && (<><dt>Goals</dt><dd className="situation__text">{situation.goals}</dd></>)}
          {situation.notes && (<><dt>Notes</dt><dd className="situation__text">{situation.notes}</dd></>)}
        </dl>
      )}
    </section>
  );
}
