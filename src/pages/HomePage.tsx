import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Activity, BookOpen, ChevronDown, ChevronRight, CircleCheck, Ear, Info, LifeBuoy, MapPin, Phone, ShieldAlert, TriangleAlert } from 'lucide-react';
import { findComune, ZONE_INFO } from '../lib/seismicZones';
import { readRaw, writeJson } from '../lib/storage';
import { SEQUENCE_MIN_MAG, SEQUENCE_RADIUS_KM } from './SequencePage';
import { TAGLINE } from '../lib/brand';
import { useSettings } from '../state/settings';
import { useQuakeFeed } from '../state/quakes';
import { useNow } from '../hooks/useNow';
import { distanceKm, formatKm } from '../lib/geo';
import { placeText } from '../lib/describe';
import { formatInt, formatMag, formatWhen, hoursAgo, timeAgo } from '../lib/format';
import { homeImpact, impactAt, impactRank, isNightInItaly, shows112, type Impact } from '../lib/impact';
import { sequenceTrend, TREND_SHORT } from '../lib/trend';
import { activeZones } from '../lib/zones';
import type { Place, Quake } from '../lib/types';
import { QuakeCard } from '../components/QuakeCard';
import { PlacePicker } from '../components/PlacePicker';
import { SpeakButton } from '../components/Actions';
import { ErrorBox, LoadingCards } from '../components/ui';
import { volcanoShort } from '../components/VolcanoZones';

type Tone = 'ok' | 'info' | 'warn' | 'danger';

interface Status {
  tone: Tone;
  title: string;
  lines: string[];
  quake?: Quake;
  /** Poche cose da fare subito, solo quando servono. */
  todo?: string[];
  showSafety?: boolean;
  /** 'button' solo dove sono possibili danni; 'line' per una scossa forte che non è per forza un'emergenza. */
  emergency?: 'button' | 'line';
}

const strongest = (qs: Quake[]) => qs.reduce<Quake | undefined>((a, b) => (!a || b.mag > a.mag ? b : a), undefined);

const IMPACT_TONE: Record<Impact, Tone> = { none: 'ok', weak: 'info', felt: 'info', strong: 'warn', damage: 'danger' };

/** Cosa ha voluto dire la scossa a casa tua, in una frase. */
const IMPACT_TEXT: Record<Impact, string> = {
  none: '',
  weak: 'Qui è arrivata leggera: qualcuno può averla sentita, altri no. Una scossa così non fa danni.',
  felt: 'Qui si è sentita chiaramente, ma una scossa così di solito non fa danni. È normale essersi spaventati.',
  strong: 'Qui si è sentita forte e può aver fatto cadere qualche oggetto. Di solito non fa danni agli edifici.',
  damage: 'Qui può aver causato danni, soprattutto agli edifici più vecchi o fragili.',
};

/* Dalle indicazioni «Subito dopo» della pagina Cosa fare (Io non rischio). */
const TODO: Partial<Record<Impact, string[]>> = {
  strong: ['Guarda con calma se in casa ci sono crepe nuove o se senti odore di gas.', 'Possono arrivare altre scosse, di solito più deboli.'],
  damage: [
    'Controlla come stanno le persone vicino a te.',
    'Esci con prudenza, con le scarpe ai piedi, senza usare l’ascensore.',
    'Se senti odore di gas non accendere fiamme né interruttori.',
    'Possono arrivare altre scosse: non rientrare in edifici danneggiati.',
  ],
};

/** La risposta alla domanda "è successo qualcosa vicino a me?" */
function homeStatus(last24: Quake[], home: Place, radiusKm: number, now: Date): Status {
  const nearby = last24.filter((q) => distanceKm(home, q) <= radiusKm);
  const nearbyLine =
    nearby.length === 0
      ? `Entro ${radiusKm} km non è stato registrato nessun terremoto.`
      : `Entro ${radiusKm} km: ${formatInt(nearby.length)} ${nearby.length === 1 ? 'terremoto registrato' : 'terremoti registrati'} in totale.`;
  // Una scossa forte e lontana si può sentire anche fuori dal raggio: controlliamo tutta Italia.
  const hi = homeImpact(last24, home, now);
  if (!hi) {
    return {
      tone: 'ok',
      title: `Tutto tranquillo vicino a ${home.name}`,
      lines: [
        'Nelle ultime 24 ore non ci sono state scosse che si potessero sentire dove sei.',
        nearby.length ? `${nearbyLine} Sono scosse piccole, normali, che registrano solo gli strumenti.` : nearbyLine,
      ],
    };
  }

  const q = hi.quake;
  const town = placeText(q.place).main;
  const where = `a ${formatKm(distanceKm(home, q))} da ${home.name}${town === home.name ? '' : ` (${town})`}`;
  const feltCount = last24.filter((x) => impactAt(x, home) !== 'none').length;
  const base = {
    tone: IMPACT_TONE[hi.impact],
    quake: q,
    showSafety: impactRank(hi.impact) >= impactRank('strong'),
    emergency: shows112(hi.impact, q.mag) ? (hi.impact === 'damage' ? 'button' : 'line') : undefined,
  } as const;

  if (hi.fresh) {
    const ago = timeAgo(q.time, now);
    const title = {
      none: '',
      weak: `C’è stata una piccola scossa ${ago}`,
      felt: `Sì, c’è stata una scossa ${ago}`,
      strong: `Una scossa ${ago}: qui si è sentita forte`,
      damage: `Scossa forte vicino a ${home.name}, ${ago}`,
    }[hi.impact];
    const lines = [`Magnitudo ${formatMag(q.mag)}, ${where}.`, IMPACT_TEXT[hi.impact]];
    if (hi.impact !== 'weak' && isNightInItaly(now)) lines.push('Se ti ha svegliato, è normale avere paura: prenditi un momento per respirare.');
    if (hi.preliminary) lines.push('Sono i primi dati dell’INGV: magnitudo e posizione possono cambiare un po’ nei prossimi minuti.');
    if (feltCount > 1) lines.push(`Nelle ultime 24 ore, in tutto: ${formatInt(feltCount)} scosse che potresti aver sentito.`);
    return { ...base, title, lines, todo: TODO[hi.impact] };
  }

  return {
    ...base,
    title: feltCount === 1 ? '1 scossa che potresti aver sentito' : `${formatInt(feltCount)} scosse che potresti aver sentito`,
    lines: [`La più sentita qui: magnitudo ${formatMag(q.mag)}, ${formatWhen(q.time, now)}, ${where}. ${IMPACT_TEXT[hi.impact]}`, nearbyLine],
  };
}

/** Senza il comune non sappiamo cosa hai sentito: niente toni d'allarme, solo il quadro dell'Italia. */
function italyStatus(last24: Quake[], now: Date): Status {
  const perceivable = last24.filter((q) => q.mag >= 2);
  const top = strongest(last24);
  const lines = [
    `Nelle ultime 24 ore l'INGV ha registrato ${formatInt(last24.length)} terremoti; ${formatInt(perceivable.length)} di magnitudo 2 o più.`,
  ];
  if (top) lines.push(`Il più forte: magnitudo ${formatMag(top.mag)} ${formatWhen(top.time, now)}, ${placeText(top.place).full}.`);
  const big = !!top && top.mag >= 5;
  return { tone: big ? 'warn' : 'info', title: 'In Italia oggi', lines, quake: top, showSafety: big };
}

const TONE_ICON = { ok: CircleCheck, info: Info, warn: TriangleAlert, danger: TriangleAlert };

function StatusPanel({ status }: { status: Status }) {
  const Icon = TONE_ICON[status.tone];
  const speech = [status.title, ...status.lines, ...(status.todo ?? [])].join('. ');
  return (
    <section className={`status status--${status.tone}`} aria-labelledby="status-title">
      <Icon className="status__icon" aria-hidden="true" />
      <div className="status__body">
        <h2 id="status-title" className="status__title">
          {status.title}
        </h2>
        {status.lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
        {status.todo && (
          <div className="stack">
            <h3>Adesso</h3>
            <ul className="advice">
              {status.todo.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        {status.emergency === 'button' && (
          <a href="tel:112" className="btn btn--emergency">
            <Phone aria-hidden="true" /> Se qualcuno è ferito o in pericolo: chiama il 112
          </a>
        )}
        <div className="row">
          {status.quake && (
            <Link to={`/terremoto/${status.quake.id}`} className="btn btn--secondary">
              Dettagli della scossa
            </Link>
          )}
          <SpeakButton text={speech} />
        </div>
        {status.showSafety && (
          <p className="small">
            Leggi con calma <Link to="/cosa-fare">cosa fare dopo una scossa</Link> e, se vedi crepe o danni,{' '}
            <Link to="/danni-casa">cosa fare se la casa ha dei danni</Link>.
            {status.emergency === 'line' && (
              <>
                {' '}
                In caso di emergenza chiama il <a href="tel:112">112</a>.
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}

function Welcome() {
  const { update } = useSettings();
  return (
    <section className="card welcome" aria-labelledby="welcome-title">
      <h2 id="welcome-title">Benvenuto su Quake Italia</h2>
      <p>
        <strong>{TAGLINE}</strong> Qui trovi i terremoti in Italia, raccontati in parole semplici. Dicci dove
        abiti: ti diremo se una scossa è vicina a te e se potresti averla sentita.
      </p>
      <PlacePicker onPick={(home) => update({ home, onboarded: true })} />
      <button type="button" className="btn btn--ghost btn--block" onClick={() => update({ onboarded: true })}>
        Lo faccio dopo
      </button>
      <p className="small muted">Il tuo comune resta salvato solo su questo dispositivo.</p>
    </section>
  );
}

/** Se la parte "Vedi altro" della home è aperta: vale solo per questo dispositivo. */
const MORE_KEY = 'quakeitalia:home-more:v1';

/**
 * Aperto/chiuso ricordato nel browser. readRaw e writeJson hanno già il try/catch
 * (in navigazione privata localStorage può fallire): se non c'è nulla si parte chiusi.
 */
function useMoreOpen(): [boolean, () => void] {
  const [open, setOpen] = useState(() => readRaw(MORE_KEY) === true);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    writeJson(MORE_KEY, next);
  };
  return [open, toggle];
}

export function HomePage() {
  const { settings } = useSettings();
  const [moreOpen, toggleMore] = useMoreOpen();
  const feed = useQuakeFeed();
  const now = useNow();
  const home = settings.home;
  const zone = useQuery({
    queryKey: ['zone', home?.name, home?.detail],
    queryFn: () => findComune(home!),
    enabled: !!home,
    staleTime: Infinity,
  });

  const data = useMemo(() => {
    if (!feed.data) return null;
    const since = hoursAgo(24, now.getTime()).getTime();
    const last24 = feed.data.filter((q) => q.time.getTime() >= since);
    const status = home ? homeStatus(last24, home, settings.radiusKm, now) : italyStatus(last24, now);
    const latestNear = home
      ? feed.data.find((q) => q.mag >= 2 && distanceKm(home, q) <= settings.radiusKm)
      : undefined;
    const top = [...last24].sort((a, b) => b.mag - a.mag).slice(0, 3);
    const zones = activeZones(last24, 20, 5).slice(0, 3);
    // Sequenza da seguire: la scossa più forte delle ultime 72 ore che sia vicina (o molto forte).
    // Più vecchia di 72 ore resta finché la zona trema ancora: chi vive una sequenza la cerca proprio in quei giorni.
    const since72 = hoursAgo(72, now.getTime()).getTime();
    const since24 = hoursAgo(24, now.getTime()).getTime();
    const stillActive = (m: Quake) =>
      feed.data!.filter((q) => q.time.getTime() >= since24 && q.time > m.time && distanceKm(m, q) <= SEQUENCE_RADIUS_KM).length >= 3;
    const sequence = feed.data
      .filter((q) => q.mag >= SEQUENCE_MIN_MAG && (q.time.getTime() >= since72 || stillActive(q)))
      .filter((q) => (home ? distanceKm(home, q) <= Math.max(settings.radiusKm, 100) || q.mag >= 5 : q.mag >= 4.5))
      .reduce<Quake | undefined>((a, b) => (!a || b.mag > a.mag ? b : a), undefined);
    const after = sequence ? feed.data.filter((q) => q.time > sequence.time && distanceKm(sequence, q) <= SEQUENCE_RADIUS_KM) : [];
    const trend = sequence ? TREND_SHORT[sequenceTrend(after, sequence.time, now).kind] : undefined;
    return { status, latestNear, top, zones, sequence, aftershocks: after.length, trend };
  }, [feed.data, home, settings.radiusKm, now]);

  return (
    <div className="container stack-lg">
      <header className="page-header">
        <h1 tabIndex={-1}>{home ? `Vicino a ${home.name}` : 'Terremoti in Italia'}</h1>
        {!home && <p className="page-header__intro">{TAGLINE}</p>}
        {home && (
          <p className="page-header__intro">
            <MapPin className="inline-icon" aria-hidden="true" /> Consideriamo "vicino" entro {settings.radiusKm} km.{' '}
            <Link to="/impostazioni">Cambia</Link>
          </p>
        )}
      </header>

      {!home && !settings.onboarded && <Welcome />}

      {feed.isPending && <LoadingCards count={2} />}
      {feed.isError && !feed.data && <ErrorBox message={(feed.error as Error).message} onRetry={() => feed.refetch()} />}

      {data && <StatusPanel status={data.status} />}

      <Link to="/ho-sentito" className="btn btn--felt">
        <Ear aria-hidden="true" />
        <span>
          <span className="btn--felt__title">Ho sentito una scossa</span>
          <span className="btn--felt__sub">Scopri subito cos'era</span>
        </span>
      </Link>

      {data?.sequence && (
        <Link to={`/sequenza/${data.sequence.id}`} className="seq-card">
          <Activity aria-hidden="true" />
          <span>
            <span className="strong">Cosa sta succedendo vicino a {placeText(data.sequence.place).main}</span>
            <span>
              Scossa di magnitudo {formatMag(data.sequence.mag)} {formatWhen(data.sequence.time, now)}
              {data.aftershocks > 0 ? ` · ${formatInt(data.aftershocks)} scosse dopo` : ''}
              {data.trend ? `, ${data.trend}` : ''}
            </span>
          </span>
          <ChevronRight aria-hidden="true" />
        </Link>
      )}

      {home && zone.data && (
        <Link to="/il-mio-comune" className="seq-card seq-card--town">
          <ShieldAlert aria-hidden="true" />
          <span>
            <span className="strong">
              {zone.data.comune}: zona sismica {zone.data.zone}
              {volcanoShort(zone.data.comune, zone.data.sigla) ? ` · ${volcanoShort(zone.data.comune, zone.data.sigla)}` : ''}
            </span>
            <span>{ZONE_INFO[zone.data.zone].label}. Scopri cosa vuol dire e come preparare la casa.</span>
          </span>
          <ChevronRight aria-hidden="true" />
        </Link>
      )}

      {/* Sopra c'è solo quello che serve subito; il resto si apre con un solo pulsante grande.
          Il focus resta sul pulsante (schema "disclosure"): il contenuto compare subito sotto. */}
      <button
        type="button"
        className="btn btn--secondary btn--block more-toggle"
        aria-expanded={moreOpen}
        aria-controls="home-more"
        onClick={toggleMore}
      >
        <span>{moreOpen ? 'Nascondi le ultime scosse in Italia' : 'Vedi altro: le ultime scosse in Italia'}</span>
        <ChevronDown className="more-toggle__icon" aria-hidden="true" />
      </button>

      <div id="home-more" className="stack-lg home-more" hidden={!moreOpen}>
        {moreOpen && <HomeMore data={data} home={home} radiusKm={settings.radiusKm} now={now} />}
      </div>
    </div>
  );
}

type HomeData = {
  latestNear?: Quake;
  top: Quake[];
  zones: ReturnType<typeof activeZones>;
};

/** La parte che si apre con "Vedi altro": ultime scosse, zone attive e i due consigli. */
function HomeMore({ data, home, radiusKm, now }: { data: HomeData | null; home: Place | null; radiusKm: number; now: Date }) {
  return (
    <>
      {data && home && (
        <section className="stack" aria-labelledby="latest-near">
          <h2 id="latest-near">Ultima scossa avvertibile vicino a te</h2>
          {data.latestNear ? (
            <QuakeCard quake={data.latestNear} now={now} home={home} />
          ) : (
            <p className="empty">Negli ultimi 7 giorni nessuna scossa di magnitudo 2 o più entro {radiusKm} km.</p>
          )}
        </section>
      )}

      {data && data.top.length > 0 && (
        <section className="stack" aria-labelledby="top-italy">
          <h2 id="top-italy">Le più forti in Italia nelle ultime 24 ore</h2>
          <ul className="quake-list">
            {data.top.map((q) => (
              <li key={q.id}>
                <QuakeCard quake={q} now={now} home={home} />
              </li>
            ))}
          </ul>
          <Link to="/terremoti" className="btn btn--secondary btn--block">
            Vedi tutti i terremoti
          </Link>
        </section>
      )}

      {data && data.zones.length > 0 && (
        <section className="stack" aria-labelledby="zones">
          <h2 id="zones">Zone più attive oggi</h2>
          <p className="muted">
            Zone dove ci sono state molte scosse, di solito piccole. Spesso si tratta di uno "sciame sismico".
          </p>
          <ul className="zone-list">
            {data.zones.map((z) => (
              <li key={z.center.id}>
                <Link
                  className="zone"
                  to={`/terremoti?vista=mappa&periodo=24h&centro=${z.center.lat.toFixed(3)},${z.center.lon.toFixed(3)}`}
                >
                  <span className="strong">{z.name}</span>
                  <span>
                    {formatInt(z.quakes.length)} scosse · la più forte {formatMag(z.strongest.mag)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link to="/cosa-fare" className="tip">
        <LifeBuoy aria-hidden="true" />
        <span>
          <span className="strong">Sai cosa fare durante un terremoto?</span>
          <span className="muted"> Pochi consigli semplici, da leggere con calma.</span>
        </span>
      </Link>

      <Link to="/capire" className="tip">
        <BookOpen aria-hidden="true" />
        <span>
          <span className="strong">Capire i terremoti</span>
          <span className="muted"> Magnitudo, repliche, perché l’Italia trema: brevi letture con dati veri.</span>
        </span>
      </Link>
    </>
  );
}
