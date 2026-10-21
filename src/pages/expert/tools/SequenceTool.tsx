import { useMemo, useState, type PointerEvent } from 'react';
import { useNavigate } from 'react-router';
import { ChartFrame, type TooltipState } from '../../../components/charts/ChartFrame';
import { fmtCompact, linear, niceTicks, timeTicks, type Scale } from '../../../components/charts/scales';
import { placeText } from '../../../lib/describe';
import { formatFull, formatInt, formatMag } from '../../../lib/format';
import type { Quake } from '../../../lib/types';
import type { ToolProps } from '../registry';

const M = { top: 16, right: 20, bottom: 36, left: 48 };
const H_SCATTER = 300;
const H_CUM = 200;
const HIT_PX = 24;

function useTimeDomain(quakes: Quake[], start: Date, end?: Date): [number, number] {
  return useMemo(() => {
    const times = quakes.map((q) => q.time.getTime());
    const t0 = times.reduce((a, b) => Math.min(a, b), start.getTime());
    const t1 = times.reduce((a, b) => Math.max(a, b), end?.getTime() ?? Date.now());
    return [t0, t1];
  }, [quakes, start, end]);
}

function TimeAxis({ x, height, width }: { x: Scale; height: number; width: number }) {
  const ticks = timeTicks(x.domain[0], x.domain[1], Math.max(2, Math.floor(width / 110)));
  return (
    <g className="axis">
      <line x1={M.left} x2={width - M.right} y1={height - M.bottom} y2={height - M.bottom} />
      {ticks.map((t) => (
        <text key={t.t} x={x(t.t)} y={height - M.bottom + 20} textAnchor="middle">
          {t.label}
        </text>
      ))}
    </g>
  );
}

function MagnitudeScatter({ quakes, domain, dim }: { quakes: Quake[]; domain: [number, number]; dim: boolean }) {
  const navigate = useNavigate();
  const [tip, setTip] = useState<TooltipState | null>(null);
  const [hover, setHover] = useState<Quake | null>(null);
  const yMin = Math.floor(quakes.reduce((m, q) => Math.min(m, q.mag), Infinity));
  const yMax = Math.ceil(quakes.reduce((m, q) => Math.max(m, q.mag), -Infinity) + 0.1);
  const strongest = quakes.reduce((a, b) => (b.mag > a.mag ? b : a));
  const dense = quakes.length > 600;

  return (
    <ChartFrame
      title="Magnitudo nel tempo"
      summary={`${quakes.length} eventi. Il più forte: magnitudo ${formatMag(strongest.mag)} il ${formatFull(strongest.time)}, ${strongest.place}.`}
      height={H_SCATTER}
      dim={dim}
      tooltip={tip}
    >
      {(width) => {
        const x = linear(domain, [M.left, width - M.right]);
        const y = linear([yMin, yMax], [H_SCATTER - M.bottom, M.top]);
        const pts = quakes.map((q) => ({ q, px: x(q.time.getTime()), py: y(q.mag) }));
        const onMove = (e: PointerEvent<SVGRectElement>) => {
          const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
          const mx = e.clientX - r.left;
          const my = e.clientY - r.top;
          let best: (typeof pts)[number] | null = null;
          let bestD = HIT_PX * HIT_PX;
          for (const p of pts) {
            const d = (p.px - mx) ** 2 + (p.py - my) ** 2;
            if (d < bestD) {
              bestD = d;
              best = p;
            }
          }
          setHover(best?.q ?? null);
          setTip(
            best
              ? {
                  x: best.px,
                  y: best.py - 12,
                  content: (
                    <>
                      <span className="chart-tooltip__value">M {formatMag(best.q.mag)}</span>
                      <span>{placeText(best.q.place).full}</span>
                      <span className="muted">{formatFull(best.q.time)}</span>
                    </>
                  ),
                }
              : null,
          );
        };
        return (
          <svg width={width} height={H_SCATTER} role="img" aria-label="Grafico: magnitudo degli eventi nel tempo">
            <g className="grid">
              {niceTicks(yMin, yMax, 5).map((v) => (
                <g key={v}>
                  <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} />
                  <text className="axis-label" x={M.left - 8} y={y(v)} dy="0.32em" textAnchor="end">
                    {formatMag(v)}
                  </text>
                </g>
              ))}
            </g>
            <TimeAxis x={x} height={H_SCATTER} width={width} />
            <g>
              {pts.map(({ q, px, py }) => (
                <circle
                  key={q.id}
                  cx={px}
                  cy={py}
                  r={4}
                  fill="var(--chart-1)"
                  fillOpacity={dense ? 0.7 : 0.9}
                  stroke="var(--surface)"
                  strokeWidth={dense ? 1 : 2}
                />
              ))}
            </g>
            {/* Etichetta diretta solo sul più forte. */}
            <text className="direct-label" x={x(strongest.time.getTime())} y={y(strongest.mag) - 10} textAnchor="middle">
              M {formatMag(strongest.mag)}
            </text>
            {hover && <circle cx={x(hover.time.getTime())} cy={y(hover.mag)} r={7} fill="none" stroke="var(--text)" strokeWidth={2} />}
            <rect
              x={M.left}
              y={M.top}
              width={width - M.left - M.right}
              height={H_SCATTER - M.top - M.bottom}
              fill="transparent"
              style={{ cursor: hover ? 'pointer' : 'default' }}
              onPointerMove={onMove}
              onPointerDown={onMove}
              onPointerLeave={() => {
                setTip(null);
                setHover(null);
              }}
              onClick={() => hover && navigate(`/terremoto/${hover.id}`)}
            />
            <text className="axis-title" x={12} y={M.top} transform={`rotate(-90 12 ${M.top})`} textAnchor="end">
              Magnitudo
            </text>
          </svg>
        );
      }}
    </ChartFrame>
  );
}

function CumulativeCount({ quakes, domain, dim }: { quakes: Quake[]; domain: [number, number]; dim: boolean }) {
  const [tip, setTip] = useState<TooltipState | null>(null);
  const [cross, setCross] = useState<number | null>(null);
  const sorted = useMemo(() => [...quakes].sort((a, b) => a.time.getTime() - b.time.getTime()), [quakes]);
  const n = sorted.length;

  return (
    <ChartFrame
      title="Numero cumulativo di eventi"
      summary={`In totale ${n} eventi nel periodo. Una salita ripida indica un aumento dell'attività.`}
      height={H_CUM}
      dim={dim}
      tooltip={tip}
    >
      {(width) => {
        const x = linear(domain, [M.left, width - M.right]);
        const y = linear([0, n], [H_CUM - M.bottom, M.top]);
        // Linea a gradini: ogni evento fa salire il conteggio di 1.
        let d = `M${x(domain[0])},${y(0)}`;
        sorted.forEach((q, i) => {
          const px = x(q.time.getTime());
          d += `H${px}V${y(i + 1)}`;
        });
        d += `H${x(domain[1])}`;
        const area = `${d}V${y(0)}H${x(domain[0])}Z`;
        const onMove = (e: PointerEvent<SVGRectElement>) => {
          const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
          const t = domain[0] + ((e.clientX - r.left - M.left) / (width - M.left - M.right)) * (domain[1] - domain[0]);
          // Ricerca binaria: quanti eventi prima di t.
          let lo = 0;
          let hi = n;
          while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (sorted[mid].time.getTime() <= t) lo = mid + 1;
            else hi = mid;
          }
          setCross(x(t));
          setTip({
            x: x(t),
            y: y(lo) - 12,
            content: (
              <>
                <span className="chart-tooltip__value">{formatInt(lo)} eventi</span>
                <span className="muted">fino al {formatFull(new Date(t))}</span>
              </>
            ),
          });
        };
        return (
          <svg width={width} height={H_CUM} role="img" aria-label="Grafico: numero cumulativo di eventi nel tempo">
            <g className="grid">
              {niceTicks(0, n, 4).map((v) => (
                <g key={v}>
                  <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} />
                  <text className="axis-label" x={M.left - 8} y={y(v)} dy="0.32em" textAnchor="end">
                    {fmtCompact(v)}
                  </text>
                </g>
              ))}
            </g>
            <TimeAxis x={x} height={H_CUM} width={width} />
            <path d={area} fill="var(--chart-1)" fillOpacity={0.1} />
            <path d={d} fill="none" stroke="var(--chart-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <text className="direct-label" x={width - M.right} y={y(n) - 8} textAnchor="end">
              {formatInt(n)}
            </text>
            {cross !== null && <line className="crosshair" x1={cross} x2={cross} y1={M.top} y2={H_CUM - M.bottom} />}
            <rect
              x={M.left}
              y={M.top}
              width={width - M.left - M.right}
              height={H_CUM - M.top - M.bottom}
              fill="transparent"
              onPointerMove={onMove}
              onPointerLeave={() => {
                setTip(null);
                setCross(null);
              }}
            />
          </svg>
        );
      }}
    </ChartFrame>
  );
}

export default function SequenceTool({ quakes, query, refreshing }: ToolProps) {
  const domain = useTimeDomain(quakes, query.start, query.end);
  return (
    <div className="stack-lg">
      <MagnitudeScatter quakes={quakes} domain={domain} dim={refreshing} />
      <CumulativeCount quakes={quakes} domain={domain} dim={refreshing} />
      <p className="small muted">Passa sopra un punto per i dettagli, toccalo per aprire l'evento. I valori sono anche nella scheda Tabella.</p>
    </div>
  );
}
