import { ellipse, rect, rng, shaded, withAlpha, H, W, type Ctx } from './draw';

// A training space that grows with your Body tier: from a basement couch to a full gym.
const WALL = ['#4f4b44', '#625e55', '#767468', '#8a8c82', '#9aa2a6', '#a8b0ba', '#c4c0b0'];
const WALL_DK = ['#403d37', '#524f47', '#645f56', '#777a70', '#868e92', '#949ca6', '#aca898'];
const FLOOR = ['#3a332c', '#473f36', '#52483c', '#3f4248', '#383b42', '#34373e', '#2e3138'];
const FLOOR_Y = 78;
const METAL = '#8d939b';
const METAL_LT = '#c5cad2';
const METAL_DK = '#4a4e56';

function window_(c: Ctx, tier: number): void {
  const x = 14, y = 12, w = 30, h = 26;
  shaded(c, x - 2, y - 2, w + 4, h + 4, '#d9d2c2', '#efeadd', '#9c9585');
  if (tier === 1) {
    rect(c, x, y, w, h, '#1d2540');
    rect(c, x + 20, y + 4, 4, 4, '#e8e6c8');
    for (const [sx, sy] of [[4, 6], [11, 14], [15, 4]]) rect(c, x + sx, y + sy, 1, 1, '#c8d0f0');
  } else {
    rect(c, x, y, w, h, '#8fc0ec');
    rect(c, x, y + 12, w, h - 12, '#b6dcf4');
    rect(c, x, y + 20, w, 6, '#7aa05a');
  }
  rect(c, x + w / 2 - 1, y, 2, h, '#d9d2c2');
  rect(c, x, y + h / 2 - 1, w, 2, '#d9d2c2');
}

function couch(c: Ctx): void {
  rect(c, 104, 62, 46, 14, '#5a4a6a');
  rect(c, 104, 62, 46, 2, '#76628a');
  rect(c, 100, 66, 8, 14, '#4a3c58');
  rect(c, 146, 66, 8, 14, '#4a3c58');
  rect(c, 106, 70, 38, 8, '#6a587c');
  rect(c, 110, 72, 6, 3, '#3a3340'); // dent
  shaded(c, 116, 42, 22, 16, '#23232b', '#3a3a46', '#14141a'); // tv
  rect(c, 118, 44, 18, 12, '#3a5a72');
  rect(c, 124, 58, 6, 3, '#23232b');
  // snacks and bottles on the floor
  rect(c, 94, 86, 8, 5, '#b08a52'); rect(c, 95, 87, 6, 2, '#d86a3a');
  rect(c, 150, 90, 3, 6, '#3f7a3a'); rect(c, 156, 88, 3, 6, '#3f7a3a');
  rect(c, 24, 92, 9, 6, '#d8d0bc'); rect(c, 26, 94, 5, 1, '#8a8478');
  withAlpha(c, 0.3, () => rect(c, 0, 0, W, H, '#0a0a14'));
}

function dumbbells(c: Ctx, x: number, y: number): void {
  rect(c, x, y + 2, 9, 2, METAL_DK);
  shaded(c, x - 2, y, 3, 6, METAL, METAL_LT, METAL_DK);
  shaded(c, x + 8, y, 3, 6, METAL, METAL_LT, METAL_DK);
}

function mat(c: Ctx, tier: number): void {
  const col = tier >= 6 ? '#2f6a8a' : tier >= 4 ? '#3f7a52' : '#7a4a8a';
  ellipse(c, 62, 96, 36, 6, col);
  ellipse(c, 62, 95, 34, 5, 'rgba(255,255,255,0.12)');
}

function pullupBar(c: Ctx, tier: number): void {
  const x = 52, y = 26;
  rect(c, x, y, 2, 52, METAL_DK); rect(c, x + 44, y, 2, 52, METAL_DK);
  rect(c, x - 2, y - 2, 50, 3, METAL); rect(c, x - 2, y - 2, 50, 1, METAL_LT);
  if (tier >= 3) { // rings hang beside the bar
    for (const rx of [60, 82]) {
      rect(c, rx, 6, 1, 20, '#c9b48a');
      ellipse(c, rx, 28, 3, 3, '#e8e2d0'); ellipse(c, rx, 28, 1, 1, WALL[tier - 1]);
    }
  }
}

function bench(c: Ctx): void {
  shaded(c, 100, 76, 28, 5, '#3a3a44', '#55555f', '#1e1e26');
  rect(c, 104, 81, 2, 10, METAL_DK); rect(c, 122, 81, 2, 10, METAL_DK);
}

function parallettes(c: Ctx): void {
  for (const x of [22, 34]) {
    rect(c, x, 88, 9, 2, METAL); rect(c, x, 88, 9, 1, METAL_LT);
    rect(c, x, 90, 2, 5, METAL_DK); rect(c, x + 7, 90, 2, 5, METAL_DK);
  }
}

function plates(c: Ctx, x: number, tier: number): void {
  rect(c, x + 6, 56, 2, 36, METAL_DK);
  const cols = ['#c43a3a', '#2f5a8a', '#d8d03a', '#3f7a3a'];
  const n = tier >= 7 ? 4 : tier >= 6 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    shaded(c, x, 60 + i * 8, 14, 6, cols[i], 'rgba(255,255,255,0.3)', 'rgba(0,0,0,0.35)');
  }
}

function rack(c: Ctx): void {
  const x = 96;
  for (const px of [x, x + 30]) shaded(c, px, 30, 3, 52, METAL, METAL_LT, METAL_DK);
  rect(c, x, 30, 33, 3, METAL_DK);
  rect(c, x - 6, 46, 45, 2, '#2a2a30'); // barbell
  for (const px of [x - 8, x + 37]) { shaded(c, px, 40, 3, 14, '#c43a3a', '#e06a6a', '#7a1f1f'); shaded(c, px - 3, 42, 3, 10, '#2f5a8a', '#5a8ac0', '#1a3552'); }
}

function mirror(c: Ctx): void {
  shaded(c, 60, 12, 38, 40, '#c8d4dc', '#eef4f8', '#8a98a2');
  rect(c, 63, 15, 32, 34, '#aebfca');
  withAlpha(c, 0.35, () => { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(66, 48); c.lineTo(80, 16); c.lineTo(86, 16); c.lineTo(72, 48); c.fill(); });
}

function rower(c: Ctx): void {
  rect(c, 10, 90, 36, 3, METAL_DK); rect(c, 10, 90, 36, 1, METAL);
  rect(c, 8, 82, 6, 8, '#2a2a30'); ellipse(c, 11, 84, 4, 4, '#3a3a44');
  rect(c, 26, 86, 8, 3, '#c43a3a');
}

function trophies(c: Ctx): void {
  rect(c, 112, 24, 38, 3, '#6a4c31');
  for (const [x, h] of [[116, 8], [128, 11], [140, 8]]) {
    rect(c, x, 24 - h, 6, h - 3, '#e3c46e'); rect(c, x + 1, 24 - h, 1, h - 3, '#fff2b0');
    rect(c, x + 2, 21, 2, 3, '#c7a14a');
  }
  for (const x of [14, 140]) { // banners
    rect(c, x, 6, 14, 22, '#8a2432'); rect(c, x, 6, 14, 2, '#d4ad55');
    rect(c, x + 5, 12, 4, 8, '#d4ad55');
  }
}

export function drawGym(c: Ctx, tier: number): void {
  const t = Math.min(7, Math.max(1, tier)) - 1;
  rect(c, 0, 0, W, FLOOR_Y, WALL[t]);
  rect(c, 0, FLOOR_Y - 3, W, 3, WALL_DK[t]);
  if (tier >= 4) for (let x = 0; x < W; x += 10) rect(c, x, 0, 1, FLOOR_Y, WALL_DK[t]); // panels
  rect(c, 0, FLOOR_Y, W, H - FLOOR_Y, FLOOR[t]);
  const rand = rng(3);
  if (tier <= 3) {
    for (let y = FLOOR_Y + 6; y < H; y += 6) rect(c, 0, y, W, 1, 'rgba(0,0,0,0.25)');
  } else { // rubber flooring with seams
    for (let x = 0; x < W; x += 20) rect(c, x, FLOOR_Y, 1, H - FLOOR_Y, 'rgba(255,255,255,0.06)');
    rect(c, 0, FLOOR_Y + 14, W, 1, 'rgba(255,255,255,0.06)');
  }
  for (let i = 0; i < 6; i++) rect(c, Math.floor(rand() * W), FLOOR_Y + 4 + Math.floor(rand() * 26), 3, 1, 'rgba(0,0,0,0.18)');

  window_(c, tier);
  if (tier === 1) { couch(c); return; }
  if (tier >= 6) mirror(c);
  if (tier >= 2) { mat(c, tier); dumbbells(c, 26, 92); dumbbells(c, 138, 94); }
  if (tier >= 3) pullupBar(c, tier);
  if (tier >= 4) { bench(c); parallettes(c); }
  if (tier >= 5) { rack(c); plates(c, 6, tier); }
  if (tier >= 6) rower(c);
  if (tier >= 7) trophies(c);
  if (tier >= 5) withAlpha(c, 0.1, () => ellipse(c, 80, 20, 40, 14, '#fff6d0')); // overhead light
}
