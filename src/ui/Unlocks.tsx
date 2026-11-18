import type { CharacterState, RungState, SectionState } from '../engine/types';
import { fmtShare, fmtStanding } from './format';

interface Row { section: SectionState; rung: RungState }

/** What you have unlocked lately and the next feat within reach in each section. */
export function Unlocks({ state }: { state: CharacterState }) {
  const recent: Row[] = [];
  const next: Row[] = [];
  for (const section of state.sections) {
    for (const rung of section.rungs) if (rung.achieved && rung.confirmedAt) recent.push({ section, rung });
    if (section.next) next.push({ section, rung: section.next });
  }
  recent.sort((a, b) => (b.rung.confirmedAt ?? '').localeCompare(a.rung.confirmedAt ?? ''));

  return (
    <section className="panel unlocks">
      <h2>Unlocked</h2>
      {recent.length === 0 ? (
        <p className="muted">Nothing unlocked yet. Your first feat will show up here.</p>
      ) : (
        <>
          <h3>Recently unlocked</h3>
          <ul className="plain">
            {recent.slice(0, 4).map(({ section, rung }) => (
              <li key={rung.id}>
                <span>{section.def.emoji} <strong>{rung.text}</strong> <span className="muted">({fmtShare(rung.share)} of adults)</span></span>
                <span className="muted small">{rung.confirmedAt}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {next.length > 0 && (
        <>
          <h3>Next unlocks</h3>
          <ul className="plain">
            {next.map(({ section, rung }) => (
              <li key={rung.id}>
                <span>{section.def.emoji} <strong>{rung.text}</strong></span>
                <span className="muted small">
                  {rung.share < section.share ? `Would put you in the ${fmtStanding(rung.share).toLowerCase()}` : `About ${fmtShare(rung.share)} of adults can do this`}
                </span>
                {rung.note && <span className="rung__note">{rung.note}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
