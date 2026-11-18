// Dev-only: every tier combination worth eyeballing. Open /gallery.html with `npm run dev`.
import { createRoot } from 'react-dom/client';
import { PixelScene, type Tiers } from './ui/pixel/PixelScene';

const t = (body: number, mind: number, upkeep: number, spirit: number, career: number): Tiers => ({ body, mind, upkeep, spirit, career });
const CASES: [string, Tiers][] = [
  ['Level 1: Basement Nerd (all T1)', t(1, 1, 1, 1, 1)],
  ['All T2', t(2, 2, 2, 2, 2)],
  ['All T3', t(3, 3, 3, 3, 3)],
  ['All T4', t(4, 4, 4, 4, 4)],
  ['All T5', t(5, 5, 5, 5, 5)],
  ['All T6', t(6, 6, 6, 6, 6)],
  ['All T7', t(7, 7, 7, 7, 7)],
  ['Dumb Brute (body 7, mind 1)', t(7, 1, 1, 1, 1)],
  ['Frail Bookworm (body 1, mind 6)', t(1, 6, 2, 2, 2)],
  ['Obsessive Housekeeper (room 7, rest 1)', t(1, 1, 7, 1, 1)],
  ['Renaissance Hero (all T5)', t(5, 5, 5, 5, 5)],
];
createRoot(document.getElementById('root')!).render(
  <div className="g">
    {CASES.map(([name, tiers]) => (
      <figure key={name} style={{ margin: 0 }}>
        <PixelScene tiers={tiers} label={name} />
        <figcaption>{name}</figcaption>
      </figure>
    ))}
  </div>,
);
