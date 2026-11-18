import { useState } from 'react';
import type { Situation as Sit } from '../store';

interface Props {
  situation: Sit;
  onChange: (situation: Sit) => void;
}

/** "Where I am now": free text only you can write. Stays on this device. */
export function Situation({ situation, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const empty = !situation.focus && !situation.goals && !situation.notes;
  const set = (patch: Partial<Sit>) => onChange({ ...situation, ...patch, updatedAt: new Date().toISOString() });

  return (
    <section className="panel situation">
      <div className="situation__head">
        <h2>My situation</h2>
        <button className="btn btn--ghost" onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button>
      </div>

      {editing ? (
        <div className="situation__form">
          <label htmlFor="sit-focus">Current focus
            <input id="sit-focus" value={situation.focus} maxLength={160} placeholder="What you are working on right now"
              onChange={(e) => set({ focus: e.target.value })} />
          </label>
          <label htmlFor="sit-goals">Goals this season
            <textarea id="sit-goals" rows={3} value={situation.goals} placeholder="One per line"
              onChange={(e) => set({ goals: e.target.value })} />
          </label>
          <label htmlFor="sit-notes">Notes
            <textarea id="sit-notes" rows={3} value={situation.notes} placeholder="Anything the numbers can't show"
              onChange={(e) => set({ notes: e.target.value })} />
          </label>
          <p className="muted small">Saved on this device only.</p>
        </div>
      ) : empty ? (
        <p className="muted">Nothing here yet. Add your current focus and goals with Edit.</p>
      ) : (
        <dl className="situation__list">
          {situation.focus && (<><dt>Focus</dt><dd>{situation.focus}</dd></>)}
          {situation.goals && (<><dt>Goals</dt><dd className="situation__text">{situation.goals}</dd></>)}
          {situation.notes && (<><dt>Notes</dt><dd className="situation__text">{situation.notes}</dd></>)}
        </dl>
      )}
    </section>
  );
}
