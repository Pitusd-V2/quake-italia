/**
 * Figure dell'articolo «Come l’INGV trova un terremoto».
 * Dati: catalogo INGV (src/data/learn/localizzazione.json, da scripts/build-location-data.mjs).
 */
import { useWidth, LegendItem } from '../components/charts/ChartFrame';
import { linear } from '../components/charts/scales';
import { Figure } from './figures';
import { arrivi, bollettino, d1, esempio, int, locData, localizzazioni, stat, tensore, type Localizzazione } from './facts/localizzazione';

const INGV_SRC = 'INGV, catalogo dei terremoti (tutte le localizzazioni e gli arrivi delle onde, richiesta FDSN)';

/** «dopo 19 secondi», «dopo 12 minuti», «dopo 44 ore». */
export function quando(s: number) {
  if (s < 90) return `dopo ${s} secondi`;
  if (s < 5400) return `dopo ${Math.round(s / 60)} minuti`;
  return `dopo ${Math.round(s / 3600)} ore`;
}

const CHI: Record<string, string> = {
  automatica: 'calcolo automatico',
  sala: 'sismologi della sala di sorveglianza',
  bollettino: 'Bollettino Sismico Italiano',
};

function etichetta(l: Localizzazione, maiuscola = false) {
  const testo = `${quando(l.dopoSecondi)}: ${CHI[l.tipo] ?? l.tipo}${l.stazioni ? `, ${l.stazioni} stazioni` : ''}`;
  return maiuscola ? testo[0].toUpperCase() + testo.slice(1) : testo;
}

/* ---------- Una scossa, cinque localizzazioni ---------- */

export function LocationStepsChart() {
  const top = 36;
  return (
    <Figure
      title="Pietrapaola, 1° agosto 2024: come cambia la localizzazione"
      caption={
        <>
          Ogni barra è una localizzazione della stessa scossa, nell’ordine in cui è stata calcolata; la lunghezza è la
          profondità. La linea verticale è la profondità finale del Bollettino Sismico Italiano ({d1(bollettino.profKm)} km).
          L’epicentro, intanto, si è spostato al massimo di {d1(Math.max(...localizzazioni.map((l) => l.spostamentoKm)))} km.
        </>
      }
      source={INGV_SRC}
      sourceHref={esempio.richiesta}
      table={
        <p>
          {localizzazioni
            .map(
              (l) =>
                `${etichetta(l, true)}; profondità ${d1(l.profKm)} km${l.profIncKm ? ` (± ${d1(l.profIncKm)})` : ''}, epicentro a ${d1(l.spostamentoKm)} km da quello finale`,
            )
            .join('. ')}
          . Nel catalogo ci sono anche {tensore.length} stime della profondità fatte con il tensore momento, un metodo diverso (
          {tensore.map((t) => `${d1(t.profKm)} km`).join(' e ')}): non sono nel grafico. Ora della scossa: {esempio.tempo.slice(11, 19)}{' '}
          UTC.
        </p>
      }
    >
      <ul className="hbars hbars--ref hbars--wide-label" aria-label="Profondità calcolata a ogni localizzazione della scossa di Pietrapaola">
        {localizzazioni.map((l) => (
          <li key={`${l.tipo}-${l.dopoSecondi}`}>
            <span className="hbars__label">{etichetta(l, true)}</span>
            <span className="hbars__track" aria-hidden="true">
              <span style={{ width: `${(l.profKm / top) * 100}%` }} />
              <i className="hbars__ref" style={{ left: `${(bollettino.profKm / top) * 100}%` }} />
            </span>
            <span className="hbars__value">{d1(l.profKm)} km</span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/* ---------- Le dromocrone: quando arrivano le onde, stazione per stazione ---------- */

export function TravelTimeChart() {
  const { ref, width } = useWidth<HTMLDivElement>();
  const H = 300;
  const M = { top: 12, right: 14, bottom: 42, left: 44 };
  const maxKm = Math.ceil(Math.max(...arrivi.map((a) => a.km)) / 100) * 100;
  const maxS = Math.ceil(Math.max(...arrivi.map((a) => Math.max(a.P ?? 0, a.S ?? 0))) / 10) * 10;
  const p = arrivi.filter((a) => a.P !== null);
  const s = arrivi.filter((a) => a.S !== null);
  return (
    <Figure
      title="Quando arrivano le onde: stazione per stazione"
      caption={
        <>
          Ogni punto è una stazione che ha registrato la scossa di Pietrapaola: in orizzontale la distanza dall’epicentro, in
          verticale quanti secondi dopo la scossa sono arrivate le onde. In blu le onde P ({p.length} stazioni), in arancione
          le onde S ({s.length} stazioni, le più vicine). Più la stazione è lontana, più le onde arrivano tardi, e più cresce il
          distacco tra le due: è il «lampo e tuono» dei terremoti. I sismologi chiamano queste curve <em>dromocrone</em>.
        </>
      }
      source={INGV_SRC}
      sourceHref={esempio.richiesta}
      table={
        <p>
          Arrivi usati dal Bollettino Sismico Italiano (secondi dopo la scossa):{' '}
          {s.map((a) => `${a.stazione} a ${int(a.km)} km, P ${d1(a.P ?? 0)} e S ${d1(a.S ?? 0)}`).join('; ')}. Le altre{' '}
          {p.length - s.length} stazioni hanno solo l’arrivo dell’onda P.
        </p>
      }
    >
      <div ref={ref} className="learn-chart">
        {width > 0 &&
          (() => {
            const x = linear([0, maxKm], [M.left, width - M.right]);
            const y = linear([0, maxS], [H - M.bottom, M.top]);
            const kmTicks = Array.from({ length: maxKm / 100 + 1 }, (_, i) => i * 100).filter((v) => width > 480 || v % 200 === 0);
            const sTicks = Array.from({ length: maxS / 20 + 1 }, (_, i) => i * 20);
            return (
              <svg width={width} height={H} role="img" aria-label="Grafico a punti: secondi di arrivo delle onde P e S in funzione della distanza delle stazioni">
                <g className="grid">
                  {sTicks.map((v) => (
                    <g key={v}>
                      <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} strokeDasharray={v === 0 ? undefined : '2 3'} />
                      <text className="axis-label" x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
                        {v} s
                      </text>
                    </g>
                  ))}
                </g>
                {p.map((a) => (
                  <circle key={`p-${a.stazione}`} cx={x(a.km)} cy={y(a.P ?? 0)} r={2.6} fill="var(--chart-1)" opacity={0.8}>
                    <title>{`${a.stazione}: ${int(a.km)} km, onda P dopo ${d1(a.P ?? 0)} s`}</title>
                  </circle>
                ))}
                {s.map((a) => (
                  <circle key={`s-${a.stazione}`} cx={x(a.km)} cy={y(a.S ?? 0)} r={3.6} fill="var(--chart-2)" stroke="var(--surface)" strokeWidth={1}>
                    <title>{`${a.stazione}: ${int(a.km)} km, onda S dopo ${d1(a.S ?? 0)} s`}</title>
                  </circle>
                ))}
                <g className="axis">
                  <line x1={M.left} x2={width - M.right} y1={H - M.bottom} y2={H - M.bottom} />
                  {kmTicks.map((v) => (
                    <text key={v} x={x(v)} y={H - M.bottom + 18} textAnchor="middle">
                      {v} km
                    </text>
                  ))}
                </g>
              </svg>
            );
          })()}
      </div>
      <p className="chart-legend">
        <LegendItem kind="dot" color="var(--chart-1)">
          Onde P (prime)
        </LegendItem>
        <LegendItem kind="dot" color="var(--chart-2)">
          Onde S (seconde)
        </LegendItem>
      </p>
    </Figure>
  );
}

/* ---------- Due anni di scosse: di quanto cambiano le prime stime ---------- */

export function ShiftChart() {
  const rows = [
    { label: `Epicentro, stima automatica (circa ${int(stat.auto.secondi / 60)} minuti dopo)`, meta: stat.auto.epiMeta, nove: stat.auto.epi9 },
    { label: `Profondità, stima automatica (circa ${int(stat.auto.secondi / 60)} minuti dopo)`, meta: stat.auto.profMeta, nove: stat.auto.prof9 },
    { label: 'Epicentro, dopo la revisione dei sismologi', meta: stat.sala.epiMeta, nove: stat.sala.epi9 },
    { label: 'Profondità, dopo la revisione dei sismologi', meta: stat.sala.profMeta, nove: stat.sala.prof9 },
  ];
  const top = Math.max(...rows.map((r) => r.nove)) * 1.05;
  const p = stat.prima;
  return (
    <Figure
      title={`${stat.confrontate} scosse del ${locData.statistica.anni.join(' e del ')}: quanto erano vicine le prime stime`}
      caption={
        <>
          Di quanti chilometri le localizzazioni dei primi minuti erano lontane da quella finale del Bollettino Sismico Italiano,
          per le scosse di magnitudo {locData.statistica.magnitudoMinima} o più in Italia e nei mari vicini già riviste dal
          Bollettino. La barra scura arriva al valore «di metà» (per metà delle scosse la differenza era minore); quella chiara
          al valore entro cui stanno 9 scosse su 10. Nella stima automatica la profondità è il dato più debole; dopo la revisione
          dei sismologi, epicentro e profondità sono di solito entro un paio di chilometri.
        </>
      }
      source="Calcolo di Quake Italia sul catalogo INGV (richieste FDSN)"
      sourceHref={locData.statistica.richieste[0]}
      table={
        <p>
          Stima automatica, l’ultima prima della revisione ({stat.auto.n} scosse; di solito {int(stat.auto.secondi)} secondi dopo
          la scossa, con {int(stat.auto.stazioni)} stazioni): epicentro entro {d1(stat.auto.epiMeta)} km per metà delle scosse ed
          entro {d1(stat.auto.epi9)} km per 9 su 10; profondità entro {d1(stat.auto.profMeta)} e {d1(stat.auto.prof9)} km.
          Revisione della sala di sorveglianza ({stat.sala.n} scosse; nel database, di solito {int(stat.sala.secondi / 60)} minuti
          dopo la scossa): epicentro entro {d1(stat.sala.epiMeta)} e {d1(stat.sala.epi9)} km; profondità entro{' '}
          {d1(stat.sala.profMeta)} e {d1(stat.sala.prof9)} km. La primissima stima automatica ({int(p.secondi)} secondi dopo, con{' '}
          {int(p.stazioni)} stazioni): epicentro entro {d1(p.epiMeta)} e {d1(p.epi9)} km, profondità entro {d1(p.profMeta)} e{' '}
          {d1(p.prof9)} km. Scosse nell’elenco: {stat.scosse}; le altre non sono ancora state riviste dal Bollettino.
        </p>
      }
    >
      <ul className="hbars hbars--wide-label" aria-label="Differenza tra prime localizzazioni e localizzazione finale, in chilometri">
        {rows.map((r) => (
          <li key={r.label}>
            <span className="hbars__label">{r.label}</span>
            <span className="hbars__track hbars__track--range" aria-hidden="true">
              <span className="hbars__soft" style={{ width: `${(r.nove / top) * 100}%` }} />
              <span style={{ width: `${(r.meta / top) * 100}%` }} />
            </span>
            <span className="hbars__value">
              {d1(r.meta)} km · 9 su 10: {d1(r.nove)}
            </span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}
