// Tiny pixel-art toolkit. Everything is drawn at a low logical resolution with whole-pixel
// rectangles, then scaled up with `image-rendering: pixelated`.

export type Ctx = CanvasRenderingContext2D;
export const W = 160;
export const H = 112;

export function rect(c: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Filled box with a 1px highlight on the top/left and a shadow on the bottom/right. */
export function shaded(c: Ctx, x: number, y: number, w: number, h: number, base: string, light: string, dark: string): void {
  rect(c, x, y, w, h, base);
  rect(c, x, y, w, 1, light);
  rect(c, x, y, 1, h, light);
  rect(c, x, y + h - 1, w, 1, dark);
  rect(c, x + w - 1, y, 1, h, dark);
}

export function ellipse(c: Ctx, cx: number, cy: number, rx: number, ry: number, color: string): void {
  for (let y = -ry; y <= ry; y++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.0001))));
    rect(c, cx - half, cy + y, half * 2 + 1, 1, color);
  }
}

export function withAlpha(c: Ctx, a: number, fn: () => void): void {
  const prev = c.globalAlpha;
  c.globalAlpha = a;
  fn();
  c.globalAlpha = prev;
}

/** Deterministic random numbers so the clutter is in the same place on every render. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Row-by-row bitmap: each string is a row, each character a palette key ('.' = transparent). */
export function sprite(c: Ctx, x: number, y: number, rows: string[], palette: Record<string, string>): void {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const col = palette[row[i]];
      if (col) rect(c, x + i, y + j, 1, 1, col);
    }
  });
}
