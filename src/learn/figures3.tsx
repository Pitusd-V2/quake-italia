/**
 * Figure di «Esiste il tempo da terremoto?».
 * Dati: src/data/learn/tempo-terremoto.json, prodotti da scripts/build-weather-myth-data.mjs
 * (catalogo INGV 1985–2024 e rianalisi meteorologica ERA5 via Open-Meteo).
 */
import data from '../data/learn/tempo-terremoto.json';
import { useWidth, LegendItem } from '../components/charts/ChartFrame';
import { linear, niceTicks } from '../components/charts/scales';
import { formatInt } from '../lib/format';
import { ExternalLink } from '../components/ui';
import { Figure } from './figures';

const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const pct = (v: number) => `${Math.round(v * 100)}%`;
const dec = (v: number, d = 2) => v.toFixed(d).replace('.', ',');
const INGV_SRC = 'INGV, catalogo dei terremoti (richieste FDSN)';
const INGV_URL = data.richieste.ingv[data.richieste.ingv.length - 1];
const METEO_SRC = 'Open-Meteo, rianalisi ERA5 (Copernicus)';
const METEO_URL = data.richieste.meteoEsempio[0];

/** p-value detto a parole, senza nasconderlo. */
export const pText = (p: number) => (p < 0.001 ? 'meno di 1 su 1.000' : `${dec(p, 2)}`);

/* ---------- Le stagioni: terremoti indipendenti per mese ---------- */

export function MonthsChart() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const H = 280;
  const M = { top: 20, right: 12, bottom: 34, left: 44 };
  const counts = data.mesi.conteggi;
  const expected = data.mesi.attesi;
  const max = Math.max(...counts, ...expected) * 1.1;
  return (
    <Figure
      title="Terremoti per mese: l’estate non ne ha di più"
      caption={
        <>
          Terremoti di magnitudo 2,5 o più in Italia dal 2005 al 2024, <strong>senza le repliche</strong> (
          {formatInt(data.mesi.n)} terremoti «indipendenti»). La linea tratteggiata è quanti ce ne aspetteremmo se il mese
          non contasse niente: segue solo i giorni del mese (febbraio è più corto). Le differenze sono quelle che il caso
          produce da solo.
        </>
      }
      source={INGV_SRC}
      sourceHref={INGV_URL}
      table={
        <ul className="advice">
          {counts.map((c, i) => (
            <li key={MONTHS[i]}>
              {MONTHS[i]}: {formatInt(c)} (attesi {dec(expected[i], 1)})
            </li>
          ))}
        </ul>
      }
    >
      <div ref={ref} className="learn-chart" style={{ height: H }}>
        {width > 0 &&
          (() => {
            const x = linear([0, 12], [M.left, width - M.right]);
            const y = linear([0, max], [H - M.bottom, M.top]);
            const bw = Math.max(4, x(1) - x(0) - 6);
            return (
              <svg width={width} height={H} role="img" aria-label="Grafico a barre: terremoti indipendenti per mese, con la linea di quanti se ne aspetterebbero per caso">
                <g className="grid">
                  {niceTicks(0, max, 4).map((v) => (
                    <g key={v}>
                      <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} />
                      <text className="axis-label" x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
                        {v}
                      </text>
                    </g>
                  ))}
                </g>
                {counts.map((c, i) => (
                  <g key={MONTHS[i]}>
                    <rect x={x(i) + 3} y={y(c)} width={bw} height={y(0) - y(c)} fill="var(--chart-1)" rx={2}>
                      <title>{`${MONTHS[i]}: ${c} terremoti, attesi ${dec(expected[i], 1)}`}</title>
                    </rect>
                    <line x1={x(i) + 1} x2={x(i) + bw + 5} y1={y(expected[i])} y2={y(expected[i])} stroke="var(--chart-fit)" strokeWidth={2} strokeDasharray="4 3" />
                  </g>
                ))}
                <g className="axis">
                  <line x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} />
                  {MONTHS.map((m, i) => (
                    <text key={m} x={x(i) + 3 + bw / 2} y={H - M.bottom + 18} textAnchor="middle">
                      {width < 420 ? m[0].toUpperCase() : m}
                    </text>
                  ))}
                </g>
              </svg>
            );
          })()}
      </div>
    </Figure>
  );
}

/* ---------- Le ore: scosse minuscole contro terremoti veri ---------- */

const norm = (xs: number[]) => {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return xs.map((v) => v / m);
};

export function HoursChart() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const H = 280;
  const M = { top: 20, right: 12, bottom: 40, left: 44 };
  const tiny = data.rilevamento.fasce[0];
  const small = norm(tiny.ore);
  const real = norm(data.ore.conteggi);
  const yMax = 1.45;
  const yMin = 0.6;
  return (
    <Figure
      title="A che ora? Le scosse minuscole «preferiscono» la notte, i terremoti no"
      caption={
        <>
          Quante scosse in ogni ora del giorno (ora italiana), rispetto alla media (1 = come la media). In arancio le scosse
          minuscole, sotto magnitudo 1 ({formatInt(tiny.scosse)} dal 2015 al 2024): di notte sono il{' '}
          {pct(tiny.rapportoNotteGiorno - 1)} in più. In blu i terremoti indipendenti di magnitudo 2,5 o più: nessuna ora
          preferita. Le scosse minuscole non avvengono di più di notte: <strong>di notte si sentono meglio</strong>, perché
          traffico e attività umane non coprono il segnale degli strumenti.
        </>
      }
      source={INGV_SRC}
      sourceHref={INGV_URL}
      table={
        <p>
          Rapporto fra le scosse per ora di notte (00–06) e di giorno (09–18), 2015–2024, repliche comprese:{' '}
          {data.rilevamento.fasce.map((f) => `magnitudo ${f.fascia}: ${dec(f.rapportoNotteGiorno)}`).join('; ')}. Per le
          magnitudo più alte il numero dipende soprattutto dall’ora delle grandi sequenze (per esempio Norcia, alle 7:40).
        </p>
      }
    >
      <div ref={ref} className="learn-chart" style={{ height: H }}>
        {width > 0 &&
          (() => {
            const x = linear([0, 23], [M.left, width - M.right]);
            const y = linear([yMin, yMax], [H - M.bottom, M.top]);
            const path = (vs: number[]) => vs.map((v, h) => `${h ? 'L' : 'M'}${x(h).toFixed(1)},${y(v).toFixed(1)}`).join('');
            return (
              <svg width={width} height={H} role="img" aria-label="Grafico a linee: scosse per ora del giorno rispetto alla media, scosse minuscole contro terremoti indipendenti">
                <rect x={x(0)} y={M.top} width={x(6) - x(0)} height={H - M.bottom - M.top} fill="var(--surface-2)" />
                <rect x={x(21)} y={M.top} width={x(23) - x(21)} height={H - M.bottom - M.top} fill="var(--surface-2)" />
                <g className="grid">
                  {[0.6, 0.8, 1, 1.2, 1.4].map((v) => (
                    <g key={v}>
                      <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} strokeDasharray={v === 1 ? undefined : '2 3'} />
                      <text className="axis-label" x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
                        {dec(v, 1)}
                      </text>
                    </g>
                  ))}
                </g>
                <path d={path(real)} fill="none" stroke="var(--chart-1)" strokeWidth={2.5} />
                <path d={path(small)} fill="none" stroke="var(--chart-2)" strokeWidth={2.5} />
                <g className="axis">
                  {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
                    <text key={h} x={x(h)} y={H - M.bottom + 18} textAnchor="middle">
                      {`${h}:00`}
                    </text>
                  ))}
                  <text className="axis-title" x={(x(0) + x(6)) / 2} y={M.top + 14} textAnchor="middle">
                    notte
                  </text>
                </g>
              </svg>
            );
          })()}
      </div>
      <p className="chart-legend">
        <LegendItem kind="line" color="var(--chart-2)">
          Scosse minuscole (sotto magnitudo 1)
        </LegendItem>
        <LegendItem kind="line" color="var(--chart-1)">
          Terremoti indipendenti (magnitudo 2,5 o più)
        </LegendItem>
      </p>
    </Figure>
  );
}

/* ---------- Il tempo nelle 24 ore prima: quinti ---------- */

const FIFTHS = {
  caldo: ['Tra le più fresche', 'Più fresche della media', 'Nella media', 'Più calde della media', 'Tra le più calde'],
  vento: ['Tra le più calme', 'Meno ventose della media', 'Nella media', 'Più ventose della media', 'Tra le più ventose'],
};

export function WeatherFifths({ kind }: { kind: 'caldo' | 'vento' }) {
  const d = data.meteo[kind];
  const total = d.quinti.reduce((a, b) => a + b, 0);
  const top = 0.3; // la barra piena vale il 30%
  return (
    <Figure
      title={kind === 'caldo' ? 'Faceva più caldo prima dei terremoti? No' : 'C’era meno vento prima dei terremoti? No'}
      caption={
        kind === 'caldo' ? (
          <>
            Per ognuno dei {data.meteo.terremoti} terremoti indipendenti di magnitudo 4 o più (1985–2024) abbiamo preso la
            temperatura massima delle 24 ore prima della scossa e l’abbiamo confrontata con le stesse 24 ore dei 15 giorni
            prima e dei 15 giorni dopo, nello stesso punto. Se il caldo non c’entra, ogni gruppo raccoglie circa il 20% dei
            terremoti (la linea). Se il «tempo da terremoto» esistesse, l’ultima barra sarebbe molto più lunga.
          </>
        ) : (
          <>
            Stesso confronto per il vento medio delle 24 ore prima della scossa. Se l’«aria ferma» annunciasse i terremoti, la
            prima barra sarebbe molto più lunga delle altre.
          </>
        )
      }
      source={METEO_SRC}
      sourceHref={METEO_URL}
      table={
        <p>
          Posizione media del giorno della scossa fra i 31 giorni del confronto: {dec(d.media, 3)} (0 = il più{' '}
          {kind === 'caldo' ? 'fresco' : 'calmo'}, 1 = il più {kind === 'caldo' ? 'caldo' : 'ventoso'}; per puro caso ci si
          aspetta 0,5 ± {dec(d.incertezza95, 3)}).
        </p>
      }
    >
      <ul className="hbars hbars--wide-value hbars--ref" aria-label={`Terremoti per ${kind === 'caldo' ? 'temperatura' : 'vento'} delle 24 ore prima`}>
        {d.quinti.map((n, i) => (
          <li key={FIFTHS[kind][i]}>
            <span className="hbars__label">{FIFTHS[kind][i]}</span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${(n / total / top) * 100}%` }} />
              <i className="hbars__ref" style={{ left: `${(0.2 / top) * 100}%` }} />
            </span>
            <span className="hbars__value">
              {n} terremoti <span className="muted">· {pct(n / total)}</span>
            </span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/* ---------- I grandi terremoti, uno per uno ---------- */

const NAMES: Record<string, string> = {
  '1997-09-26': 'Umbria e Marche',
  '2009-04-06': 'L’Aquila',
  '2012-05-20': 'Emilia',
  '2016-08-24': 'Amatrice e Accumoli',
  '2016-10-26': 'Visso',
  '2016-10-30': 'Norcia',
};
const longDate = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Dove si colloca un valore fra i 31 giorni del confronto, a parole. */
function where(p: number | null, low: string, high: string) {
  if (p == null) return 'dato mancante';
  if (p < 0.2) return `tra le più ${low}`;
  if (p < 0.4) return `un po’ più ${low} della media`;
  if (p <= 0.6) return 'nella media';
  if (p <= 0.8) return `un po’ più ${high} della media`;
  return `tra le più ${high}`;
}

export function BigQuakesWeather() {
  const rows = data.meteo.grandi;
  return (
    <figure className="learn-figure">
      <p className="learn-figure__title">Che tempo faceva prima dei grandi terremoti</p>
      <div className="table-wrap">
        <table className="data-table">
          <caption className="visually-hidden">Il tempo nelle 24 ore prima dei terremoti di magnitudo 5,8 o più dal 1985</caption>
          <thead>
            <tr>
              <th scope="col">Terremoto</th>
              <th scope="col">Temperatura (24 ore prima)</th>
              <th scope="col">Vento (24 ore prima)</th>
              <th scope="col" className="num">Pioggia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.data}-${r.ora}`}>
                <td>
                  <span className="strong">{NAMES[r.data] ?? r.luogo}</span>
                  <br />
                  <span className="small muted">
                    {longDate.format(new Date(`${r.data}T00:00:00Z`))}, ore {r.ora} · {r.tipoMag} {dec(r.mag, 1)}
                  </span>
                </td>
                <td>
                  max {r.tmax24h == null ? '—' : `${dec(r.tmax24h, 1)} °C`}
                  <br />
                  <span className="small muted">{where(r.caldo, 'fresche', 'calde')}</span>
                </td>
                <td>
                  {r.ventoMedio24h == null ? '—' : `${dec(r.ventoMedio24h, 1)} km/h`}
                  <br />
                  <span className="small muted">{where(r.vento, 'calme', 'ventose')}</span>
                </td>
                <td className="num">{r.pioggia24h == null ? '—' : `${dec(r.pioggia24h, 1)} mm`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="learn-figure__caption">
        <span>
          Ogni riga confronta le 24 ore prima della scossa con le stesse ore dei 15 giorni prima e dopo, nello stesso punto
          («nella media», «tra le più calde»…). Sono valori di rianalisi su una griglia di decine di chilometri: descrivono il
          tempo della zona, non quello di una singola strada.
        </span>
        <span className="learn-figure__source">
          Fonte: <ExternalLink href="https://open-meteo.com/en/docs/historical-weather-api">{METEO_SRC}</ExternalLink>{' '}
          e INGV (magnitudo e orari)
        </span>
      </figcaption>
    </figure>
  );
}

/* ---------- La trappola del catalogo vecchio ---------- */

function ratios(test: { conteggi: number[]; attesi: number[] }) {
  const sum = (xs: number[], ms: number[]) => ms.reduce((s, m) => s + xs[m], 0);
  return {
    inverno: sum(test.conteggi, [11, 0, 1]) / sum(test.attesi, [11, 0, 1]),
    estate: sum(test.conteggi, [5, 6, 7]) / sum(test.attesi, [5, 6, 7]),
  };
}

export function OldCatalogChart() {
  const old = data.catalogoVecchio.vecchio;
  const neu = data.catalogoVecchio.nuovo;
  const o = ratios(old.test);
  const n = ratios(neu.test);
  const rows: [string, number][] = [
    [`Inverno, ${old.periodo}`, o.inverno],
    [`Estate, ${old.periodo}`, o.estate],
    [`Inverno, ${neu.periodo}`, n.inverno],
    [`Estate, ${neu.periodo}`, n.estate],
  ];
  const top = 1.3;
  return (
    <Figure
      title="Il finto «effetto estate» del catalogo vecchio"
      caption={
        <>
          Terremoti indipendenti di magnitudo 3 o più, inverno (dicembre–febbraio) ed estate (giugno–agosto), rispetto a
          quanti ce ne aspetteremmo (la linea = come atteso). Fino al 2004 sembra che d’estate ci siano il{' '}
          {pct(o.estate - 1)} di terremoti in più. Dal 2005, con la rete di stazioni moderna, l’effetto sparisce.
        </>
      }
      source={INGV_SRC}
      sourceHref={INGV_URL}
      table={
        <p>
          {old.periodo}: {formatInt(old.test.n)} terremoti, magnitudo quasi tutte di durata (Md: {formatInt(Number(old.tipiMagnitudo[0][1]))});
          test a rotazione p = {pText(old.test.p)}. {neu.periodo}: {formatInt(neu.test.n)} terremoti, magnitudo locali e
          momento (ML e Mw); p = {pText(neu.test.p)}. Solo magnitudo 3–3,4: prima {dec(old.da3a35.inverno)} in inverno e{' '}
          {dec(old.da3a35.estate)} in estate, poi {dec(neu.da3a35.inverno)} e {dec(neu.da3a35.estate)}.
        </p>
      }
    >
      <ul className="hbars hbars--ref" aria-label="Terremoti in inverno ed estate rispetto all’atteso, catalogo vecchio e nuovo">
        {rows.map(([label, r]) => (
          <li key={label}>
            <span className="hbars__label">{label}</span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${(r / top) * 100}%`, background: label.includes(old.periodo) ? 'var(--chart-2)' : undefined }} />
              <i className="hbars__ref" style={{ left: `${(1 / top) * 100}%` }} />
            </span>
            <span className="hbars__value">{dec(r)}</span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

export const weatherData = data;
