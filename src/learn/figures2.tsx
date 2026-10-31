/**
 * Figure degli articoli su storia sismica e vulcani.
 * Dati: CPTI15 v4.0 (src/data/learn/cpti15.json, scripts/build-history-data.py)
 * e catalogo INGV per i Campi Flegrei (src/data/learn/campi-flegrei.json, scripts/build-learn-data.mjs).
 */
import cpti from '../data/learn/cpti15.json';
import cf from '../data/learn/campi-flegrei.json';
import { useWidth, LegendItem } from '../components/charts/ChartFrame';
import { linear, niceTicks } from '../components/charts/scales';
import { formatInt } from '../lib/format';
import { Figure } from './figures';

interface CptiEvent {
  anno: number;
  mese: number | null;
  giorno: number | null;
  area: string;
  mw: number;
  io: string | null;
}

const dec = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
/** "9-10" -> 9,5 ; "11" -> 11 */
const ioNum = (io: string | null) => {
  if (!io) return null;
  const parts = String(io).split('-').map(Number);
  return parts.length === 2 ? (parts[0] + parts[1]) / 2 : parts[0];
};
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
const CPTI_SRC = 'INGV, Catalogo Parametrico dei Terremoti Italiani CPTI15 v4.0';
const CPTI_URL = 'https://emidius.mi.ingv.it/CPTI15-DBMI15/';

/* ---------- Linea del tempo dei terremoti più forti ---------- */

const LABELLED = new Set([1456, 1693, 1783, 1908, 1915, 1980]);

export function HistoryTimeline() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const H = 300;
  const M = { top: 44, right: 16, bottom: 34, left: 40 };
  const events = (cpti.forti as CptiEvent[]).slice().sort((a, b) => a.anno - b.anno);
  return (
    <Figure
      title="Mille anni di terremoti forti in Italia"
      caption={
        <>
          Ogni cerchio è un terremoto di magnitudo stimata 6,5 o più ({events.length} dal catalogo storico). In alto i più
          forti. Per i terremoti antichi la magnitudo è ricavata dagli effetti descritti nei documenti, quindi è una stima.
        </>
      }
      source={CPTI_SRC}
      sourceHref={CPTI_URL}
      table={
        <ul className="advice">
          {events
            .slice()
            .sort((a, b) => b.mw - a.mw)
            .map((e) => (
              <li key={`${e.anno}-${e.mese}-${e.giorno}-${e.area}`}>
                {e.anno} — {e.area}: Mw {dec(e.mw, 2)}
                {e.io ? `, intensità ${e.io}` : ''}
              </li>
            ))}
        </ul>
      }
    >
      <div ref={ref} className="learn-chart" style={{ height: H }}>
        {width > 0 &&
          (() => {
            const x = linear([1000, 2030], [M.left, width - M.right]);
            const y = linear([6.45, 7.4], [H - M.bottom, M.top]);
            const labels = events.filter((e) => LABELLED.has(e.anno) && (e.anno !== 1783 || e.mese === 2) && (e.mw >= 7 || e.anno === 1980));
            return (
              <svg width={width} height={H} role="img" aria-label="Linea del tempo dei terremoti italiani più forti">
                <g className="grid">
                  {[6.5, 7.0].map((v) => (
                    <g key={v}>
                      <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} />
                      <text className="axis-label" x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
                        {dec(v)}
                      </text>
                    </g>
                  ))}
                </g>
                <text className="axis-title" x={4} y={14}>
                  Magnitudo (Mw)
                </text>
                <g className="axis">
                  <line x1={M.left} x2={width - M.right} y1={H - M.bottom} y2={H - M.bottom} />
                  {[1000, 1200, 1400, 1600, 1800, 2000].map((yr) => (
                    <text key={yr} x={x(yr)} y={H - M.bottom + 20} textAnchor="middle">
                      {yr}
                    </text>
                  ))}
                </g>
                {events.map((e) => (
                  <circle key={`${e.anno}-${e.mese}-${e.giorno}-${e.area}`} cx={x(e.anno)} cy={y(e.mw)} r={4 + (e.mw - 6.5) * 6} fill="var(--chart-1)" fillOpacity={0.75} stroke="var(--surface)" strokeWidth={2}>
                    <title>{`${e.anno} — ${e.area}: Mw ${dec(e.mw, 2)}`}</title>
                  </circle>
                ))}
                {width > 480 &&
                  labels.map((e, i) => (
                    <text key={e.anno} className="direct-label" x={x(e.anno)} y={y(e.mw) - 12 - (i % 2) * 14} textAnchor="middle">
                      {`${e.anno} ${e.area.split(' ')[0]}`}
                    </text>
                  ))}
              </svg>
            );
          })()}
      </div>
    </Figure>
  );
}

/* ---------- Quanti terremoti forti per secolo (e perché i numeri antichi sono bassi) ---------- */

export function CenturyBars() {
  const rows = cpti.mw6PerSecolo as [number, number][];
  const max = Math.max(...rows.map(([, n]) => n));
  return (
    <Figure
      title="Terremoti di magnitudo 6 o più, secolo per secolo"
      caption="Sembra che oggi tremi più che nel Medioevo, ma non è così: dei secoli antichi ci sono arrivati meno documenti, quindi molti terremoti non sono stati registrati. I sismologi dicono che il catalogo è “incompleto” per i periodi antichi. Il XXI secolo arriva solo fino al 2020."
      source={CPTI_SRC}
      sourceHref={CPTI_URL}
    >
      <ul className="hbars" aria-label="Terremoti di magnitudo 6 o più per secolo">
        {rows.map(([sec, n]) => (
          <li key={sec}>
            <span className="hbars__label">{ROMAN[sec]} secolo</span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${(n / max) * 100}%` }} />
            </span>
            <span className="hbars__value">{n}</span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/* ---------- Vulcanici contro tettonici: magnitudo e intensità ---------- */

export function VolcanicIntensityChart() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const H = 320;
  const M = { top: 24, right: 20, bottom: 44, left: 44 };
  const tect = (cpti.forti as CptiEvent[]).map((e) => ({ ...e, i: ioNum(e.io) })).filter((e) => e.i !== null);
  const volc = [...(cpti.flegreo.piuForti as CptiEvent[]), ...(cpti.etna.piuForti as CptiEvent[])]
    .map((e) => ({ ...e, i: ioNum(e.io) }))
    .filter((e) => e.i !== null);
  // Etichette dirette: anno + parte del nome dell'area (nel 1883 ci fu un terremoto anche sull'Etna).
  const NAMED: [number, string, string][] = [[1883, 'Ischia', 'Ischia 1883'], [1914, 'Linera', 'Etna 1914'], [2018, 'Fleri', 'Fleri 2018']];
  const nameOf = (e: CptiEvent) => NAMED.find(([y, a]) => e.anno === y && e.area.includes(a))?.[2];
  return (
    <Figure
      title="Piccola magnitudo, grande intensità"
      caption="In orizzontale la magnitudo, in verticale l’intensità massima (effetti). I terremoti vulcanici (arancio) hanno magnitudo molto più basse di quelli tettonici più forti (blu), ma vicino all’epicentro possono fare danni simili, perché nascono a pochissima profondità."
      source={CPTI_SRC}
      sourceHref={CPTI_URL}
      table={
        <ul className="advice">
          {volc.map((e) => (
            <li key={`${e.anno}-${e.area}`}>
              {e.anno} — {e.area}: Mw {dec(e.mw, 2)}, intensità {e.io}
            </li>
          ))}
        </ul>
      }
    >
      <p className="chart-legend">
        <LegendItem kind="dot" color="var(--chart-1)">Terremoti tettonici forti (Mw ≥ 6,5)</LegendItem>
        <LegendItem kind="dot" color="var(--chart-2)">Terremoti vulcanici (area flegrea ed Etna)</LegendItem>
      </p>
      <div ref={ref} className="learn-chart" style={{ height: H }}>
        {width > 0 &&
          (() => {
            const x = linear([3.6, 7.5], [M.left, width - M.right]);
            const y = linear([6.5, 11.5], [H - M.bottom, M.top]);
            return (
              <svg width={width} height={H} role="img" aria-label="Grafico magnitudo contro intensità: vulcanici e tettonici">
                <g className="grid">
                  {[7, 8, 9, 10, 11].map((v) => (
                    <g key={v}>
                      <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} />
                      <text className="axis-label" x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
                        {ROMAN[v]}
                      </text>
                    </g>
                  ))}
                </g>
                <g className="axis">
                  <line x1={M.left} x2={width - M.right} y1={H - M.bottom} y2={H - M.bottom} />
                  {niceTicks(4, 7.5, 7).map((v) => (
                    <text key={v} x={x(v)} y={H - M.bottom + 18} textAnchor="middle">
                      {dec(v)}
                    </text>
                  ))}
                  <text className="axis-title" x={(M.left + width - M.right) / 2} y={H - 4} textAnchor="middle">
                    Magnitudo (Mw)
                  </text>
                </g>
                <text className="axis-title" x={4} y={14}>
                  Intensità
                </text>
                {tect.map((e) => (
                  <circle key={`t${e.anno}${e.area}`} cx={x(e.mw)} cy={y(e.i!)} r={5} fill="var(--chart-1)" fillOpacity={0.8} stroke="var(--surface)" strokeWidth={2}>
                    <title>{`${e.anno} ${e.area}: Mw ${dec(e.mw, 2)}, intensità ${e.io}`}</title>
                  </circle>
                ))}
                {volc.map((e) => (
                  <circle key={`v${e.anno}${e.area}`} cx={x(e.mw)} cy={y(e.i!)} r={5} fill="var(--chart-2)" fillOpacity={0.9} stroke="var(--surface)" strokeWidth={2}>
                    <title>{`${e.anno} ${e.area}: Mw ${dec(e.mw, 2)}, intensità ${e.io}`}</title>
                  </circle>
                ))}
                {volc
                  .filter((e) => nameOf(e))
                  .map((e) => (
                    <text key={`l${e.anno}`} className="direct-label" x={x(e.mw) + 8} y={y(e.i!) - 8}>
                      {nameOf(e)}
                    </text>
                  ))}
              </svg>
            );
          })()}
      </div>
    </Figure>
  );
}

/* ---------- Campi Flegrei: terremoti per anno ---------- */

export function CFYearBars() {
  // Anche gli anni senza terremoti nel catalogo (es. 2017) compaiono, con 0.
  const byYear = new Map((cf.perAnno as [number, number, number][]).map((r) => [r[0], r]));
  const lastYear = Math.max(...byYear.keys());
  const rows: [number, number, number][] = [];
  for (let y = 2014; y <= lastYear; y++) rows.push(byYear.get(y) ?? [y, 0, 0]);
  const max = Math.max(...rows.map(([, n]) => n));
  return (
    <Figure
      title="Campi Flegrei: quanti terremoti ogni anno, e il più forte"
      caption={
        <>
          Terremoti dell’area flegrea presenti nel catalogo nazionale INGV, entro 8 km da Pozzuoli. L’Osservatorio Vesuviano ne
          registra molti di più (anche piccolissimi), ma la tendenza è la stessa: dal 2019 la sismicità aumenta sia di numero
          sia di magnitudo. L’ultimo anno è parziale: dati scaricati il {cf.scaricato}.
        </>
      }
      source="INGV, catalogo dei terremoti (richiesta FDSN)"
      sourceHref={cf.richiesta}
    >
      <ul className="hbars hbars--wide-value" aria-label="Terremoti ai Campi Flegrei per anno">
        {rows.map(([y, n, m]) => (
          <li key={y}>
            <span className="hbars__label">{y}</span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${Math.max(1, (n / max) * 100)}%` }} />
            </span>
            <span className="hbars__value">
              {formatInt(n)}
              {n > 0 && <span className="muted"> · max {dec(m)}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/* ---------- Campi Flegrei: terremoti al mese (dal 2015) ---------- */

export function CFMonthlyChart() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const H = 260;
  const M = { top: 20, right: 12, bottom: 32, left: 40 };
  const months = (cf.mensile as [string, number][]).filter(([k]) => k >= '2015-01');
  const maxN = Math.max(...months.map(([, n]) => n));
  return (
    <Figure
      title="Campi Flegrei: terremoti al mese dal 2015"
      caption="Ogni barra è un mese. Fino al 2018 i terremoti localizzati erano pochissimi; dal 2022 diventano decine e poi centinaia al mese, spesso in “sciami” di poche ore."
      source="INGV, catalogo dei terremoti (richiesta FDSN)"
      sourceHref={cf.richiesta}
    >
      <div ref={ref} className="learn-chart" style={{ height: H }}>
        {width > 0 &&
          (() => {
            const x = linear([0, months.length], [M.left, width - M.right]);
            const y = linear([0, maxN * 1.05], [H - M.bottom, M.top]);
            const bw = Math.max(1, x(1) - x(0) - 1);
            return (
              <svg width={width} height={H} role="img" aria-label="Grafico: numero di terremoti al mese ai Campi Flegrei dal 2015">
                <g className="grid">
                  {niceTicks(0, maxN, 4).map((v) => (
                    <g key={v}>
                      <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} />
                      <text className="axis-label" x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
                        {v}
                      </text>
                    </g>
                  ))}
                </g>
                {months.map(([k, n], i) =>
                  n > 0 ? (
                    <rect key={k} x={x(i)} y={y(n)} width={bw} height={y(0) - y(n)} fill="var(--chart-2)">
                      <title>{`${k}: ${n} terremoti`}</title>
                    </rect>
                  ) : null,
                )}
                <g className="axis">
                  <line x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} />
                  {months.map(([k], i) =>
                    k.endsWith('-01') && (Number(k.slice(0, 4)) % (width < 500 ? 3 : 2) === 1) ? (
                      <text key={k} x={x(i)} y={H - M.bottom + 18} textAnchor="middle">
                        {k.slice(0, 4)}
                      </text>
                    ) : null,
                  )}
                </g>
              </svg>
            );
          })()}
      </div>
    </Figure>
  );
}

/* ---------- Campi Flegrei: sollevamento del suolo nelle tre crisi ---------- */

export function UpliftBars() {
  const rows: [string, number, string][] = [
    ['1970–1972', 160, 'circa 1,5–1,7 m'],
    ['1982–1984', 180, 'circa 1,8 m'],
    ['dal 2005 a oggi', 169.5, 'circa 169,5 cm (fino ad agosto 2026)'],
  ];
  return (
    <Figure
      title="Quanto si è alzato il suolo a Pozzuoli"
      caption="Sollevamento massimo del suolo nelle tre fasi di bradisismo. Le prime due crisi furono rapide (pochi anni); quella attuale è iniziata nel 2005 ed è stata più lenta, ma ha ormai raggiunto valori simili. Il dato attuale è quello della stazione GPS del Rione Terra (RITE)."
      source="INGV – Osservatorio Vesuviano, Bollettino di sorveglianza Campi Flegrei, settembre 2026; pubblicazioni INGV sulle crisi del 1970–72 e 1982–84"
      sourceHref="https://www.ov.ingv.it/index.php/monitoraggio-e-infrastrutture/bollettini-tutti/bollett-mensili-cf/anno-2026-3/2017-bollettino-mensile-campi-flegrei-2026-09/file"
    >
      <ul className="hbars hbars--wide-value" aria-label="Sollevamento del suolo nelle crisi di bradisismo">
        {rows.map(([label, cm, text]) => (
          <li key={label}>
            <span className="hbars__label">{label}</span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${(cm / 180) * 100}%`, background: 'var(--chart-2)' }} />
            </span>
            <span className="hbars__value">{text}</span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}
