/**
 * Figure dell'articolo «Le zone sismiche, spiegate».
 * Dati: elenco DPC dei comuni (maggio 2025), popolazione ISTAT (1/1/2025), Allegato A dell'OPCM 3274/2003 e griglia
 * INGV MPS04 (src/data/learn/zone.json, da scripts/build-zone-data.mjs). I numeri passano da ./facts/zone.
 */
import type { CSSProperties, ReactNode } from 'react';
import { LegendItem } from '../components/charts/ChartFrame';
import { ExternalLink } from '../components/ui';
import { Figure } from './figures';
import { dec, n } from './facts/format';
import {
  atto,
  bloccoAgMax,
  bloccoAgMin,
  bloccoGriglia,
  cat1984,
  classificati1984,
  comuni2003,
  comuniOggi,
  comuniZona,
  divisi,
  g2,
  magliaAg,
  magliaIndici,
  nuoviSenzaCategoria,
  passoGrigliaKm,
  popTotale,
  popZona,
  popDivisi,
  quotaComuni,
  quotaPop,
  quotaPopDivisi,
  regioni,
  SOGLIE,
  zone2003,
  zoneData,
  ZONE,
  type Zona,
} from './facts/zone';

/* ---------- Colori e piccoli pezzi comuni ---------- */

/** I colori delle zone sono quelli del sito (pagina «Il mio comune»): cambiano da soli con il tema. */
const COLORE: Record<Zona, string> = { 1: 'var(--zone1)', 2: 'var(--zone2)', 3: 'var(--zone3)', 4: 'var(--zone4)' };
/** «Non classificato» e «diviso tra zone»: righe oblique grigie, senza un colore di zona. */
const RIGHE = 'repeating-linear-gradient(135deg, var(--chart-axis) 0 2px, transparent 2px 6px)';
const FONTE_DPC = zoneData.fonti.zone;
const FONTE_ISTAT = zoneData.fonti.popolazione;
const FONTE_OPCM = zoneData.fonti.opcm3274;
const FONTE_MPS = zoneData.fonti.mps04;

/** Una riga sotto la barra, a tutta larghezza (dentro .hbars, che è una griglia). */
const sottoRiga: CSSProperties = { gridColumn: '1 / -1', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' };

function Link({ href, children }: { href: string; children: ReactNode }) {
  return <ExternalLink href={href}>{children}</ExternalLink>;
}

/* ---------- Figura A: da 2.965 comuni classificati a tutti ---------- */

interface Segmento {
  nome: string;
  valore: number;
  colore: string;
}

const RIGHE_STORIA: { anno: string; sotto: string; valore: string; segmenti: Segmento[] }[] = [
  {
    anno: '1984',
    sotto: 'decreti del 1981–1984',
    valore: `${n(classificati1984)} classificati`,
    segmenti: [
      { nome: 'I categoria', valore: cat1984.I, colore: COLORE[1] },
      { nome: 'II categoria', valore: cat1984.II, colore: COLORE[2] },
      { nome: 'III categoria', valore: cat1984.III, colore: COLORE[3] },
      { nome: 'non classificati', valore: cat1984.NC, colore: RIGHE },
    ],
  },
  {
    anno: '2003',
    sotto: 'ordinanza 3274, prima delle modifiche delle Regioni',
    valore: `tutti gli ${n(comuni2003)}`,
    segmenti: ZONE.map((z, k) => ({ nome: `zona ${z}`, valore: zone2003[k], colore: COLORE[z] })),
  },
  {
    anno: '2025',
    sotto: 'elenco della Protezione Civile, maggio',
    valore: `tutti i ${n(comuniOggi)}`,
    segmenti: ZONE.map((z, k) => ({ nome: `zona ${z}`, valore: comuniZona[k], colore: COLORE[z] })),
  },
];

export function ZoneHistoryBars() {
  return (
    <Figure
      title={`Da ${n(classificati1984)} comuni a tutti`}
      caption={
        <>
          Ogni barra è l’Italia divisa per comuni: quanti comuni c’erano in ogni classe. Fino al 2003 la parte a righe grigie
          era «non classificata»: per le regole sulle costruzioni non era zona sismica. Le categorie del 1984 non sono le zone di
          oggi: erano assegnate con criteri diversi; nel 2003 l’ordinanza le fece corrispondere alle zone 1, 2 e 3 per gli
          obblighi di legge. Il numero dei comuni è cambiato ({n(comuni2003)} nell’elenco del 2003, {n(comuniOggi)} in quello
          del 2025) e dal 2003 le Regioni hanno spostato molti comuni da una zona all’altra: le barre dicono quanti comuni ci
          sono in ogni classe, non quali si sono spostati.
        </>
      }
      source="OPCM 3274/2003, Allegato A (copia INGV); Dipartimento della Protezione Civile, elenco dei comuni (maggio 2025, CC BY 4.0)"
      sourceHref={FONTE_OPCM.pagina}
      table={
        <>
          <p>
            1984 (categorie dei decreti fino al 1984, come le riporta l’Allegato A del 2003): I categoria {n(cat1984.I)}, II
            categoria {n(cat1984.II)}, III categoria {n(cat1984.III)}, non classificati {n(cat1984.NC)}. Altri{' '}
            {n(nuoviSenzaCategoria)} comuni dell’elenco sono nati dopo e non hanno una categoria.
          </p>
          <p>
            2003 (zone dell’Allegato A, prima delle modifiche delle Regioni): {ZONE.map((z, k) => `zona ${z} ${n(zone2003[k])}`).join(', ')}.
          </p>
          <p>
            2025 (zona principale di ogni comune; un comune diviso tra più zone conta in quella più pericolosa):{' '}
            {ZONE.map((z, k) => `zona ${z} ${n(comuniZona[k])}`).join(', ')}.
          </p>
          <p>
            File usati: <Link href={FONTE_OPCM.url}>Allegato A (.xls)</Link>, <Link href={FONTE_DPC.url}>elenco DPC (CSV)</Link>.
            Conteggi nostri, rifacibili con scripts/build-zone-data.mjs.
          </p>
        </>
      }
    >
      <ul className="hbars hbars--wide-label" aria-label="Comuni per classe sismica nel 1984, nel 2003 e nel 2025">
        {RIGHE_STORIA.map((r) => {
          const tot = r.segmenti.reduce((a, s) => a + s.valore, 0);
          return (
            <li key={r.anno}>
              <span className="hbars__label">
                {r.anno} <span className="muted">· {r.sotto}</span>
              </span>
              <span className="hbars__track hbars__track--stack" aria-hidden="true">
                {r.segmenti.map((s) => (
                  <span key={s.nome} style={{ width: `${(s.valore / tot) * 100}%`, background: s.colore }} />
                ))}
              </span>
              <span className="hbars__value">{r.valore}</span>
              <span style={sottoRiga}>{r.segmenti.map((s) => `${s.nome} ${n(s.valore)}`).join(' · ')}</span>
            </li>
          );
        })}
      </ul>
      <p className="chart-legend">
        {ZONE.map((z) => (
          <LegendItem key={z} kind="bar" color={COLORE[z]}>
            {z < 4 ? `Zona ${z} (nel 1984: ${['I', 'II', 'III'][z - 1]} categoria)` : 'Zona 4'}
          </LegendItem>
        ))}
        <LegendItem kind="bar" color={RIGHE}>
          Non classificato
        </LegendItem>
      </p>
    </Figure>
  );
}

/* ---------- Figura B: abitanti e comuni per zona ---------- */

export function ZonePopulationBars() {
  const maxPop = Math.max(...popZona, popDivisi);
  const maxCom = Math.max(...comuniZona);
  const nomiDivisi = divisi.map((d) => d.comune).join(', ');
  return (
    <Figure
      title="Quante persone vivono in ogni zona"
      caption={
        <>
          Abitanti al 1° gennaio 2025 e comuni, per zona sismica. {divisi.length} comuni hanno parti in zone con numeri diversi
          ({nomiDivisi}): i loro abitanti sono contati a parte, perché non sappiamo quanti vivono in ogni parte; quasi tutti sono
          a Roma. Nel conteggio dei comuni, invece, ognuno conta nella sua zona più pericolosa. Le sottozone (per esempio 2A o
          3S) sono contate nella loro zona.
        </>
      }
      source="Dipartimento della Protezione Civile, elenco dei comuni (maggio 2025); ISTAT, popolazione residente al 1° gennaio 2025 (CC BY 4.0)"
      sourceHref={FONTE_DPC.pagina}
      table={
        <>
          <p>
            Abitanti: {ZONE.map((z, k) => `zona ${z} ${n(popZona[k])} (${dec(quotaPop[k])}%)`).join('; ')}; comuni divisi tra zone{' '}
            {n(popDivisi)} ({dec(quotaPopDivisi)}%). Totale {n(popTotale)}.
          </p>
          <p>
            Comuni: {ZONE.map((z, k) => `zona ${z} ${n(comuniZona[k])} (${dec(quotaComuni[k])}%)`).join('; ')}. Totale {n(comuniOggi)}.
          </p>
          <p>
            File usati: <Link href={FONTE_DPC.url}>elenco DPC (CSV)</Link>, <Link href={FONTE_ISTAT.url}>popolazione ISTAT (zip)</Link>.
            Unione sul codice ISTAT del comune e somme: calcoli nostri, rifacibili con scripts/build-zone-data.mjs.
          </p>
        </>
      }
    >
      <p className="learn-figure__title" style={{ fontSize: 'var(--fs-base)' }}>
        Abitanti
      </p>
      <ul className="hbars hbars--wide-value" aria-label="Abitanti per zona sismica">
        {ZONE.map((z, k) => (
          <li key={z}>
            <span className="hbars__label">Zona {z}</span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${(popZona[k] / maxPop) * 100}%`, background: COLORE[z] }} />
            </span>
            <span className="hbars__value">
              {n(popZona[k])} ({dec(quotaPop[k])}%)
            </span>
          </li>
        ))}
        <li>
          <span className="hbars__label">Divisi tra zone</span>
          <span className="hbars__track" aria-hidden="true">
            <span style={{ width: `${(popDivisi / maxPop) * 100}%`, background: RIGHE }} />
          </span>
          <span className="hbars__value">
            {n(popDivisi)} ({dec(quotaPopDivisi)}%)
          </span>
        </li>
      </ul>
      <p className="learn-figure__title" style={{ fontSize: 'var(--fs-base)' }}>
        Comuni
      </p>
      <ul className="hbars hbars--wide-value" aria-label="Comuni per zona sismica">
        {ZONE.map((z, k) => (
          <li key={z}>
            <span className="hbars__label">Zona {z}</span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${(comuniZona[k] / maxCom) * 100}%`, background: COLORE[z] }} />
            </span>
            <span className="hbars__value">
              {n(comuniZona[k])} ({dec(quotaComuni[k])}%)
            </span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/* ---------- Tabella: le zone regione per regione ---------- */

const semplice = (k: string) => /^[1-4]$/.test(k);

export function ZoneRegionTable() {
  return (
    <Figure
      title="Ogni Regione ha il suo elenco"
      caption={
        <>
          Quanti comuni ha ogni Regione (e ogni Provincia autonoma) in ciascuna zona, e l’atto con cui ha deciso l’elenco in vigore.
          Un comune diviso tra più zone conta in quella più pericolosa. Alcune Regioni usano sottozone o codici propri: il Lazio
          2A, 2B, 3A e 3B, la Basilicata lettere minuscole, il Piemonte la «3S».
        </>
      }
      source="Dipartimento della Protezione Civile: elenco dei comuni e tabella degli atti regionali (al 31 maggio 2025)"
      sourceHref={FONTE_DPC.pagina}
      table={
        <p>
          File usati: <Link href={FONTE_DPC.url}>elenco DPC (CSV)</Link>, <Link href={zoneData.fonti.atti.url}>tabella degli atti regionali (PDF)</Link>.
          Conteggi nostri, rifacibili con scripts/build-zone-data.mjs.
        </p>
      }
    >
      <div className="table-wrap">
        <table className="data-table">
          <caption className="visually-hidden">Comuni per zona sismica in ogni Regione e Provincia autonoma, con l’atto di classificazione in vigore</caption>
          <thead>
            <tr>
              <th scope="col">Regione</th>
              {ZONE.map((z) => (
                <th key={z} scope="col" className="num">
                  Zona {z}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regioni.map((r) => {
              const speciali = Object.entries(r.codici).filter(([k]) => !semplice(k));
              return (
                <tr key={r.nome}>
                  <th scope="row" style={{ fontWeight: 400 }}>
                    <span className="strong">{r.nome.replace(/'/g, '’')}</span>
                    <br />
                    <span className="small muted">
                      {n(r.comuni)} comuni · {atto(r)}
                    </span>
                    {speciali.length > 0 && (
                      <>
                        <br />
                        <span className="small muted">Codici: {speciali.map(([k, v]) => `${k} (${n(v)})`).join(', ')}</span>
                      </>
                    )}
                  </th>
                  {r.zone.map((v, k) => (
                    <td key={k} className="num">
                      {v ? n(v) : '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Figure>
  );
}

/* ---------- Disegno: un'etichetta per il comune, tanti valori sulla griglia ---------- */

const KM_GRADO = 111.2;
const PX_KM = 14;
const MARGINE = { sx: 46, dx: 60, su: 64, giu: 56 };

export function ZoneGridDiagram() {
  const lats = bloccoGriglia.map((p) => p[1]);
  const lons = bloccoGriglia.map((p) => p[0]);
  const [lat0, lat1, lon0, lon1] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
  const kx = Math.cos((((lat0 + lat1) / 2) * Math.PI) / 180) * KM_GRADO * PX_KM;
  const ky = KM_GRADO * PX_KM;
  const x = (lon: number) => MARGINE.sx + (lon - lon0) * kx;
  const y = (lat: number) => MARGINE.su + (lat1 - lat) * ky;
  const larg = (lon1 - lon0) * kx;
  const alt = (lat1 - lat0) * ky;
  const W = MARGINE.sx + larg + MARGINE.dx;
  const H = MARGINE.su + alt + MARGINE.giu;
  // Il contorno del comune è inventato: una forma irregolare dentro il blocco di punti (coordinate da 0 a 1).
  const forma = [
    [0.1, 0.12], [0.42, 0.03], [0.8, 0.1], [0.97, 0.38], [0.9, 0.7], [0.66, 0.96], [0.3, 0.92], [0.06, 0.7], [0.02, 0.38],
  ].map(([u, v]) => [MARGINE.sx - 16 + u * (larg + 32), MARGINE.su - 16 + v * (alt + 32)] as const);
  const contorno = `M${forma.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join('L')}Z`;
  // L'edificio sta al centro di una maglia della griglia: i suoi quattro punti (nord-ovest, nord-est, sud-ovest, sud-est).
  const angoli = magliaIndici;
  const magliaMin = Math.min(...magliaAg);
  const magliaMax = Math.max(...magliaAg);
  // Arrotondati a due decimali i quattro valori possono coincidere: allora non si scrive «tra 0,21 e 0,21 g».
  const magliaTesto =
    g2(magliaMin) === g2(magliaMax) ? `tutti e quattro circa ${g2(magliaMin)} g` : `tra ${g2(magliaMin)} e ${g2(magliaMax)} g`;
  const casa = angoli.map((i) => bloccoGriglia[i]).reduce(([a, b], p) => [a + x(p[0]) / 4, b + y(p[1]) / 4], [0, 0]);
  const passo = passoGrigliaKm * PX_KM;
  const zona: Zona = 2;
  return (
    <Figure
      title="Un numero per il comune, tanti valori sulla griglia"
      caption={
        <>
          Disegno schematico. Il contorno del comune è inventato; i punti e i valori sono veri: {bloccoGriglia.length} punti
          vicini della mappa di pericolosità dell’INGV (MPS04) nel basso Molise, nella zona di San Giuliano di Puglia. Ogni
          numero è l’accelerazione del suolo su roccia, in g, che ha il 10% di probabilità di essere superata in 50 anni: qui va
          da {g2(bloccoAgMin)} a {g2(bloccoAgMax)} g, tutti valori da zona {zona}. Con le regole del 2003 un comune in zona{' '}
          {zona} usava per tutto il territorio lo stesso valore, {g2(SOGLIE[zona].ancoraggio)} g. Dal 1° luglio 2009, con le
          Norme Tecniche per le Costruzioni, non si usa più un valore unico per il comune: si parte dai quattro punti intorno
          all’edificio di una griglia simile, quella delle norme, un po’ meno fitta (qui, per mostrare l’idea, usiamo i punti
          di MPS04: {magliaTesto}), e poi si tiene conto del tipo di terreno e della forma del luogo.
        </>
      }
      source="INGV, Gruppo di Lavoro MPS (2004), mappa di pericolosità MPS04, griglia di 0,05° (CC BY 4.0)"
      sourceHref={FONTE_MPS.doi}
      table={
        <>
          <p>
            I {bloccoGriglia.length} punti (da nord a sud e da ovest a est): valore centrale di ag e, tra parentesi, l’intervallo
            tra il 16° e l’84° percentile, cioè l’incertezza della stima.
          </p>
          <ul>
            {bloccoGriglia.map(([lon, lat, ag, p16, p84]) => (
              <li key={`${lon}-${lat}`}>
                {dec(Number(lat.toFixed(3)))}° N, {dec(Number(lon.toFixed(3)))}° E: {g2(ag)} g ({g2(p16)}–{g2(p84)} g)
              </li>
            ))}
          </ul>
          <p>
            Distanza tra punti vicini della griglia: circa {dec(passoGrigliaKm)} km (nostro calcolo su tutti i punti). File:{' '}
            <Link href={FONTE_MPS.url}>griglia MPS04 (zip)</Link>.
          </p>
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W.toFixed(0)} ${H.toFixed(0)}`}
        className="diagram"
        style={{ maxWidth: 380, margin: '0 auto' }}
        role="img"
        aria-label={`Un comune disegnato in zona ${zona}, con sopra ${bloccoGriglia.length} punti della griglia di pericolosità a circa ${dec(passoGrigliaKm)} km l’uno dall’altro: i valori vanno da ${g2(bloccoAgMin)} a ${g2(bloccoAgMax)} g, mentre con le regole del 2003 tutto il comune usava ${g2(SOGLIE[zona].ancoraggio)} g`}
      >
        <path d={contorno} fill={COLORE[zona]} fillOpacity={0.16} stroke={COLORE[zona]} strokeWidth={2.5} strokeLinejoin="round" />
        <g transform={`translate(${(W / 2).toFixed(1)}, 26)`}>
          <rect x={-74} y={-17} width={148} height={34} rx={8} fill={COLORE[zona]} />
          <text textAnchor="middle" dy="0.35em" fill={`var(--on-zone${zona})`} style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font)' }}>
            Comune in zona {zona}
          </text>
        </g>
        {/* Il riquadro dei quattro punti usati per l'edificio. */}
        <path
          d={`M${[angoli[0], angoli[1], angoli[3], angoli[2]].map((i) => `${x(bloccoGriglia[i][0]).toFixed(1)},${y(bloccoGriglia[i][1]).toFixed(1)}`).join('L')}Z`}
          fill="none"
          stroke="var(--chart-2)"
          strokeWidth={2}
          strokeDasharray="5 4"
        />
        <g className="d-house" transform={`translate(${casa[0].toFixed(1)}, ${casa[1].toFixed(1)})`}>
          <rect x={-9} y={-4} width={18} height={14} />
          <polygon points="-12,-3 0,-13 12,-3" />
        </g>
        {bloccoGriglia.map(([lon, lat, ag], i) => {
          const usato = angoli.includes(i);
          return (
            <g key={i}>
              <circle cx={x(lon)} cy={y(lat)} r={usato ? 6 : 4.5} fill={usato ? 'var(--chart-2)' : 'var(--chart-1)'} stroke="var(--surface)" strokeWidth={1.5} />
              <text
                x={x(lon) + 7}
                y={y(lat) - 7}
                className="d-label"
                style={{ fontSize: 14, fontWeight: usato ? 700 : 400, paintOrder: 'stroke', stroke: 'var(--surface)', strokeWidth: 4, strokeLinejoin: 'round' }}
              >
                {g2(ag)}
              </text>
            </g>
          );
        })}
        {/* Scala: la distanza tra due punti vicini. */}
        <g transform={`translate(${MARGINE.sx}, ${(MARGINE.su + alt + 34).toFixed(1)})`}>
          <line x1={0} y1={0} x2={passo} y2={0} className="d-leader" />
          <line x1={0} y1={-5} x2={0} y2={5} className="d-leader" />
          <line x1={passo} y1={-5} x2={passo} y2={5} className="d-leader" />
          <text x={passo + 8} dy="0.35em" className="d-label d-label--muted" style={{ fontSize: 14 }}>
            circa {dec(passoGrigliaKm)} km
          </text>
        </g>
      </svg>
      <p className="chart-legend">
        <LegendItem kind="dot" color="var(--chart-1)">
          Punto della griglia, con ag in g
        </LegendItem>
        <LegendItem kind="dot" color="var(--chart-2)">
          I quattro punti intorno all’edificio
        </LegendItem>
      </p>
    </Figure>
  );
}
