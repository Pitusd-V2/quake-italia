/**
 * Figure dell'articolo «Magnitudo e intensità».
 * Dati: intensità per comune del database «Hai Sentito Il Terremoto» dell'INGV (2007–2024, versione 4, CC BY 4.0),
 * elaborate da scripts/build-intensita-data.mjs (src/data/learn/intensita.json). Distanze, mediane e confronto con la
 * formula del sito sono un nostro calcolo.
 */
import { useWidth, LegendItem } from '../components/charts/ChartFrame';
import { linear, log10 } from '../components/charts/scales';
import { Figure } from './figures';
import { n } from './facts/format';
import {
  classi,
  confronto,
  conSegno,
  dataScossa,
  dec1,
  eventi,
  HSIT_DOI,
  intensitaData,
  PERCENTUALE_GRADO,
  pct,
  piccole,
  piccoleEntro1SenzaFacili,
  quotaMw,
  policastroNord,
  policastroSud,
  romano,
  type Classe,
  type Evento,
  valI,
} from './facts/intensita';

const HSIT_SRC = 'INGV, Hai Sentito Il Terremoto: intensità per comune 2007–2024 (versione 4, CC BY 4.0); calcoli di Quake Italia';
const NOME_BREVE: Record<Evento['chiave'], string> = {
  ischia: 'Ischia 2017',
  emilia: 'Emilia 2012',
  norcia: 'Norcia 2016',
  policastro: 'Golfo di Policastro 2022',
};
const COL_PUNTO = 'var(--chart-1)';
const COL_SUD = 'var(--chart-2)';
const COL_FORMULA = 'var(--chart-3)';
const COL_MEDIANA = 'var(--text)';
const mag = (e: Evento) => `${e.magTipo} ${dec1(e.mag)}`;
const km = (v: number) => (v >= 1000 ? n(v) : String(v).replace('.', ','));

/* ---------- 1. Quattro scosse, quattro storie ---------- */

/** Spostamento verticale piccolo e sempre uguale, per non sovrapporre i comuni con la stessa intensità. */
const sparpaglia = (i: number) => (((i * 0.618034) % 1) - 0.5) * 0.3;

function Pannello({ e, x0, y0, w, h }: { e: Evento; x0: number; y0: number; w: number; h: number }) {
  const M = { top: 24, right: 10, bottom: 22, left: 36 };
  const x = log10([1, 1000], [x0 + M.left, x0 + w - M.right]);
  const y = linear([1, 8.4], [y0 + h - M.bottom, y0 + M.top]);
  const profonda = e.prof > 40;
  // La mediana di ogni fascia sta al centro (in scala logaritmica) della fascia; si spezza dove manca una fascia.
  const med = e.mediane.map((f) => ({ ...f, cx: x(Math.sqrt(Math.max(1, f.da) * f.a)), cy: y(f.mediana) }));
  const tratti: (typeof med)[] = [];
  med.forEach((m, i) => (i > 0 && med[i - 1].a === m.da ? tratti[tratti.length - 1].push(m) : tratti.push([m])));
  const curva = e.curva.map(([d, v], i) => `${i ? 'L' : 'M'}${x(d).toFixed(1)},${y(v).toFixed(1)}`).join('');
  return (
    <g>
      <text className="axis-title" x={x0} y={y0 + 14}>
        <tspan className="strong-label">{NOME_BREVE[e.chiave]}</tspan> · {mag(e)} · {n(e.prof)} km{w > 420 ? ' di profondità' : ''}
      </text>
      <g className="grid">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((v) => (
          <g key={v}>
            <line x1={x0 + M.left} x2={x0 + w - M.right} y1={y(v)} y2={y(v)} />
            <text className="axis-label" x={x0 + M.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
              {romano(v)}
            </text>
          </g>
        ))}
        {[1, 10, 100, 1000].map((d) => (
          <line key={d} x1={x(d)} x2={x(d)} y1={y0 + M.top} y2={y0 + h - M.bottom} />
        ))}
      </g>
      <g className="axis">
        {[1, 10, 100, 1000].map((d) => (
          <text key={d} x={x(d)} y={y0 + h - M.bottom + 15} textAnchor={d === 1 ? 'start' : d === 1000 ? 'end' : 'middle'}>
            {km(d)}
          </text>
        ))}
      </g>
      {e.punti.map(([d, v, sud], i) => (
        <circle
          key={i}
          cx={x(Math.max(1, d))}
          cy={y(v + sparpaglia(i))}
          r={2.4}
          fill={profonda && sud ? COL_SUD : COL_PUNTO}
          fillOpacity={profonda && sud ? 0.75 : 0.4}
        >
          <title>{`Un comune a ${km(d)} km: intensità ${valI(v)}${v === 1 ? ' (non sentita)' : ''}`}</title>
        </circle>
      ))}
      <path d={curva} fill="none" stroke={COL_FORMULA} strokeWidth={2} strokeDasharray="5 4" />
      {tratti.map((t, k) =>
        t.length > 1 ? <polyline key={k} points={t.map((m) => `${m.cx},${m.cy}`).join(' ')} fill="none" stroke={COL_MEDIANA} strokeWidth={2.5} /> : null,
      )}
      {med.map((m) => (
        <circle key={m.da} cx={m.cx} cy={m.cy} r={3.5} fill={COL_MEDIANA} stroke="var(--surface)" strokeWidth={1.5}>
          <title>{`Da ${km(m.da)} a ${km(m.a)} km: mediana ${valI(m.mediana)} su ${m.n} comuni`}</title>
        </circle>
      ))}
    </g>
  );
}

export function IntensityDistanceChart() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const cols = width >= 640 ? 2 : 1;
  const rows = Math.ceil(eventi.length / cols);
  const GAP = 20;
  const PANEL_H = 220;
  const AXIS_H = 22;
  const H = rows * PANEL_H + (rows - 1) * 12 + AXIS_H;
  const w = (width - GAP * (cols - 1)) / cols;
  const ischia = eventi.find((e) => e.chiave === 'ischia')!;
  const policastro = eventi.find((e) => e.chiave === 'policastro')!;
  return (
    <Figure
      title="Quattro scosse, quattro storie"
      caption={
        <>
          Ogni punto è un comune: in orizzontale la distanza dall’epicentro (in scala logaritmica: ogni tacca è dieci volte più
          lontana), in verticale l’intensità MCS stimata dai questionari dei cittadini. Accanto al nome: magnitudo e
          profondità. Il grado I vuol dire «non sentita».
          Solo i comuni con almeno {confronto.qMin} questionari; i punti sono un po’ sparpagliati in verticale per non
          coprirsi. La linea continua è la mediana per fascia di distanza; quella tratteggiata è la stima della formula che
          Quake Italia usa per dire «Sentita forte» o «Sentita bene». Nella scossa profonda del Golfo di Policastro i comuni a
          sud dell’epicentro (in arancio) l’hanno sentita molto più di quelli a nord.
        </>
      }
      source={HSIT_SRC}
      sourceHref={HSIT_DOI}
      table={
        <ul className="advice">
          {eventi.map((e) => (
            <li key={e.id}>
              <strong>
                {NOME_BREVE[e.chiave]} ({dataScossa(e)}, {mag(e)}, {n(e.prof)} km di profondità)
              </strong>
              : {n(e.comuniUsati)} comuni con almeno {confronto.qMin} questionari su {n(e.comuni)}. Mediane per fascia di
              distanza dall’epicentro:{' '}
              {e.mediane.map((f) => `da ${km(f.da)} a ${km(f.a)} km ${valI(f.mediana)} (${f.n} comuni, sentita nel ${pct(f.sentito)})`).join('; ')}.
              Intensità più alta: {valI(e.massimo.I)} a {e.massimo.comune} ({km(e.massimo.dKm)} km, {e.massimo.q} questionari). La
              formula del sito, sopra l’epicentro: {dec1(e.formulaEpicentro)}.
            </li>
          ))}
          <li>
            Golfo di Policastro, tra 100 e 200 km: a sud dell’epicentro sentita nel {pct(policastroSud.sentito)} dei comuni (
            {policastroSud.n}, mediana {valI(policastroSud.mediana)}); a nord nel {pct(policastroNord.sentito)} ({policastroNord.n},
            mediana {valI(policastroNord.mediana)}).
          </li>
          <li>Dati scaricati il {intensitaData.scaricato}.</li>
        </ul>
      }
    >
      <p className="chart-legend">
        <LegendItem kind="dot" color={COL_PUNTO}>
          Un comune
        </LegendItem>
        <LegendItem kind="dot" color={COL_SUD}>
          Comune a sud dell’epicentro (solo scossa profonda)
        </LegendItem>
        <LegendItem kind="line" color={COL_MEDIANA}>
          Mediana
        </LegendItem>
        <LegendItem kind="line" color={COL_FORMULA}>
          Formula del sito (tratteggio)
        </LegendItem>
      </p>
      <div ref={ref} className="learn-chart" style={{ height: width > 0 ? H : 4 * PANEL_H }}>
        {width > 0 && (
          <svg
            width={width}
            height={H}
            role="img"
            aria-label={`Intensità per comune in funzione della distanza per quattro scosse. Ischia 2017, magnitudo ${dec1(ischia.mag)} a ${ischia.prof} km: intensità ${valI(ischia.massimo.I)} vicino all’epicentro, non più sentita oltre circa ${ischia.distMaxSentito} km. Emilia 2012 e Norcia 2016: intensità che scende piano, sentite fino a centinaia di chilometri. Golfo di Policastro 2022, magnitudo ${dec1(policastro.mag)} a ${policastro.prof} km: intensità bassa ovunque, intorno al grado II, più alta a sud che a nord.`}
          >
            {eventi.map((e, i) => (
              <Pannello key={e.id} e={e} x0={(i % cols) * (w + GAP)} y0={Math.floor(i / cols) * (PANEL_H + 12)} w={w} h={PANEL_H} />
            ))}
            <text className="axis-title" x={width / 2} y={H - 4} textAnchor="middle">
              Distanza dall’epicentro (km, scala logaritmica)
            </text>
          </svg>
        )}
      </div>
    </Figure>
  );
}

/* ---------- 2. Quanto sbaglia la nostra stima ---------- */

const etichetta = (c: Classe) => `Magnitudo ${c.da}–${c.a}`;
const riga = (c: Classe) =>
  `${etichetta(c)}: ${n(c.terremoti)} scosse, ${n(c.n)} comuni; scarto mediano ${conSegno(c.mediana)}, medio ${conSegno(c.media)}, deviazione standard ${dec1(c.sd)}; entro un grado nel ${pct(c.entro1)}`;

export function FormulaCheckBars() {
  return (
    <Figure
      title="Quanto sbaglia la nostra stima"
      caption={
        <>
          Per ogni comune abbiamo confrontato l’intensità stimata dall’INGV con i questionari e quella che prevede la formula
          del sito (Allen, Wald e Worden, 2012), che stima la scala Mercalli modificata: molto simile alla MCS, grado
          per grado, ma non identica. La barra (e il primo numero) è la quota di comuni dove la formula sbaglia al massimo di un
          grado; lo scarto è la mediana di «questionari meno formula» (positivo: la formula stima troppo poco). Scosse fino a{' '}
          {confronto.profMax} km di profondità, comuni entro {confronto.distMax} km dall’ipocentro con almeno {confronto.qMin}{' '}
          questionari, compresi quelli dove nessuno l’ha sentita. Per le scosse più piccole molti accordi sono facili: nessuno
          l’ha sentita e la formula dice grado I. È un nostro calcolo.
        </>
      }
      source={HSIT_SRC}
      sourceHref={HSIT_DOI}
      table={
        <ul className="advice">
          {classi.map((c) => (
            <li key={c.da}>
              {riga(c)}; comuni dove nessuno l’ha sentita: {pct(c.nonSentito)}; accordi «facili» (nessuno l’ha sentita e la formula dice grado I) nel {pct(c.nonSentitoEntrambi)}; magnitudo
              Mw nel {pct(quotaMw(c))} dei casi (le altre sono soprattutto ML).
            </li>
          ))}
          <li>
            {etichetta(piccole)}, senza gli accordi facili: entro un grado nel {pct(piccoleEntro1SenzaFacili)}.
          </li>
          <li>
            Solo i comuni con almeno 10 questionari:{' '}
            {confronto.q10.map((c) => `${etichetta(c)} entro un grado nel ${pct(c.entro1)} (scarto ${conSegno(c.mediana)}, ${n(c.n)} comuni, «non sentito» nel ${pct(c.nonSentito)})`).join('; ')}.
            Con più questionari restano soprattutto i comuni dove la scossa si è sentita: in parte è lo stesso effetto di selezione della riga seguente.
          </li>
          <li>
            Se si togliessero i comuni dove nessuno l’ha sentita (un errore, perché resterebbero solo i più colpiti):{' '}
            {confronto.soloSentiti.map((c) => `${etichetta(c)} scarto ${conSegno(c.mediana)}, entro un grado nel ${pct(c.entro1)}`).join('; ')}.
          </li>
        </ul>
      }
    >
      <ul className="hbars hbars--wide-value" aria-label="Quota di comuni dove la formula del sito sbaglia al massimo di un grado, per magnitudo">
        {classi.map((c) => (
          <li key={c.da}>
            <span className="hbars__label">{etichetta(c)}</span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${c.entro1}%` }} />
            </span>
            <span className="hbars__value">
              {pct(c.entro1)} · scarto {conSegno(c.mediana)}
            </span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/* ---------- 3. Dalla percentuale di chi l'ha sentita al grado ---------- */

const pctDec = (v: number) => `${String(v).replace('.', ',')}%`;
/** «dal» e «del» davanti a una percentuale: dallo 0,1%, dall’87,5%, del 12,5%. */
const conArt = (prep: 'da' | 'de', v: number) => {
  const s = String(v);
  const art = s.startsWith('0') ? 'llo ' : /^(8|11)/.test(s) ? 'll’' : 'l ';
  return `${prep}${art}${pctDec(v)}`;
};

export function FeltPercentBars() {
  return (
    <Figure
      title="Quanti l’hanno sentita: dalla percentuale al grado"
      caption={
        <>
          I questionari di un comune danno prima un grado dagli effetti descritti: paura, oggetti che si muovono, porte che
          sbattono. Poi «Hai Sentito Il Terremoto» calcola quanti l’hanno sentita, dando ai «non sentito» un peso 6 volte
          maggiore, perché chi non ha sentito niente risponde meno. Se questa percentuale indica un grado più basso, il grado
          si abbassa: diventa una media dei due, pesata sul numero di risposte. Per il grado II la percentuale è l’unico
          indizio. Sotto lo 0,1% è grado I, cioè non sentita. Oltre l’87,5% dice solo «VI o più»: per i gradi più alti contano
          i danni agli edifici.
        </>
      }
      source="INGV, Hai Sentito Il Terremoto: readme del database 2007–2024 (versione 4), tabella 2; Sbarra e colleghi (2025)"
      sourceHref={HSIT_DOI}
      table={
        <ul className="advice">
          {PERCENTUALE_GRADO.map((g) => (
            <li key={g.grado}>
              Grado {g.grado}{g.a === 100 ? ' o più' : ''}: {g.a === 100 ? `${conArt('da', g.da)} in su` : `${conArt('da', g.da)} a meno ${conArt('de', g.a)}`}
            </li>
          ))}
        </ul>
      }
    >
      <ul className="hbars" aria-label="Percentuale di persone che hanno sentito la scossa e grado MCS corrispondente">
        {PERCENTUALE_GRADO.map((g) => (
          <li key={g.grado}>
            <span className="hbars__label">
              Grado {g.grado}
              {g.a === 100 ? ' o più' : ''}
            </span>
            <span className="hbars__track hbars__track--range" aria-hidden="true">
              <span style={{ left: `${g.da}%`, width: `${g.a - g.da}%` }} />
            </span>
            <span className="hbars__value">{g.a === 100 ? conArt('da', g.da) : `${pctDec(g.da)}–${pctDec(g.a)}`}</span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}
