/**
 * Figure dell'articolo «Casa antisismica: cosa vuol dire davvero».
 * Dati: ISTAT, censimento 2011, e OPCM 3274/2003, Allegato A (src/data/learn/antisismica.json, da
 * scripts/build-antisismica-data.mjs). Quote, unione dei due elenchi e periodi di ritorno sono nostri calcoli.
 */
import type { CSSProperties } from 'react';
import { LegendItem } from '../components/charts/ChartFrame';
import { Figure } from './figures';
import { n } from './facts/format';
import {
  altroPerEpoca,
  antisismicaData,
  caPerEpoca,
  classificati,
  differenzaSenzaCampania,
  edificiPerEpoca,
  edificiTotali,
  EPOCHE,
  epocaMassima,
  muraturaPerEpoca,
  ncZona2,
  ncZona3,
  ncZona4,
  PERIODI,
  pct1,
  pubblicati,
  quotaCumulata,
  quotaEdificiNonUniti,
  quotaPrima1981,
  quotaPrima2001,
  STATI,
  totaliMateriale,
  unione,
  type Gruppo,
  type StatoId,
} from './facts/antisismica';

const ISTAT_SRC = 'ISTAT, Censimento 2011, Edifici residenziali (CC BY 4.0); quote: calcolo di Quake Italia';
const NTC_SRC = 'Norme tecniche per le costruzioni 2018 (§2.4, §3.2.1, Tab. 3.2.I e 7.3.III) e Circolare n. 7 del 2019; periodi di ritorno: calcolo di Quake Italia con la formula [3.2.0]';
const NTC_URL = 'https://www.gazzettaufficiale.it/eli/gu/2018/02/20/42/so/8/sg/pdf';

/** La riga di testo sotto una barra. */
const sottoRiga: CSSProperties = { gridColumn: '1 / -1', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' };
/** Le intestazioni delle tabelle: il tema le azzera perché di solito contengono un pulsante. */
const th: CSSProperties = { padding: 'var(--sp-2) var(--sp-3)' };

/* ---------- A. Gli edifici per epoca e materiale ---------- */

const MATERIALI = [
  { nome: 'Muratura portante', colore: 'var(--chart-1)', valori: muraturaPerEpoca },
  { nome: 'Calcestruzzo armato', colore: 'var(--chart-2)', valori: caPerEpoca },
  { nome: 'Altro', colore: 'var(--chart-3)', valori: altroPerEpoca },
];

/** Le norme che cadono dentro una classe del censimento (indice della classe → testo). */
const NORME: Record<number, string> = {
  4: '1974: legge n. 64 sulle costruzioni in zone sismiche',
  5: `1981–84: decreti che classificano ${n(pubblicati.classificazione1984.comuniClassificati)} comuni`,
  7: '2003: ordinanza n. 3274, tutti i comuni in una zona',
  8: '1° luglio 2009: norme tecniche del 2008 obbligatorie',
};

export function BuildingAgeBars() {
  return (
    <Figure
      title="Quando sono stati costruiti gli edifici in cui viviamo"
      caption={
        <>
          Gli edifici residenziali italiani al censimento del 2011 ({n(edificiTotali)}), per epoca di costruzione e materiale
          della struttura portante. Sotto ogni barra: la quota di edifici costruiti fino a quel periodo e le norme arrivate in
          quegli anni. Le classi del censimento non coincidono con le date delle norme: la classe «2006 e dopo», per esempio,
          comprende edifici progettati prima delle norme del 2008. L’epoca è quella indicata nel questionario. E per decenni le
          regole sismiche valevano solo nei comuni classificati: la data, da sola, non dice con quali regole è stato costruito un
          edificio, né com’è fatto oggi. Le norme tecniche del 2018 sono arrivate dopo questo censimento.
        </>
      }
      source={ISTAT_SRC}
      sourceHref={antisismicaData.fonti.istat.url}
      table={
        <>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="visually-hidden">Edifici residenziali per epoca di costruzione e materiale, censimento 2011</caption>
              <thead>
                <tr>
                  <th scope="col" style={th}>Epoca</th>
                  <th scope="col" className="num" style={th}>Muratura</th>
                  <th scope="col" className="num" style={th}>Calcestruzzo armato</th>
                  <th scope="col" className="num" style={th}>Altro</th>
                  <th scope="col" className="num" style={th}>Totale</th>
                  <th scope="col" className="num" style={th}>Fino a qui</th>
                </tr>
              </thead>
              <tbody>
                {EPOCHE.map((e, i) => (
                  <tr key={e.id}>
                    <th scope="row">{e.nome}</th>
                    <td className="num">{n(muraturaPerEpoca[i])}</td>
                    <td className="num">{caPerEpoca[i] ? n(caPerEpoca[i]) : '—'}</td>
                    <td className="num">{n(altroPerEpoca[i])}</td>
                    <td className="num">{n(edificiPerEpoca[i])}</td>
                    <td className="num">{pct1(quotaCumulata[i])}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">Totale</th>
                  <td className="num">{n(totaliMateriale.muratura)}</td>
                  <td className="num">{n(totaliMateriale.ca)}</td>
                  <td className="num">{n(totaliMateriale.altro)}</td>
                  <td className="num">{n(edificiTotali)}</td>
                  <td className="num">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>Nel file ISTAT non c’è una riga per il calcestruzzo armato prima del 1919: per quell’epoca muratura e «altro» fanno già il totale.</p>
        </>
      }
    >
      <ul className="hbars hbars--wide-label" aria-label="Edifici residenziali italiani per epoca di costruzione, divisi per materiale">
        {EPOCHE.map((e, i) => (
          <li key={e.id}>
            <span className="hbars__label">{e.nome}</span>
            <span className="hbars__track hbars__track--stack" aria-hidden="true">
              {MATERIALI.map((m) => (
                <span key={m.nome} style={{ width: `${(m.valori[i] / epocaMassima) * 100}%`, background: m.colore }} />
              ))}
            </span>
            <span className="hbars__value">{n(edificiPerEpoca[i])}</span>
            <span style={sottoRiga}>
              Fino a qui: {pct1(quotaCumulata[i])}
              {NORME[i] && (
                <>
                  {' · '}
                  <strong>{NORME[i]}</strong>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="chart-legend">
        {MATERIALI.map((m) => (
          <LegendItem key={m.nome} kind="bar" color={m.colore}>
            {m.nome}
          </LegendItem>
        ))}
      </p>
    </Figure>
  );
}

/* ---------- B. La scala dei quattro stati limite (schema) ---------- */

const SCHEDA: Record<StatoId, { livello: number; danno: string; casa: string }> = {
  SLO: {
    livello: 1,
    danno: 'Nessun danno e nessuna interruzione d’uso significativi.',
    casa: 'Per una casa non è richiesta: vale per scuole e opere strategiche.',
  },
  SLD: {
    livello: 2,
    danno: 'Danni che non mettono a rischio chi c’è dentro. L’edificio si può usare subito, anche se qualche apparecchiatura si ferma.',
    casa: 'Per una casa si controlla la rigidezza.',
  },
  SLV: {
    livello: 3,
    danno: 'Rotture e crolli di parti non strutturali e impianti, danni importanti alla struttura. Resta un margine di sicurezza contro il crollo.',
    casa: 'Per una casa si controlla la resistenza e, dove richiesto, la duttilità.',
  },
  SLC: {
    livello: 4,
    danno: 'Danni molto gravi alla struttura. Resta solo un piccolo margine contro il crollo.',
    casa: 'Si controlla solo in alcuni casi, e solo per la duttilità.',
  },
};

const NOME_CLASSE = {
  II: 'Una casa (classe II)',
  III: 'Una scuola (classe III)',
  IV: 'Un’opera strategica per le emergenze (classe IV)',
} as const;

export function LimitStatesLadder() {
  return (
    <Figure
      title="Quattro scosse di progetto, quattro richieste all’edificio"
      caption={
        <>
          Schema delle prestazioni che le norme chiedono a un edificio nuovo: scendendo, la scossa è più forte e più rara, e il
          danno ammesso cresce. I quadretti indicano solo l’ordine, non misurano il danno. La percentuale è la probabilità che,
          nel luogo dell’edificio, quella scossa venga superata in 50 anni: vale per una casa. Per scuole e opere strategiche la
          stessa percentuale si riferisce a un periodo più lungo, quindi a una scossa più forte. Il periodo di ritorno è una
          media: 475 anni non vuol dire che la scossa arrivi puntuale ogni 475 anni. Può capitare prima, o non capitare per molto
          più tempo. Queste sono richieste di progetto per le costruzioni nuove: non descrivono com’è fatto un edificio esistente.
        </>
      }
      source={NTC_SRC}
      sourceHref={NTC_URL}
    >
      <ol className="hbars hbars--wide-label" aria-label="I quattro stati limite, dal meno grave al più grave">
        {STATI.map((s) => {
          const d = SCHEDA[s.id];
          return (
            <li key={s.id}>
              <span className="hbars__label">
                {s.nome} ({s.id})
              </span>
              <span className="hbars__track hbars__track--stack" aria-hidden="true">
                {[1, 2, 3, 4].map((k) => (
                  <span
                    key={k}
                    style={{
                      width: '25%',
                      borderRight: k < 4 ? '2px solid var(--surface)' : undefined,
                      background: k <= d.livello ? `color-mix(in srgb, var(--chart-2) ${25 + k * 18}%, var(--surface))` : 'transparent',
                    }}
                  />
                ))}
              </span>
              <span className="hbars__value">{Math.round(s.pvr * 100)}% in 50 anni</span>
              <span style={sottoRiga}>
                {d.danno} <strong>{d.casa}</strong>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="small strong">Periodo di ritorno della scossa di progetto, in anni</p>
      <div className="table-wrap">
        <table className="data-table">
          <caption className="visually-hidden">Periodi di ritorno per classe d’uso e stato limite, con vita nominale di 50 anni</caption>
          <thead>
            <tr>
              <th scope="col" style={th}>Edificio</th>
              {STATI.map((s) => (
                <th key={s.id} scope="col" className="num" style={th}>
                  {s.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODI.map((p) => (
              <tr key={p.classe}>
                <th scope="row">{NOME_CLASSE[p.classe]}</th>
                {STATI.map((s) => (
                  <td key={s.id} className="num">
                    {n(p.tr[s.id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted">
        Con una vita nominale di 50 anni, il valore delle costruzioni ordinarie. Il periodo di riferimento è la vita nominale per
        il coefficiente d’uso: {PERIODI.map((p) => `${p.vr} anni per la classe ${p.classe}`).join(', ')}.
      </p>
    </Figure>
  );
}

/* ---------- C. Gli edifici c'erano già ---------- */

const RIGHE_C: { nome: string; gruppo: Gruppo; colore: string }[] = [
  { nome: 'Non classificati, poi zona 2', gruppo: ncZona2, colore: 'var(--chart-2)' },
  { nome: 'Non classificati, poi zona 3', gruppo: ncZona3, colore: 'var(--chart-2)' },
  { nome: 'Non classificati, poi zona 4', gruppo: ncZona4, colore: 'var(--chart-2)' },
  { nome: 'Già classificati nel 1984', gruppo: classificati, colore: 'var(--chart-1)' },
];

export function BeforeClassificationBars() {
  return (
    <Figure
      title="Quando il comune è entrato in una zona, gli edifici c’erano già"
      caption={
        <>
          Quota di edifici residenziali costruiti prima del 2001, cioè prima dell’ordinanza del 2003, nei comuni che i decreti
          fino al 1984 non classificavano, divisi per la zona ricevuta nel 2003. In blu, per confronto, i comuni già classificati:
          l’età degli edifici è simile nei due gruppi. Anche lì, però, molti edifici possono essere più vecchi della classificazione:
          il grafico dice quanti edifici c’erano già, non con quali regole è stato costruito ciascuno. Non dice che siano insicuri,
          e non dice nulla di un singolo edificio: per quello serve la verifica di un tecnico abilitato.
        </>
      }
      source="ISTAT, Censimento 2011 (CC BY 4.0), e OPCM 3274/2003, Allegato A (copia INGV); unione dei due elenchi: calcolo di Quake Italia"
      sourceHref={antisismicaData.fonti.opcm3274.url}
      table={
        <>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="visually-hidden">Età degli edifici residenziali secondo la classificazione del comune</caption>
              <thead>
                <tr>
                  <th scope="col" style={th}>Comuni</th>
                  <th scope="col" className="num" style={th}>Quanti</th>
                  <th scope="col" className="num" style={th}>Edifici</th>
                  <th scope="col" className="num" style={th}>Prima del 1981</th>
                  <th scope="col" className="num" style={th}>Prima del 2001</th>
                </tr>
              </thead>
              <tbody>
                {RIGHE_C.map((r) => (
                  <tr key={r.nome}>
                    <th scope="row">{r.nome}</th>
                    <td className="num">{n(r.gruppo.comuni)}</td>
                    <td className="num">{n(r.gruppo.edifici)}</td>
                    <td className="num">{pct1(quotaPrima1981(r.gruppo))}</td>
                    <td className="num">{pct1(quotaPrima2001(r.gruppo))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            I due elenchi usano codici di anni diversi (2001 e 2011). Li abbiamo uniti per codice e nome: {n(unione.uniti)} comuni
            su {n(unione.comuniIstat)}. Restano fuori {unione.nonUnitiIstat.length} comuni nati o fusi dopo il 2001 (
            {n(unione.edificiNonUniti)} edifici, il {pct1(quotaEdificiNonUniti)}). La Campania aveva già un elenco regionale nel 2002:
            senza i suoi comuni la quota dei non classificati cambia di {(differenzaSenzaCampania * 100).toFixed(2).replace('.', ',')} punti percentuali.
          </p>
        </>
      }
    >
      <ul className="hbars hbars--wide-label" aria-label="Quota di edifici costruiti prima del 2001, per classificazione del comune">
        {RIGHE_C.map((r) => {
          const q = quotaPrima2001(r.gruppo);
          return (
            <li key={r.nome}>
              <span className="hbars__label">{r.nome}</span>
              <span className="hbars__track" aria-hidden="true">
                <span style={{ width: `${q * 100}%`, background: r.colore }} />
              </span>
              <span className="hbars__value">{pct1(q)}</span>
              <span style={sottoRiga}>
                {n(r.gruppo.comuni)} comuni, {n(r.gruppo.edifici)} edifici
              </span>
            </li>
          );
        })}
      </ul>
    </Figure>
  );
}
