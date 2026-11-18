import { ellipse, rect, rng, shaded, sprite, withAlpha, H, W, type Ctx } from './draw';

const WALL = ['#585247', '#6e695b', '#8a8572', '#9aa398', '#a8b6bf', '#b6c0d4', '#d8cca4'];
const WALL_DK = ['#48433a', '#5c574a', '#757060', '#85897f', '#93a0a9', '#a0aabd', '#bfb28b'];
const FLOOR = ['#3a332c', '#493f35', '#5b4937', '#69523a', '#79593b', '#8a6944', '#99794e'];
const FLOOR_DK = ['#2e2823', '#3a322a', '#4a3b2c', '#58442f', '#664b31', '#765837', '#85663f'];
const FLOOR_Y = 78;

function window_(c: Ctx, tier: number): void {
  const x = 14, y = 12, w = 32, h = 32;
  shaded(c, x - 2, y - 2, w + 4, h + 4, '#d9d2c2', '#efeadd', '#9c9585');
  if (tier === 1) {
    rect(c, x, y, w, h, '#1d2540');
    rect(c, x, y + 18, w, h - 18, '#252f52');
    rect(c, x + 22, y + 5, 5, 5, '#e8e6c8'); // moon
    rect(c, x + 24, y + 5, 3, 5, '#1d2540');
    for (const [sx, sy] of [[4, 6], [11, 14], [16, 4], [8, 22]]) rect(c, x + sx, y + sy, 1, 1, '#c8d0f0');
  } else {
    rect(c, x, y, w, h, '#8fc0ec');
    rect(c, x, y + 14, w, h - 14, '#b6dcf4');
    ellipse(c, x + 10, y + 9, 5, 2, '#f4f8fc');
    ellipse(c, x + 22, y + 14, 6, 2, '#eef5fb');
    rect(c, x, y + 26, w, 6, '#7aa05a'); // hills
    rect(c, x + 8, y + 24, 14, 2, '#7aa05a');
  }
  rect(c, x + w / 2 - 1, y, 2, h, '#d9d2c2'); // mullions
  rect(c, x, y + h / 2 - 1, w, 2, '#d9d2c2');
  rect(c, x - 3, y + h + 2, w + 6, 2, '#b5ad9a'); // sill
  if (tier >= 3) {
    const curtain = tier >= 7 ? '#8a2432' : tier >= 5 ? '#5a6f9a' : '#8a7a5a';
    rect(c, x - 6, y - 4, 7, h + 10, curtain);
    rect(c, x + w - 1, y - 4, 7, h + 10, curtain);
    for (let i = 0; i < 3; i++) {
      rect(c, x - 5 + i * 2, y - 3, 1, h + 8, 'rgba(0,0,0,0.18)');
      rect(c, x + w + i * 2, y - 3, 1, h + 8, 'rgba(0,0,0,0.18)');
    }
    rect(c, x - 8, y - 6, w + 16, 2, tier >= 7 ? '#d4ad55' : '#6b5a3a');
  }
  if (tier >= 2) withAlpha(c, tier >= 5 ? 0.16 : 0.1, () => {
    c.fillStyle = '#fff6d0';
    c.beginPath();
    c.moveTo(x + 2, y + h);
    c.lineTo(x + w - 2, y + h);
    c.lineTo(x + w + 34, FLOOR_Y + 22);
    c.lineTo(x + 26, FLOOR_Y + 22);
    c.fill();
  });
}

function desk(c: Ctx, tier: number): void {
  const x = 112, y = 62;
  shaded(c, x, y, 44, 4, '#7a5a3a', '#9a7a52', '#5a3f27'); // top
  rect(c, x + 2, y + 4, 3, 16, '#5a3f27');
  rect(c, x + 39, y + 4, 3, 16, '#5a3f27');
  rect(c, x + 5, y + 6, 34, 4, '#6a4c31'); // apron
  // monitor
  shaded(c, x + 14, y - 20, 22, 16, '#23232b', '#3a3a46', '#14141a');
  rect(c, x + 16, y - 18, 18, 12, tier === 1 ? '#2a6f86' : '#3a9ec0');
  rect(c, x + 16, y - 18, 18, 1, '#7fd6f2');
  for (let i = 0; i < 4; i++) rect(c, x + 18, y - 16 + i * 3, 6 + ((i * 5) % 8), 1, '#bfeaf8');
  rect(c, x + 23, y - 4, 4, 3, '#23232b');
  rect(c, x + 19, y - 1, 12, 1, '#23232b');
  rect(c, x + 12, y - 1, 8, 1, '#c9c4b8'); // keyboard
  rect(c, x + 32, y - 2, 3, 2, '#c9c4b8'); // mouse
  if (tier >= 4) { // tidy lamp
    rect(c, x + 3, y - 12, 1, 12, '#c7a14a');
    rect(c, x + 1, y - 14, 6, 3, '#e3c46e');
    withAlpha(c, 0.18, () => ellipse(c, x + 4, y - 6, 8, 5, '#fff2b0'));
  }
  if (tier <= 2) { // papers and cups
    rect(c, x + 3, y - 4, 8, 4, '#e9e4d4');
    rect(c, x + 4, y - 5, 8, 1, '#cfc9b6');
    rect(c, x + 37, y - 5, 4, 5, '#d8d4c8');
    rect(c, x + 38, y - 4, 2, 1, '#6a3b24');
  }
  // chair
  rect(c, x + 12, y + 8, 18, 3, tier >= 5 ? '#6b2f3a' : '#3b3b44');
  rect(c, x + 20, y + 11, 2, 9, '#2a2a30');
  rect(c, x + 16, y + 20, 10, 1, '#2a2a30');
}

function shelf(c: Ctx, tier: number): void {
  const x = 112, y = 26;
  rect(c, x, y + 11, 44, 3, '#6a4c31');
  rect(c, x, y + 11, 44, 1, '#8a6a46');
  const colors = ['#8a2f2f', '#2f5a8a', '#4f7a3f', '#c9a14a', '#6a3f7a', '#d8d0bc', '#2f6a6a'];
  const rand = rng(11);
  const n = tier <= 1 ? 4 : tier === 2 ? 7 : 10;
  let bx = x + 2;
  for (let i = 0; i < n && bx < x + 40; i++) {
    const bh = 7 + Math.floor(rand() * 4);
    const bw = 2 + Math.floor(rand() * 2);
    const lean = tier <= 2 && i % 3 === 1;
    rect(c, bx, y + 11 - bh + (lean ? 1 : 0), bw, bh - (lean ? 1 : 0), colors[i % colors.length]);
    rect(c, bx, y + 11 - bh + (lean ? 1 : 0), 1, bh - (lean ? 1 : 0), 'rgba(255,255,255,0.25)');
    bx += bw + (tier <= 2 ? 1 + Math.floor(rand() * 3) : 0);
  }
  if (tier >= 4) { // trophy
    rect(c, x + 36, y + 4, 4, 2, '#e3c46e');
    rect(c, x + 37, y + 6, 2, 3, '#c7a14a');
    rect(c, x + 35, y + 9, 6, 2, '#8a6a46');
  }
}

function rug(c: Ctx, tier: number): void {
  if (tier < 3) return;
  const color = tier >= 7 ? '#8a2432' : tier >= 5 ? '#4f6a9a' : '#7a6a4a';
  const trim = tier >= 7 ? '#d4ad55' : 'rgba(255,255,255,0.22)';
  ellipse(c, 80, 99, 40, 7, color);
  ellipse(c, 80, 99, 35, 5, trim);
  ellipse(c, 80, 99, 33, 4, color);
}

function pictures(c: Ctx, tier: number): void {
  if (tier < 4) return;
  shaded(c, 58, 14, 18, 13, '#6a4c31', '#9a7a52', '#4a3322');
  rect(c, 60, 16, 14, 9, '#9ec8e4');
  rect(c, 60, 21, 14, 4, '#6f9a52');
  rect(c, 64, 18, 3, 3, '#f4e08a');
  if (tier >= 5) {
    shaded(c, 82, 18, 11, 15, '#6a4c31', '#9a7a52', '#4a3322');
    rect(c, 84, 20, 7, 11, '#d8d0bc');
    rect(c, 85, 22, 5, 1, '#6a6a72');
    rect(c, 85, 25, 5, 1, '#6a6a72');
    rect(c, 85, 28, 3, 1, '#6a6a72');
  }
}

function plant(c: Ctx, x: number, tier: number): void {
  if (tier < 5) return;
  rect(c, x, FLOOR_Y + 12, 8, 7, '#a3593a');
  rect(c, x, FLOOR_Y + 12, 8, 1, '#c4724c');
  rect(c, x + 3, FLOOR_Y + 4, 2, 8, '#3f6a34');
  for (const [dx, dy, w] of [[-3, 5, 5], [4, 3, 5], [-2, 0, 4], [3, -1, 4], [0, -4, 3]]) ellipse(c, x + 4 + dx, FLOOR_Y + 6 + dy, w, 2, '#4f8a3f');
  rect(c, x + 2, FLOOR_Y + 3, 3, 1, '#78b45a');
}

function clutter(c: Ctx, tier: number): void {
  if (tier > 3) return;
  const rand = rng(7);
  const count = tier === 1 ? 14 : tier === 2 ? 7 : 3;
  for (let i = 0; i < count; i++) {
    const x = 4 + Math.floor(rand() * 140);
    const y = FLOOR_Y + 6 + Math.floor(rand() * 24);
    switch (i % 5) {
      case 0: // pizza box
        rect(c, x, y, 10, 7, '#b08a52');
        rect(c, x, y, 10, 1, '#d4ae72');
        rect(c, x + 2, y + 2, 6, 3, '#d86a3a');
        rect(c, x + 3, y + 3, 2, 1, '#f2c14a');
        break;
      case 1: // sock
        rect(c, x, y, 4, 2, i % 2 ? '#d8d8d8' : '#8a8aa0');
        rect(c, x + 3, y - 1, 2, 2, i % 2 ? '#c4c4c4' : '#767690');
        break;
      case 2: // can
        rect(c, x, y, 4, 6, '#b9bec6');
        rect(c, x, y, 4, 1, '#e4e8ee');
        rect(c, x + 1, y + 2, 2, 2, '#c43a3a');
        break;
      case 3: // trash bag
        ellipse(c, x + 4, y + 4, 5, 4, '#1f2024');
        rect(c, x + 2, y + 1, 2, 1, '#4a4c54');
        rect(c, x + 3, y - 1, 2, 2, '#1f2024');
        break;
      default: // crumpled paper
        rect(c, x, y, 3, 3, '#ece8dc');
        rect(c, x + 1, y + 1, 1, 1, '#b8b4a6');
    }
  }
  if (tier === 1) { // cockroaches and a stain
    for (const [rx, ry] of [[30, 96], [118, 90], [96, 104], [6, 84]]) {
      rect(c, rx, ry, 3, 1, '#3a2418');
      rect(c, rx + 3, ry - 1, 1, 1, '#3a2418');
    }
    withAlpha(c, 0.3, () => ellipse(c, 100, 56, 7, 5, '#2a2218'));
  }
}

function palace(c: Ctx, tier: number): void {
  if (tier < 7) return;
  for (const x of [2, 150]) { // marble columns
    shaded(c, x, 8, 8, 70, '#ece8e0', '#fffdf6', '#c0bab0');
    rect(c, x - 1, 6, 10, 3, '#d4ad55');
    rect(c, x - 1, 76, 10, 3, '#d4ad55');
    for (let i = 0; i < 4; i++) rect(c, x + 2 + (i % 2) * 2, 12 + i * 15, 1, 12, '#d6d0c4');
  }
  rect(c, 0, 4, W, 2, '#d4ad55'); // gold cornice
  rect(c, 0, 6, W, 1, '#a8862f');
  rect(c, 80, 0, 1, 10, '#d4ad55'); // chandelier
  ellipse(c, 80, 11, 12, 2, '#d4ad55');
  for (const dx of [-11, -6, 0, 6, 11]) {
    rect(c, 80 + dx, 13, 1, 3, '#d4ad55');
    rect(c, 80 + dx, 16, 1, 1, '#fff2b0');
  }
  withAlpha(c, 0.12, () => ellipse(c, 80, 20, 22, 14, '#fff2b0'));
}

export function drawRoom(c: Ctx, tier: number): void {
  const t = Math.min(7, Math.max(1, tier)) - 1;
  rect(c, 0, 0, W, FLOOR_Y, WALL[t]);
  if (tier >= 5) for (let x = 0; x < W; x += 8) rect(c, x, 0, 4, FLOOR_Y, WALL_DK[t]); // wallpaper stripes
  rect(c, 0, FLOOR_Y - 3, W, 3, WALL_DK[t]); // baseboard
  rect(c, 0, FLOOR_Y, W, H - FLOOR_Y, FLOOR[t]);
  for (let y = FLOOR_Y + 6; y < H; y += 6) rect(c, 0, y, W, 1, FLOOR_DK[t]); // planks
  const rand = rng(3);
  for (let y = FLOOR_Y + 6; y < H; y += 6) for (let i = 0; i < 4; i++) rect(c, Math.floor(rand() * W), y - 6, 1, 6, FLOOR_DK[t]);

  window_(c, tier);
  pictures(c, tier);
  shelf(c, tier);
  desk(c, tier);
  plant(c, 6, tier);
  plant(c, 140, tier);
  rug(c, tier);
  clutter(c, tier);
  palace(c, tier);
  if (tier <= 1) withAlpha(c, 0.28, () => rect(c, 0, 0, W, H, '#0a0a14')); // dim, gloomy
  if (tier >= 6) { // sparkle
    const r = rng(5);
    for (let i = 0; i < 14; i++) {
      const sx = 10 + Math.floor(r() * 140), sy = 8 + Math.floor(r() * 90);
      rect(c, sx, sy, 1, 1, '#fff6c8');
      if (i % 3 === 0) { rect(c, sx - 1, sy, 3, 1, '#fff6c8'); rect(c, sx, sy - 1, 1, 3, '#fff6c8'); }
    }
  }
}

export { sprite };
