/**
 * Figure dell'articolo «Una scossa, tante magnitudo».
 * Dati: tutte le stime della magnitudo che il catalogo INGV conserva per ogni terremoto
 * (src/data/learn/magnitudo.json, da scripts/build-magnitude-data.mjs).
 */
import { useWidth, LegendItem } from '../components/charts/ChartFrame';
import { linear } from '../components/charts/scales';
import { ExternalLink } from '../components/ui';
import { Figure } from './figures';
import { amatrice, conMw, d1, magnitudoData, momentoForbice, momentoVolte, norcia, type Sintesi } from './facts/magnitudo';

const INGV_SRC = 'INGV, catalogo dei terremoti (tutte le magnitudo di ogni scossa, richieste FDSN)';
const date = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' });

/* ---------- Le stime della magnitudo, terremoto per terremoto ---------- */

const ROW = 64;

/** Le stime uguali si mettono una sopra l'altra, così si vede quante sono. */
function stacked(values: number[]) {
  const seen = new Map<number, number>();
  const count = new Map<number, number>();
  for (const v of values) count.set(v, (count.get(v) ?? 0) + 1);
  return values.map((v) => {
    const i = seen.get(v) ?? 0;
    seen.set(v, i + 1);
    return { v, dy: (i - ((count.get(v) ?? 1) - 1) / 2) * 5 };
  });
}

function rowSummary(s: Sintesi) {
  const ml = s.mlMin === s.mlMax ? `ML ${d1(s.mlMin ?? 0)}` : `ML ${d1(s.mlMin ?? 0)}–${d1(s.mlMax ?? 0)}`;
  return `${ml} · Mw ${d1(s.mw ?? 0)}`;
}

export function MagnitudeEstimatesChart() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const rows = conMw;
  // Il nome sta sopra la propria riga di punti: così il grafico funziona anche sul telefono.
  const M = { top: 4, right: 16, bottom: 34, left: 16 };
  const H = M.top + rows.length * ROW + M.bottom;
  const lo = 5.3;
  const hi = 6.7;
  return (
    <Figure
      title="Sei terremoti italiani, tutte le loro magnitudo"
      caption={
        <>
          Ogni pallino blu è una stima della magnitudo locale (ML) conservata nel catalogo INGV per quella scossa; i pallini
          uguali sono messi uno sopra l’altro. Il rombo arancione è la magnitudo momento (Mw). Per quasi tutte le scosse la Mw
          cade dentro o accanto al gruppo delle ML, in su o in giù. Norcia è l’eccezione: la Mw ({d1(norcia.mw ?? 0)}) supera di{' '}
          {d1((norcia.mw ?? 0) - (norcia.mlMax ?? 0))} anche la più alta delle sue ML ({d1(norcia.mlMax ?? 0)}).
        </>
      }
      source={INGV_SRC}
      sourceHref={norcia.richiesta}
      table={
        <>
          {magnitudoData.eventi.map((e) => (
            <p key={e.id}>
              <strong>
                {e.nome}, {date.format(new Date(e.tempo))}
              </strong>{' '}
              ({e.luogo}):{' '}
              {e.stime
                .map(
                  (s) =>
                    `${s.tipo} ${d1(s.valore)}${s.incertezza ? ` ± ${d1(s.incertezza)}` : ''}${s.stazioni ? ` (${s.stazioni} stazioni)` : ''}${s.preferita ? ', la principale' : ''}`,
                )
                .join('; ')}
              . <ExternalLink href={e.richiesta}>Richiesta</ExternalLink>
            </p>
          ))}
          <p>
            «Mwp» è un’altra stima della magnitudo momento. «Md» è la magnitudo durata. Le incertezze sono quelle indicate dal
            catalogo; dove non c’è il numero, il catalogo non lo riporta.
          </p>
        </>
      }
    >
      <div ref={ref} className="learn-chart">
        {width > 0 &&
          (() => {
            const x = linear([lo, hi], [M.left, width - M.right]);
            const yt = (i: number) => M.top + i * ROW + 16; // riga del nome
            const yc = (i: number) => M.top + i * ROW + 42; // riga dei punti
            return (
              <svg width={width} height={H} role="img" aria-label="Grafico a punti: per sei terremoti italiani, le stime della magnitudo locale e la magnitudo momento">
                <g className="grid">
                  {[5.5, 6, 6.5].map((v) => (
                    <line key={v} x1={x(v)} x2={x(v)} y1={M.top} y2={H - M.bottom} strokeDasharray="2 3" />
                  ))}
                </g>
                {rows.map((s, i) => (
                  <g key={s.nome}>
                    <text x={0} y={yt(i)}>
                      <tspan className="strong-label" fontSize={14}>
                        {s.nome} {s.anno}
                      </tspan>
                      <tspan className="axis-label" dx={8}>
                        {rowSummary(s)}
                      </tspan>
                    </text>
                    {s.mlMin !== null && s.mlMax !== null && (
                      <rect
                        x={x(s.mlMin) - 7}
                        y={yc(i) - 11}
                        width={x(s.mlMax) - x(s.mlMin) + 14}
                        height={22}
                        rx={11}
                        fill="var(--chart-1)"
                        opacity={0.12}
                      />
                    )}
                    {stacked(s.mlValori).map(({ v, dy }, k) => (
                      <circle key={k} cx={x(v)} cy={yc(i) + dy} r={4.5} fill="var(--chart-1)" stroke="var(--surface)" strokeWidth={1}>
                        <title>{`${s.nome}: ML ${d1(v)}`}</title>
                      </circle>
                    ))}
                    {s.mw !== null && (
                      <path
                        d={`M${x(s.mw)},${yc(i) - 9} l9,9 l-9,9 l-9,-9 z`}
                        fill="var(--chart-2)"
                        stroke="var(--surface)"
                        strokeWidth={1.5}
                      >
                        <title>{`${s.nome}: Mw ${d1(s.mw)}`}</title>
                      </path>
                    )}
                  </g>
                ))}
                <g className="axis">
                  <line x1={M.left} x2={width - M.right} y1={H - M.bottom} y2={H - M.bottom} />
                  {[5.5, 6, 6.5].map((v) => (
                    <text key={v} x={x(v)} y={H - M.bottom + 18} textAnchor="middle">
                      {d1(v)}
                    </text>
                  ))}
                </g>
              </svg>
            );
          })()}
      </div>
      <p className="chart-legend">
        <LegendItem kind="dot" color="var(--chart-1)">
          Stime della magnitudo locale (ML)
        </LegendItem>
        <LegendItem kind="dot" color="var(--chart-2)">
          Magnitudo momento (Mw)
        </LegendItem>
      </p>
    </Figure>
  );
}

/* ---------- Quanto è stata grande la rottura: il momento sismico ---------- */

export function MomentChart() {
  const ref = amatrice.mw ?? 6;
  const rows = conMw.map((s) => ({ s, volte: momentoVolte(s.mw ?? 0, ref) }));
  const top = Math.max(...rows.map((r) => r.volte)) * 1.08;
  const [fLo, fHi] = momentoForbice(norcia.mw ?? 0, ref);
  return (
    <Figure
      title="Quanto è stata grande la rottura: il momento sismico, con Amatrice = 1"
      caption={
        <>
          Il momento sismico di ogni scossa, ricavato dalla sua Mw e messo a confronto con quello di Amatrice (24 agosto 2016).
          Con la ML, Norcia e Amatrice sembravano quasi uguali ({d1(norcia.mlPrincipale ?? 0)} e {d1(amatrice.mlPrincipale ?? 0)});
          il momento sismico di Norcia è invece circa {d1(momentoVolte(norcia.mw ?? 0, ref))} volte quello di Amatrice.
        </>
      }
      source="Calcolo di Quake Italia sulle Mw del catalogo INGV, con la formula della magnitudo momento"
      table={
        <p>
          Mw = ⅔ · (log₁₀ M₀ − 9,1): ogni punto di Mw in più vuol dire circa 32 volte più momento sismico, mezzo punto circa
          5,6 volte. Le magnitudo del catalogo sono arrotondate al decimale, quindi i rapporti sono approssimati: per Norcia il
          valore vero sta tra circa {Math.round(fLo)} e {Math.round(fHi)} volte. In numeri:{' '}
          {rows.map((r) => `${r.s.nome} (Mw ${d1(r.s.mw ?? 0)}) ${d1(r.volte)}`).join('; ')}.
        </p>
      }
    >
      <ul className="hbars" aria-label="Momento sismico di sei terremoti italiani, rispetto ad Amatrice">
        {rows.map(({ s, volte }) => (
          <li key={s.nome}>
            <span className="hbars__label">
              {s.nome} {s.anno}
            </span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${(volte / top) * 100}%` }} />
            </span>
            <span className="hbars__value">{s.nome === amatrice.nome ? '1 (riferimento)' : `× ${d1(volte)}`}</span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}
