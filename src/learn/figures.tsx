/**
 * Figure di "Capire i terremoti".
 * - Illustrazioni (disegni) per spiegare i concetti.
 * - Grafici costruiti con DATI VERI dell'INGV (src/data/learn/*.json, generati da scripts/build-learn-data.mjs).
 * Ogni grafico ha anche la versione "a numeri" per chi usa un lettore di schermo.
 */
import type { ReactNode } from 'react';
import slab from '../data/learn/slab.json';
import norcia from '../data/learn/norcia2016.json';
import gr from '../data/learn/gr-italia.json';
import { useWidth } from '../components/charts/ChartFrame';
import { linear, niceTicks } from '../components/charts/scales';
import { formatInt } from '../lib/format';
import { ExternalLink } from '../components/ui';

/* ---------- Contenitore comune ---------- */

export function Figure({
  title,
  caption,
  source,
  sourceHref,
  table,
  children,
}: {
  title: string;
  caption: ReactNode;
  source?: string;
  sourceHref?: string;
  table?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="learn-figure">
      <p className="learn-figure__title">{title}</p>
      <div className="learn-figure__body">{children}</div>
      <figcaption className="learn-figure__caption">
        <span>{caption}</span>
        {source && (
          <span className="learn-figure__source">
            Fonte: {sourceHref ? <ExternalLink href={sourceHref}>{source}</ExternalLink> : source}
          </span>
        )}
      </figcaption>
      {table && (
        <details className="learn-figure__table">
          <summary>Vedi i numeri</summary>
          {table}
        </details>
      )}
    </figure>
  );
}

/* ---------- 1. Faglia, ipocentro, epicentro, onde (illustrazione) ---------- */

export function FaultDiagram() {
  return (
    <Figure
      title="Dove nasce un terremoto"
      caption="Disegno schematico (non in scala). La roccia si rompe nell’ipocentro, lungo la faglia; l’epicentro è il punto in superficie proprio sopra. Da lì partono le onde sismiche in tutte le direzioni."
    >
      <svg viewBox="0 0 640 380" className="diagram" role="img" aria-label="Schema: faglia inclinata, ipocentro in profondità, epicentro in superficie, onde sismiche che si propagano">
        {/* Terreno: due blocchi separati dalla faglia */}
        <polygon points="20,110 300,110 380,360 20,360" className="d-rock" />
        <polygon points="300,118 620,118 620,360 380,360" className="d-rock d-rock--alt" />
        {/* Superficie e case */}
        <line x1="20" y1="110" x2="300" y2="110" className="d-ground" />
        <line x1="300" y1="118" x2="620" y2="118" className="d-ground" />
        {[60, 120, 470, 540].map((x, i) => (
          <g key={x} transform={`translate(${x} ${i < 2 ? 110 : 118})`} className="d-house">
            <rect x="-14" y="-22" width="28" height="22" />
            <polygon points="-18,-22 0,-38 18,-22" />
          </g>
        ))}
        {/* Faglia */}
        <line x1="300" y1="110" x2="380" y2="360" className="d-fault" />
        <text x="392" y="335" className="d-label">Faglia</text>
        {/* Movimento dei blocchi (faglia "normale": il blocco di destra scende) */}
        <path d="M455 205 l0 40" className="d-arrow" markerEnd="url(#arrow)" />
        <path d="M240 245 l0 -40" className="d-arrow" markerEnd="url(#arrow)" />
        {/* Onde */}
        {[40, 75, 110].map((r) => (
          <circle key={r} cx="345" cy="250" r={r} className="d-wave" />
        ))}
        <text x="440" y="300" className="d-label d-label--muted">Onde sismiche</text>
        {/* Ipocentro */}
        <circle cx="345" cy="250" r="9" className="d-hypo" />
        <text x="200" y="285" className="d-label">Ipocentro</text>
        <line x1="290" y1="279" x2="336" y2="256" className="d-leader" />
        {/* Epicentro e profondità */}
        <line x1="345" y1="250" x2="345" y2="114" className="d-depth" />
        <polygon points="345,114 335,98 355,98" className="d-epi" />
        <text x="358" y="94" className="d-label">Epicentro</text>
        <text x="352" y="190" className="d-label d-label--muted">profondità</text>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="d-arrowhead" />
          </marker>
        </defs>
      </svg>
    </Figure>
  );
}

/* ---------- 2. Energia per magnitudo (calcolata con la formula di Gutenberg-Richter) ---------- */

const ENERGY_ROWS = [3, 4, 5, 6, 7].map((m) => ({ m, ratio: 10 ** (1.5 * (m - 3)) }));

export function EnergyChart() {
  // Due cifre significative (32, 1.000, 32.000…): sono stime, non serve di più. Separatore delle migliaia sempre.
  const group = new Intl.NumberFormat('it-IT', { useGrouping: 'always' } as Intl.NumberFormatOptions);
  const fmt = (r: number) => (r < 1.5 ? 'riferimento' : `circa ${group.format(Number(r.toPrecision(2)))} volte`);
  return (
    <Figure
      title="Quanta energia in più, magnitudo dopo magnitudo"
      caption="Energia liberata rispetto a un terremoto di magnitudo 3. Ogni punto in più vuol dire circa 32 volte più energia: le barre sono in scala logaritmica, altrimenti la magnitudo 7 non starebbe nello schermo."
      source="relazione energia-magnitudo log₁₀E = 1,5·M + 4,8 (Gutenberg e Richter); USGS"
      sourceHref="https://www.usgs.gov/programs/earthquake-hazards/earthquake-magnitude-energy-release-and-shaking-intensity"
    >
      <ul className="hbars" aria-label="Energia relativa per magnitudo">
        {ENERGY_ROWS.map(({ m, ratio }) => (
          <li key={m}>
            <span className="hbars__label">Magnitudo {m}</span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${8 + (Math.log10(ratio) / 6) * 92}%` }} />
            </span>
            <span className="hbars__value">{fmt(ratio)}</span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/* ---------- 3. Scala MCS (testi INGV) ---------- */

const MCS: [string, string, string][] = [
  ['I', 'Impercettibile', 'Rilevato soltanto dai sismografi.'],
  ['II', 'Molto leggero', 'Sentito solo da persone molto sensibili, in perfetta quiete, ai piani alti.'],
  ['III', 'Leggero', 'Percepito da una piccola parte delle persone in casa, come il passaggio di un mezzo pesante.'],
  ['IV', 'Moderato', 'Notato in casa da molte persone: tintinnano finestre e stoviglie, scricchiolano porte.'],
  ['V', 'Abbastanza forte', 'Avvertito da quasi tutti; oggetti appesi oscillano, quadri sbattono, quasi tutti si svegliano.'],
  ['VI', 'Forte', 'Avvertito da tutti con paura; cadono oggetti; danni leggeri agli edifici (crepe nell’intonaco).'],
  ['VII', 'Molto forte', 'Danni moderati a molti edifici solidi; cadono tegole e camini.'],
  ['VIII', 'Rovinoso', 'Circa un quarto delle case gravemente danneggiato, alcune crollano.'],
  ['IX', 'Distruttivo', 'Circa metà delle case in pietra distrutte.'],
  ['X', 'Completamente distruttivo', 'Circa tre quarti degli edifici distrutti; danni a ponti e dighe.'],
  ['XI', 'Catastrofico', 'Crollano tutti gli edifici in muratura.'],
  ['XII', 'Grandemente catastrofico', 'Nessuna opera umana resiste; il paesaggio cambia.'],
];

export function MCSScale() {
  return (
    <Figure
      title="I 12 gradi della scala Mercalli-Cancani-Sieberg (MCS)"
      caption="L’intensità descrive gli effetti in un luogo. Dal I al V grado si guardano le persone e gli oggetti; dal VI al XII i danni agli edifici e all’ambiente. Descrizioni riassunte dalla scala ufficiale."
      source="INGV, Database Fotografico Macrosismico — Scala MCS"
      sourceHref="https://dfm.ingv.it/?page=scale.mcs"
    >
      <ol className="mcs" aria-label="Gradi della scala MCS">
        {MCS.map(([deg, name, text], i) => (
          <li key={deg} style={{ ['--step' as string]: String(i) }}>
            <span className="mcs__deg">{deg}</span>
            <span>
              <span className="strong">{name}.</span> {text}
            </span>
          </li>
        ))}
      </ol>
    </Figure>
  );
}

/* ---------- 4. La placca sotto la Calabria (DATI VERI) ---------- */

export function SlabChart() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const H = 360;
  const M = { top: 28, right: 16, bottom: 40, left: 52 };
  const len = slab.sezione.lunghezzaKm;
  const pts = slab.punti as [number, number, number][];
  return (
    <Figure
      title="I terremoti disegnano la placca che sprofonda"
      caption={
        <>
          Ogni punto è un terremoto vero (magnitudo ≥ 2,5, dal 2005 al 2025) lungo una “fetta” di 120 km che va dal Mar Ionio
          al Tirreno passando sotto la Calabria. In orizzontale la distanza, in verticale la profondità. I terremoti profondi
          si allineano su un piano inclinato: è la placca ionica che scende nel mantello. Il più profondo è a{' '}
          <strong>{slab.statistiche.maxProfonditaKm} km</strong>.
        </>
      }
      source="INGV, catalogo dei terremoti (richiesta FDSN)"
      sourceHref={slab.richiesta}
      table={
        <p>
          Terremoti nella sezione: {formatInt(slab.statistiche.totale)}; più profondi di 100 km: {formatInt(slab.statistiche.oltre100km)};
          profondità massima: {slab.statistiche.maxProfonditaKm} km. Dati scaricati il {slab.scaricato}.
        </p>
      }
    >
      <div ref={ref} className="learn-chart" style={{ height: H }}>
        {width > 0 &&
          (() => {
            const x = linear([-20, len + 20], [M.left, width - M.right]);
            const y = linear([0, 650], [M.top, H - M.bottom]);
            return (
              <svg width={width} height={H} role="img" aria-label={`Sezione: ${slab.statistiche.totale} terremoti, i più profondi fino a ${slab.statistiche.maxProfonditaKm} km`}>
                <g className="grid">
                  {[0, 100, 200, 300, 400, 500, 600].map((d) => (
                    <g key={d}>
                      <line x1={M.left} x2={width - M.right} y1={y(d)} y2={y(d)} />
                      <text className="axis-label" x={M.left - 8} y={y(d)} dy="0.32em" textAnchor="end">
                        {d}
                      </text>
                    </g>
                  ))}
                </g>
                <text className="axis-title" x={4} y={14}>
                  Profondità (km)
                </text>
                {pts.map(([d, z, m], i) => (
                  <circle key={i} cx={x(d)} cy={y(z)} r={1.6 + Math.max(0, m - 2.5) * 1.1} fill="var(--chart-1)" fillOpacity={0.55} />
                ))}
                <line x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} className="surface-line" />
                <text className="axis-label strong-label" x={M.left + 4} y={H - 12}>
                  ← Mar Ionio (sud-est)
                </text>
                <text className="axis-label strong-label" x={width - M.right - 4} y={H - 12} textAnchor="end">
                  Mar Tirreno (nord-ovest) →
                </text>
                {width > 420 && (
                  <text className="direct-label" x={x(len * 0.74)} y={y(170)} textAnchor="middle">
                    la placca scende verso nord-ovest
                  </text>
                )}
              </svg>
            );
          })()}
      </div>
    </Figure>
  );
}

/* ---------- 5. Gutenberg-Richter in Italia, 2025 (DATI VERI) ---------- */

export function GRBars() {
  const rows = (gr.almeno as [number, number][]).filter(([, n]) => n > 0);
  const max = Math.log10(rows[0][1]);
  return (
    <Figure
      title="Quanti terremoti, nel 2025, di almeno questa magnitudo"
      caption={
        <>
          Tutti i terremoti localizzati dall’INGV nel 2025 nell’area italiana e nei mari vicini ({formatInt(gr.totale)} in
          tutto). Ogni gradino in più di magnitudo, i terremoti diventano circa <strong>dieci volte meno</strong>. Barre in
          scala logaritmica.
        </>
      }
      source="INGV, catalogo dei terremoti (richiesta FDSN)"
      sourceHref={gr.richiesta}
      table={
        <p>
          Magnitudo di completezza stimata: {String(gr.mc).replace('.', ',')}; b-value (metodo di Aki-Utsu, su{' '}
          {formatInt(gr.nSopraMc)} eventi): {String(gr.bValue).replace('.', ',')}. Dati scaricati il {gr.scaricato}.
        </p>
      }
    >
      <ul className="hbars" aria-label="Numero di terremoti per magnitudo minima">
        {rows.map(([m, n]) => (
          <li key={m}>
            <span className="hbars__label">Magnitudo {m} o più</span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${6 + (Math.log10(n) / max) * 94}%` }} />
            </span>
            <span className="hbars__value">{formatInt(n)}</span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/* ---------- 6. Sequenza Amatrice–Visso–Norcia, giorno per giorno (DATI VERI) ---------- */

const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

export function NorciaChart() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const H = 320;
  const M = { top: 56, right: 12, bottom: 34, left: 44 };
  const days = norcia.giornaliero as number[];
  const start = Date.UTC(2016, 7, 20);
  // Una sola etichetta per giorno: la scossa più forte di quel giorno.
  const mains = (norcia.principali as { giorno: number; mag: number; luogo: string }[]).reduce<Record<number, { mag: number; luogo: string }>>((acc, e) => {
    if (e.mag >= 5.5 && (!acc[e.giorno] || e.mag > acc[e.giorno].mag)) acc[e.giorno] = { mag: e.mag, luogo: e.luogo };
    return acc;
  }, {});
  const maxDay = Math.max(...days);
  return (
    <Figure
      title="Amatrice–Visso–Norcia 2016–2017: scosse al giorno"
      caption={
        <>
          Numero di terremoti di magnitudo ≥ 2,5 al giorno, entro 40 km da Norcia ({formatInt(norcia.totale)} in tutto, dal 20
          agosto 2016 al 28 febbraio 2017). Dopo ogni scossa forte le repliche sono tantissime e poi calano giorno dopo
          giorno. Ma attenzione: <strong>due mesi dopo la prima scossa ne è arrivata una più forte</strong>.
        </>
      }
      source="INGV, catalogo dei terremoti (richiesta FDSN)"
      sourceHref={norcia.richiesta}
      table={
        <ul className="advice">
          {(norcia.principali as { data: string; mag: number; tipo: string; luogo: string }[]).map((e) => (
            <li key={e.data}>
              {e.data} UTC — {e.tipo} {e.mag.toFixed(1).replace('.', ',')} — {e.luogo}
            </li>
          ))}
        </ul>
      }
    >
      <div ref={ref} className="learn-chart" style={{ height: H }}>
        {width > 0 &&
          (() => {
            const x = linear([0, days.length], [M.left, width - M.right]);
            const y = linear([0, maxDay * 1.08], [H - M.bottom, M.top]);
            const bw = Math.max(1, x(1) - x(0) - (width > 500 ? 1 : 0));
            const monthTicks: { i: number; label: string }[] = [];
            for (let i = 0; i < days.length; i++) {
              const d = new Date(start + i * 86_400_000);
              if (d.getUTCDate() === 1) monthTicks.push({ i, label: `${MONTHS[d.getUTCMonth()]}${d.getUTCMonth() === 0 ? ` ${d.getUTCFullYear()}` : ''}` });
            }
            return (
              <svg width={width} height={H} role="img" aria-label="Grafico a barre: numero di terremoti al giorno durante la sequenza del 2016-2017">
                <g className="grid">
                  {niceTicks(0, maxDay, 4).map((v) => (
                    <g key={v}>
                      <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} />
                      <text className="axis-label" x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
                        {v}
                      </text>
                    </g>
                  ))}
                </g>
                {days.map((n, i) =>
                  n > 0 ? (
                    <rect key={i} x={x(i)} y={y(n)} width={bw} height={y(0) - y(n)} fill="var(--chart-1)">
                      <title>{`${new Date(start + i * 86_400_000).toLocaleDateString('it-IT', { timeZone: 'UTC' })}: ${n} terremoti`}</title>
                    </rect>
                  ) : null,
                )}
                <g className="axis">
                  <line x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} />
                  {monthTicks.map((t) => (
                    <text key={t.i} x={x(t.i)} y={H - M.bottom + 18} textAnchor="middle">
                      {t.label}
                    </text>
                  ))}
                </g>
                {Object.entries(mains).map(([g, e], k, all) => {
                  const i = Number(g);
                  const top = y(Math.max(days[i] ?? 0, days[i + 1] ?? 0));
                  // Se due scosse forti sono troppo vicine nel grafico, la seconda etichetta va una riga più su.
                  const prev = all[k - 1];
                  const raised = prev && x(i) - x(Number(prev[0])) < 52 ? 16 : 0;
                  return (
                    <g key={g}>
                      <line x1={x(i) + bw / 2} x2={x(i) + bw / 2} y1={top - 4} y2={M.top - 2 - raised} className="annot-line" />
                      <text className="direct-label" x={x(i) + bw / 2} y={M.top - 8 - raised} textAnchor="middle">
                        {`M ${e.mag.toFixed(1).replace('.', ',')}`}
                      </text>
                    </g>
                  );
                })}
              </svg>
            );
          })()}
      </div>
    </Figure>
  );
}

/* ---------- 7. Rischio = pericolosità × vulnerabilità × esposizione (illustrazione) ---------- */

export function RiskDiagram() {
  const items = [
    { k: 'Pericolosità', q: 'Quanto spesso e quanto forte trema la terra qui?', e: 'Dipende dalla natura: non si può cambiare.' },
    { k: 'Vulnerabilità', q: 'Quanto sono fragili gli edifici?', e: 'Si può ridurre: costruire e rinforzare bene.' },
    { k: 'Esposizione', q: 'Quante persone e quanti beni ci sono?', e: 'Si gestisce: piani di emergenza, aree di attesa.' },
  ];
  return (
    <Figure
      title="Da cosa dipende il rischio sismico"
      caption="Il rischio è il risultato di tre fattori. Se uno dei tre è basso, il rischio si abbassa: per questo, anche se i terremoti non si possono prevedere, si possono ridurre i danni."
      source="Dipartimento della Protezione Civile — Descrizione del rischio sismico"
      sourceHref="https://rischi.protezionecivile.gov.it/it/sismico/descrizione-del-rischio/"
    >
      <div className="risk">
        {items.map((it, i) => (
          <div key={it.k} className="risk__row">
            <div className="risk__card">
              <p className="strong">{it.k}</p>
              <p>{it.q}</p>
              <p className="small muted">{it.e}</p>
            </div>
            <span className="risk__op" aria-hidden="true">
              {i < 2 ? '×' : '='}
            </span>
          </div>
        ))}
        <div className="risk__card risk__card--result">
          <p className="strong">Rischio</p>
          <p>I danni che ci si può aspettare.</p>
        </div>
      </div>
    </Figure>
  );
}
