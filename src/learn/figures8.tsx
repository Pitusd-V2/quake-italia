/**
 * Figure dell'articolo «Il terreno amplifica: gli effetti di sito».
 * Dati: flatfile del database accelerometrico ESM, INGV e ORFEUS (src/data/learn/sito.json, da
 * scripts/build-sito-data.mjs). La regressione e i fattori per categoria sono un nostro calcolo.
 */
import { useWidth, LegendItem } from '../components/charts/ChartFrame';
import { log10 } from '../components/charts/scales';
import { Figure } from './figures';
import { dec, n } from './facts/format';
import {
  CATEGORIE,
  curva,
  d1,
  dispersione,
  f1,
  fattoriPga,
  fattoriSa1,
  filtri,
  g2,
  inG,
  ITA10,
  NTC_SS_MAX,
  NTC_TC_ESEMPI,
  ntcLungoC,
  ONNA_RISONANZA,
  ONNA_TAB3,
  onnaV,
  perCategoria,
  pocheStazioni,
  robustezza,
  robustezzaC,
  scossa,
  scossaFattore,
  scossaMax,
  scossaRoccia,
  scossaSoffici,
  scossaVicina,
  sitoData,
  type Categoria,
  type Fattore,
} from './facts/sito';

const ESM_SRC = 'Engineering Strong-Motion database (ESM), INGV e ORFEUS, flatfile (licenza CC BY 4.0); calcolo di Quake Italia';
const date = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' });
const oraItaliana = new Intl.DateTimeFormat('it-IT', { hour: 'numeric', minute: '2-digit', timeZone: 'Europe/Rome' });

/* Tre gruppi di colore: roccia, terreni rigidi, terreni soffici. */
const GRUPPO: Record<Categoria, number> = { A: 0, B: 1, C: 2, D: 2, E: 2 };
const COLORE = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-2)'];
const NOME_GRUPPO = ['A: roccia (onde S oltre 800 m/s)', 'B: terreni rigidi (360–800 m/s)', 'C, D, E: terreni soffici (sotto 360 m/s)'];

/** Numeri di accelerazione sull'asse: «0,001 g». */
const tickG = (v: number) => `${dec(v)} g`;

/* ---------- Stessa scossa, terreni diversi ---------- */

export function SiteScatter() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const H = 330;
  const M = { top: 12, right: width < 420 ? 60 : 74, bottom: 40, left: 54 };
  const R0 = 1;
  const R1 = filtri.rjbMaxKm;
  const Y0 = 0.0005;
  const Y1 = 1;
  const punti = [...scossa.punti].sort((a, b) => [1, 0, 2][GRUPPO[a[2]]] - [1, 0, 2][GRUPPO[b[2]]]); // i soffici sopra
  const conta = [0, 1, 2].map((g) => scossa.punti.filter((p) => GRUPPO[p[2]] === g).length);
  const curve: Categoria[] = ['A', 'C'];
  const quando = date.format(new Date(`${scossa.tempo}Z`));
  const ora = oraItaliana.format(new Date(`${scossa.tempo}Z`));
  return (
    <Figure
      title={`Stessa scossa, terreni diversi: ${quando}, magnitudo ${d1(scossa.mw)}`}
      caption={
        <>
          Ogni punto è una stazione accelerometrica che ha registrato la scossa delle {ora} (ora italiana) tra Accumoli e
          Amatrice: in orizzontale la distanza dalla faglia (dalla sua proiezione in superficie), in verticale l’accelerazione di picco del suolo, in frazioni
          dell’accelerazione di gravità (g). Le scale sono logaritmiche: sull’asse verticale ogni tacca vale dieci volte la precedente. Il colore è
          la categoria di sottosuolo della stazione: in blu la roccia ({conta[0]} stazioni), in viola i terreni rigidi (
          {conta[1]}), in arancione i terreni soffici ({conta[2]}). Le due linee sono i valori medi che il nostro calcolo, fatto su{' '}
          {n(sitoData.selezione.terremoti)} terremoti, prevede per questa scossa: su roccia e su terreni di categoria C. Delle {scossaSoffici.tot} stazioni
          su terreni soffici, {scossaSoffici.sopraRoccia} stanno sopra la linea della roccia; delle {scossaRoccia.tot} su roccia,
          {scossaRoccia.sopraC === 0 ? ' nessuna sta' : scossaRoccia.sopraC === 1 ? ' una sta' : ` ${scossaRoccia.sopraC} stanno`} sopra quella dei terreni C. Ma i punti sono
          molto sparsi anche dentro lo stesso colore.
        </>
      }
      source={ESM_SRC}
      sourceHref={sitoData.doi[0]}
      table={
        <>
          <p>
            Scossa {scossa.id} del catalogo ESM: {scossa.tempo.replace('T', ' ')} UTC, magnitudo momento {d1(scossa.mw)},
            profondità {dec(scossa.profKm)} km. Distanza: quella di Joyner e Boore, cioè dal punto più vicino della proiezione in
            superficie della faglia. Stazioni entro {filtri.rjbMaxKm} km, esclusi i sensori dentro gli edifici: {scossa.punti.length}.
          </p>
          <p>
            In questa scossa, rispetto alla linea della roccia, le stazioni stanno in media (media geometrica):{' '}
            {CATEGORIE.map((c) => `${c} ${f1(scossaFattore[c].f)} volte (${scossaFattore[c].n} stazioni)`).join('; ')}.
          </p>
          <p>
            La stazione più vicina era a {dec(scossaVicina[0])} km dalla faglia ({g2(scossaVicina[1])}, categoria {scossaVicina[2]});
            l’accelerazione più alta è stata {g2(scossaMax[1])} a {dec(scossaMax[0])} km (categoria {scossaMax[2]}). Accelerazione di picco:
            mediana delle componenti orizzontali ruotate (RotD50), come la calcola ESM.
          </p>
        </>
      }
    >
      <div ref={ref} className="learn-chart">
        {width > 0 &&
          (() => {
            const x = log10([R0, R1], [M.left, width - M.right]);
            const y = log10([Y0, Y1], [H - M.bottom, M.top]);
            const xTicks = (width > 420 ? [1, 3, 10, 30, 100] : [1, 10, 100]).filter((v) => v <= R1);
            const yTicks = [0.001, 0.01, 0.1, 1];
            const rs = Array.from({ length: 41 }, (_, i) => R0 * (R1 / R0) ** (i / 40));
            return (
              <svg
                width={width}
                height={H}
                role="img"
                aria-label={`Grafico a punti dell'accelerazione registrata contro la distanza per la scossa del ${quando}: a parità di distanza le stazioni su terreni soffici registrano in media di più di quelle su roccia, con molta dispersione`}
              >
                <g className="grid">
                  {yTicks.map((v) => (
                    <g key={v}>
                      <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} strokeDasharray="2 3" />
                      <text className="axis-label" x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
                        {tickG(v)}
                      </text>
                    </g>
                  ))}
                  {xTicks.map((v) => (
                    <line key={v} x1={x(v)} x2={x(v)} y1={M.top} y2={H - M.bottom} strokeDasharray="2 3" />
                  ))}
                </g>
                {punti.map((p, k) => (
                  <circle
                    key={k}
                    cx={x(Math.max(p[0], R0))}
                    cy={y(inG(p[1]))}
                    r={3.4}
                    fill={COLORE[GRUPPO[p[2]]]}
                    stroke="var(--surface)"
                    strokeWidth={0.8}
                    opacity={0.85}
                  >
                    <title>{`Categoria ${p[2]}: ${dec(p[0])} km, ${g2(p[1])}`}</title>
                  </circle>
                ))}
                {curve.map((c) => {
                  const d = rs.map((r, i) => `${i ? 'L' : 'M'}${x(r).toFixed(1)},${y(inG(curva(r, c))).toFixed(1)}`).join('');
                  const yEnd = y(inG(curva(R1, c)));
                  return (
                    <g key={c}>
                      <path d={d} fill="none" stroke="var(--surface)" strokeWidth={5} />
                      <path d={d} fill="none" stroke={COLORE[GRUPPO[c]]} strokeWidth={2.5} />
                      <text className="direct-label" x={width - M.right + 6} y={yEnd} dy="0.32em">
                        {c === 'A' ? 'media A' : 'media C'}
                      </text>
                    </g>
                  );
                })}
                <g className="axis">
                  <line x1={M.left} x2={width - M.right} y1={H - M.bottom} y2={H - M.bottom} />
                  {xTicks.map((v) => (
                    <text key={v} x={x(v)} y={H - M.bottom + 16} textAnchor="middle">
                      {v} km
                    </text>
                  ))}
                  <text className="axis-title" x={(M.left + width - M.right) / 2} y={H - 4} textAnchor="middle">
                    distanza dalla faglia
                  </text>
                </g>
              </svg>
            );
          })()}
      </div>
      <p className="chart-legend">
        {NOME_GRUPPO.map((nome, k) => (
          <LegendItem key={nome} kind="dot" color={COLORE[k]}>
            {nome}
          </LegendItem>
        ))}
      </p>
    </Figure>
  );
}

/* ---------- Quanto in più, in media ---------- */

const SCALA = 5; // le barre vanno da 0 a 5 volte
/** Il tratto scuro sottile che segna un intervallo sopra la barra. */
const BAFFO = { top: '40%', height: '20%', borderRadius: 0, background: 'var(--text)' } as const;

function Barre({ fattori, label }: { fattori: Record<Categoria, Fattore>; label: string }) {
  return (
    <ul className="hbars hbars--ref hbars--wide-label" aria-label={label}>
      {CATEGORIE.map((c) => {
        const v = fattori[c];
        const pochi = pocheStazioni(c);
        return (
          <li key={c}>
            <span className="hbars__label">
              {c === 'A' ? 'A, roccia: il riferimento' : `${c}${pochi ? `: pochi dati (${perCategoria[c].stazioni} stazioni)` : ''}`}
            </span>
            <span className="hbars__track hbars__track--range" aria-hidden="true">
              <span
                style={{
                  width: `${(v.f / SCALA) * 100}%`,
                  background: c === 'A' ? 'var(--chart-fit)' : pochi ? `color-mix(in srgb, ${COLORE[GRUPPO[c]]} 35%, transparent)` : COLORE[GRUPPO[c]],
                }}
              />
              {c !== 'A' && (
                <span style={{ ...BAFFO, left: `${(v.lo / SCALA) * 100}%`, width: `${((v.hi - v.lo) / SCALA) * 100}%` }} />
              )}
              <i className="hbars__ref" style={{ left: `${100 / SCALA}%` }} />
            </span>
            <span className="hbars__value">{c === 'A' ? '1' : `${f1(v.f)} volte (da ${f1(v.lo)} a ${f1(v.hi)})`}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function SiteFactors() {
  const s = sitoData.selezione;
  const [rc0, rc1] = robustezzaC;
  return (
    <Figure
      title="Quanto in più, in media, rispetto alla roccia"
      caption={
        <>
          Di quante volte lo scuotimento registrato su ogni categoria di sottosuolo supera, in media, quello su roccia (A), a parità
          di terremoto e di distanza. Le barre sono la nostra stima; il tratto scuro è l’intervallo in cui la stima cade 9 volte su
          10 se si cambiano a caso le stazioni usate; la linea verticale segna 1, la roccia. Sopra: l’accelerazione di picco, che
          conta di più per gli edifici bassi e rigidi; sotto: lo scuotimento a 1 secondo, che conta di più per gli edifici alti
          e per le onde lente. Per D ed E ci sono troppe poche stazioni per fidarsi del numero (barre chiare). Per confronto, il modello ITA10
          (Bindi e altri, 2011), costruito su dati italiani con un altro metodo, trova valori simili per B (circa {f1(ITA10.B)} volte) e
          un po’ più bassi per C (da {f1(ITA10.C[0])} a {f1(ITA10.C[1])} volte, secondo il periodo). Sono medie: un singolo luogo può stare molto sopra o molto sotto.
        </>
      }
      source={ESM_SRC}
      sourceHref={sitoData.doi[0]}
      table={
        <>
          <p>
            Dati: {n(s.registrazioni)} registrazioni di {n(s.terremoti)} terremoti (magnitudo da {dec(s.magnitudo[0])} a{' '}
            {dec(s.magnitudo[1])}, profondità fino a {filtri.profMaxKm} km, anni {s.anni[0]}–{s.anni[1]}) a {n(s.stazioni)}{' '}
            stazioni entro {filtri.rjbMaxKm} km dalla faglia. Per categoria:{' '}
            {CATEGORIE.map((c) => `${c} ${n(perCategoria[c].registrazioni)} registrazioni a ${n(perCategoria[c].stazioni)} stazioni`).join('; ')}.
          </p>
          <p>
            Accelerazione di picco:{' '}
            {CATEGORIE.filter((c) => c !== 'A')
              .map((c) => `${c} ${f1(fattoriPga[c].f)} (${f1(fattoriPga[c].lo)}–${f1(fattoriPga[c].hi)})`)
              .join('; ')}
            . A 1 secondo:{' '}
            {CATEGORIE.filter((c) => c !== 'A')
              .map((c) => `${c} ${f1(fattoriSa1[c].f)} (${f1(fattoriSa1[c].lo)}–${f1(fattoriSa1[c].hi)})`)
              .join('; ')}
            . Intervalli al 90% con {n(sitoData.bootstrap.repliche)} ricampionamenti delle stazioni.
          </p>
          <p>
            Prove su parti dei dati (fattore C dell’accelerazione di picco, da {f1(rc0)} a {f1(rc1)}):{' '}
            {robustezza.map((p) => `${p.nome}, ${n(p.registrazioni)} registrazioni: C ${f1(p.pga.C ?? NaN)}, B ${f1(p.pga.B ?? NaN)}`).join('; ')}.
          </p>
          <p>
            Modello: {sitoData.modello.formula}, con R distanza dalla faglia in km e h = {filtri.hKm} km. La norma tecnica (NTC
            2018) modifica lo spettro di progetto con due coefficienti: SS, al massimo {dec(NTC_SS_MAX.B)} per B e{' '}
            {dec(NTC_SS_MAX.C)} per C, che vale anche per l’accelerazione di picco; e CC, che allunga il tratto alto dello spettro.
            A 1 secondo, rispetto alla roccia, la norma moltiplica per SS·CC: per C, con SS al massimo e TC* tra{' '}
            {dec(NTC_TC_ESEMPI[0])} e {dec(NTC_TC_ESEMPI[2])} s, da circa {f1(ntcLungoC[0])} a {f1(ntcLungoC[1])} (un nostro conto
            sulle formule della norma). SS diminuisce quando lo scuotimento atteso è forte. Sono grandezze di progetto, non medie
            di registrazioni: il confronto con queste barre è solo indicativo.
          </p>
        </>
      }
    >
      <p className="small strong">Accelerazione di picco</p>
      <Barre fattori={fattoriPga} label="Fattore medio dell'accelerazione di picco per categoria di sottosuolo, rispetto alla roccia" />
      <p className="small strong">Scuotimento a 1 secondo (accelerazione spettrale)</p>
      <Barre fattori={fattoriSa1} label="Fattore medio dell'accelerazione spettrale a 1 secondo per categoria di sottosuolo, rispetto alla roccia" />
    </Figure>
  );
}

/* ---------- Ogni luogo è diverso: la dispersione dentro le categorie ---------- */

export function SiteSpread() {
  const cat: Categoria[] = ['A', 'B', 'C'];
  const top = 5;
  return (
    <Figure
      title="Stessa categoria, luoghi diversi"
      caption={
        <>
          Per ogni stazione con almeno {filtri.minRegStazione} registrazioni, di quante volte in media lo scuotimento (accelerazione
          di picco) supera quello previsto per una roccia «media». La barra arriva al valore di metà delle stazioni; il tratto
          scuro va dal 10% al 90% delle stazioni; la linea verticale segna 1. Anche tra le stazioni su roccia c’è chi registra la metà e chi più del doppio:
          la categoria dice la tendenza, non la risposta di un luogo preciso.
        </>
      }
      source={ESM_SRC}
      sourceHref={sitoData.doi[0]}
      table={
        <p>
          {cat
            .map((c) => {
              const d = dispersione[c];
              return `${c}: ${d.n} stazioni; 10% sotto ${f1(d.p10 ?? NaN)}, metà sotto ${f1(d.p50 ?? NaN)}, 90% sotto ${f1(d.p90 ?? NaN)}`;
            })
            .join('. ')}
          . Le categorie D ed E hanno {dispersione.D.n} e {dispersione.E.n} stazioni con abbastanza registrazioni: troppo poche.
        </p>
      }
    >
      <ul className="hbars hbars--ref hbars--wide-label" aria-label="Dispersione del fattore di amplificazione tra le stazioni di ogni categoria">
        {cat.map((c) => {
          const d = dispersione[c];
          const p10 = d.p10 ?? 0;
          const p50 = d.p50 ?? 0;
          const p90 = d.p90 ?? 0;
          return (
            <li key={c}>
              <span className="hbars__label">
                {c === 'A' ? 'A, roccia' : c === 'B' ? 'B, terreni rigidi' : 'C, terreni soffici'} ({d.n} stazioni)
              </span>
              <span className="hbars__track hbars__track--range" aria-hidden="true">
                <span style={{ width: `${(p50 / top) * 100}%`, background: COLORE[GRUPPO[c]] }} />
                <span style={{ ...BAFFO, left: `${(p10 / top) * 100}%`, width: `${((p90 - p10) / top) * 100}%` }} />
                <i className="hbars__ref" style={{ left: `${100 / top}%` }} />
              </span>
              <span className="hbars__value">
                metà sotto {f1(p50)}; da {f1(p10)} a {f1(p90)}
              </span>
            </li>
          );
        })}
      </ul>
    </Figure>
  );
}

/* ---------- La risonanza (disegno) ---------- */

export function ResonanceDiagram() {
  // Sezione verticale: terreno soffice da y=80 a y=200 (spessore h), roccia sotto.
  const top = 80;
  const base = 200;
  const cx = 318;
  const amp = (z: number) => 48 * (0.22 + 0.78 * Math.cos((Math.PI / 2) * ((z - top) / (base - top))));
  const zs = Array.from({ length: 25 }, (_, i) => top + ((base - top) * i) / 24);
  const lato = (s: 1 | -1) =>
    [...zs.map((z) => [cx + s * amp(z), z]), [cx + s * amp(base), 270]].map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y}`).join('');
  return (
    <Figure
      title="Perché un terreno «risuona»"
      caption={
        <>
          Disegno schematico, non in scala. Le onde S salgono dalla roccia. Entrando nel terreno soffice rallentano e la loro
          ampiezza cresce; poi rimbalzano tra la superficie e la roccia. A una certa frequenza, quella in cui lo spessore h è un
          quarto della lunghezza d’onda, i rimbalzi si sommano: è la frequenza propria f₀ = V / (4·h), con V velocità delle onde
          S nel terreno. La curva mostra quanto oscilla il terreno alle varie profondità a quella frequenza: più in superficie,
          meno in basso. La formula vale per uno strato uniforme sopra una roccia molto più rigida; valli, strati diversi e
          scosse molto forti la complicano.
        </>
      }
    >
      <svg viewBox="0 0 400 290" className="diagram" role="img" aria-label="Sezione del terreno: uno strato soffice di spessore h sopra la roccia. Le onde salgono dalla roccia e il terreno oscilla di più in superficie.">
        <defs>
          <marker id="freccia-sito" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="d-arrowhead" />
          </marker>
        </defs>
        <rect x="10" y={top} width="380" height={base - top} className="d-rock" />
        <rect x="10" y={base} width="380" height="80" className="d-rock d-rock--alt" />
        <line x1="10" y1={top} x2="390" y2={top} className="d-ground" />
        <g className="d-house">
          <rect x="44" y="46" width="48" height="34" />
          <polygon points="38,48 68,24 98,48" />
        </g>
        <text x="22" y="130" className="d-label">terreno soffice</text>
        <text x="22" y="154" className="d-label d-label--muted">onde lente (V)</text>
        <text x="22" y="236" className="d-label">roccia</text>
        <text x="22" y="260" className="d-label d-label--muted">onde veloci</text>
        <line x1="214" y1={top + 4} x2="214" y2={base - 4} className="d-leader" markerStart="url(#freccia-sito)" markerEnd="url(#freccia-sito)" />
        <text x="224" y={(top + base) / 2} dy="0.35em" className="d-label">
          h
        </text>
        <path d={lato(1)} className="d-wave" />
        <path d={lato(-1)} className="d-wave" />
        <line x1={cx} y1={top} x2={cx} y2={base} className="d-depth" />
        <path d={`M${cx + 44} 278 l0 -58`} className="d-arrow" markerEnd="url(#freccia-sito)" />
      </svg>
      <p>
        <strong>f₀ = V / (4·h)</strong>. Un esempio: a Onna circa {ONNA_RISONANZA.hM} metri di sedimenti risuonano tra{' '}
        {ONNA_RISONANZA.fHz[0]} e {ONNA_RISONANZA.fHz[1]} hertz (oscillazioni al secondo). Rovesciando la formula, nello strato
        le onde S viaggerebbero tra circa {onnaV[0]} e {onnaV[1]} metri al secondo: un nostro conto, solo per l’ordine di grandezza.
      </p>
    </Figure>
  );
}

/* ---------- Onna e i paesi vicini (dati pubblicati) ---------- */

const g = (v: number | null) => (v === null ? '—' : dec(v));

export function OnnaTable() {
  return (
    <Figure
      title="6 aprile 2009: lo scuotimento ricostruito paese per paese"
      caption={
        <>
          La scossa principale non fu registrata né a Onna né a Monticchio. Gli autori dello studio hanno usato le repliche
          registrate dopo, nei due paesi e intorno, per ricostruire l’accelerazione di picco della scossa principale
          («ricostruita»); a L’Aquila, dove la scossa fu registrata, il metodo dà {g(ONNA_TAB3[0].pgaSimulata)} g contro{' '}
          {g(ONNA_TAB3[0].pgaOsservata)} g misurati. L’intensità «dalla PGA» è quella che corrisponde all’accelerazione
          ricostruita secondo una relazione empirica usata dagli autori; quella «osservata» viene dai danni rilevati, secondo il
          rilievo di Tertulliani e altri (2009) usato dagli autori (il rilievo di Galli e altri, 2009, dà a Monticchio il VI). Il
          metodo presuppone che il terreno risponda alle scosse forti come alle deboli: per questo gli autori considerano i
          valori ricostruiti un limite superiore.
        </>
      }
      source="Cantore, Rovelli e Calderoni (2017), Geophysical Journal International, tabella 3"
      sourceHref="https://doi.org/10.1093/gji/ggx135"
    >
      <div className="table-wrap">
        <table className="data-table">
          <caption className="visually-hidden">Accelerazione di picco ricostruita e intensità nei paesi intorno all’Aquila, 6 aprile 2009</caption>
          <thead>
            <tr>
              <th scope="col">Luogo</th>
              <th scope="col" className="num">
                Accelerazione ricostruita
              </th>
              <th scope="col">Intensità osservata</th>
              <th scope="col">Intensità dalla PGA</th>
            </tr>
          </thead>
          <tbody>
            {ONNA_TAB3.map((r) => (
              <tr key={r.luogo}>
                <th scope="row">{r.luogo}</th>
                <td className="num">
                  {g(r.pgaSimulata)} g{r.pgaOsservata !== null && <span className="small muted"> (misurata {g(r.pgaOsservata)} g)</span>}
                </td>
                <td>{r.iOsservata}</td>
                <td>{r.iSimulata}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Figure>
  );
}
