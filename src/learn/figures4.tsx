/**
 * Figure dell'articolo «Il mal da terremoto».
 * - Fattori di rischio: Miwa e altri (2021), PLOS ONE, tabella 2 (regressione logistica multivariata).
 * - Equilibrio a occhi chiusi: Honma e altri (2012), Scientific Reports, tabella 1.
 * - Scosse sentite a Norcia: catalogo INGV (src/data/learn/seq-centro-italia.json) e la stessa formula
 *   dell'intensità usata nel resto del sito (src/lib/impact.ts, Allen, Wald e Worden 2012).
 */
import { useEffect, useState } from 'react';
import { useWidth } from '../components/charts/ChartFrame';
import { linear } from '../components/charts/scales';
import { intensityAt } from '../lib/impact';
import type { Quake } from '../lib/types';
import { Figure } from './figures';

const dec = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
const MIWA = 'Miwa e altri (2021), PLOS ONE';
const MIWA_URL = 'https://doi.org/10.1371/journal.pone.0255816';
const HONMA = 'Honma e altri (2012), Scientific Reports';
const HONMA_URL = 'https://doi.org/10.1038/srep00749';

/* ---------- Chi ne soffre di più (Kumamoto 2016) ---------- */

/** Odds ratio della tabella 2 di Miwa e altri (2021). */
const FACTORS: [string, number][] = [
  ['Sentirsi in ansia', 3.05],
  ['Avere 21 anni o più', 3.0],
  ['Essere donna', 1.71],
  ['Fischi o orecchie tappate', 1.43],
  ['Essere dal 3° piano in su', 1.35],
  ['Soffrire il mal d’auto o di mare', 1.22],
];

export function RiskFactorsChart() {
  const top = 3.5;
  return (
    <Figure
      title="Chi lo sente di più: i fattori trovati a Kumamoto"
      caption={
        <>
          Quanto aumenta la probabilità di avere il mal da terremoto, a parità degli altri fattori (1 = nessuna differenza, la
          linea). Chi si sentiva in ansia aveva circa il triplo delle probabilità; chi abitava dal terzo piano in su, circa un
          terzo in più. Non contavano invece la zona e il tipo di edificio (legno o cemento).
        </>
      }
      source={MIWA}
      sourceHref={MIWA_URL}
      table={
        <p>
          Odds ratio della regressione logistica multivariata su 3.656 persone:{' '}
          {FACTORS.map(([l, v]) => `${l.toLowerCase()} ${dec(v, 2)}`).join('; ')}. I sintomi del sistema nervoso autonomo
          (per esempio capogiri alzandosi in piedi) avevano un effetto più piccolo, 1,10.
        </p>
      }
    >
      <ul className="hbars hbars--ref" aria-label="Fattori associati al mal da terremoto e quanto aumentano la probabilità">
        {FACTORS.map(([label, v]) => (
          <li key={label}>
            <span className="hbars__label">{label}</span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${(v / top) * 100}%` }} />
              <i className="hbars__ref" style={{ left: `${(1 / top) * 100}%` }} />
            </span>
            <span className="hbars__value">× {dec(v, 2)}</span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/* ---------- L'equilibrio cambia anche senza sintomi (Tokyo e Osaka, 2011) ---------- */

/** Tabella 1 di Honma e altri (2012): area dell'oscillazione del corpo (mm², rettangolo), media dei gruppi. */
const SWAY = {
  aperti: { tokyo: 521.0, osaka: 402.3, p: 0.191 },
  chiusi: { tokyo: 675.9, osaka: 467.9, p: 0.007 },
};

export function SwayChart() {
  const top = 750;
  const rows: [string, number, boolean][] = [
    ['Occhi aperti · Osaka', SWAY.aperti.osaka, false],
    ['Occhi aperti · Tokyo', SWAY.aperti.tokyo, true],
    ['Occhi chiusi · Osaka', SWAY.chiusi.osaka, false],
    ['Occhi chiusi · Tokyo', SWAY.chiusi.tokyo, true],
  ];
  const more = SWAY.chiusi.tokyo / SWAY.chiusi.osaka - 1;
  return (
    <Figure
      title="Quanto oscilla il corpo stando fermi in piedi"
      caption={
        <>
          Quattro mesi dopo il terremoto del Giappone del 2011, 101 studenti universitari sono stati fatti stare fermi in
          piedi per un minuto su una pedana che misura le oscillazioni del corpo. A Tokyo (blu) le repliche erano state
          continue; a Osaka (arancio), lontana 700 km, quasi nessuna. Nessuno di loro si lamentava di capogiri. Con gli occhi
          aperti non c’erano differenze chiare; con gli occhi chiusi gli studenti di Tokyo oscillavano su un’area di circa il{' '}
          {Math.round(more * 100)}% più grande. La vista, quando c’è, compensa.
        </>
      }
      source={HONMA}
      sourceHref={HONMA_URL}
      table={
        <p>
          Area rettangolare dell’oscillazione del centro di gravità, in mm² (media): occhi aperti Tokyo {dec(SWAY.aperti.tokyo)},
          Osaka {dec(SWAY.aperti.osaka)} (p = {dec(SWAY.aperti.p, 3)}); occhi chiusi Tokyo {dec(SWAY.chiusi.tokyo)}, Osaka{' '}
          {dec(SWAY.chiusi.osaka)} (p = {dec(SWAY.chiusi.p, 3)}). Anche la lunghezza del percorso a occhi chiusi era maggiore
          a Tokyo: 599,9 contro 495,8 mm (p = 0,003). Ansia, umore e sonno erano simili nei due gruppi.
        </p>
      }
    >
      <ul className="hbars hbars--wide-value" aria-label="Area dell’oscillazione del corpo, Tokyo e Osaka, occhi aperti e chiusi">
        {rows.map(([label, v, tokyo]) => (
          <li key={label}>
            <span className="hbars__label">{label}</span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${(v / top) * 100}%`, background: tokyo ? undefined : 'var(--chart-2)' }} />
            </span>
            <span className="hbars__value">{dec(v, 0)} mm²</span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/* ---------- Scosse vere, probabilmente sentite a Norcia, settimana per settimana ---------- */

const NORCIA = { lat: 42.793, lon: 13.093 };
const FIRST_DAY = Date.UTC(2016, 7, 24); // 24 agosto 2016, giorno di Amatrice
const WEEKS = 27;
const fmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', timeZone: 'UTC' });

interface SeqData {
  inizio: string;
  eventi: [number, number, number, number, number][];
  richieste: string[];
}

/** Settimane dal 24 agosto 2016: quante scosse (M ≥ 2,5) avevano un’intensità stimata a Norcia di almeno 3. */
function feltPerWeek(d: SeqData) {
  const start = Date.parse(d.inizio);
  const weeks = Array(WEEKS).fill(0) as number[];
  for (const [min, lat, lon, depth, mag] of d.eventi) {
    const t = start + min * 60_000;
    const w = Math.floor((t - FIRST_DAY) / (7 * 86_400_000));
    if (w < 0 || w >= WEEKS) continue;
    const q = { lat: lat / 1000, lon: lon / 1000, depthKm: depth / 10, mag: mag / 10 } as unknown as Quake;
    if (intensityAt(q, NORCIA) >= 3) weeks[w]++;
  }
  return weeks;
}

export function NorciaFeltChart() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [data, setData] = useState<{ weeks: number[]; url: string } | null>(null);
  useEffect(() => {
    let alive = true;
    import('../data/learn/seq-centro-italia.json').then((m) => {
      const d = m.default as unknown as SeqData;
      if (alive) setData({ weeks: feltPerWeek(d), url: d.richieste[0] });
    });
    return () => {
      alive = false;
    };
  }, []);
  const H = 300;
  const M = { top: 28, right: 12, bottom: 40, left: 12 };
  const weeks = data?.weeks ?? [];
  const max = Math.max(1, ...weeks);
  const quiet = weeks.filter((n, i) => i > 0 && n <= 5).length;
  return (
    <Figure
      title="Norcia 2016–2017: le scosse vere che si sentivano in casa, settimana per settimana"
      caption={
        <>
          Stima di quante scosse si sono sentite chiaramente in casa a Norcia (intensità 3 o più), dal 24 agosto 2016 a fine
          febbraio 2017. Dopo le scosse forti le scosse sentite erano decine al giorno; ma in {quiet || '…'} settimane su{' '}
          {WEEKS - 1} se ne sono sentite 5 o meno. È proprio nelle settimane tranquille che il mal da terremoto si fa notare:
          il corpo si è abituato a «aspettare» la prossima.
        </>
      }
      source="INGV, catalogo dei terremoti (richiesta FDSN)"
      sourceHref={data?.url}
      table={
        <p>
          Scosse di magnitudo 2,5 o più entro 40 km da Norcia (le più piccole non sono nel conto, quindi i numeri sono un
          minimo). L’intensità a Norcia è stimata con la formula di Allen, Wald e Worden (2012), la stessa che il sito usa per
          dire se una scossa si è sentita a casa tua: è una stima, con un margine di circa un grado.{' '}
          {weeks.length > 0 && `Settimana per settimana: ${weeks.join(', ')}.`}
        </p>
      }
    >
      <div ref={ref} className="learn-chart" style={{ height: H }}>
        {!data && <p className="muted">Sto calcolando…</p>}
        {data &&
          width > 0 &&
          (() => {
            const x = linear([0, WEEKS], [M.left, width - M.right]);
            const y = linear([0, Math.sqrt(max)], [H - M.bottom, M.top]);
            const bw = Math.max(3, x(1) - x(0) - 3);
            return (
              <svg width={width} height={H} role="img" aria-label="Grafico a barre: scosse probabilmente sentite in casa a Norcia, per settimana">
                {weeks.map((n, i) => (
                  <g key={i}>
                    {n > 0 && (
                      <rect x={x(i) + 1.5} y={y(Math.sqrt(n))} width={bw} height={y(0) - y(Math.sqrt(n))} fill="var(--chart-1)" rx={2}>
                        <title>{`Settimana dal ${fmt.format(new Date(FIRST_DAY + i * 7 * 86_400_000))}: ${n} scosse sentite`}</title>
                      </rect>
                    )}
                    {(width > 520 || n >= 10 || n === 0) && (
                      <text className="axis-label" x={x(i) + 1.5 + bw / 2} y={y(Math.sqrt(n)) - 5} textAnchor="middle">
                        {n}
                      </text>
                    )}
                  </g>
                ))}
                <g className="axis">
                  <line x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} />
                  {[0, 9, 13, 21].map((i) => (
                    <text key={i} x={x(i) + 1.5 + bw / 2} y={H - M.bottom + 18} textAnchor={i === 0 ? 'start' : 'middle'}>
                      {fmt.format(new Date(FIRST_DAY + i * 7 * 86_400_000))}
                    </text>
                  ))}
                </g>
              </svg>
            );
          })()}
      </div>
      <p className="small muted">Barre in scala a radice quadrata, per far vedere anche le settimane con poche scosse.</p>
    </Figure>
  );
}

export const swayIncrease = SWAY.chiusi.tokyo / SWAY.chiusi.osaka - 1;
