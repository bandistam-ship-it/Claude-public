// Dev-only: every Body tier. Open /gallery.html with `npm run dev`.
import { createRoot } from 'react-dom/client';
import { PixelScene } from './ui/pixel/PixelScene';

const NAMES = ['Frail', 'Weak', 'Average', 'Fit', 'Athletic', 'Powerful', 'Legendary'];
createRoot(document.getElementById('root')!).render(
  <div className="g">
    {NAMES.map((name, i) => (
      <figure key={name} style={{ margin: 0 }}>
        <PixelScene body={i + 1} label={name} />
        <figcaption>Tier {i + 1}: {name}</figcaption>
      </figure>
    ))}
  </div>,
);
