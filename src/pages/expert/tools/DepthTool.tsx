import { useMemo, useState } from 'react';
import { ChartFrame, type TooltipState } from '../../../components/charts/ChartFrame';
import { linear, niceTicks } from '../../../components/charts/scales';
import { histogram } from '../../../lib/stats';
import { formatInt } from '../../../lib/format';
import type { ToolProps } from '../registry';

const ROW = 26; // barra da 22px + 2px di spazio sopra e sotto
const BAR = 22;
const M = { top: 8, right: 56, bottom: 36, left: 88 };

/** Classi fitte vicino alla superficie (dove avviene quasi tutto), larghe in profondità. */
const EDGES = [0, 2, 4, 6, 8, 10, 12, 15, 20, 25, 30, 40, 60, 100, 200, 300, 700];

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export default function DepthTool({ quakes, refreshing }: ToolProps) {
  const [tip, setTip] = useState<TooltipState | null>(null);
  const depths = useMemo(() => quakes.map((q) => Math.max(0, q.depthKm)), [quakes]);
  const maxDepth = depths.reduce((a, b) => Math.max(a, b), 0);
  const bins = useMemo(() => histogram(depths, EDGES), [depths]);
  const maxCount = bins.reduce((a, b) => Math.max(a, b.count), 0);
  const shallow = depths.filter((d) => d < 10).length;
  const height = M.top + M.bottom + bins.length * ROW;

  return (
    <div className="stack-lg">
      <div className="stat-row">
        <div className="stat">
          <span className="stat__label">Profondità mediana</span>
          <span className="stat__value">{median(depths).toFixed(1).replace('.', ',')} km</span>
        </div>
        <div className="stat">
          <span className="stat__label">Evento più profondo</span>
          <span className="stat__value">{Math.round(maxDepth)} km</span>
        </div>
        <div className="stat">
          <span className="stat__label">Entro 10 km di profondità</span>
          <span className="stat__value">{Math.round((shallow / depths.length) * 100)}%</span>
        </div>
      </div>

      <ChartFrame
        title="Numero di eventi per profondità"
        summary={`${depths.length} eventi. Profondità mediana ${median(depths).toFixed(1)} km, massima ${Math.round(maxDepth)} km.`}
        height={height}
        dim={refreshing}
        tooltip={tip}
      >
        {(width) => {
          const x = linear([0, maxCount], [M.left, width - M.right]);
          return (
            <svg width={width} height={height} role="img" aria-label="Istogramma delle profondità">
              <g className="grid">
                {niceTicks(0, maxCount, Math.max(2, Math.floor(width / 120))).map((v) => (
                  <g key={v}>
                    <line x1={x(v)} x2={x(v)} y1={M.top} y2={height - M.bottom} />
                    <text className="axis-label" x={x(v)} y={height - M.bottom + 18} textAnchor="middle">
                      {formatInt(v)}
                    </text>
                  </g>
                ))}
              </g>
              <text className="axis-title" x={(M.left + width - M.right) / 2} y={height - 4} textAnchor="middle">
                Numero di eventi
              </text>
              {bins.map((b, i) => {
                const yTop = M.top + i * ROW + (ROW - BAR) / 2;
                const w = Math.max(0, x(b.count) - M.left);
                const r = Math.min(4, w, BAR / 2);
                const label = `${b.from}–${b.to} km`;
                const show = () =>
                  setTip({
                    x: M.left + w / 2,
                    y: yTop - 6,
                    content: (
                      <>
                        <span className="chart-tooltip__value">{formatInt(b.count)} eventi</span>
                        <span>{label} di profondità</span>
                      </>
                    ),
                  });
                return (
                  <g key={b.from}>
                    <text className="axis-label" x={M.left - 8} y={yTop + BAR / 2} dy="0.32em" textAnchor="end">
                      {label}
                    </text>
                    {w > 0 && (
                      <path
                        d={`M${M.left},${yTop}H${M.left + w - r}Q${M.left + w},${yTop} ${M.left + w},${yTop + r}V${yTop + BAR - r}Q${M.left + w},${yTop + BAR} ${M.left + w - r},${yTop + BAR}H${M.left}Z`}
                        fill="var(--chart-1)"
                      />
                    )}
                    <text className="value-label" x={M.left + w + 6} y={yTop + BAR / 2} dy="0.32em">
                      {formatInt(b.count)}
                    </text>
                    <rect
                      x={M.left}
                      y={M.top + i * ROW}
                      width={width - M.left - M.right}
                      height={ROW}
                      fill="transparent"
                      tabIndex={0}
                      aria-label={`${label}: ${b.count} eventi`}
                      onPointerEnter={show}
                      onFocus={show}
                      onPointerLeave={() => setTip(null)}
                      onBlur={() => setTip(null)}
                    />
                  </g>
                );
              })}
              <line className="baseline" x1={M.left} x2={M.left} y1={M.top} y2={height - M.bottom} />
            </svg>
          );
        }}
      </ChartFrame>
    </div>
  );
}
