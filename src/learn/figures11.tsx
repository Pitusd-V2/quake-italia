/**
 * Figure dell'articolo «Perché gli edifici crollano».
 * Dati: tabelle e figure di studi pubblicati (src/data/learn/crolli.json, da scripts/build-crolli-data.mjs).
 * Le probabilità delle curve di fragilità sono un nostro calcolo con i parametri pubblicati.
 */
import { useId, useState, type ReactNode } from 'react';
import { useWidth, LegendItem } from '../components/charts/ChartFrame';
import { ExternalLink } from '../components/ui';
import { Figure } from './figures';
import { dec, n } from './facts/format';
import {
  agibilita,
  CLASSI,
  CLASSI_CA,
  crolliCampi,
  crolliData,
  crolliNorcia,
  curveMuratura,
  danno5Campi,
  dannoCampi,
  dannoNorcia,
  finoA2Campi,
  finoA2Norcia,
  fonte,
  griglia,
  indicePga,
  inG,
  modelli,
  parametriMuratura,
  PGA_ESEMPIO,
  perc,
  probCA,
  probMuratura,
  probPct,
  restoCampi,
  restoNorcia,
  scuotimento,
  unitaCampi,
  unitaNorcia,
  type ClasseMuratura,
} from './facts/crolli';

/* ---------- Norcia e Campi Alto: il danno rilevato ---------- */

/* Scala di un solo colore: più scuro, danno più grave. */
const COLORE_DANNO = [14, 30, 46, 62, 80, 100].map((p) => `color-mix(in srgb, var(--chart-2) ${p}%, var(--surface-2))`);
const COLORE_RESTO = 'var(--chart-grid)';
const NOME_DANNO = ['0 nessuno', '1 lieve', '2 moderato', '3 grave', '4 molto grave', '5 crollo'];
/* Il filo di colore della superficie che separa i pezzi della barra. */
const STACCO = 'inset -2px 0 0 var(--surface)';

function BarraDanno({ nome, unita, quote, resto, nota }: { nome: string; unita: number; quote: (number | null)[]; resto: number; nota: string }) {
  return (
    <li>
      <span className="hbars__label">
        {nome} ({n(unita)} unità)
      </span>
      <span className="hbars__track hbars__track--stack" aria-hidden="true">
        {quote.map((q, k) =>
          q === null ? null : <span key={k} style={{ width: `${q}%`, background: COLORE_DANNO[k], boxShadow: STACCO }} title={`Danno ${NOME_DANNO[k]}: ${q}%`} />,
        )}
        <span style={{ width: `${resto}%`, background: COLORE_RESTO }} title={`Resto: ${resto}%`} />
      </span>
      <span className="hbars__value">{nota}</span>
    </li>
  );
}

export function CrolliNorciaCampi() {
  const s = fonte('sisti2022');
  return (
    <Figure
      title="Due centri rinforzati, due esiti diversi"
      caption={
        <>
          Il danno rilevato alla fine della sequenza del 2016 nelle unità strutturali in muratura (porzioni di edificio che
          lavorano come un corpo unico), dalle schede dei tecnici, convertito nella scala europea da 0 a 5. A Norcia il {perc(finoA2Norcia)} ha
          avuto un danno fino a 2; a Campi Alto, frazione di Norcia con muri per lo più di pietre grezze, il {perc(finoA2Campi)}, e il{' '}
          {perc(danno5Campi)} ha avuto un crollo locale o totale. Gli autori giudicano le scosse registrate vicino a Campi Alto il 26 ottobre
          paragonabili o superiori a quella di Norcia del 30 ottobre. Per Campi Alto manca la registrazione del 30 ottobre. Le {unitaCampi} schede di Campi Alto comprendono 44 unità residenziali in muratura e 5 magazzini. Il grafico descrive
          questi due centri: non dice come si comporta un altro edificio.
        </>
      }
      source="Sisti e altri (2022), Bulletin of Earthquake Engineering, figura 12"
      sourceHref={s.url}
      table={
        <div className="table-wrap">
          <table className="data-table">
            <caption className="visually-hidden">Danno e agibilità delle unità in muratura a Norcia e Campi Alto, in percentuale</caption>
            <thead>
              <tr>
                <th scope="col">Dato</th>
                <th scope="col" className="num">
                  Norcia
                </th>
                <th scope="col" className="num">
                  Campi Alto
                </th>
              </tr>
            </thead>
            <tbody>
              {NOME_DANNO.map((nome, k) => (
                <tr key={nome}>
                  <th scope="row">Danno {nome}</th>
                  <td className="num">{dannoNorcia[k] === null ? 'non indicato' : perc(dannoNorcia[k] as number)}</td>
                  <td className="num">{perc(dannoCampi[k])}</td>
                </tr>
              ))}
              <tr>
                <th scope="row">Resto per arrivare a 100</th>
                <td className="num">{perc(restoNorcia)} (danno 5 o dato mancante)</td>
                <td className="num">{perc(restoCampi)} (dato mancante o arrotondamenti)</td>
              </tr>
              <tr>
                <th scope="row">Agibili (esito A)</th>
                <td className="num">{perc(agibilita.norcia.A)}</td>
                <td className="num">{perc(agibilita.campiAlto.A)}</td>
              </tr>
              <tr>
                <th scope="row">Agibili solo dopo interventi, o in parte (B, C)</th>
                <td className="num">{perc(agibilita.norcia.BC)}</td>
                <td className="num">{perc(agibilita.campiAlto.BC)}</td>
              </tr>
              <tr>
                <th scope="row">Inagibili (esito E)</th>
                <td className="num">{perc(agibilita.norcia.E)}</td>
                <td className="num">{perc(agibilita.campiAlto.E)}</td>
              </tr>
              <tr>
                <th scope="row">Crolli totali e parziali (unità)</th>
                <td className="num">
                  {crolliNorcia.totali} e {crolliNorcia.parziali}
                </td>
                <td className="num">
                  {crolliCampi.totali} e {crolliCampi.parziali}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      }
    >
      <ul
        className="hbars hbars--wide-label"
        aria-label={`Indice di danno. Norcia, ${unitaNorcia} unità: ${finoA2Norcia}% con danno fino a 2. Campi Alto, ${unitaCampi} unità: ${finoA2Campi}% con danno fino a 2 e ${danno5Campi}% con danno 5.`}
      >
        <BarraDanno nome="Norcia" unita={unitaNorcia} quote={dannoNorcia} resto={restoNorcia} nota={`danno fino a 2: ${perc(finoA2Norcia)}`} />
        <BarraDanno nome="Campi Alto" unita={unitaCampi} quote={dannoCampi} resto={restoCampi} nota={`danno fino a 2: ${perc(finoA2Campi)}`} />
      </ul>
      <p className="chart-legend">
        {NOME_DANNO.map((nome, k) => (
          <LegendItem key={nome} kind="bar" color={COLORE_DANNO[k]}>
            {nome}
          </LegendItem>
        ))}
        <LegendItem kind="bar" color={COLORE_RESTO}>
          non indicato
        </LegendItem>
      </p>
    </Figure>
  );
}

/* ---------- Stessa scossa, classi diverse: le curve di fragilità ---------- */

/* Le classi sono ordinate: dall'arancione (più fragile) al grigio (meno fragile). */
const COLORE_CLASSE: Record<ClasseMuratura, string> = {
  A: 'var(--chart-2)',
  B: 'color-mix(in srgb, var(--chart-2) 66%, var(--chart-axis))',
  C: 'color-mix(in srgb, var(--chart-2) 33%, var(--chart-axis))',
  D: 'var(--chart-axis)',
};
const TRATTO: Record<ClasseMuratura, string | undefined> = { A: undefined, B: undefined, C: '7 3', D: '2 3' };
const NOME_CLASSE: Record<ClasseMuratura, string> = {
  A: 'Classe A (la più fragile)',
  B: 'Classe B',
  C: 'Classe C',
  D: 'Classe D (la meno fragile delle quattro)',
};
const PGA_TABELLA = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];

export function CrolliFragilita() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const idCursore = useId();
  const [indice, setIndice] = useState(indicePga(PGA_ESEMPIO));
  const pga = griglia[indice];
  const H = 300;
  const M = { top: 12, right: 30, bottom: 42, left: 44 };
  const x = (v: number) => M.left + (v / 0.6) * (width - M.left - M.right);
  const y = (p: number) => H - M.bottom - p * (H - M.top - M.bottom);
  const xTicks = width < 420 ? [0, 0.2, 0.4, 0.6] : [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
  const s = fonte('lagomarsino2021');
  const r = fonte('rosti2021');
  return (
    <Figure
      title="Stessa scossa, classi di edifici diverse"
      caption={
        <>
          Ogni curva dice quale quota di una classe di edifici in muratura raggiunge o supera il danno 3 (grave: grandi crepe nella maggior parte dei
          muri) al crescere dell’accelerazione di picco del suolo (PGA). A {inG(PGA_ESEMPIO)}: {CLASSI.map((c) => `classe ${c} ${probPct(probMuratura(c, 'D3', PGA_ESEMPIO))}`).join(', ')}. Le
          probabilità sono un nostro calcolo con i parametri pubblicati. Valgono per gruppi di edifici, su un terreno di riferimento: non dicono
          niente di una casa precisa, e una classe non coincide con un tipo di edificio. È uno dei {modelli.muratura} modelli per la muratura
          della valutazione nazionale del rischio: il meno severo per i danni 4 e 5 e, nelle stime nazionali, anche per il danno 3. Gli altri modelli danno percentuali più alte.
        </>
      }
      source="Lagomarsino, Cattari e Ottonelli (2021), tabella 13; calcolo di Quake Italia"
      sourceHref={s.url}
      table={
        <>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="visually-hidden">Probabilità di danno almeno 3 e almeno 4 per classe di muratura e accelerazione di picco</caption>
              <thead>
                <tr>
                  <th scope="col">PGA</th>
                  {CLASSI.map((c) => (
                    <th key={c} scope="col" className="num">
                      {c}: ≥3 / ≥4
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PGA_TABELLA.map((v) => (
                  <tr key={v}>
                    <th scope="row">{inG(v)}</th>
                    {CLASSI.map((c) => (
                      <td key={c} className="num">
                        {probPct(probMuratura(c, 'D3', v)).replace('meno dell’1%', '<1%')} / {probPct(probMuratura(c, 'D4', v)).replace('meno dell’1%', '<1%')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Formula: {crolliData.fragilita.formula}. Parametri (mediana della PGA per il danno 3 e per il danno 4, in g, e dispersione β):{' '}
            {CLASSI.map((c) => `${c} ${dec(parametriMuratura[c].mediane[2])} e ${dec(parametriMuratura[c].mediane[3])}, β ${dec(parametriMuratura[c].beta)}`).join('; ')}. Il danno 5 non è
            mostrato: le sue mediane stanno oltre i valori di PGA osservati.
          </p>
          <p>
            Per il cemento armato di 3–4 piani (metodo diverso, numeri non confrontabili direttamente con quelli qui sopra; Rosti e altri, 2021, curve
            empiriche, <ExternalLink href={r.url}>tabella 3</ExternalLink>
            ), probabilità di danno almeno 3 a {inG(PGA_ESEMPIO)}:{' '}
            {CLASSI_CA.map((c) => `${c === 'C2-M' ? 'progettato senza criteri sismici moderni (classe C2)' : 'progettato per il sisma dopo il 1981 (classe D)'} ${probPct(probCA(c, 'D3', PGA_ESEMPIO))}`).join('; ')}.
          </p>
        </>
      }
    >
      <div ref={ref} className="learn-chart">
        {width > 0 && (
          <svg
            width={width}
            height={H}
            role="img"
            aria-label={`Quattro curve che salgono con l'accelerazione del suolo da 0 a 0,6 g. A ${dec(pga)} g la probabilità di danno almeno 3 è: ${CLASSI.map((c) => `classe ${c} ${probPct(curveMuratura[c].D3[indice])}`).join(', ')}.`}
          >
            <g className="grid">
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <g key={p}>
                  <line x1={M.left} x2={width - M.right} y1={y(p)} y2={y(p)} strokeDasharray="2 3" />
                  <text className="axis-label" x={M.left - 6} y={y(p)} dy="0.32em" textAnchor="end">
                    {p * 100}%
                  </text>
                </g>
              ))}
            </g>
            <line x1={x(pga)} x2={x(pga)} y1={M.top} y2={H - M.bottom} className="annot-line" />
            {CLASSI.map((c) => (
              <path
                key={c}
                d={griglia.map((v, i) => `${i ? 'L' : 'M'}${x(v).toFixed(1)},${y(curveMuratura[c].D3[i]).toFixed(1)}`).join('')}
                fill="none"
                stroke={COLORE_CLASSE[c]}
                strokeWidth={2}
                strokeDasharray={TRATTO[c]}
              />
            ))}
            {CLASSI.map((c) => (
              <circle key={c} cx={x(pga)} cy={y(curveMuratura[c].D3[indice])} r={4} fill={COLORE_CLASSE[c]} stroke="var(--surface)" strokeWidth={2} />
            ))}
            {CLASSI.map((c) => (
              <text key={c} className="direct-label" x={width - M.right + 8} y={y(curveMuratura[c].D3[griglia.length - 1])} dy="0.32em">
                {c}
              </text>
            ))}
            <g className="axis">
              <line x1={M.left} x2={width - M.right} y1={H - M.bottom} y2={H - M.bottom} />
              {xTicks.map((v) => (
                <text key={v} x={x(v)} y={H - M.bottom + 16} textAnchor="middle">
                  {dec(v)} g
                </text>
              ))}
              <text className="axis-title" x={(M.left + width - M.right) / 2} y={H - 4} textAnchor="middle">
                accelerazione di picco del suolo (PGA)
              </text>
            </g>
          </svg>
        )}
      </div>
      <p className="small">
        <label htmlFor={idCursore} className="strong">
          Scegli lo scuotimento: {inG(pga)}
        </label>
        <input
          id={idCursore}
          type="range"
          min={0}
          max={griglia.length - 1}
          step={1}
          value={indice}
          onChange={(e) => setIndice(Number(e.target.value))}
          aria-valuetext={`${dec(pga)} g`}
          style={{ display: 'block', width: '100%', accentColor: 'var(--chart-2)' }}
        />
        <span aria-live="polite">
          Danno almeno 3: {CLASSI.map((c) => `${c} ${probPct(curveMuratura[c].D3[indice])}`).join(' · ')}
        </span>
      </p>
      <p className="chart-legend">
        {CLASSI.map((c) => (
          <LegendItem key={c} kind="line" color={COLORE_CLASSE[c]}>
            {NOME_CLASSE[c]}
          </LegendItem>
        ))}
      </p>
    </Figure>
  );
}

/* ---------- Quanto ha tremato ---------- */

const stimato = (v: string, misurato: boolean) =>
  misurato ? (
    v
  ) : (
    <>
      {v}
      <span aria-label=" (stima)">*</span>
    </>
  );

export function CrolliScuotimento() {
  const s = fonte('sorrentino2019');
  return (
    <Figure
      title="Quanto ha tremato, e quanto danno ha fatto"
      caption={
        <>
          In ogni casella il primo valore è del 24 agosto 2016, il secondo del 30 ottobre. L’intensità (scala EMS-98) misura gli effetti osservati: quella
          di ottobre somma i danni di tutta la sequenza. La velocità (PGV) e l’accelerazione (PGA) di picco misurano il moto del suolo. Con l’asterisco i
          valori stimati dalle mappe di scuotimento dell’INGV, dove non c’era un accelerometro: tutti quelli di San Capone, quindi il confronto con Amatrice è
          tra una stima e una misura. Per San Capone lo studio non riporta l’intensità di ottobre.
        </>
      }
      source="Sorrentino e altri (2019), Bulletin of Earthquake Engineering, tabella 1"
      sourceHref={s.url}
    >
      <div className="table-wrap">
        <table className="data-table">
          <caption className="visually-hidden">Intensità, velocità e accelerazione di picco il 24 agosto e il 30 ottobre 2016 in quattro località</caption>
          <thead>
            <tr>
              <th scope="col">Luogo</th>
              <th scope="col">Intensità</th>
              <th scope="col" className="num">
                PGV (cm/s)
              </th>
              <th scope="col" className="num">
                PGA (g)
              </th>
            </tr>
          </thead>
          <tbody>
            {scuotimento.map((l) => (
              <tr key={l.luogo}>
                <th scope="row">{l.luogo}</th>
                <td>
                  {l.ems[0]} → {l.ems[1] ?? 'n.d.'}
                </td>
                <td className="num">
                  {stimato(String(l.pgv[0]), l.misurato[0])} → {stimato(String(l.pgv[1]), l.misurato[1])}
                </td>
                <td className="num">
                  {stimato(dec(l.pga[0]), l.misurato[0])} → {stimato(dec(l.pga[1]), l.misurato[1])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Figure>
  );
}

/* ---------- Come si rompe un muro (disegno) ---------- */

function Vignetta({ titolo, sotto, label, children }: { titolo: string; sotto: string; label: string; children: ReactNode }) {
  return (
    <div className="fault-types__item">
      <svg viewBox="0 0 320 280" className="diagram" role="img" aria-label={label}>
        {children}
      </svg>
      <p className="fault-types__label">
        <strong>{titolo}</strong>
        <br />
        {sotto}
      </p>
    </div>
  );
}

const MURO = { fill: 'var(--surface-2)', stroke: 'var(--text-muted)', strokeWidth: 2 } as const;
const SOLAIO = { fill: 'var(--text-muted)' } as const;
const CATENA = { stroke: 'var(--chart-1)', strokeWidth: 4 } as const;

/* Pietre del muro che si disgrega: colonne sfalsate, con qualche pietra caduta. */
const PIETRE: [number, number, number, number][] = [
  [216, 62, 24, 16], [242, 64, 20, 14], [214, 82, 20, 18], [236, 80, 26, 17],
  [218, 104, 26, 15], [246, 102, 18, 18], [214, 123, 22, 17], [238, 122, 24, 18],
  [218, 144, 20, 17], [240, 144, 22, 15], [214, 165, 26, 17], [242, 163, 20, 18],
  [218, 186, 22, 16], [242, 186, 20, 17], [214, 206, 24, 17], [240, 207, 22, 16], [216, 227, 26, 15], [244, 227, 18, 15],
];

export function CrolliMeccanismi() {
  return (
    <Figure
      title="Tre modi in cui un muro reagisce"
      caption={
        <>
          Disegni schematici di un edificio in muratura visto in sezione, non in scala. A sinistra una parete non collegata a solai e muri
          trasversali: la scossa la spinge fuori dal suo piano e ruota attorno alla base. Al centro catene e solai ben ancorati fanno lavorare i muri
          insieme, come una scatola. A destra il limite: se pietre e malta sono scadenti il muro si sfalda da solo, e la catena da sola non basta. Sono
          meccanismi generali: per sapere com’è fatto un edificio preciso serve un tecnico abilitato.
        </>
      }
    >
      <div className="fault-types">
        <Vignetta
          titolo="Senza collegamenti"
          sotto="La parete si ribalta verso l’esterno."
          label="Sezione di un edificio: la parete destra, non collegata al solaio, ruota verso l'esterno attorno alla base."
        >
          <defs>
            <marker id="freccia-crolli" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="d-arrowhead" />
            </marker>
          </defs>
          <line x1="10" y1="250" x2="310" y2="250" className="d-ground" />
          <rect x="60" y="60" width="26" height="190" {...MURO} />
          <rect x="86" y="146" width="120" height="8" {...SOLAIO} />
          <rect x="86" y="60" width="120" height="8" {...SOLAIO} />
          <g transform="rotate(10 240 250)">
            <rect x="214" y="60" width="26" height="190" {...MURO} />
          </g>
          <path d="M282 70 q 22 10 28 44" className="d-arrow" markerEnd="url(#freccia-crolli)" />
          <text x="10" y="32" className="d-label">
            si ribalta
          </text>
        </Vignetta>
        <Vignetta
          titolo="A scatola"
          sotto="Catene e solai tengono insieme i muri."
          label="Sezione di un edificio: due pareti unite da solai ancorati e da catene metalliche con piastre alle estremità."
        >
          <line x1="10" y1="250" x2="310" y2="250" className="d-ground" />
          <rect x="60" y="60" width="26" height="190" {...MURO} />
          <rect x="234" y="60" width="26" height="190" {...MURO} />
          <rect x="60" y="52" width="200" height="10" {...SOLAIO} />
          <rect x="86" y="146" width="148" height="8" {...SOLAIO} />
          {/* Le catene stanno all'altezza dei solai, appena sotto il solaio intermedio e sotto la copertura. */}
          <line x1="52" y1="72" x2="268" y2="72" {...CATENA} />
          <line x1="52" y1="60" x2="52" y2="84" {...CATENA} />
          <line x1="268" y1="60" x2="268" y2="84" {...CATENA} />
          <line x1="52" y1="140" x2="268" y2="140" {...CATENA} />
          <line x1="52" y1="128" x2="52" y2="152" {...CATENA} />
          <line x1="268" y1="128" x2="268" y2="152" {...CATENA} />
          <text x="110" y="128" className="d-label">
            catena
          </text>
          <text x="10" y="32" className="d-label">
            lavorano insieme
          </text>
        </Vignetta>
        <Vignetta
          titolo="Se il muro si sfalda"
          sotto="Con malta povera la catena non basta."
          label="Sezione di un edificio: la parete destra è fatta di pietre irregolari separate; alcune pietre sono cadute a terra nonostante la catena."
        >
          <line x1="10" y1="250" x2="310" y2="250" className="d-ground" />
          <rect x="60" y="60" width="26" height="190" {...MURO} />
          <rect x="60" y="52" width="150" height="10" {...SOLAIO} />
          <rect x="86" y="146" width="124" height="8" {...SOLAIO} />
          {PIETRE.map(([px, py, w, h], k) => (
            <rect key={k} x={px} y={py} width={w} height={h} rx={3} {...MURO} />
          ))}
          <line x1="52" y1="140" x2="272" y2="140" {...CATENA} />
          <line x1="52" y1="128" x2="52" y2="152" {...CATENA} />
          <line x1="272" y1="128" x2="272" y2="152" {...CATENA} />
          <rect x="274" y="232" width="20" height="16" rx={3} transform="rotate(18 284 240)" {...MURO} />
          <rect x="296" y="236" width="14" height="12" rx={3} {...MURO} />
          <rect x="272" y="196" width="16" height="13" rx={3} transform="rotate(-24 280 202)" {...MURO} />
          <text x="10" y="32" className="d-label">
            si disgrega
          </text>
        </Vignetta>
      </div>
    </Figure>
  );
}
