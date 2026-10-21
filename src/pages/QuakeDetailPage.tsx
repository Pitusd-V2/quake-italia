import { lazy, Suspense, useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { Activity, ArrowLeft, ChevronRight, Clock, Layers, MapPin, Ruler } from 'lucide-react';
import { SEQUENCE_MIN_MAG } from './SequencePage';
import { useSettings } from '../state/settings';
import { useQuake, useQuakeFeed } from '../state/quakes';
import { useNow } from '../hooks/useNow';
import { distanceKm, formatKm } from '../lib/geo';
import { capitalize, depthNote, depthText, feltEstimate, magLevel, placeText, shareText, speechText } from '../lib/describe';
import { formatFull, formatMag, formatWhen, timeAgo } from '../lib/format';
import { buildQueryUrl, ingvEventPage } from '../lib/ingv';
import { MagBadge, LevelLabel } from '../components/MagBadge';
import { QuakeList } from '../components/QuakeCard';
import { ShareButton, SpeakButton } from '../components/Actions';
import { ErrorBox, ExternalLink, LoadingCards, Notice } from '../components/ui';

const QuakeMap = lazy(() => import('../components/QuakeMap'));

export function QuakeDetailPage() {
  const { id } = useParams();
  const { settings } = useSettings();
  const feed = useQuakeFeed();
  const now = useNow();
  const { quake, isLoading, error } = useQuake(id, feed.data);
  const home = settings.home;

  const nearby = useMemo(() => {
    if (!quake || !feed.data) return [];
    return feed.data.filter((q) => q.id !== quake.id && distanceKm(q, quake) <= 20);
  }, [quake, feed.data]);

  if (isLoading) {
    return (
      <div className="container">
        <LoadingCards count={2} label="Sto caricando il terremoto…" />
      </div>
    );
  }
  if (error || !quake) {
    return (
      <div className="container stack-lg">
        <h1 tabIndex={-1}>Terremoto non trovato</h1>
        {error ? (
          <ErrorBox message={(error as Error).message} />
        ) : (
          <p>Non troviamo questo terremoto nei dati INGV. Forse il link non è corretto.</p>
        )}
        <Link to="/terremoti" className="btn btn--primary">
          Vedi tutti i terremoti
        </Link>
      </div>
    );
  }

  const p = placeText(quake.place);
  const lvl = magLevel(quake.mag);
  const note = depthNote(quake.depthKm);
  const felt = home ? feltEstimate(quake, home) : null;
  const pageUrl = `${window.location.origin}/terremoto/${quake.id}`;

  return (
    <div className="container stack-lg">
      <Link to="/terremoti" className="back-link">
        <ArrowLeft aria-hidden="true" /> Tutti i terremoti
      </Link>

      <header className="detail-hero">
        <MagBadge mag={quake.mag} size="lg" />
        <div className="stack-sm">
          <h1 tabIndex={-1}>{p.main}</h1>
          {p.sub && <p className="muted">{p.sub}</p>}
          <LevelLabel mag={quake.mag} />
        </div>
      </header>

      <section className="card stack" aria-labelledby="meaning">
        <h2 id="meaning">Cosa significa</h2>
        <p className="lead">
          Una scossa <span className="strong">{lvl.name.toLowerCase()}</span>. {lvl.feel}
        </p>
        <div className="row">
          <SpeakButton text={speechText(quake, now, home)} />
          <ShareButton title="Terremoto" text={shareText(quake, now)} url={pageUrl} />
        </div>
        <p className="small">
          <Link to="/capire/magnitudo-e-intensita">Cos’è la magnitudo, e perché è diversa dall’intensità?</Link>
        </p>
      </section>

      {quake.mag >= SEQUENCE_MIN_MAG && (
        <Link to={`/sequenza/${quake.id}`} className="seq-card">
          <Activity aria-hidden="true" />
          <span>
            <span className="strong">Cosa sta succedendo nella zona</span>
            <span>Le scosse dopo questa, spiegate in modo semplice. Si aggiorna da solo.</span>
          </span>
          <ChevronRight aria-hidden="true" />
        </Link>
      )}

      <section className="card" aria-labelledby="facts-title">
        <h2 id="facts-title" className="visually-hidden">
          I dati della scossa
        </h2>
        <dl className="facts-list">
          <div>
            <dt>
              <Clock aria-hidden="true" /> Quando
            </dt>
            <dd>
              {capitalize(formatWhen(quake.time, now))} <span className="muted">({timeAgo(quake.time, now)})</span>
            </dd>
          </div>
          <div>
            <dt>
              <MapPin aria-hidden="true" /> Dove
            </dt>
            <dd>{p.full}</dd>
          </div>
          <div>
            <dt>
              <Layers aria-hidden="true" /> Profondità
            </dt>
            <dd>
              {capitalize(depthText(quake.depthKm))}
              {note && <span className="block muted">{note}</span>}
              {quake.depthKm >= 70 && (
                <Link to="/capire/perche-l-italia-trema" className="block small">
                  Perché ci sono terremoti così profondi?
                </Link>
              )}
            </dd>
          </div>
          {home && felt && (
            <div>
              <dt>
                <Ruler aria-hidden="true" /> Da {home.name}
              </dt>
              <dd>
                {formatKm(distanceKm(home, quake))} — <span className={`chip chip--felt-${felt.key}`}>{felt.label}</span>
                <span className="block muted">{felt.explain} (stima indicativa)</span>
              </dd>
            </div>
          )}
        </dl>
      </section>

      <Suspense fallback={<div className="quake-map quake-map--loading">Sto caricando la mappa…</div>}>
        <QuakeMap
          quakes={[quake, ...nearby]}
          home={home}
          selectedId={quake.id}
          focus={{ center: quake, zoom: 8 }}
          cooperative
          label={`Mappa: ${p.full}`}
          className="quake-map--detail"
        />
      </Suspense>

      <Notice tone="info" title="I numeri possono cambiare un po'">
        <p>
          Subito dopo una scossa l'INGV pubblica una prima stima, che poi i sismologi controllano. Magnitudo e posizione
          possono essere aggiornate nelle ore successive.
        </p>
      </Notice>

      <section className="card stack" aria-labelledby="hsit">
        <h2 id="hsit">L'hai sentita?</h2>
        <p>Racconta all'INGV cosa hai sentito: aiuti i sismologi a capire gli effetti di questa scossa.</p>
        <div className="row">
          <ExternalLink href="https://www.hsit.it/" className="btn btn--secondary">
            Questionario «Hai sentito il terremoto?»
          </ExternalLink>
          <ExternalLink href={ingvEventPage(quake.id)} className="btn btn--ghost">
            Pagina ufficiale INGV
          </ExternalLink>
        </div>
      </section>

      {nearby.length > 0 && (
        <section className="stack" aria-labelledby="same-zone">
          <h2 id="same-zone">Altre scosse nella stessa zona (ultimi 7 giorni)</h2>
          <QuakeList quakes={nearby} now={now} home={home} pageSize={5} />
        </section>
      )}

      {/* Per chi vuole i numeri esatti: chiusi di base, si aprono con un tocco. */}
      <details className="card stack tech-details">
        <summary>
          <h2 id="tech">Dati tecnici</h2>
        </summary>
          <dl className="tech-list tabular">
            <dt>ID evento</dt>
            <dd>{quake.id}</dd>
            <dt>Ora (UTC)</dt>
            <dd>{quake.time.toISOString().replace('T', ' ').slice(0, 23)}</dd>
            <dt>Ora italiana</dt>
            <dd>{formatFull(quake.time)}</dd>
            <dt>Latitudine / Longitudine</dt>
            <dd>
              {quake.lat.toFixed(4)}, {quake.lon.toFixed(4)}
            </dd>
            <dt>Profondità</dt>
            <dd>{quake.depthKm.toFixed(1)} km</dd>
            <dt>Magnitudo</dt>
            <dd>
              {formatMag(quake.mag)} ({quake.magType})
            </dd>
            <dt>Autore / versione</dt>
            <dd>
              {quake.author} / {quake.version ?? '—'}
            </dd>
            <dt>Descrizione INGV</dt>
            <dd>{quake.place}</dd>
          </dl>
          <div className="row">
            <ExternalLink href={buildQueryUrl({ start: new Date(0), eventId: quake.id })} className="btn btn--ghost">
              GeoJSON
            </ExternalLink>
            <ExternalLink
              href={buildQueryUrl({ start: new Date(0), eventId: quake.id }).replace('format=geojson', 'format=xml')}
              className="btn btn--ghost"
            >
              QuakeML
            </ExternalLink>
          </div>
      </details>
    </div>
  );
}
