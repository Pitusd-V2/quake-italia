/**
 * Figure dell'articolo «Le faglie».
 * Dati: meccanismi focali del catalogo INGV e coste di Natural Earth (src/data/learn/faglie.json,
 * da scripts/build-fault-data.mjs).
 */
import type { ReactNode } from 'react';
import { useWidth, LegendItem } from '../components/charts/ChartFrame';
import { Figure } from './figures';
import { conta, crostali, faglieData, notevoli, PROF_MAX, profonde, profondeSud, ZONE, zone, type Riga } from './facts/faglie';

const COLORE = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];
const NOME = ['normale', 'inversa', 'trascorrente'];
const NOMI = ['normali', 'inverse', 'trascorrenti'];
const pct = (q: number) => `${Math.round(q * 100)}%`;
const INGV_SRC = 'INGV, catalogo dei terremoti: meccanismi focali (tensore momento), richieste FDSN';
const date = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/* ---------- I tre tipi di faglia (disegno) ---------- */

function Arrow({ d, id }: { d: string; id: string }) {
  return <path d={d} className="d-arrow" markerEnd={`url(#${id})`} />;
}

function Pannello({ id, titolo, sotto, children, label }: { id: string; titolo: string; sotto: string; children: ReactNode; label: string }) {
  return (
    <div className="fault-types__item">
      <svg viewBox="0 0 320 280" className="diagram" role="img" aria-label={label}>
        <defs>
          <marker id={id} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="d-arrowhead" />
          </marker>
        </defs>
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

export function FaultTypesDiagram() {
  // Sezione verticale: la faglia scende verso destra; il blocco a destra sta sopra il piano di faglia.
  // x della faglia a una certa quota y: parte da (150, 110) e scende di 3 in verticale per 1 in orizzontale.
  const fx = (y: number) => 150 + (y - 110) / 3;
  return (
    <Figure
      title="Tre modi di rompersi"
      caption={
        <>
          Disegni schematici, non in scala. Nelle prime due figure la Terra è tagliata in verticale: la linea scura è la faglia,
          inclinata. Nella faglia <strong>normale</strong> il blocco che sta sopra la faglia scende; nella faglia{' '}
          <strong>inversa</strong> sale. Nella faglia <strong>trascorrente</strong>, vista dall’alto, i due blocchi scorrono di
          lato. Le frecce in alto indicano come viene «tirata» o «spinta» la crosta.
        </>
      }
    >
      <div className="fault-types">
        <Pannello
          id="freccia-normale"
          titolo="Normale"
          sotto="la crosta si allunga"
          label="Faglia normale in sezione: il blocco sopra la faglia scende, la crosta viene tirata dai due lati"
        >
          <polygon points={`20,110 150,110 ${fx(260)},260 20,260`} className="d-rock" />
          <polygon points={`${fx(134)},134 300,134 300,260 ${fx(260)},260`} className="d-rock d-rock--alt" />
          <line x1="20" y1="110" x2="150" y2="110" className="d-ground" />
          <line x1={fx(134)} y1="134" x2="300" y2="134" className="d-ground" />
          <line x1="150" y1="110" x2={fx(260)} y2="260" className="d-fault" />
          <Arrow d="M70 62 l-46 0" id="freccia-normale" />
          <Arrow d="M250 62 l46 0" id="freccia-normale" />
          <Arrow d="M250 175 l0 40" id="freccia-normale" />
          <Arrow d="M75 215 l0 -40" id="freccia-normale" />
        </Pannello>
        <Pannello
          id="freccia-inversa"
          titolo="Inversa"
          sotto="la crosta si accorcia"
          label="Faglia inversa in sezione: il blocco sopra la faglia sale, la crosta viene spinta dai due lati"
        >
          <polygon points={`20,110 150,110 ${fx(260)},260 20,260`} className="d-rock" />
          <polygon points={`${fx(86)},86 300,86 300,260 ${fx(260)},260`} className="d-rock d-rock--alt" />
          <line x1="20" y1="110" x2="150" y2="110" className="d-ground" />
          <line x1={fx(86)} y1="86" x2="300" y2="86" className="d-ground" />
          <line x1={fx(86)} y1="86" x2={fx(260)} y2="260" className="d-fault" />
          <Arrow d="M24 50 l46 0" id="freccia-inversa" />
          <Arrow d="M296 50 l-46 0" id="freccia-inversa" />
          <Arrow d="M250 215 l0 -40" id="freccia-inversa" />
          <Arrow d="M75 175 l0 40" id="freccia-inversa" />
        </Pannello>
        <Pannello
          id="freccia-trascorrente"
          titolo="Trascorrente"
          sotto="i blocchi scorrono di lato (vista dall’alto)"
          label="Faglia trascorrente vista dall'alto: due blocchi affiancati che scorrono in direzioni opposte"
        >
          <rect x="30" y="40" width="126" height="200" className="d-rock" />
          <rect x="164" y="40" width="126" height="200" className="d-rock d-rock--alt" />
          <line x1="160" y1="30" x2="160" y2="250" className="d-fault" />
          <Arrow d="M93 190 l0 -90" id="freccia-trascorrente" />
          <Arrow d="M227 100 l0 90" id="freccia-trascorrente" />
        </Pannello>
      </div>
    </Figure>
  );
}

/* ---------- La mappa: che faglie si muovono in Italia ---------- */

const LAT0 = 36.3;
const LAT1 = 47.2;
const LON0 = faglieData.area.minlon;
const LON1 = faglieData.area.maxlon;
const K = Math.cos((42 * Math.PI) / 180); // i gradi di longitudine sono più corti di quelli di latitudine

export function FaultMap() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const mw = Math.min(width, 560);
  const s = mw / ((LON1 - LON0) * K);
  const mh = (LAT1 - LAT0) * s;
  const x = (lon: number) => (lon - LON0) * K * s;
  const y = (lat: number) => (LAT1 - lat) * s;
  const punti = [...crostali].sort((a, b) => a[3] - b[3]);
  const r = (m: number) => 1.6 + Math.max(0, m - 3.5) * 1.7;
  const [n, i, t] = conta(crostali);
  return (
    <Figure
      title={`Che faglie si muovono in Italia: ${crostali.length} terremoti dal ${faglieData.anni[0]} al ${faglieData.anni[1]}`}
      caption={
        <>
          Ogni punto è una scossa di magnitudo {String(faglieData.magnitudoMinima).replace('.', ',')} o più, avvenuta nella
          crosta (fino a {PROF_MAX} km di profondità), per cui l’INGV ha calcolato il meccanismo focale; i punti più grandi sono
          le scosse più forti. In blu le faglie normali ({n}), in arancione le inverse ({i}), in viola le trascorrenti ({t}).
          Lungo l’Appennino domina il blu; sotto la Pianura Padana e al largo della costa marchigiana, l’arancione. I riquadri
          tratteggiati sono le zone confrontate nel grafico successivo.
        </>
      }
      source={INGV_SRC}
      sourceHref={faglieData.richieste[faglieData.richieste.length - 1]}
      table={
        <>
          <p>
            Scosse nella crosta con meccanismo focale: {crostali.length} ({n} normali, {i} inverse, {t} trascorrenti). Escluse
            dalla mappa {profonde.length} scosse più profonde di {PROF_MAX} km: {profondeSud.length} sotto il Tirreno meridionale e la
            Calabria, dentro la placca che scende sotto il Tirreno, le altre soprattutto sotto l’Appennino settentrionale e il mar Ionio. Molte scosse vengono da poche sequenze: per esempio quella
            dell’Italia centrale del 2016–2017.
          </p>
          <p>
            Le scosse di magnitudo 5,5 o più:{' '}
            {notevoli
              .map((v) => `${date.format(new Date(`${v.tempo}Z`))}, ${v.luogo}, ${v.magTipo} ${String(v.mag).replace('.', ',')}: ${v.tipo} (profondità ${String(v.prof).replace('.', ',')} km)`)
              .join('; ')}
            .
          </p>
          <p>Coste: Natural Earth (pubblico dominio).</p>
        </>
      }
    >
      <div ref={ref} className="learn-chart learn-map">
        {width > 0 && (
          <svg width={mw} height={mh} role="img" aria-label="Mappa dell'Italia con i terremoti colorati secondo il tipo di faglia: normali lungo l'Appennino, inverse in Pianura Padana">
            {faglieData.coste.map((c, k) => (
              <path key={k} d={c.map(([lo, la], j) => `${j ? 'L' : 'M'}${x(lo).toFixed(1)},${y(la).toFixed(1)}`).join('')} className="learn-map__coast" />
            ))}
            {ZONE.map((z, k) => (
              <g key={z.nome}>
                <rect x={x(z.box[2])} y={y(z.box[1])} width={x(z.box[3]) - x(z.box[2])} height={y(z.box[0]) - y(z.box[1])} className="learn-map__zone" />
                <circle cx={x(z.box[2])} cy={y(z.box[1])} r={8} className="learn-map__num" />
                <text x={x(z.box[2])} y={y(z.box[1])} dy="0.35em" textAnchor="middle" className="learn-map__numtext">
                  {k + 1}
                </text>
              </g>
            ))}
            {punti.map((p: Riga, k) => (
              <circle key={k} cx={x(p[1])} cy={y(p[0])} r={r(p[3])} fill={COLORE[p[4]]} className="learn-map__dot">
                <title>{`${p[6]}: magnitudo ${String(p[3]).replace('.', ',')}, faglia ${NOME[p[4]]}, ${String(p[2]).replace('.', ',')} km`}</title>
              </circle>
            ))}
          </svg>
        )}
      </div>
      <p className="chart-legend">
        {NOMI.map((nome, k) => (
          <LegendItem key={nome} kind="dot" color={COLORE[k]}>
            Faglie {nome}
          </LegendItem>
        ))}
      </p>
    </Figure>
  );
}

/* ---------- Le zone a confronto ---------- */

export function ZoneBars() {
  return (
    <Figure
      title="Zona che vai, faglia che trovi"
      caption={
        <>
          Per ogni zona (i riquadri della mappa), la quota di scosse su faglie normali, inverse e trascorrenti. Sono zone
          disegnate da noi con confini semplici, solo per confrontare: i numeri cambierebbero un po’ spostando i bordi.
        </>
      }
      source={INGV_SRC}
      sourceHref={faglieData.richieste[faglieData.richieste.length - 1]}
      table={
        <p>
          {zone
            .map(
              (z) =>
                `${z.nome} (latitudine ${z.box[0]}–${z.box[1]}°, longitudine ${z.box[2]}–${z.box[3]}°): ${z.n} scosse, ${z.conta[0]} normali, ${z.conta[1]} inverse, ${z.conta[2]} trascorrenti`,
            )
            .join('; ')}
          .
        </p>
      }
    >
      <ul className="hbars hbars--wide-label" aria-label="Quota di faglie normali, inverse e trascorrenti per zona">
        {zone.map((z) => (
          <li key={z.nome}>
            <span className="hbars__label">
              {zone.indexOf(z) + 1}. {z.nome} ({z.n} scosse)
            </span>
            <span className="hbars__track hbars__track--stack" aria-hidden="true">
              {z.quota.map((q, k) => (
                <span key={k} style={{ width: `${q * 100}%`, background: COLORE[k] }} />
              ))}
            </span>
            <span className="hbars__value">
              {z.quota
                .map((q, k) => [q, k] as const)
                .filter(([q]) => q >= 0.1)
                .map(([q, k]) => `${pct(q)} ${NOMI[k]}`)
                .join(', ')}
            </span>
          </li>
        ))}
      </ul>
      <p className="chart-legend">
        {NOMI.map((nome, k) => (
          <LegendItem key={nome} kind="bar" color={COLORE[k]}>
            {nome[0].toUpperCase() + nome.slice(1)}
          </LegendItem>
        ))}
      </p>
    </Figure>
  );
}
