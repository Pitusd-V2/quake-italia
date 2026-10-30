import type { CSSProperties } from 'react';
import { magLevel, type Level } from '../lib/describe';
import { formatMag } from '../lib/format';

const levelStyle = (l: Level) =>
  ({ '--lvl': `var(--lvl${l})`, '--on-lvl': `var(--on-lvl${l})` }) as CSSProperties;

/** Il numero della magnitudo, grande e colorato secondo il livello. */
/** Con `depthKm` le scosse molto superficiali salgono di un livello (vedi magLevel). */
export function MagBadge({ mag, depthKm, size = 'md' }: { mag: number; depthKm?: number; size?: 'sm' | 'md' | 'lg' }) {
  const lvl = magLevel(mag, depthKm);
  return (
    <span className={`mag mag--${size}`} style={levelStyle(lvl.level)}>
      <span className="mag__value tabular">{formatMag(mag)}</span>
      <span className="mag__unit">magnitudo</span>
    </span>
  );
}

/** Tacche crescenti: il livello si capisce anche senza distinguere i colori. */
export function LevelBars({ level }: { level: Level }) {
  return (
    <span className="bars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= level ? 'bars__bar bars__bar--on' : 'bars__bar'} style={{ height: `${30 + i * 14}%` }} />
      ))}
    </span>
  );
}

/** Etichetta a parole: "▂▃▅ Leggera" */
export function LevelLabel({ mag, depthKm }: { mag: number; depthKm?: number }) {
  const lvl = magLevel(mag, depthKm);
  return (
    <span className="level" style={levelStyle(lvl.level)}>
      <LevelBars level={lvl.level} />
      {lvl.name}
    </span>
  );
}
