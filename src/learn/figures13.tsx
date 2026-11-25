/**
 * Figure dell'articolo «I terremoti sono aumentati?».
 * Dati: catalogo INGV (servizio FDSN) e catalogo omogeneo HORUS (Lolli e altri 2020), in src/data/learn/aumentati.json
 * (da scripts/build-aumentati-data.mjs). I conteggi sono un nostro calcolo; le soglie di completezza della terza figura
 * sono numeri pubblicati dagli autori di HORUS.
 */
import { useWidth, LegendItem } from '../components/charts/ChartFrame';
import { linear, niceTicks } from '../components/charts/scales';
import { Figure } from './figures';
import { n } from './facts/format';
import {
  ANNI_FDSN,
  ANNI_HORUS,
  ANNI_SEQUENZA_HORUS,
  aumentatiData,
  CF_RAGGIO_KM,
  completoDal,
  d1,
  fdsnAnni,
  horusAnni,
  ind4Periodi,
  MC_ANNUALE,
  MC_TAB10,
  PERIODI,
  pct,
  SEQ_GIORNI,
  SEQ_RAGGIO_KM,
  sequenze,
} from './facts/aumentati';

const FDSN_SRC = 'INGV, catalogo ISIDe (servizio FDSN, licenza CC BY 4.0); conteggi di Quake Italia';
const HORUS_SRC = 'Catalogo HORUS, Lolli e altri 2020 (INGV, licenza CC BY 4.0); conteggi di Quake Italia';

/** Il 16 aprile 2005 come frazione d'anno (105 giorni su 365): la linea della nuova rete. */
const NUOVA_RETE = 2005 + 105 / 365;
/** Nella tabella 10 (facts) il 16 aprile 2005 è scritto 2005,29. */
const NUOVA_RETE_TAB = 2005.29;

const C_RESTO = 'var(--chart-1)';
const C_SEQ = 'color-mix(in srgb, var(--chart-1) 35%, transparent)';
const C_CF = 'var(--chart-2)';

/** Scala per anni a barre: x(anno) è il bordo sinistro della barra dell'anno; xt(t) una data come frazione d'anno. */
function scalaAnni(primo: number, ultimo: number, sinistra: number, destra: number) {
  const passo = (destra - sinistra) / (ultimo - primo + 1);
  const x = (anno: number) => sinistra + (anno - primo) * passo;
  const larghezza = Math.max(1, passo * (passo > 6 ? 0.78 : 0.86));
  return { x, xt: x, passo, larghezza, centro: (anno: number) => x(anno) + passo / 2 };
}

/** Tacche degli anni: ogni 5 o 10 anni, secondo lo spazio. */
function tacche(primo: number, ultimo: number, passo: number) {
  const ogni = passo * 5 >= 44 ? 5 : passo * 10 >= 40 ? 10 : 20;
  const out: number[] = [];
  for (let a = Math.ceil(primo / ogni) * ogni; a <= ultimo; a += ogni) out.push(a);
  return out;
}

/** Sistema le etichette sopra i picchi su più righe, così non si sovrappongono. */
function righeEtichette(xs: number[], minimo: number) {
  const ultimoPerRiga: number[] = [];
  return xs.map((x) => {
    let riga = ultimoPerRiga.findIndex((u) => x - u >= minimo);
    if (riga < 0) riga = ultimoPerRiga.length;
    ultimoPerRiga[riga] = x;
    return riga;
  });
}

/* ---------- 1. Quante scosse ha il catalogo, anno per anno ---------- */

export function CatalogYears() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const H = 300;
  const M = { top: 14, right: 6, bottom: 30, left: width < 420 ? 44 : 52 };
  const max = Math.max(...fdsnAnni.map((r) => r.totale));
  const nomiSeq = sequenze.map((s) => s.nome).join(', ');
  const primo = fdsnAnni[0];
  const ultimo = fdsnAnni[fdsnAnni.length - 1];
  return (
    <Figure
      title={`Quante scosse ha il catalogo, anno per anno (${ANNI_FDSN[0]}-${ANNI_FDSN[1]})`}
      caption={
        <>
          Ogni barra è un anno: quanti terremoti il catalogo dell’INGV ha localizzato in Italia, nei mari vicini e in una parte
          dei Paesi confinanti (il riquadro tra 35 e 48 gradi di latitudine nord e tra 6 e 19 di longitudine est), di qualunque
          magnitudo. Dai {n(primo.totale)} del {primo.anno} ai {n(ultimo.totale)} del {ultimo.anno}. In chiaro le scosse delle
          grandi sequenze ({nomiSeq}: entro {SEQ_RAGGIO_KM} km e {SEQ_GIORNI} giorni dalle scosse principali); in arancione, una striscia sottile in cima alle barre degli ultimi anni, quelle
          dei Campi Flegrei (entro {CF_RAGGIO_KM} km dal centro della caldera). La linea verticale segna il 16 aprile 2005: da
          quel giorno il catalogo è fatto con un nuovo sistema di analisi, la rete potenziata e un’altra magnitudo, quindi gli anni prima e dopo non si confrontano
          alla pari.
        </>
      }
      source={FDSN_SRC}
      sourceHref={aumentatiData.fonti.fdsn.doi}
      table={
        <div className="table-wrap">
          <table className="data-table">
            <caption className="visually-hidden">Terremoti per anno nel catalogo INGV, con le grandi sequenze, i Campi Flegrei e il tipo di magnitudo</caption>
            <thead>
              <tr>
                <th scope="col">Anno</th>
                <th scope="col" className="num">Totale</th>
                <th scope="col" className="num">Grandi sequenze</th>
                <th scope="col" className="num">Campi Flegrei</th>
                <th scope="col" className="num">Magnitudo Md</th>
                <th scope="col" className="num">Magnitudo ML</th>
              </tr>
            </thead>
            <tbody>
              {fdsnAnni.map((r) => (
                <tr key={r.anno}>
                  <th scope="row">{r.anno}</th>
                  <td className="num">{n(r.totale)}</td>
                  <td className="num">{n(r.seq)}</td>
                  <td className="num">{n(r.cf)}</td>
                  <td className="num">{pct(r.md / r.totale)}</td>
                  <td className="num">{pct(r.ml / r.totale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    >
      <div ref={ref} className="learn-chart">
        {width > 0 &&
          (() => {
            const s = scalaAnni(ANNI_FDSN[0], ANNI_FDSN[1], M.left, width - M.right);
            const y = linear([0, max * 1.04], [H - M.bottom, M.top]);
            const xLinea = s.xt(NUOVA_RETE);
            return (
              <svg
                width={width}
                height={H}
                role="img"
                aria-label={`Grafico a barre dei terremoti per anno nel catalogo INGV dal ${ANNI_FDSN[0]} al ${ANNI_FDSN[1]}: da circa ${n(primo.totale)} a circa ${n(ultimo.totale)} l’anno, con i picchi delle grandi sequenze nel 2009, nel 2016 e nel 2017 e una parte crescente di scosse ai Campi Flegrei negli ultimi anni`}
              >
                <g className="grid">
                  {niceTicks(0, max, 4).map((v) => (
                    <g key={v}>
                      <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} />
                      <text className="axis-label" x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
                        {n(v)}
                      </text>
                    </g>
                  ))}
                </g>
                {fdsnAnni.map((r) => {
                  const x0 = s.x(r.anno) + (s.passo - s.larghezza) / 2;
                  const y1 = y(r.resto);
                  const y2 = y(r.resto + r.seq);
                  const y3 = y(r.totale);
                  return (
                    <g key={r.anno}>
                      <title>{`${r.anno}: ${n(r.totale)} terremoti (grandi sequenze ${n(r.seq)}, Campi Flegrei ${n(r.cf)})`}</title>
                      <rect x={x0} y={y1} width={s.larghezza} height={y(0) - y1} fill={C_RESTO} />
                      {r.seq > 0 && <rect x={x0} y={y2} width={s.larghezza} height={y1 - y2} fill={C_SEQ} />}
                      {r.cf > 0 && <rect x={x0} y={y3} width={s.larghezza} height={Math.max(y2 - y3, 1)} fill={C_CF} />}
                    </g>
                  );
                })}
                <line x1={xLinea} x2={xLinea} y1={M.top} y2={H - M.bottom} className="annot-line" strokeDasharray="4 3" />
                {['16 aprile 2005:', 'nuova rete e', 'nuova magnitudo'].map((t, i) => (
                  <text key={t} className="axis-label" x={xLinea - 5} y={M.top + 10 + i * 14} textAnchor="end">
                    {t}
                  </text>
                ))}
                <g className="axis">
                  <line x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} />
                  {tacche(ANNI_FDSN[0], ANNI_FDSN[1], s.passo).map((a) => (
                    <text key={a} x={s.centro(a)} y={H - M.bottom + 17} textAnchor="middle">
                      {a}
                    </text>
                  ))}
                </g>
              </svg>
            );
          })()}
      </div>
      <p className="chart-legend">
        <LegendItem kind="bar" color={C_RESTO}>
          altre scosse
        </LegendItem>
        <LegendItem kind="bar" color={C_SEQ}>
          grandi sequenze
        </LegendItem>
        <LegendItem kind="bar" color={C_CF}>
          Campi Flegrei
        </LegendItem>
      </p>
    </Figure>
  );
}

/* ---------- 2. Le scosse forti, anno per anno (HORUS, Mw 4 o più, terraferma) ---------- */

export function StrongYears() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const H = 280;
  const M = { top: 44, right: 6, bottom: 30, left: 34 };
  const max = Math.max(...horusAnni.map((r) => r.w4));
  const picchi = Object.keys(ANNI_SEQUENZA_HORUS).map(Number);
  const elenco = picchi.map((a) => `${a} ${ANNI_SEQUENZA_HORUS[a]}`).join(', ');
  return (
    <Figure
      title={`Le scosse forti, anno per anno: magnitudo 4 o più (${ANNI_HORUS[0]}-${ANNI_HORUS[1]})`}
      caption={
        <>
          Terremoti di magnitudo momento (Mw) 4 o più con epicentro nella terraferma italiana, dal catalogo HORUS, che porta
          tutte le magnitudo sulla stessa scala. Secondo gli autori, a questa soglia il catalogo è completo dal {completoDal(4)}:
          i conteggi si possono confrontare su tutto il periodo, con più incertezza sulle magnitudo degli anni più vecchi. La parte scura sono le scosse «indipendenti», cioè senza le
          repliche (tolte con il metodo di Gardner e Knopoff); la parte chiara sono le repliche. I picchi sono gli anni delle
          grandi sequenze ({elenco}). Le linee orizzontali sono la media all’anno delle scosse indipendenti in tre periodi:{' '}
          {PERIODI.map(([a, b], i) => `${d1(ind4Periodi[i])} nel ${a}-${b}`).join(', ')}. Nessun aumento.
        </>
      }
      source={HORUS_SRC}
      sourceHref={aumentatiData.fonti.horus.doi}
      table={
        <div className="table-wrap">
          <table className="data-table">
            <caption className="visually-hidden">Terremoti per anno in terraferma italiana nel catalogo HORUS, a magnitudo 3 e 4 o più, con e senza repliche</caption>
            <thead>
              <tr>
                <th scope="col">Anno</th>
                <th scope="col" className="num">Mw 4 o più</th>
                <th scope="col" className="num">senza repliche</th>
                <th scope="col" className="num">Mw 3 o più</th>
                <th scope="col" className="num">senza repliche</th>
              </tr>
            </thead>
            <tbody>
              {horusAnni.map((r) => {
                const tre = r.anno >= completoDal(3);
                return (
                  <tr key={r.anno}>
                    <th scope="row">{r.anno}</th>
                    <td className="num">{n(r.w4)}</td>
                    <td className="num">{n(r.ind4)}</td>
                    <td className="num">{tre ? n(r.w3) : '–'}</td>
                    <td className="num">{tre ? n(r.ind3) : '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="small muted">
            Mw 3 o più: solo dal {completoDal(3)}, quando il catalogo è completo a quella soglia. Esclusi gli eventi segnati
            come non terremoti (esplosioni e simili).
          </p>
        </div>
      }
    >
      <div ref={ref} className="learn-chart">
        {width > 0 &&
          (() => {
            const s = scalaAnni(ANNI_HORUS[0], ANNI_HORUS[1], M.left, width - M.right);
            const y = linear([0, max * 1.02], [H - M.bottom, M.top]);
            const xs = picchi.map((a) => s.centro(a));
            const righe = righeEtichette(xs, 32);
            return (
              <svg
                width={width}
                height={H}
                role="img"
                aria-label={`Grafico a barre dei terremoti di magnitudo 4 o più in terraferma italiana dal ${ANNI_HORUS[0]} al ${ANNI_HORUS[1]}: le scosse indipendenti restano tra poche e una ventina l’anno senza crescere; i picchi sono le repliche delle grandi sequenze`}
              >
                <g className="grid">
                  {niceTicks(0, max, 4).map((v) => (
                    <g key={v}>
                      <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} />
                      <text className="axis-label" x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
                        {n(v)}
                      </text>
                    </g>
                  ))}
                </g>
                {horusAnni.map((r) => {
                  const x0 = s.x(r.anno) + (s.passo - s.larghezza) / 2;
                  return (
                    <g key={r.anno}>
                      <title>{`${r.anno}: ${n(r.w4)} scosse di Mw 4 o più, ${n(r.ind4)} senza repliche`}</title>
                      <rect x={x0} y={y(r.ind4)} width={s.larghezza} height={y(0) - y(r.ind4)} fill={C_RESTO} />
                      {r.w4 > r.ind4 && <rect x={x0} y={y(r.w4)} width={s.larghezza} height={y(r.ind4) - y(r.w4)} fill={C_SEQ} />}
                    </g>
                  );
                })}
                {PERIODI.map(([a, b], i) => (
                  <line
                    key={a}
                    x1={s.x(a)}
                    x2={s.x(b) + s.passo}
                    y1={y(ind4Periodi[i])}
                    y2={y(ind4Periodi[i])}
                    stroke="var(--text)"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                  />
                ))}
                {picchi.map((a, i) => {
                  const r = horusAnni.find((h) => h.anno === a);
                  if (!r) return null;
                  const yTesto = M.top - 8 - righe[i] * 14;
                  return (
                    <g key={a}>
                      <line x1={xs[i]} x2={xs[i]} y1={y(r.w4) - 3} y2={yTesto + 3} className="annot-line" />
                      <text className="axis-label" x={xs[i]} y={yTesto} textAnchor="middle">
                        {a}
                      </text>
                    </g>
                  );
                })}
                <g className="axis">
                  <line x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} />
                  {tacche(ANNI_HORUS[0], ANNI_HORUS[1], s.passo).map((a) => (
                    <text key={a} x={s.centro(a)} y={H - M.bottom + 17} textAnchor="middle">
                      {a}
                    </text>
                  ))}
                </g>
              </svg>
            );
          })()}
      </div>
      <p className="chart-legend">
        <LegendItem kind="bar" color={C_RESTO}>
          scosse indipendenti
        </LegendItem>
        <LegendItem kind="bar" color={C_SEQ}>
          repliche
        </LegendItem>
        <LegendItem kind="line" color="var(--text)">
          media del periodo
        </LegendItem>
      </p>
    </Figure>
  );
}

/* ---------- 3. La soglia si è abbassata (numeri pubblicati) ---------- */

export function CompletenessSteps() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const H = 230;
  const M = { top: 12, right: 10, bottom: 30, left: 40 };
  const A0 = 1960;
  const A1 = 2020;
  return (
    <Figure
      title="La soglia si è abbassata: da che magnitudo il catalogo non perde scosse"
      caption={
        <>
          La magnitudo di completezza della terraferma italiana nel tempo, in magnitudo momento: sopra questa soglia il catalogo
          registra praticamente tutte le scosse. Più la linea è in basso, più la rete «sente» scosse piccole. La linea a gradini è la
          tabella degli autori di HORUS per i periodi dal 1960 al 2010; i punti sono la loro stima anno per anno dal 2005 al 2019,
          che sale nel 2012 e nel 2016, quando c’erano migliaia di repliche da localizzare, e nel 2008 per motivi non chiari, e scende fino a{' '}
          {d1(MC_ANNUALE[MC_ANNUALE.length - 1][1])} nel {MC_ANNUALE[MC_ANNUALE.length - 1][0]}. Sono numeri pubblicati,
          non un nostro calcolo; con altri metodi si ottengono valori un po’ diversi.
        </>
      }
      source="Lolli, Randazzo, Vannucci e Gasperini (2020), tabella 10 e tabella S2"
      sourceHref={aumentatiData.fonti.horus.studio}
      table={
        <div className="table-wrap">
          <table className="data-table">
            <caption className="visually-hidden">Magnitudo di completezza del catalogo HORUS per periodo e per anno</caption>
            <thead>
              <tr>
                <th scope="col">Periodo</th>
                <th scope="col" className="num">Magnitudo di completezza (Mw)</th>
              </tr>
            </thead>
            <tbody>
              {MC_TAB10.map(([a, b, mc]) => (
                <tr key={a}>
                  <th scope="row">
                    {a === NUOVA_RETE_TAB ? '16/4/2005' : a}-{b === NUOVA_RETE_TAB ? '15/4/2005' : b - 1}
                  </th>
                  <td className="num">{d1(mc)}</td>
                </tr>
              ))}
              {MC_ANNUALE.map(([a, mc]) => (
                <tr key={`a${a}`}>
                  <th scope="row">{a} (stima annuale)</th>
                  <td className="num">{d1(mc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    >
      <div ref={ref} className="learn-chart">
        {width > 0 &&
          (() => {
            const x = linear([A0, A1], [M.left, width - M.right]);
            const y = linear([1, 4.5], [H - M.bottom, M.top]);
            const gradini = MC_TAB10.map(([a, b, mc]) => `M${x(a).toFixed(1)},${y(mc).toFixed(1)}H${x(b).toFixed(1)}`).join('');
            const verticali = MC_TAB10.slice(1).map(([a, , mc], i) => `M${x(a).toFixed(1)},${y(MC_TAB10[i][2]).toFixed(1)}V${y(mc).toFixed(1)}`).join('');
            const xt = width < 420 ? [1960, 1980, 2000, 2020] : [1960, 1970, 1980, 1990, 2000, 2010, 2020];
            return (
              <svg
                width={width}
                height={H}
                role="img"
                aria-label="Grafico a gradini della magnitudo di completezza in terraferma italiana: 4 dal 1960, 3 dal 1981, 2,5 dal 1990, 2,1 dal 2003, 1,8 dall’aprile 2005, fino a 1,3 nel 2019"
              >
                <g className="grid">
                  {[1, 2, 3, 4].map((v) => (
                    <g key={v}>
                      <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} />
                      <text className="axis-label" x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
                        {v}
                      </text>
                    </g>
                  ))}
                </g>
                <path d={gradini + verticali} fill="none" stroke="var(--chart-1)" strokeWidth={3} />
                {MC_ANNUALE.map(([a, mc]) => (
                  <circle key={a} cx={x(a + 0.5)} cy={y(mc)} r={3.5} fill="var(--chart-2)" stroke="var(--surface)" strokeWidth={1}>
                    <title>{`${a}: ${d1(mc)}`}</title>
                  </circle>
                ))}
                <g className="axis">
                  <line x1={M.left} x2={width - M.right} y1={H - M.bottom} y2={H - M.bottom} />
                  {xt.map((a) => (
                    <text key={a} x={x(a)} y={H - M.bottom + 17} textAnchor="middle">
                      {a}
                    </text>
                  ))}
                </g>
              </svg>
            );
          })()}
      </div>
      <p className="chart-legend">
        <LegendItem kind="line" color="var(--chart-1)">
          per periodo (1960-2010)
        </LegendItem>
        <LegendItem kind="dot" color="var(--chart-2)">
          anno per anno (2005-2019)
        </LegendItem>
      </p>
    </Figure>
  );
}

