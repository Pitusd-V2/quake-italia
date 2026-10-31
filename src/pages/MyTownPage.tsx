import { useQuery } from '@tanstack/react-query';
import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { BellRing, Check, ChevronRight, ClipboardCheck, History, Landmark, Settings, ShieldAlert } from 'lucide-react';
import { useSettings } from '../state/settings';
import { useNow } from '../hooks/useNow';
import { fetchQuakes } from '../lib/ingv';
import { findComune, ZONE_INFO, ZONES_SOURCE } from '../lib/seismicZones';
import { placeText } from '../lib/describe';
import { daysAgo, formatInt, formatMag } from '../lib/format';
import { QuakeList } from '../components/QuakeCard';
import { PlacePicker } from '../components/PlacePicker';
import { ExternalLink, LoadingCards, Notice, PageHeader } from '../components/ui';
import { VolcanoZones } from '../components/VolcanoZones';

const NEAR_KM = 30;

const CHECKLIST: { id: string; text: string }[] = [
  { id: 'area', text: 'So qual è l’area di attesa del mio Comune, cioè dove andare dopo una scossa forte.' },
  { id: 'mobili', text: 'Ho fissato al muro i mobili alti e pesanti (armadi, librerie).' },
  { id: 'oggetti', text: 'Non tengo oggetti pesanti o di vetro sopra il letto o sugli scaffali alti.' },
  { id: 'gas', text: 'So dove sono e come si chiudono gas, acqua e luce.' },
  { id: 'kit', text: 'Ho pronto un kit: torcia, radio a pile, acqua, pronto soccorso.' },
  { id: 'medicine', text: 'Ho medicine e copie dei documenti in una borsa facile da prendere.' },
  { id: 'punto', text: 'Ho deciso con la famiglia un punto dove ritrovarci.' },
  { id: 'casa', text: 'So se la mia casa è costruita con criteri antisismici (posso chiederlo a un tecnico).' },
];

const longDate = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'long', year: 'numeric' });

export function MyTownPage() {
  const { settings, update } = useSettings();
  const now = useNow(60_000);
  const home = settings.home;

  const zone = useQuery({
    queryKey: ['zone', home?.name, home?.detail],
    queryFn: () => findComune(home!),
    enabled: !!home,
    staleTime: Infinity,
  });

  // Il catalogo strumentale INGV disponibile da questo servizio parte dal 1985.
  const history = useQuery({
    queryKey: ['history', home?.lat, home?.lon],
    queryFn: ({ signal }) =>
      fetchQuakes({ start: new Date('1985-01-01T00:00:00Z'), minMag: 4, around: { lat: home!.lat, lon: home!.lon, radiusKm: NEAR_KM }, orderBy: 'magnitude', limit: 5 }, signal),
    enabled: !!home,
    staleTime: 24 * 3_600_000,
  });

  const recent = useQuery({
    queryKey: ['recent30', home?.lat, home?.lon],
    queryFn: ({ signal }) => fetchQuakes({ start: daysAgo(30), around: { lat: home!.lat, lon: home!.lon, radiusKm: NEAR_KM } }, signal),
    enabled: !!home,
    staleTime: 10 * 60_000,
  });

  if (!home) {
    return (
      <div className="container stack-lg">
        <PageHeader title="Il mio comune" intro="Scopri quanto è sismica la zona dove vivi e come prepararti." />
        <section className="card stack">
          <h2>Dove abiti?</h2>
          <PlacePicker onPick={(p) => update({ home: p, onboarded: true })} />
        </section>
      </div>
    );
  }

  const done = CHECKLIST.filter((c) => settings.checklist[c.id]).length;
  const total = CHECKLIST.length;
  const toggle = (id: string) => update({ checklist: { ...settings.checklist, [id]: !settings.checklist[id] } });
  const z = zone.data;
  const strongestRecent = recent.data?.reduce<(typeof recent.data)[number] | undefined>((a, b) => (!a || b.mag > a.mag ? b : a), undefined);
  const perceivable = recent.data?.filter((q) => q.mag >= 2).length ?? 0;

  return (
    <div className="container stack-lg">
      <PageHeader title={`Il mio comune: ${home.name}`} intro="Quanto è sismica la tua zona, cosa è successo in passato e come prepararti." />

      {/* Le impostazioni sono personali come il comune: qui le trova anche chi usa il telefono (dove non sono in alto). */}
      <Link to="/impostazioni" className="link-card">
        <Settings aria-hidden="true" />
        <span>
          <span className="strong">Le tue impostazioni</span>
          <span className="muted">Cambia comune, grandezza del testo, colori e avvisi delle nuove scosse.</span>
        </span>
        <ChevronRight aria-hidden="true" />
      </Link>

      {/* ---------- Zona sismica ---------- */}
      <section className="card stack" aria-labelledby="zone-title">
        <h2 id="zone-title" className="icon-title">
          <ShieldAlert aria-hidden="true" /> Zona sismica
        </h2>
        {zone.isPending && <LoadingCards count={1} label="Cerco la classificazione del comune…" />}
        {zone.data === null && (
          <Notice tone="info" title={`Non trovo "${home.name}" nell’elenco dei comuni`}>
            <p>Forse è una frazione o una località. Imposta il nome del comune in <Link to="/impostazioni">Impostazioni</Link>.</p>
          </Notice>
        )}
        {z && (
          <>
            <div className="zone-hero">
              <span className="zone-badge" style={{ '--zone': `var(--zone${z.zone})`, '--on-zone': `var(--on-zone${z.zone})` } as CSSProperties}>
                <span className="zone-badge__label">Zona</span>
                <span className="zone-badge__value">{z.zone}</span>
              </span>
              <div className="stack-sm">
                <p className="lead strong">{ZONE_INFO[z.zone].label}</p>
                <p>{ZONE_INFO[z.zone].text}</p>
                <p className="small muted">
                  {z.comune} ({z.provincia}) — codice ufficiale: <span className="strong">{z.code}</span>
                </p>
              </div>
            </div>
            <ol className="zone-scale" aria-label="Le quattro zone sismiche italiane, dalla più pericolosa alla meno pericolosa">
              {([1, 2, 3, 4] as const).map((n) => (
                <li
                  key={n}
                  className={n === z.zone ? 'is-current' : undefined}
                  style={{ '--zone': `var(--zone${n})`, '--on-zone': `var(--on-zone${n})` } as CSSProperties}
                  aria-current={n === z.zone ? 'true' : undefined}
                >
                  <span className="zone-scale__n">{n}</span>
                  <span className="zone-scale__t">{ZONE_INFO[n].label.replace('Pericolosità ', '')}</span>
                </li>
              ))}
            </ol>
            {z.mixed && (
              <p className="muted">
                Il territorio di questo comune è diviso in più zone: qui mostriamo la più pericolosa. Le lettere (A, B…) sono
                sottozone decise dalla Regione.
              </p>
            )}
            {!z.mixed && /[A-Za-z]/.test(z.code) && (
              <p className="muted">La lettera nel codice indica una sottozona decisa dalla Regione.</p>
            )}
            <p className="small muted">
              La zona serve a Regione e Genio civile per pianificare e controllare il territorio. Per costruire, dal 2009, non
              conta più la zona: i progettisti usano la pericolosità calcolata punto per punto, su una griglia di 5 km (Norme
              Tecniche per le Costruzioni). La zona non dice quando ci sarà un terremoto: nessuno può prevederlo. Fonte:{' '}
              <ExternalLink href="https://rischi.protezionecivile.gov.it/it/sismico/attivita/classificazione-sismica/">{ZONES_SOURCE}</ExternalLink>.
            </p>
          </>
        )}
      </section>

      {/* ---------- Vesuvio e Campi Flegrei ---------- */}
      {z && <VolcanoZones comune={z.comune} sigla={z.sigla} />}

      {/* ---------- Storia ---------- */}
      <section className="stack" aria-labelledby="history-title">
        <h2 id="history-title" className="icon-title">
          <History aria-hidden="true" /> I terremoti più forti qui vicino
        </h2>
        <p className="muted">Magnitudo 4 o più, entro {NEAR_KM} km, dal 1985 a oggi (catalogo strumentale INGV).</p>
        {history.isPending && <LoadingCards count={2} label="Cerco nel catalogo storico…" />}
        {history.data && history.data.length === 0 && (
          <p className="empty">Dal 1985 non risultano terremoti di magnitudo 4 o più entro {NEAR_KM} km.</p>
        )}
        {history.data && history.data.length > 0 && (
          <>
            <p className="lead">
              Il più forte: magnitudo <span className="strong">{formatMag(history.data[0].mag)}</span> il{' '}
              {longDate.format(history.data[0].time)}, {placeText(history.data[0].place).full}.
            </p>
            <QuakeList quakes={history.data} now={now} home={home} pageSize={5} />
          </>
        )}
        <p className="small muted">
          Per i terremoti più antichi (dall’anno 1000) c’è il{' '}
          <ExternalLink href="https://emidius.mi.ingv.it/CPTI15-DBMI15/">catalogo storico CPTI15 dell’INGV</ExternalLink>.
        </p>
      </section>

      {/* ---------- Ultimi 30 giorni ---------- */}
      <section className="card stack" aria-labelledby="recent-title">
        <h2 id="recent-title">Ultimi 30 giorni</h2>
        {recent.isPending && <LoadingCards count={1} />}
        {recent.data && (
          <p className="lead">
            Entro {NEAR_KM} km: <span className="strong">{formatInt(recent.data.length)}</span> terremoti registrati, di cui{' '}
            <span className="strong">{formatInt(perceivable)}</span> di magnitudo 2 o più
            {strongestRecent ? `. Il più forte: magnitudo ${formatMag(strongestRecent.mag)}.` : '.'}
          </p>
        )}
        <Link to="/terremoti?vicino=1&periodo=7g" className="btn btn--secondary">
          Vedi le scosse vicine
        </Link>
      </section>

      {/* ---------- Checklist ---------- */}
      <section className="card stack" aria-labelledby="check-title">
        <h2 id="check-title" className="icon-title">
          <ClipboardCheck aria-hidden="true" /> Prepara la tua casa
        </h2>
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${(done / total) * 100}%` }} />
        </div>
        <p className="strong" role="status">
          Hai fatto {done} {done === 1 ? 'cosa' : 'cose'} su {total}
          {done === total ? ': complimenti!' : '.'}
        </p>
        <ul className="checklist">
          {CHECKLIST.map((c) => (
            <li key={c.id}>
              <label className="check">
                <input type="checkbox" checked={!!settings.checklist[c.id]} onChange={() => toggle(c.id)} />
                <span className="check__box" aria-hidden="true">
                  <Check />
                </span>
                <span>{c.text}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="small muted">Le spunte restano salvate su questo dispositivo.</p>
      </section>

      {/* ---------- Comune e IT-alert ---------- */}
      <section className="card stack" aria-labelledby="plan-title">
        <h2 id="plan-title" className="icon-title">
          <Landmark aria-hidden="true" /> Il piano del tuo Comune
        </h2>
        <p>
          Ogni Comune ha un piano di protezione civile che indica le <span className="strong">aree di attesa</span>: i posti
          sicuri dove andare dopo una scossa forte. Di solito si trova sul sito del Comune, oppure puoi chiederlo in Comune.
        </p>
        <ExternalLink
          href={`https://www.google.com/search?q=${encodeURIComponent(`piano protezione civile comune di ${home.name} aree di attesa`)}`}
          className="btn btn--secondary"
        >
          Cerca il piano di {home.name}
        </ExternalLink>
      </section>

      <Notice tone="info" icon={<BellRing />} title="IT-alert: gli avvisi ufficiali dello Stato">
        <p>
          Per alcune emergenze gravi (per esempio un maremoto o un’eruzione) lo Stato può mandare un messaggio a tutti i
          telefoni della zona con IT-alert. Non serve installare niente. Per i terremoti, invece, in Italia non c’è un sistema pubblico di allerta. In altri
          Paesi, come il Giappone, esiste: avvisa pochi secondi prima che arrivino le onde più forti, a scossa già iniziata,
          ma non può prevedere i terremoti.
        </p>
        <ExternalLink href="https://www.it-alert.gov.it/it/">Scopri IT-alert</ExternalLink>
      </Notice>
    </div>
  );
}
