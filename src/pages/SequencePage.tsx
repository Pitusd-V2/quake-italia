import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowLeft, Info, LifeBuoy, TriangleAlert } from 'lucide-react';
import { useSettings } from '../state/settings';
import { useQuake, useQuakeFeed, REFRESH_MS } from '../state/quakes';
import { useNow } from '../hooks/useNow';
import { fetchQuakes, ingvEventPage } from '../lib/ingv';
import { capitalize, magLevel, placeText } from '../lib/describe';
import { sequenceTrend, trendText } from '../lib/trend';
import { formatInt, formatMag, formatTime, formatWhen, timeAgo } from '../lib/format';
import type { Quake } from '../lib/types';
import { MagBadge } from '../components/MagBadge';
import { QuakeCard } from '../components/QuakeCard';
import { SpeakButton } from '../components/Actions';
import { ErrorBox, ExternalLink, LoadingCards, Notice } from '../components/ui';

/** Da questa magnitudo in su ha senso parlare di "sequenza" e mostrare la pagina. */
export const SEQUENCE_MIN_MAG = 3.5;
export const SEQUENCE_RADIUS_KM = 30;

const dayFmt = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', weekday: 'short', day: 'numeric', month: 'short' });

interface Block {
  from: number;
  to: number;
  count: number;
  maxMag: number;
}

/** Raggruppa le repliche in intervalli di tempo adatti alla durata della sequenza. */
function timeBlocks(after: Quake[], start: number, now: number): { blocks: Block[]; unit: string } {
  const elapsed = now - start;
  const step = elapsed <= 6 * 3_600_000 ? 30 * 60_000 : elapsed <= 48 * 3_600_000 ? 3 * 3_600_000 : 24 * 3_600_000;
  const unit = step === 30 * 60_000 ? 'mezz’ora' : step === 3 * 3_600_000 ? '3 ore' : 'giorno';
  const blocks: Block[] = [];
  for (let t = start; t < now; t += step) blocks.push({ from: t, to: Math.min(t + step, now), count: 0, maxMag: 0 });
  for (const q of after) {
    const i = Math.min(blocks.length - 1, Math.floor((q.time.getTime() - start) / step));
    if (i >= 0) {
      blocks[i].count++;
      blocks[i].maxMag = Math.max(blocks[i].maxMag, q.mag);
    }
  }
  return { blocks: blocks.slice(-16), unit };
}

function blockLabel(b: Block, unit: string): string {
  const from = new Date(b.from);
  const to = new Date(b.to);
  return unit === 'giorno' ? dayFmt.format(from) : `${formatTime(from)}–${formatTime(to)}`;
}

export function SequencePage() {
  const { id } = useParams();
  const { settings } = useSettings();
  const feed = useQuakeFeed();
  const now = useNow(30_000);
  const { quake: main, isLoading, error } = useQuake(id, feed.data);

  const seq = useQuery({
    queryKey: ['sequence', id],
    queryFn: ({ signal }) =>
      fetchQuakes(
        { start: new Date(main!.time.getTime() - 2 * 3_600_000), around: { lat: main!.lat, lon: main!.lon, radiusKm: SEQUENCE_RADIUS_KM } },
        signal,
      ),
    enabled: !!main,
    refetchInterval: REFRESH_MS,
  });

  const data = useMemo(() => {
    if (!main || !seq.data) return null;
    const t0 = main.time.getTime();
    const after = seq.data.filter((q) => q.id !== main.id && q.time.getTime() > t0).sort((a, b) => a.time.getTime() - b.time.getTime());
    const bigger = after.filter((q) => q.mag > main.mag);
    const strongestAfter = after.reduce<Quake | undefined>((a, b) => (!a || b.mag > a.mag ? b : a), undefined);
    const { blocks, unit } = timeBlocks(after, t0, now.getTime());
    const maxCount = Math.max(1, ...blocks.map((b) => b.count));
    const trend = after.length ? trendText(sequenceTrend(after, main.time, now)) : null;
    return { after, bigger, strongestAfter, blocks, unit, maxCount, trend };
  }, [main, seq.data, now]);

  if (isLoading) {
    return (
      <div className="container">
        <LoadingCards count={2} label="Sto caricando la sequenza…" />
      </div>
    );
  }
  if (error || !main) {
    return (
      <div className="container stack-lg">
        <h1 tabIndex={-1}>Sequenza non trovata</h1>
        {error ? <ErrorBox message={(error as Error).message} /> : <p>Non troviamo questo terremoto nei dati INGV.</p>}
        <Link to="/terremoti" className="btn btn--primary">
          Vedi tutti i terremoti
        </Link>
      </div>
    );
  }

  const p = placeText(main.place);
  const lvl = magLevel(main.mag);
  const summary = data
    ? `${capitalize(formatWhen(main.time, now))} c'è stata una scossa ${lvl.name.toLowerCase()} di magnitudo ${formatMag(main.mag)} vicino a ${p.main}. ` +
      (data.after.length
        ? `Da allora ci sono state ${formatInt(data.after.length)} scosse entro ${SEQUENCE_RADIUS_KM} km${data.strongestAfter ? `, la più forte di magnitudo ${formatMag(data.strongestAfter.mag)}` : ''}.`
        : 'Da allora non sono state registrate altre scosse nella zona.')
    : '';

  return (
    <div className="container stack-lg">
      <Link to={`/terremoto/${main.id}`} className="back-link">
        <ArrowLeft aria-hidden="true" /> Torna alla scossa
      </Link>

      <header className="page-header">
        <p className="eyebrow">Si aggiorna da solo ogni minuto</p>
        <h1 tabIndex={-1}>Cosa sta succedendo vicino a {p.main}</h1>
      </header>

      {main.mag < SEQUENCE_MIN_MAG && (
        <Notice tone="info" title="Scossa di piccola intensità">
          <p>Per scosse di questa intensità di solito non si parla di sequenza, ma puoi comunque vedere l’attività della zona.</p>
        </Notice>
      )}

      <section className="card stack" aria-labelledby="seq-summary">
        <div className="best-match__head">
          <MagBadge mag={main.mag} size="lg" />
          <div>
            <h2 id="seq-summary">Scossa principale</h2>
            <p>{p.full}</p>
            <p className="muted">
              {capitalize(formatWhen(main.time, now))} ({timeAgo(main.time, now)})
            </p>
          </div>
        </div>
        {seq.isPending && <LoadingCards count={1} label="Conto le scosse successive…" />}
        {seq.isError && <ErrorBox message={(seq.error as Error).message} onRetry={() => seq.refetch()} />}
        {data && (
          <>
            <p className="lead">{summary}</p>
            {data.trend && <p className="strong">{data.trend}</p>}
            <SpeakButton text={data.trend ? `${summary} ${data.trend}` : summary} />
          </>
        )}
      </section>

      {data && data.bigger.length > 0 && (
        <Notice tone="warn" icon={<TriangleAlert />} title="Dopo questa scossa ne è arrivata una più forte">
          <p>Segui la sequenza a partire dalla scossa più forte:</p>
          <Link to={`/sequenza/${data.bigger.reduce((a, b) => (b.mag > a.mag ? b : a)).id}`} className="btn btn--secondary">
            Vai alla scossa più forte
          </Link>
        </Notice>
      )}

      {data && data.after.length > 0 && (
        <section className="card stack" aria-labelledby="seq-time">
          <h2 id="seq-time" className="icon-title">
            <Activity aria-hidden="true" /> Le scosse nel tempo
          </h2>
          <p className="muted">Numero di scosse ogni {data.unit}, entro {SEQUENCE_RADIUS_KM} km. Più lunga la barra, più scosse.</p>
          <ul className="time-bars">
            {data.blocks.map((b) => (
              <li key={b.from}>
                <span className="time-bars__label tabular">{blockLabel(b, data.unit)}</span>
                <span className="time-bars__track" aria-hidden="true">
                  <span style={{ width: `${(b.count / data.maxCount) * 100}%` }} />
                </span>
                <span className="time-bars__value tabular">
                  {b.count} <span className="visually-hidden">scosse</span>
                  {b.count > 0 && <span className="muted small"> (max {formatMag(b.maxMag)})</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card stack" aria-labelledby="seq-normal">
        <h2 id="seq-normal" className="icon-title">
          <Info aria-hidden="true" /> Cosa è normale sapere
        </h2>
        <ul className="advice">
          <li>Dopo una scossa forte è normale che ne arrivino altre (le <span className="strong">repliche</span>), anche per giorni o settimane.</li>
          <li>Di solito le repliche sono più deboli e diventano meno frequenti col passare del tempo.</li>
          <li>
            Nessuno però può dire se arriverà una scossa più forte: per questo è giusto restare prudenti anche quando
            sembra tutto calmo.
          </li>
          <li>Non rientrare in edifici danneggiati finché un tecnico non li ha controllati.</li>
          <li>
            Dopo giorni di scosse capita a molte persone di sentire tremare anche quando è tutto fermo: è il{' '}
            <Link to="/capire/mal-da-terremoto">«mal da terremoto»</Link>. È comune e di solito passa da solo.
          </li>
          <li>
            Segui le fonti ufficiali: il tuo Comune, la Protezione Civile, l’INGV. Diffida delle «previsioni» sui social:{' '}
            <Link to="/e-vero">ecco le voci più comuni, e perché sono false</Link>.
          </li>
        </ul>
        <div className="row">
          <ExternalLink href={ingvEventPage(main.id)} className="btn btn--ghost">
            Scheda ufficiale INGV
          </ExternalLink>
          <ExternalLink href="https://ingvterremoti.com/" className="btn btn--ghost">
            Blog INGVterremoti
          </ExternalLink>
        </div>
      </section>

      <section className="card stack" aria-labelledby="seq-help">
        <h2 id="seq-help" className="icon-title">
          <LifeBuoy aria-hidden="true" /> Dopo una scossa
        </h2>
        <p>
          In caso di emergenza chiama il <a href="tel:112">112</a>.
        </p>
        <div className="row">
          <Link to="/cosa-fare" className="btn btn--secondary">
            Cosa fare dopo una scossa
          </Link>
          <Link to="/danni-casa" className="btn btn--secondary">
            La casa ha dei danni?
          </Link>
        </div>
      </section>

      {data && data.after.length > 0 && (
        <section className="stack" aria-labelledby="seq-latest">
          <h2 id="seq-latest">Le scosse più recenti</h2>
          <ul className="quake-list">
            {[...data.after].reverse().slice(0, 5).map((q) => (
              <li key={q.id}>
                <QuakeCard quake={q} now={now} home={settings.home} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
