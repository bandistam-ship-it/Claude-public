import type { CharacterState } from '../engine/types';
import { fmtPercentile, fmtStanding } from './format';
import { PixelScene } from './pixel/PixelScene';

export function Character({ state }: { state: CharacterState }) {
  const label = `${state.archetype.name}, ${state.tierTitle} build`;
  const overall = state.combinedShare < 1;
  return (
    <section className="scene" aria-label="Your character in his training space">
      <PixelScene label={label} body={state.tier} />
      <div className="scene__caption">
        <div className="archetype">{state.archetype.name}</div>
        <p className="muted">{state.archetype.blurb}</p>
        <div className="level">
          <strong>{state.tierTitle}</strong>
          {overall && (
            <span className="muted"> · overall {fmtStanding(state.combinedShare).toLowerCase()} ({fmtPercentile(state.combinedShare)})</span>
          )}
          <p className="muted small">{state.rungsDone} of {state.rungsTotal} feats</p>
        </div>
      </div>
    </section>
  );
}
