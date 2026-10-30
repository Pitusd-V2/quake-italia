import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { feltLike } from '../lib/feltLike';
import type { Place, Quake } from '../lib/types';
import { SpeakButton } from './Actions';

/** Un lampadario che oscilla di più o di meno: si capisce prima di leggere. Fermo se la scossa non si è sentita. */
function Lamp({ swingDeg }: { swingDeg: number }) {
  return (
    <svg
      className={`felt-lamp${swingDeg > 0 ? ' felt-lamp--swing' : ''}`}
      style={{ '--swing': `${swingDeg}deg` } as CSSProperties}
      viewBox="0 0 64 72"
      width="64"
      height="72"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="22" y="2" width="20" height="4" rx="2" className="felt-lamp__ceiling" />
      <g className="felt-lamp__arm">
        <line x1="32" y1="6" x2="32" y2="40" className="felt-lamp__cord" />
        <path d="M18 52 Q32 34 46 52 Z" className="felt-lamp__shade" />
        <circle cx="32" cy="55" r="4" className="felt-lamp__bulb" />
      </g>
    </svg>
  );
}

export function FeltLikeCard({ quake, place }: { quake: Quake; place: Place }) {
  const f = feltLike(quake, place);
  return (
    <section className="card felt-like" aria-labelledby={`felt-like-${quake.id}`}>
      <Lamp swingDeg={f.swingDeg} />
      <div className="stack-sm">
        <p className="eyebrow">Così si è sentita a {place.name}</p>
        <h2 id={`felt-like-${quake.id}`} className="felt-like__title">
          {f.title}
        </h2>
        <p>{f.text}</p>
        {f.degree >= 6 && (
          <p>
            <Link to="/danni-casa">Se vedi crepe o danni: cosa fare</Link>
          </p>
        )}
        <p className="small muted">
          Stima per il centro del comune: circa grado {f.roman} della scala Mercalli. Ai piani alti, su terreni morbidi o
          in case vecchie si sente di più. <Link to="/capire/magnitudo-e-intensita">Magnitudo e intensità</Link>
        </p>
        <div>
          <SpeakButton text={`Così si è sentita a ${place.name}: ${f.title}. ${f.text}`} />
        </div>
      </div>
    </section>
  );
}
