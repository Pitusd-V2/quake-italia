import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Larghezza del contenitore, aggiornata quando la finestra cambia dimensione. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Misura subito (il ResizeObserver risponde solo al prossimo disegno, che in una scheda
    // in background può tardare), poi resta in ascolto dei cambi di dimensione.
    setWidth(Math.floor(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

export interface TooltipState {
  x: number;
  y: number;
  content: ReactNode;
}

/** Riquadro del grafico: titolo, descrizione per i lettori di schermo, tooltip. */
export function ChartFrame({
  title,
  summary,
  legend,
  height,
  dim,
  tooltip,
  children,
}: {
  title: string;
  /** Frase che riassume il grafico (letta dai lettori di schermo). */
  summary: string;
  legend?: ReactNode;
  height: number;
  /** Durante un nuovo caricamento: il grafico resta, ma sbiadito. */
  dim?: boolean;
  tooltip: TooltipState | null;
  children: (width: number) => ReactNode;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  return (
    <figure className="chart">
      <figcaption className="chart__caption">
        <span className="chart__title">{title}</span>
        {legend}
      </figcaption>
      <div ref={ref} className="chart__plot" style={{ height, opacity: dim ? 0.5 : 1 }}>
        {width > 0 && children(width)}
        {tooltip && (
          <div
            className="chart-tooltip"
            role="status"
            style={{
              left: Math.min(Math.max(tooltip.x, 90), Math.max(90, width - 90)),
              top: tooltip.y,
            }}
          >
            {tooltip.content}
          </div>
        )}
      </div>
      <p className="visually-hidden">{summary}</p>
    </figure>
  );
}

export function LegendItem({ kind, color, children }: { kind: 'dot' | 'bar' | 'line'; color: string; children: ReactNode }) {
  return (
    <span className="chart-legend__item">
      <span className={`chart-legend__key chart-legend__key--${kind}`} style={{ background: color }} aria-hidden="true" />
      {children}
    </span>
  );
}
