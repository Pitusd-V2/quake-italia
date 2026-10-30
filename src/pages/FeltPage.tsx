import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Clock, HeartHandshake, MapPin } from 'lucide-react';
import { useSettings } from '../state/settings';
import { useQuakeFeed } from '../state/quakes';
import { useNow } from '../hooks/useNow';
import { distanceKm, formatKm } from '../lib/geo';
import { feltEstimate, magLevel, placeText, speechText } from '../lib/describe';
import { daysAgo, formatMag, formatTime, formatWhen, timeAgo } from '../lib/format';
import { fetchQuakes } from '../lib/ingv';
import { impactAt, impactRank } from '../lib/impact';
import type { Place, Quake } from '../lib/types';
import { MagBadge, LevelLabel } from '../components/MagBadge';
import { FeltLikeCard } from '../components/FeltLikeCard';
import { QuakeCard } from '../components/QuakeCard';
import { PlacePicker } from '../components/PlacePicker';
import { SpeakButton } from '../components/Actions';
import { ErrorBox, ExternalLink, LoadingCards, Notice, PageHeader, Segmented } from '../components/ui';

type Window = '60' | '180' | '720';
const WINDOWS: { value: Window; label: string }[] = [
  { value: '60', label: "Nell'ultima ora" },
  { value: '180', label: 'Nelle ultime 3 ore' },
  { value: '720', label: 'Nelle ultime 12 ore' },
];
const WIDER: Record<Window, Window | null> = { '60': '180', '180': '720', '720': null };

interface Candidate {
  quake: Quake;
  ratio: number;
}

function BestMatch({ quake, place, now }: { quake: Quake; place: Place; now: Date }) {
  const p = placeText(quake.place);
  const felt = feltEstimate(quake, place);
  const lvl = magLevel(quake.mag, quake.depthKm);
  return (
    <article className="card best-match" aria-labelledby="best-title">
      <p className="eyebrow">Molto probabilmente era questa</p>
      <div className="best-match__head">
        <MagBadge mag={quake.mag} depthKm={quake.depthKm} size="lg" />
        <div>
          <h2 id="best-title">{p.main}</h2>
          {p.sub && <p className="muted">{p.sub}</p>}
          <LevelLabel mag={quake.mag} depthKm={quake.depthKm} />
        </div>
      </div>
      <ul className="facts">
        <li>
          <Clock aria-hidden="true" />
          <span>
            <span className="strong">{timeAgo(quake.time, now)}</span> — {formatWhen(quake.time, now)}
          </span>
        </li>
        <li>
          <MapPin aria-hidden="true" />
          <span>
            A <span className="strong">{formatKm(distanceKm(place, quake))}</span> da {place.name}
          </span>
        </li>
      </ul>
      <p className={`chip chip--felt-${felt.key}`}>{felt.label}</p>
      <p>
        {felt.explain} {lvl.feel}
      </p>
      <div className="row">
        <Link to={`/terremoto/${quake.id}`} className="btn btn--primary">
          Tutti i dettagli
        </Link>
        <SpeakButton text={`Molto probabilmente hai sentito questa scossa. ${speechText(quake, now, place)}`} />
      </div>
    </article>
  );
}

export function FeltPage() {
  const { settings } = useSettings();
  const feed = useQuakeFeed();
  const now = useNow(15_000);
  const [place, setPlace] = useState<Place | null>(settings.home);
  const [changing, setChanging] = useState(false);
  const [win, setWin] = useState<Window>('60');

  // Chi apre questa pagina ha appena sentito qualcosa: chiediamo subito dati freschi.
  const { refetch } = feed;
  useEffect(() => {
    void refetch();
  }, [refetch]);

  const { candidates, tooWeak } = useMemo(() => {
    if (!feed.data || !place) return { candidates: null, tooWeak: 0 };
    const since = now.getTime() - Number(win) * 60_000;
    const recent = feed.data.filter((q) => q.time.getTime() >= since);
    const scored: Candidate[] = recent.map((q) => ({ quake: q, ratio: feltEstimate(q, place).ratio }));
    return {
      candidates: scored.filter((c) => c.ratio <= 2.5).sort((a, b) => a.ratio - b.ratio),
      // Scosse vicine ma troppo deboli per essere sentite: le citiamo per non dare l'idea che "non ci sia niente".
      tooWeak: scored.filter((c) => c.ratio > 2.5 && distanceKm(place, c.quake) <= 30).length,
    };
  }, [feed.data, place, win, now]);

  // Ultime settimane: c'è stata qui una scossa sentita bene? Serve solo per la nota sul «mal da terremoto».
  const noneNow = candidates !== null && candidates.length === 0;
  const pastMonth = useQuery({
    queryKey: ['felt-past-month', place?.lat, place?.lon],
    queryFn: ({ signal }) =>
      fetchQuakes({ start: daysAgo(30), minMag: 3, around: { lat: place!.lat, lon: place!.lon, radiusKm: 150 } }, signal),
    enabled: !!place && noneNow,
    staleTime: 30 * 60_000,
  });
  const pastFelt = useMemo(() => {
    if (!place || !pastMonth.data) return null;
    const since = now.getTime() - Number(win) * 60_000;
    return (
      pastMonth.data
        .filter((q) => q.time.getTime() < since && impactRank(impactAt(q, place)) >= impactRank('felt'))
        .sort((a, b) => b.time.getTime() - a.time.getTime())[0] ?? null
    );
  }, [pastMonth.data, place, win, now]);

  const updated = feed.dataUpdatedAt ? formatTime(new Date(feed.dataUpdatedAt)) : null;
  const winLabel = WINDOWS.find((w) => w.value === win)!.label.toLowerCase();

  return (
    <div className="container stack-lg">
      <PageHeader
        title="Ho sentito una scossa"
        intro="Cerchiamo tra i terremoti registrati dall'INGV quello che potresti aver sentito."
      />

      <section className="card stack" aria-labelledby="where">
        <h2 id="where">Dove ti trovi?</h2>
        {place && !changing ? (
          <div className="row row--between">
            <p>
              <MapPin className="inline-icon" aria-hidden="true" /> Cerco vicino a <span className="strong">{place.name}</span>
            </p>
            <button type="button" className="btn btn--ghost" onClick={() => setChanging(true)}>
              Non sono qui
            </button>
          </div>
        ) : (
          <PlacePicker
            gpsLabel="Usa la posizione dove sono adesso"
            label="Oppure scrivi il comune dove ti trovi"
            onPick={(p) => {
              setPlace(p);
              setChanging(false);
            }}
          />
        )}
        <Segmented legend="Quando l'hai sentita?" options={WINDOWS} value={win} onChange={setWin} />
      </section>

      {place && (
        <section className="stack" aria-live="polite" aria-busy={feed.isFetching}>
          {feed.isPending && <LoadingCards count={1} label="Sto controllando i dati INGV…" />}
          {feed.isError && !feed.data && <ErrorBox message={(feed.error as Error).message} onRetry={() => feed.refetch()} />}

          {candidates && candidates.length > 0 && (
            <>
              <BestMatch quake={candidates[0].quake} place={place} now={now} />
              <FeltLikeCard quake={candidates[0].quake} place={place} />
              {candidates.length > 1 && (
                <div className="stack">
                  <h2>Altre scosse nella zona {winLabel}</h2>
                  <ul className="quake-list">
                    {candidates.slice(1, 6).map((c) => (
                      <li key={c.quake.id}>
                        <QuakeCard quake={c.quake} now={now} home={place} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {candidates && candidates.length === 0 && (
            <Notice tone="info" title={`Per ora non risulta nessuna scossa avvertibile vicino a ${place.name} ${winLabel}.`}>
              {tooWeak > 0 && (
                <p>
                  Gli strumenti hanno registrato {tooWeak === 1 ? 'una microscossa' : `${tooWeak} microscosse`} entro 30 km,
                  ma {tooWeak === 1 ? 'era troppo debole' : 'erano troppo deboli'} per essere sentite dalle persone.
                </p>
              )}
              <p>
                I dati dell'INGV possono arrivare con qualche minuto di ritardo. Questa pagina controlla di nuovo da sola ogni
                minuto{updated ? ` (ultimo controllo alle ${updated})` : ''}.
              </p>
              {WIDER[win] && (
                <button type="button" className="btn btn--secondary" onClick={() => setWin(WIDER[win]!)}>
                  Cerca in un periodo più lungo
                </button>
              )}
            </Notice>
          )}

          {noneNow && pastFelt && (
            <Notice tone="info" title="Ti sembra di sentire ancora tremare?">
              <p>
                Qui {formatWhen(pastFelt.time, now)} si è sentita bene una scossa (magnitudo {formatMag(pastFelt.mag)},{' '}
                {placeText(pastFelt.place).main}). Dopo una scossa così, a molte persone capita di sentire tremare anche quando
                è tutto fermo: si chiama <span className="strong">«mal da terremoto»</span>. È comune, non stai esagerando, e
                di solito passa da solo nel giro di qualche settimana.
              </p>
              <p>Per capire se trema davvero, guarda un lampadario o l’acqua in un bicchiere: se restano fermi, di solito non sta tremando.</p>
              <Link to="/capire/mal-da-terremoto" className="btn btn--secondary">
                Cos’è il mal da terremoto
              </Link>
            </Notice>
          )}
        </section>
      )}

      <section className="card stack" aria-labelledby="help-ingv">
        <h2 id="help-ingv">
          <HeartHandshake className="inline-icon" aria-hidden="true" /> Aiuta i sismologi
        </h2>
        <p>
          Se hai sentito la scossa puoi raccontarlo all'INGV con il questionario ufficiale «Hai sentito il terremoto?». Bastano
          pochi minuti e serve a capire gli effetti nei diversi paesi.
        </p>
        <ExternalLink href="https://www.hsit.it/" className="btn btn--secondary">
          Compila il questionario INGV
        </ExternalLink>
      </section>

      <Link to="/cosa-fare" className="btn btn--secondary btn--block">
        Cosa fare dopo una scossa
      </Link>
    </div>
  );
}
