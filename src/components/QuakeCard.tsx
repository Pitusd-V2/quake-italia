import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Clock, MapPin } from 'lucide-react';
import { distanceKm, formatKm } from '../lib/geo';
import { feltEstimate, placeText } from '../lib/describe';
import { formatWhen, timeAgo } from '../lib/format';
import type { Place, Quake } from '../lib/types';
import { LevelLabel, MagBadge } from './MagBadge';

/** Mostrata solo se la scossa può essersi sentita: per quelle lontane sarebbe solo rumore. */
export function FeltChip({ quake, at }: { quake: Quake; at: Place }) {
  const felt = feltEstimate(quake, at);
  if (felt.key === 'no') return null;
  return <span className={`chip chip--felt-${felt.key}`}>{felt.label}</span>;
}

export function QuakeCard({
  quake,
  now,
  home,
  headingLevel = 3,
}: {
  quake: Quake;
  now: Date;
  home?: Place | null;
  headingLevel?: 2 | 3 | 4;
}) {
  const p = placeText(quake.place);
  const H = `h${headingLevel}` as const;
  return (
    <Link to={`/terremoto/${quake.id}`} className="quake-card">
      <MagBadge mag={quake.mag} depthKm={quake.depthKm} />
      <div className="quake-card__body">
        <H className="quake-card__title">{p.main}</H>
        {p.sub && <span className="quake-card__sub">{p.sub}</span>}
        <span className="quake-card__meta">
          <Clock className="inline-icon" aria-hidden="true" />
          <span>
            {timeAgo(quake.time, now)} <span className="muted">· {formatWhen(quake.time, now)}</span>
          </span>
        </span>
        {home && (
          <span className="quake-card__meta">
            <MapPin className="inline-icon" aria-hidden="true" />
            <span>
              a {formatKm(distanceKm(home, quake))} da {home.name}
            </span>
          </span>
        )}
        <span className="quake-card__tags">
          <LevelLabel mag={quake.mag} depthKm={quake.depthKm} />
          {home && <FeltChip quake={quake} at={home} />}
        </span>
      </div>
      <ChevronRight className="quake-card__chevron" aria-hidden="true" />
    </Link>
  );
}

export function QuakeList({
  quakes,
  now,
  home,
  pageSize = 20,
  emptyText = 'Nessun terremoto da mostrare.',
}: {
  quakes: Quake[];
  now: Date;
  home?: Place | null;
  pageSize?: number;
  emptyText?: string;
}) {
  const [shown, setShown] = useState(pageSize);
  if (!quakes.length) return <p className="empty">{emptyText}</p>;
  const rest = quakes.length - shown;
  return (
    <>
      <ul className="quake-list">
        {quakes.slice(0, shown).map((q) => (
          <li key={q.id}>
            <QuakeCard quake={q} now={now} home={home} />
          </li>
        ))}
      </ul>
      {rest > 0 && (
        <button type="button" className="btn btn--secondary btn--block" onClick={() => setShown((s) => s + pageSize)}>
          {rest === 1 ? 'Mostra l’ultimo' : `Mostra altri ${Math.min(rest, pageSize)} (ne restano ${rest})`}
        </button>
      )}
    </>
  );
}
