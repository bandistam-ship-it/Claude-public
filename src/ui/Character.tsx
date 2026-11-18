import type { CharacterState, StatId } from '../engine/types';

// Placeholder art: each stat's tier (1–7) picks one layer of the scene.
const LAYERS: Record<StatId, string[]> = {
  body: ['🦴', '🧍', '🚶', '🏃', '🤸', '🏋️', '🦾'], // the figure
  mind: ['😶', '🤔', '🙂', '🤓', '🧐', '🧙', '🌌'], // the face
  upkeep: ['🗑️🪳🧦🍕', '🧦📦🥡', '🛏️📦', '🛏️🪴', '🛋️🪴🖼️', '🛋️🪴🖼️✨', '🏛️🪴🖼️👑'], // the room
  spirit: ['', '🌫️', '🕯️', '🔥', '✨', '🌟', '☀️'], // the aura
  career: ['🩳', '👕', '👔', '💼', '🎩', '⚖️', '👑'], // the outfit
};

export function Character({ state }: { state: CharacterState }) {
  const tier = (id: StatId) => state.stats.find((s) => s.def.id === id)?.tier ?? 1;
  const layer = (id: StatId) => LAYERS[id][tier(id) - 1];
  const messy = tier('upkeep') <= 2;

  return (
    <section className={`scene ${messy ? 'scene--messy' : ''}`} aria-label="Your character in his room">
      <div className="scene__room" title={`Room: ${state.stats.find((s) => s.def.id === 'upkeep')?.title}`}>
        {layer('upkeep')}
      </div>
      <div className="scene__figure">
        <span className="scene__aura">{layer('spirit')}</span>
        <span className="scene__face" title="Mind">{layer('mind')}</span>
        <span className="scene__body" title="Body">{layer('body')}</span>
        <span className="scene__outfit" title="Career">{layer('career')}</span>
      </div>
      <div className="scene__caption">
        <div className="archetype">
          <span className="archetype__emoji">{state.archetype.emoji}</span> {state.archetype.name}
        </div>
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
