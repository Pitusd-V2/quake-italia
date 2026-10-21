import { useId, useMemo, useState } from 'react';
import { ChartFrame, LegendItem, type TooltipState } from '../../../components/charts/ChartFrame';
import { fmtCompact, fmtNum, linear, log10, logTicks, niceTicks } from '../../../components/charts/scales';
import { bValue, completenessMaxc, frequencyMagnitude } from '../../../lib/stats';
import { formatInt, formatMag } from '../../../lib/format';
import type { ToolProps } from '../registry';

const H = 340;
const M = { top: 20, right: 20, bottom: 44, left: 52 };

export default function MagnitudeTool({ quakes, refreshing }: ToolProps) {
  const bins = useMemo(() => frequencyMagnitude(quakes), [quakes]);
  const autoMc = useMemo(() => completenessMaxc(bins), [bins]);
  const [mcText, setMcText] = useState('');
  const mcInput = Number(mcText.replace(',', '.'));
  const mc = mcText.trim() !== '' && Number.isFinite(mcInput) ? mcInput : autoMc;
  const fit = useMemo(() => (mc == null ? null : bValue(quakes, mc)), [quakes, mc]);
  const [tip, setTip] = useState<TooltipState | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const mcId = useId();

  if (bins.length < 3) return <p className="empty">Servono più eventi, con magnitudo diverse, per questo grafico.</p>;

  const maxCum = bins[0].cumulative;
  const m0 = bins[0].mag - 0.1;
  const m1 = bins[bins.length - 1].mag + 0.1;

  return (
    <div className="stack-lg">
      <div className="stat-row">
        <div className="stat">
          <span className="stat__label">b-value</span>
          <span className="stat__value">{fit ? `${fmtNum(fit.b, 2)} ± ${fmtNum(fit.sigma, 2)}` : '—'}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Magnitudo di completezza (Mc)</span>
          <span className="stat__value">{mc != null ? formatMag(mc) : '—'}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Eventi con M ≥ Mc</span>
          <span className="stat__value">{fit ? formatInt(fit.n) : '—'}</span>
        </div>
        <div className="stat">
          <span className="stat__label">a-value</span>
          <span className="stat__value">{fit ? fmtNum(fit.a, 2) : '—'}</span>
        </div>
      </div>
      {!fit && (
        <p className="muted">
          Servono almeno 30 eventi sopra la magnitudo di completezza per stimare il b-value in modo affidabile.
        </p>
      )}

      <ChartFrame
        title="Distribuzione frequenza-magnitudo"
        summary={`Classi di magnitudo da ${formatMag(bins[0].mag)} a ${formatMag(bins[bins.length - 1].mag)}. ${fit ? `b-value ${fmtNum(fit.b, 2)} più o meno ${fmtNum(fit.sigma, 2)}, magnitudo di completezza ${formatMag(fit.mc)}.` : ''}`}
        height={H}
        dim={refreshing}
        tooltip={tip}
        legend={
          <span className="chart-legend">
            <LegendItem kind="bar" color="var(--chart-2)">
              Eventi per classe (0,1)
            </LegendItem>
            <LegendItem kind="dot" color="var(--chart-1)">
              Eventi con M ≥ valore (cumulativo)
            </LegendItem>
            {fit && (
              <LegendItem kind="line" color="var(--chart-fit)">
                Retta di Gutenberg-Richter
              </LegendItem>
            )}
          </span>
        }
      >
        {(width) => {
          const x = linear([m0, m1], [M.left, width - M.right]);
          const y = log10([0.8, maxCum * 1.3], [H - M.bottom, M.top]);
          const slot = x(m0 + 0.1) - x(m0);
          const barW = Math.max(1, Math.min(24, slot - 2));
          const base = y(0.8);
          const show = (b: (typeof bins)[number]) => {
            setHover(b.mag);
            setTip({
              x: x(b.mag),
              y: Math.min(y(b.cumulative), y(Math.max(b.count, 0.8))) - 12,
              content: (
                <>
                  <span className="chart-tooltip__value">M {formatMag(b.mag)}</span>
                  <span>
                    {formatInt(b.count)} nella classe · {formatInt(b.cumulative)} con M ≥ {formatMag(b.mag)}
                  </span>
                </>
              ),
            });
          };
          return (
            <svg width={width} height={H} role="img" aria-label="Grafico di Gutenberg-Richter in scala logaritmica">
              <g className="grid">
                {logTicks(1, maxCum * 1.3).map((v) => (
                  <g key={v}>
                    <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} />
                    <text className="axis-label" x={M.left - 8} y={y(v)} dy="0.32em" textAnchor="end">
                      {fmtCompact(v)}
                    </text>
                  </g>
                ))}
              </g>
              <g className="axis">
                <line x1={M.left} x2={width - M.right} y1={H - M.bottom} y2={H - M.bottom} />
                {niceTicks(m0, m1, Math.max(3, Math.floor(width / 70))).map((v) => (
                  <text key={v} x={x(v)} y={H - M.bottom + 20} textAnchor="middle">
                    {formatMag(v)}
                  </text>
                ))}
                <text className="axis-title" x={(M.left + width - M.right) / 2} y={H - 4} textAnchor="middle">
                  Magnitudo
                </text>
              </g>

              {/* Colonne: numero per classe. Arrotondate sopra, piatte sulla base. */}
              {bins.map((b) => {
                if (!b.count) return null;
                const top = y(b.count);
                const h = base - top;
                const r = Math.min(4, barW / 2, h);
                const left = x(b.mag) - barW / 2;
                return (
                  <path
                    key={`c${b.mag}`}
                    d={`M${left},${base}V${top + r}Q${left},${top} ${left + r},${top}H${left + barW - r}Q${left + barW},${top} ${left + barW},${top + r}V${base}Z`}
                    fill="var(--chart-2)"
                    opacity={hover === null || hover === b.mag ? 0.9 : 0.45}
                  />
                );
              })}

              {/* Retta di G-R: log10 N = a - b M, dalla Mc in su. */}
              {fit && (
                <line
                  x1={x(fit.mc)}
                  y1={y(10 ** (fit.a - fit.b * fit.mc))}
                  x2={x(m1)}
                  y2={y(Math.max(0.8, 10 ** (fit.a - fit.b * m1)))}
                  stroke="var(--chart-fit)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              )}

              {/* Punti: cumulativo. */}
              {bins.map((b) => (
                <circle key={`p${b.mag}`} cx={x(b.mag)} cy={y(b.cumulative)} r={4.5} fill="var(--chart-1)" stroke="var(--surface)" strokeWidth={2} />
              ))}

              {mc != null && (
                <g className="mc-marker">
                  <line x1={x(mc)} x2={x(mc)} y1={M.top} y2={H - M.bottom} />
                  <text x={x(mc) + 6} y={M.top + 12}>
                    Mc {formatMag(mc)}
                  </text>
                </g>
              )}
              {fit && (
                <text className="direct-label" x={width - M.right} y={M.top + 12} textAnchor="end">
                  b = {fmtNum(fit.b, 2)}
                </text>
              )}

              {/* Aree di aggancio larghe quanto la classe, anche da tastiera. */}
              {bins.map((b) => (
                <rect
                  key={`h${b.mag}`}
                  x={x(b.mag) - slot / 2}
                  y={M.top}
                  width={slot}
                  height={H - M.top - M.bottom}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`Magnitudo ${formatMag(b.mag)}: ${b.count} eventi nella classe, ${b.cumulative} con magnitudo uguale o superiore`}
                  onPointerEnter={() => show(b)}
                  onFocus={() => show(b)}
                  onPointerLeave={() => {
                    setHover(null);
                    setTip(null);
                  }}
                  onBlur={() => {
                    setHover(null);
                    setTip(null);
                  }}
                />
              ))}
            </svg>
          );
        }}
      </ChartFrame>

      <div className="form-grid">
        <div className="field">
          <label htmlFor={mcId} className="field__label">
            Mc personalizzata
          </label>
          <input
            id={mcId}
            className="input"
            inputMode="decimal"
            placeholder={autoMc != null ? `automatica: ${formatMag(autoMc)}` : ''}
            value={mcText}
            onChange={(e) => setMcText(e.target.value)}
          />
          <p className="field__help">Lascia vuoto per la stima automatica (massima curvatura + 0,2).</p>
        </div>
      </div>

      <details className="card details">
        <summary>Come sono calcolati questi valori</summary>
        <div className="stack-sm">
          <p>
            <span className="strong">Mc</span>: metodo della massima curvatura (classe con più eventi) più una correzione di
            +0,2 (Woessner &amp; Wiemer, 2005).
          </p>
          <p>
            <span className="strong">b-value</span>: stima di massima verosimiglianza di Aki (1965) con la correzione di Utsu per
            magnitudo arrotondate a 0,1: b = log₁₀e / (M̄ − (Mc − 0,05)). Incertezza secondo Shi &amp; Bolt (1982).
          </p>
          <p>
            Il catalogo mescola tipi di magnitudo diversi (ML, Mw, Md): per studi seri filtra per tipo e periodo omogeneo.
          </p>
        </div>
      </details>
    </div>
  );
}
