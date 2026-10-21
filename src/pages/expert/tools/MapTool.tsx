import { lazy, Suspense, useState } from 'react';
import { DEPTH_STOPS, type ColorBy } from '../../../components/QuakeMap';
import { MapLegend } from '../../QuakesPage';
import { Segmented } from '../../../components/ui';
import { useResolvedTheme } from '../../../state/settings';
import type { ToolProps } from '../registry';

const QuakeMap = lazy(() => import('../../../components/QuakeMap'));

function DepthLegend() {
  const theme = useResolvedTheme();
  const stops = DEPTH_STOPS[theme];
  const max = stops[stops.length - 1][0];
  // Scala non lineare sul piano (le profondità basse sono le più frequenti): posizioniamo i valori in modo uniforme.
  const gradient = stops.map(([, c], i) => `${c} ${(i / (stops.length - 1)) * 100}%`).join(', ');
  return (
    <div className="depth-legend" aria-label={`Colore per profondità: da 0 a ${max} km, più scuro = più profondo`}>
      <div className="depth-legend__bar" style={{ background: `linear-gradient(to right, ${gradient})` }} aria-hidden="true" />
      <div className="depth-legend__ticks tabular" aria-hidden="true">
        {stops.map(([d]) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <p className="small muted">Profondità in km ({theme === 'dark' ? 'più chiaro' : 'più scuro'} = più profondo)</p>
    </div>
  );
}

export default function MapTool({ quakes, home }: ToolProps) {
  const [colorBy, setColorBy] = useState<ColorBy>('depth');
  return (
    <div className="stack">
      <Segmented<ColorBy>
        legend="Colore dei cerchi"
        options={[
          { value: 'depth', label: 'Per profondità' },
          { value: 'level', label: 'Per magnitudo' },
        ]}
        value={colorBy}
        onChange={setColorBy}
      />
      <Suspense fallback={<div className="quake-map quake-map--loading">Sto caricando la mappa…</div>}>
        <QuakeMap quakes={quakes} home={home} colorBy={colorBy} focus="quakes" className="quake-map--page" />
      </Suspense>
      {colorBy === 'depth' ? <DepthLegend /> : <MapLegend />}
      <p className="small muted">La dimensione del cerchio indica sempre la magnitudo. Tocca un cerchio per i dettagli.</p>
    </div>
  );
}
