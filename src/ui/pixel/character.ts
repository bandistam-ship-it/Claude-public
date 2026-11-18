import { ellipse, rect, shaded, withAlpha, type Ctx } from './draw';

export interface Tiers { body: number; mind: number; upkeep: number }

const SKIN = { base: '#d9a47f', light: '#ecc09c', dark: '#b27c5a', deep: '#8e5f45' };
const CX = 80;

const SHOULDER = [6, 7, 8, 9, 11, 13, 15];
const WAIST = [5, 5, 6, 6, 6, 7, 7];
const ARM = [2, 2, 3, 3, 4, 5, 6];
const LEG = [4, 4, 5, 5, 6, 7, 8];

const SHIRT_TOP = 56;
const TORSO_BOTTOM = 81;

const PANTS = ['#7d3a3a', '#3f5a85', '#4a5260', '#8a7a5a', '#4b4f58', '#1f2a44', '#14141c'];
const TOPS = ['', '#8c8c92', '#3d6b8a', '#e8e8ea', '#e8e8ea', '#1f2a44', '#16161e'];

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

function cape(c: Ctx, tiers: Tiers): void {
  if (tiers.mind < 7) return;
  const sh = SHOULDER[tiers.body - 1];
  rect(c, CX - sh - 3, SHIRT_TOP, sh * 2 + 7, 42, '#7a1f2b');
  rect(c, CX - sh - 3, SHIRT_TOP, 2, 42, '#a02f3d');
  rect(c, CX - sh - 3, 96, sh * 2 + 7, 2, '#d4ad55');
}

function legs(c: Ctx, tiers: Tiers): void {
  const lw = LEG[tiers.body - 1];
  const outfit = tiers.mind; // the outfit follows Mind
  for (const side of [-1, 1]) {
    const x = side < 0 ? CX - 1 - lw : CX + 1;
    // skin first (visible below boxers)
    shaded(c, x, 82, lw, 18, SKIN.base, SKIN.light, SKIN.dark);
    if (outfit >= 2) shaded(c, x, 82, lw, 18, PANTS[outfit - 1], 'rgba(255,255,255,0.14)', 'rgba(0,0,0,0.3)');
    else shaded(c, x - 1, 80, lw + 2, 9, PANTS[0], '#a05050', '#5a2828');
    if (outfit >= 5) rect(c, x + Math.floor(lw / 2), 84, 1, 15, 'rgba(255,255,255,0.1)'); // crease
    // shoes / slippers
    if (outfit <= 1) {
      shaded(c, x - 1, 100, lw + 3, 3, '#6b5b95', '#8a7ab8', '#463a68');
    } else {
      shaded(c, x - 1, 100, lw + 3, 3, '#221b16', '#3a2f27', '#0e0a08');
    }
  }
  rect(c, CX - 1, 82, 2, 18, 'rgba(0,0,0,0.35)');
}

function torsoHalf(y: number, sh: number, wa: number): number {
  return Math.round(lerp(sh, wa, (y - SHIRT_TOP) / (TORSO_BOTTOM - SHIRT_TOP)));
}

function body(c: Ctx, tiers: Tiers, slouch: number): void {
  const b = tiers.body;
  const sh = SHOULDER[b - 1], wa = WAIST[b - 1], at = ARM[b - 1];
  const top = SHIRT_TOP + slouch;
  // arms
  for (const side of [-1, 1]) {
    const x = side < 0 ? CX - sh - at : CX + sh + 1;
    shaded(c, x, top + 1, at, 22, SKIN.base, SKIN.light, SKIN.dark);
    shaded(c, x, top + 23, at, 3, SKIN.base, SKIN.light, SKIN.dark); // hand
    if (b >= 4) rect(c, x + Math.floor(at / 2), top + 6, 1, 3, SKIN.dark); // bicep line
  }
  // torso
  for (let y = top; y <= TORSO_BOTTOM; y++) {
    const half = torsoHalf(y, sh, wa);
    rect(c, CX - half, y, half * 2 + 1, 1, SKIN.base);
    rect(c, CX - half, y, 2, 1, SKIN.light);
    rect(c, CX + half - 1, y, 2, 1, SKIN.dark);
  }
  if (b <= 1) for (const y of [62, 64, 66]) { // ribs
    rect(c, CX - 4, y + slouch, 3, 1, SKIN.dark);
    rect(c, CX + 2, y + slouch, 3, 1, SKIN.dark);
  }
  if (b >= 4) { // pecs
    rect(c, CX - sh + 2, 62, sh - 2, 1, SKIN.dark);
    rect(c, CX + 1, 62, sh - 2, 1, SKIN.dark);
    rect(c, CX, 58, 1, 5, SKIN.dark);
  }
  if (b >= 5) for (const y of [67, 71, 75]) { // abs
    rect(c, CX, y - 2, 1, 4, SKIN.dark);
    rect(c, CX - 3, y, 7, 1, SKIN.dark);
  }
  if (b >= 6) { // deltoids
    ellipse(c, CX - sh, top + 3, 3, 3, SKIN.light);
    ellipse(c, CX + sh, top + 3, 3, 3, SKIN.base);
  }
}

function clothing(c: Ctx, tiers: Tiers, slouch: number): void {
  const car = tiers.mind;
  if (car <= 1) return;
  const b = tiers.body;
  const sh = SHOULDER[b - 1], wa = WAIST[b - 1], at = ARM[b - 1];
  const top = SHIRT_TOP + slouch;
  const col = TOPS[car - 1];
  const hem = car === 2 ? 76 : car >= 6 ? 84 : 80;
  for (let y = top; y <= hem; y++) {
    const half = torsoHalf(Math.min(y, TORSO_BOTTOM), sh, wa) + 1;
    rect(c, CX - half, y, half * 2 + 1, 1, col);
    rect(c, CX - half, y, 2, 1, 'rgba(255,255,255,0.14)');
    rect(c, CX + half - 1, y, 2, 1, 'rgba(0,0,0,0.28)');
  }
  if (car >= 3) { // sleeves
    const len = car === 3 ? 8 : 22;
    for (const side of [-1, 1]) {
      const x = side < 0 ? CX - sh - at : CX + sh + 1;
      shaded(c, x - (side < 0 ? 0 : 0), top + 1, at, len, col, 'rgba(255,255,255,0.14)', 'rgba(0,0,0,0.28)');
    }
  }
  if (car === 2) { // tank-top neckline
    rect(c, CX - 3, top, 7, 2, SKIN.base);
  }
  if (car >= 4) { // collar + buttons
    rect(c, CX - 3, top, 2, 3, '#f6f6f8');
    rect(c, CX + 2, top, 2, 3, '#f6f6f8');
    if (car <= 5) for (const y of [62, 67, 72]) rect(c, CX, y + slouch, 1, 1, '#9a9aa4');
  }
  if (car >= 5) { // tie
    rect(c, CX - 1, top + 2, 3, 2, '#8e2b2b');
    rect(c, CX - 1, top + 4, 3, 14, '#a63a3a');
    rect(c, CX, top + 4, 1, 14, '#8e2b2b');
  }
  if (car >= 6) { // blazer lapels + shirt V
    rect(c, CX - 2, top, 5, 4, '#f6f6f8');
    rect(c, CX - 4, top, 2, 10, 'rgba(255,255,255,0.1)');
    rect(c, CX + 3, top, 2, 10, 'rgba(0,0,0,0.25)');
    rect(c, CX - 1, top + 2, 3, 2, '#8e2b2b');
    rect(c, CX - 1, top + 4, 3, 12, '#a63a3a');
    rect(c, CX - 8, top + 12, 3, 2, '#d4ad55'); // pocket square / pin
  }
  if (car >= 7) {
    rect(c, CX - sh - 1, top, sh * 2 + 3, 1, '#d4ad55');
    rect(c, CX - sh - 1, hem, sh * 2 + 3, 1, '#d4ad55');
    rect(c, CX - 5, top + 3, 2, 2, '#d4ad55'); // chain
  }
}

function head(c: Ctx, tiers: Tiers, slouch: number): void {
  const m = tiers.mind;
  const hy = 47 + slouch;
  const sh = SHOULDER[tiers.body - 1];
  rect(c, CX - 2, hy + 6, 5, 4, SKIN.dark); // neck
  // head
  ellipse(c, CX, hy, 6, 7, SKIN.dark);
  ellipse(c, CX - 1, hy, 5, 7, SKIN.base);
  ellipse(c, CX - 2, hy - 1, 2, 4, SKIN.light);
  rect(c, CX - 7, hy, 1, 3, SKIN.base); // ears
  rect(c, CX + 6, hy, 1, 3, SKIN.dark);
  // hair
  const hair = m >= 6 ? '#8c8c96' : '#2b2018';
  ellipse(c, CX, hy - 5, 7, 4, hair);
  rect(c, CX - 5, hy - 2, 11, 2, SKIN.base);
  rect(c, CX - 7, hy - 4, 1, 4, hair);
  rect(c, CX + 6, hy - 4, 1, 4, hair);
  if (m <= 1) { // unkempt
    rect(c, CX - 8, hy - 7, 2, 2, hair);
    rect(c, CX + 5, hy - 9, 2, 3, hair);
    rect(c, CX - 2, hy - 10, 2, 2, hair);
  }
  const ey = hy;
  const eyes = (white: boolean) => {
    if (white) { rect(c, CX - 4, ey, 2, 2, '#f4f4f4'); rect(c, CX + 1, ey, 2, 2, '#f4f4f4'); }
  };
  // eyes and mouth by mind tier
  if (m <= 1) { // blank stare, dark circles, slack mouth
    eyes(true);
    rect(c, CX - 4, ey + 1, 2, 1, '#f4f4f4');
    rect(c, CX - 3, ey + 1, 1, 1, '#3a3a44');
    rect(c, CX + 2, ey + 1, 1, 1, '#3a3a44');
    rect(c, CX - 4, ey + 2, 2, 1, SKIN.deep);
    rect(c, CX + 1, ey + 2, 2, 1, SKIN.deep);
    rect(c, CX - 1, hy + 4, 2, 2, '#5a2a2a');
  } else if (m === 2) {
    eyes(true);
    rect(c, CX - 3, ey, 1, 2, '#3a3a44');
    rect(c, CX + 2, ey, 1, 2, '#3a3a44');
    rect(c, CX - 4, ey - 2, 2, 1, hair);
    rect(c, CX + 1, ey - 2, 2, 1, hair);
    rect(c, CX - 1, hy + 4, 2, 1, '#7a3a3a');
  } else {
    eyes(true);
    rect(c, CX - 3, ey, 1, 2, '#3a3a44');
    rect(c, CX + 2, ey, 1, 2, '#3a3a44');
    rect(c, CX - 4, ey - 2, 2, 1, hair);
    rect(c, CX + 1, ey - 2, 2, 1, hair);
    rect(c, CX - 2, hy + 4, 4, 1, '#7a3a3a');
    rect(c, CX - 3, hy + 3, 1, 1, '#7a3a3a');
    rect(c, CX + 2, hy + 3, 1, 1, '#7a3a3a');
  }
  if (m >= 4) { // glasses
    const thick = m >= 5;
    const frame = '#23232b';
    const w = thick ? 5 : 4, h = thick ? 4 : 3;
    for (const x of [CX - 5, CX]) {
      rect(c, x, ey - 1, w, 1, frame);
      rect(c, x, ey - 1 + h, w, 1, frame);
      rect(c, x, ey - 1, 1, h + 1, frame);
      rect(c, x + w - 1, ey - 1, 1, h + 1, frame);
      if (thick) withAlpha(c, 0.35, () => rect(c, x + 1, ey, w - 2, h - 1, '#bcd8e8'));
    }
    rect(c, CX - 1, ey, 2, 1, frame); // bridge
    if (thick) rect(c, CX - 4, ey, 1, 1, '#ffffff');
  }
  if (m >= 6) { // beard + glow
    ellipse(c, CX, hy + 6, 4, 3, '#a8a8b2');
    rect(c, CX - 3, hy + 3, 7, 1, '#a8a8b2');
    rect(c, CX - 2, hy + 4, 5, 1, SKIN.base);
    rect(c, CX - 1, hy + 4, 3, 1, '#7a3a3a');
  }
  if (m >= 7) {
    withAlpha(c, 0.5, () => { rect(c, CX - 4, ey, 2, 2, '#6ff0ff'); rect(c, CX + 1, ey, 2, 2, '#6ff0ff'); });
    rect(c, CX - 3, ey, 1, 1, '#d8ffff');
    rect(c, CX + 2, ey, 1, 1, '#d8ffff');
    withAlpha(c, 0.18, () => ellipse(c, CX, hy - 2, 11, 12, '#6ff0ff'));
  }
  if (m >= 5) { // book in hand
    const x = CX + sh + 3;
    shaded(c, x, 66 + slouch, 9, 11, '#6b2f2f', '#8f4545', '#3f1a1a');
    rect(c, x + 8, 67 + slouch, 1, 9, '#efe6cf');
    rect(c, x + 2, 69 + slouch, 4, 1, '#d4ad55');
  }
}

export function drawCharacter(c: Ctx, tiers: Tiers): void {
  const slouch = tiers.body <= 1 ? 2 : 0;
  // ground shadow
  withAlpha(c, 0.3, () => ellipse(c, CX, 103, 16 + tiers.body * 1.2, 3, '#000000'));
  cape(c, tiers);
  legs(c, tiers);
  body(c, tiers, slouch);
  clothing(c, tiers, slouch);
  head(c, tiers, slouch);
}
