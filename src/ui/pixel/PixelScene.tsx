import { useEffect, useRef } from 'react';
import { drawCharacter, type Tiers } from './character';
import { H, W } from './draw';
import { drawRoom } from './room';

export type { Tiers };

/** The character in his room, drawn as pixel art. Each stat's tier changes one layer. */
export function PixelScene({ tiers, label }: { tiers: Tiers; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { body, mind, upkeep, spirit, career } = tiers;

  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    drawRoom(ctx, upkeep);
    drawCharacter(ctx, { body, mind, upkeep, spirit, career });
  }, [body, mind, upkeep, spirit, career]);

  return <canvas ref={ref} className="pixel-scene" width={W} height={H} role="img" aria-label={label} />;
}
