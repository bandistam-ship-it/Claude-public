import type { CharacterState, StatId } from '../engine/types';
import { PixelScene } from './pixel/PixelScene';

export function Character({ state }: { state: CharacterState }) {
  const tier = (id: StatId) => state.stats.find((s) => s.def.id === id)?.tier ?? 1;
  const title = (id: StatId) => state.stats.find((s) => s.def.id === id)?.title ?? '';
  const label = `${state.archetype.name}: body ${title('body')}, mind ${title('mind')}, room ${title('upkeep')}, spirit ${title('spirit')}, career ${title('career')}`;

  return (
    <section className="scene" aria-label="Your character in his room">
      <PixelScene
        label={label}
        tiers={{ body: tier('body'), mind: tier('mind'), upkeep: tier('upkeep'), spirit: tier('spirit'), career: tier('career') }}
      />
      <div className="scene__caption">
        <div className="archetype">{state.archetype.name}</div>
        <p className="muted">{state.archetype.blurb}</p>
        <div className="level">
          <strong>Level {state.level}</strong>
          <span className="muted"> · {Math.round(state.totalXp).toLocaleString('en')} XP total</span>
          <div className="bar"><div className="bar__fill" style={{ width: `${state.levelProgress * 100}%` }} /></div>
        </div>
      </div>
    </section>
  );
}
