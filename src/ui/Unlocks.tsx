import type { CharacterState, MilestoneState, StatState, DomainState } from '../engine/types';

interface Row { stat: StatState; domain: DomainState; ms: MilestoneState }

/** What you have unlocked lately, what is strongest, and the next unlock in each domain. */
export function Unlocks({ state }: { state: CharacterState }) {
  const recent: Row[] = [];
  const next: Row[] = [];
  const strongest: { stat: StatState; domain: DomainState }[] = [];
  for (const stat of state.stats) {
    for (const domain of stat.domains) {
      if (domain.level > 1) strongest.push({ stat, domain });
      for (const ms of domain.milestones) {
        if (ms.achieved && ms.source !== 'implied' && ms.confirmedAt) recent.push({ stat, domain, ms });
      }
      const nextMs = domain.milestones.find((m) => !m.achieved);
      if (nextMs && stat.def.weight > 1) next.push({ stat, domain, ms: nextMs });
    }
  }
  recent.sort((a, b) => (b.ms.confirmedAt ?? '').localeCompare(a.ms.confirmedAt ?? ''));
  strongest.sort((a, b) => b.domain.level - a.domain.level);
  next.sort((a, b) => b.domain.level - a.domain.level);

  return (
    <section className="panel unlocks">
      <h2>Unlocked</h2>
      {recent.length === 0 && strongest.length === 0 ? (
        <p className="muted">Nothing unlocked yet. Your first milestone will show up here.</p>
      ) : (
        <>
          {strongest.length > 0 && (
            <>
              <h3>Your strongest</h3>
              <ul className="plain">
                {strongest.slice(0, 3).map(({ stat, domain }) => (
                  <li key={domain.def.id}>
                    <strong>{stat.def.emoji} {domain.def.name}</strong> <span className="muted">level {domain.level} of 7</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {recent.length > 0 && (
            <>
              <h3>Recently unlocked</h3>
              <ul className="plain">
                {recent.slice(0, 4).map(({ stat, domain, ms }) => (
                  <li key={ms.id}>
                    <span>{stat.def.emoji} <strong>{domain.def.name}</strong> L{ms.level}: {ms.text}</span>
                    <span className="muted small"> · {ms.confirmedAt}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      {next.length > 0 && (
        <>
          <h3>Next unlocks</h3>
          <ul className="plain">
            {next.map(({ stat, domain, ms }) => (
              <li key={ms.id}>
                <span>{stat.def.emoji} <strong>{domain.def.name}</strong> L{ms.level}: {ms.text}</span>
                {ms.note && <span className="rung__note">{ms.note}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
