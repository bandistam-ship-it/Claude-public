import { ellipse, rect, shaded, withAlpha, type Ctx } from './draw';

// The figure is built from the Body tier alone: a thin, slouched, bare-chested nerd at tier 1,
// growing through an athletic frame to a broad, defined, powerful one at tier 7.

const SKIN = { base: '#d9a47f', light: '#ecc09c', dark: '#b27c5a', deep: '#8e5f45' };
const CX = 80;

const SHOULDER = [6, 7, 8, 9, 11, 13, 15];
const WAIST = [5, 5, 6, 6, 6, 7, 7];
const ARM = [2, 2, 3, 3, 4, 5, 6];
const LEG = [4, 4, 5, 5, 6, 7, 8];
const SHORTS = ['#7d3a3a', '#3f4a6a', '#2f3a52', '#26303f', '#1f2733', '#1a1f2a', '#14141c'];

const TORSO_TOP = 56;
const TORSO_BOTTOM = 81;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const torsoHalf = (y: number, sh: number, wa: number) => Math.round(lerp(sh, wa, (y - TORSO_TOP) / (TORSO_BOTTOM - TORSO_TOP)));

function legs(c: Ctx, tier: number): void {
  const lw = LEG[tier - 1];
  for (const side of [-1, 1]) {
    const x = side < 0 ? CX - 1 - lw : CX + 1;
    shaded(c, x, 82, lw, 18, SKIN.base, SKIN.light, SKIN.dark);
    if (tier >= 4) rect(c, x + Math.floor(lw / 2), 90, 1, 5, SKIN.dark); // quad separation
    shaded(c, x - 1, 80, lw + 2, 10, SHORTS[tier - 1], 'rgba(255,255,255,0.14)', 'rgba(0,0,0,0.3)');
    if (tier <= 1) { // slippers
      shaded(c, x - 1, 100, lw + 3, 3, '#6b5b95', '#8a7ab8', '#463a68');
    } else { // trainers
      shaded(c, x - 1, 100, lw + 3, 3, '#f0f0f2', '#ffffff', '#9a9aa4');
      rect(c, x - 1, 102, lw + 3, 1, tier >= 5 ? '#c43a3a' : '#5a5a66');
    }
  }
  rect(c, CX - 1, 82, 2, 18, 'rgba(0,0,0,0.35)');
}

function torso(c: Ctx, tier: number, slouch: number): void {
  const sh = SHOULDER[tier - 1], wa = WAIST[tier - 1], at = ARM[tier - 1];
  const top = TORSO_TOP + slouch;
  for (const side of [-1, 1]) { // arms
    const x = side < 0 ? CX - sh - at : CX + sh + 1;
    shaded(c, x, top + 1, at, 22, SKIN.base, SKIN.light, SKIN.dark);
    shaded(c, x, top + 23, at, 3, SKIN.base, SKIN.light, SKIN.dark);
    if (tier >= 4) rect(c, x + Math.floor(at / 2), top + 6, 1, 3, SKIN.dark); // bicep line
    if (tier >= 6) rect(c, x, top + 16, at, 1, SKIN.dark); // forearm vein line
  }
  for (let y = top; y <= TORSO_BOTTOM; y++) { // torso
    const half = torsoHalf(y, sh, wa);
    rect(c, CX - half, y, half * 2 + 1, 1, SKIN.base);
    rect(c, CX - half, y, 2, 1, SKIN.light);
    rect(c, CX + half - 1, y, 2, 1, SKIN.dark);
  }
  if (tier <= 1) for (const y of [62, 64, 66]) { // ribs
    rect(c, CX - 4, y + slouch, 3, 1, SKIN.dark);
    rect(c, CX + 2, y + slouch, 3, 1, SKIN.dark);
  }
  if (tier >= 3) { // collarbones
    rect(c, CX - sh + 2, top + 1, sh - 3, 1, SKIN.dark);
    rect(c, CX + 2, top + 1, sh - 3, 1, SKIN.dark);
  }
  if (tier >= 4) { // pecs
    rect(c, CX - sh + 2, 62, sh - 2, 1, SKIN.dark);
    rect(c, CX + 1, 62, sh - 2, 1, SKIN.dark);
    rect(c, CX, 58, 1, 5, SKIN.dark);
  }
  if (tier >= 5) for (const y of [67, 71, 75]) { // abs
    rect(c, CX, y - 2, 1, 4, SKIN.dark);
    rect(c, CX - 3, y, 7, 1, SKIN.dark);
  }
  if (tier >= 6) { // deltoids and lats
    ellipse(c, CX - sh, top + 3, 3, 3, SKIN.light);
    ellipse(c, CX + sh, top + 3, 3, 3, SKIN.base);
    rect(c, CX - sh, top + 8, 1, 8, SKIN.dark);
    rect(c, CX + sh, top + 8, 1, 8, SKIN.dark);
  }
  if (tier >= 7) { // wristbands
    for (const side of [-1, 1]) rect(c, side < 0 ? CX - sh - at : CX + sh + 1, top + 21, at, 2, '#f0f0f2');
  }
}

function head(c: Ctx, tier: number, slouch: number): void {
  const hy = 47 + slouch;
  rect(c, CX - 2, hy + 6, 5, 4, SKIN.dark); // neck
  ellipse(c, CX, hy, 6, 7, SKIN.dark);
  ellipse(c, CX - 1, hy, 5, 7, SKIN.base);
  ellipse(c, CX - 2, hy - 1, 2, 4, SKIN.light);
  rect(c, CX - 7, hy, 1, 3, SKIN.base);
  rect(c, CX + 6, hy, 1, 3, SKIN.dark);
  const hair = '#2b2018';
  ellipse(c, CX, hy - 5, 7, 4, hair);
  rect(c, CX - 5, hy - 2, 11, 2, SKIN.base);
  rect(c, CX - 7, hy - 4, 1, 4, hair);
  rect(c, CX + 6, hy - 4, 1, 4, hair);
  if (tier <= 1) { // unkempt
    rect(c, CX - 8, hy - 7, 2, 2, hair);
    rect(c, CX + 5, hy - 9, 2, 3, hair);
    rect(c, CX - 2, hy - 10, 2, 2, hair);
  }
  rect(c, CX - 4, hy, 2, 2, '#f4f4f4');
  rect(c, CX + 1, hy, 2, 2, '#f4f4f4');
  if (tier <= 1) { // tired, blank
    rect(c, CX - 3, hy + 1, 1, 1, '#3a3a44');
    rect(c, CX + 2, hy + 1, 1, 1, '#3a3a44');
    rect(c, CX - 4, hy + 2, 2, 1, SKIN.deep);
    rect(c, CX + 1, hy + 2, 2, 1, SKIN.deep);
    rect(c, CX - 1, hy + 4, 2, 2, '#5a2a2a');
  } else {
    rect(c, CX - 3, hy, 1, 2, '#3a3a44');
    rect(c, CX + 2, hy, 1, 2, '#3a3a44');
    rect(c, CX - 4, hy - 2, 2, 1, hair);
    rect(c, CX + 1, hy - 2, 2, 1, hair);
    if (tier === 2) {
      rect(c, CX - 1, hy + 4, 2, 1, '#7a3a3a');
    } else { // smiling
      rect(c, CX - 2, hy + 4, 4, 1, '#7a3a3a');
      rect(c, CX - 3, hy + 3, 1, 1, '#7a3a3a');
      rect(c, CX + 2, hy + 3, 1, 1, '#7a3a3a');
    }
  }
  if (tier >= 5) rect(c, CX - 6, hy - 4, 13, 2, '#c43a3a'); // headband
}

export function drawCharacter(c: Ctx, tier: number): void {
  const slouch = tier <= 1 ? 2 : 0;
  withAlpha(c, 0.3, () => ellipse(c, CX, 103, 16 + tier * 1.2, 3, '#000000')); // ground shadow
  legs(c, tier);
  torso(c, tier, slouch);
  head(c, tier, slouch);
}
