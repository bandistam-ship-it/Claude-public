import { useEffect, useRef } from 'react';
import { drawCharacter } from './character';
import { H, W } from './draw';
import { drawGym } from './gym';

/** The character in his training space, drawn as pixel art. Body tier sets the build and the gear. */
export function PixelScene({ body, label }: { body: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    drawGym(ctx, body);
    drawCharacter(ctx, body);
  }, [body]);

  return <canvas ref={ref} className="pixel-scene" width={W} height={H} role="img" aria-label={label} />;
}
