/**
 * Rivedere una sequenza sulla mappa: i punti compaiono giorno dopo giorno, le tappe principali si fermano un attimo
 * con una frase. Si carica solo quando qualcuno lo chiede (la mappa e i dati pesano).
 * Non parte mai da solo: si avvia con un pulsante, si può fermare e spostare a mano.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { FeatureCollection } from 'geojson';
import { Map as MlMap, NavigationControl, setWorkerUrl, type ExpressionSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Il worker di MapLibre come file a parte (vedi QuakeMap).
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { formatInt } from '../lib/format';
import { useResolvedTheme } from '../state/settings';
import { ExternalLink, Segmented } from '../components/ui';
import { findMilestone, SEQUENCES, type SequenceData, type SequenceDef, type SequenceId } from './sequences';

setWorkerUrl(workerUrl);

const STYLE = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};
/** Palette dei grafici del sito: arancione per le scosse recenti, blu per quelle passate. */
const RECENT = '#eb6834';
const PAST = '#2a78d6';
/** Durata di una riproduzione completa, senza contare le pause sulle tappe. */
const PLAY_MS = 45_000;
const MILESTONE_PAUSE_MS = 2_600;

const dateFmt = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });

interface Prepared {
  data: SequenceData;
  start: number;
  total: number;
  geojson: FeatureCollection;
  /** Minuto di ogni tappa e indice della scossa corrispondente. */
  milestones: { t: number; index: number }[];
  bins: number[];
  /** Tempo (minuti) di ogni scossa, già ordinato: serve per contare quelle visibili. */
  times: number[];
}

function prepare(def: SequenceDef, data: SequenceData): Prepared {
  const start = Date.parse(data.inizio);
  const total = (Date.parse(data.fine) - start) / 60_000;
  const binMin = def.binDays * 1440;
  const bins = new Array(Math.ceil(total / binMin)).fill(0);
  for (const e of data.eventi) bins[Math.min(bins.length - 1, Math.floor(e[0] / binMin))]++;
  return {
    data,
    start,
    total,
    bins,
    times: data.eventi.map((e) => e[0]),
    geojson: {
      type: 'FeatureCollection',
      features: data.eventi.map((e, i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [e[2] / 1000, e[1] / 1000] },
        properties: { i, t: e[0], mag: e[4] / 10 },
      })),
    },
    milestones: def.milestones
      .map((m) => {
        const index = findMilestone(data, m);
        return { t: index >= 0 ? data.eventi[index][0] : Math.round((Date.parse(m.at) - start) / 60_000), index };
      }),
  };
}

/** Quante scosse fino al minuto t (ricerca binaria). */
function countUntil(times: number[], t: number): number {
  let lo = 0;
  let hi = times.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const radiusExpr = (def: SequenceDef): ExpressionSpecification => [
  'interpolate', ['linear'], ['get', 'mag'], ...def.radius.flat(),
] as unknown as ExpressionSpecification;

export default function SequenceReplay({ initial, allowSwitch = true }: { initial: SequenceId; allowSwitch?: boolean }) {
  const theme = useResolvedTheme();
  const [id, setId] = useState<SequenceId>(initial);
  const def = SEQUENCES[id];
  const [prep, setPrep] = useState<Prepared | null>(null);
  const [error, setError] = useState(false);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const tRef = useRef(0);
  const pauseUntil = useRef(0);

  // Dati della sequenza scelta.
  useEffect(() => {
    let alive = true;
    setPrep(null);
    setPlaying(false);
    setT(0);
    tRef.current = 0;
    def
      .load()
      .then((data) => alive && setPrep(prepare(def, data)))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [def]);

  // Mappa: creata quando i dati sono pronti, ricreata se cambiano sequenza o tema.
  useEffect(() => {
    if (!prep || !container.current) return;
    let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
    for (const e of prep.data.eventi) {
      minLat = Math.min(minLat, e[1] / 1000); maxLat = Math.max(maxLat, e[1] / 1000);
      minLon = Math.min(minLon, e[2] / 1000); maxLon = Math.max(maxLon, e[2] / 1000);
    }
    const map = new MlMap({
      container: container.current,
      style: STYLE[theme],
      bounds: [[minLon, minLat], [maxLon, maxLat]],
      fitBoundsOptions: { padding: 24 },
      attributionControl: { compact: true },
      cooperativeGestures: true,
      dragRotate: false,
      pitchWithRotate: false,
      maxZoom: 13,
      locale: {
        'NavigationControl.ZoomIn': 'Ingrandisci',
        'NavigationControl.ZoomOut': 'Rimpicciolisci',
        'CooperativeGesturesHandler.WindowsHelpText': 'Tieni premuto Ctrl e usa la rotellina per ingrandire la mappa',
        'CooperativeGesturesHandler.MacHelpText': 'Tieni premuto ⌘ e usa la rotellina per ingrandire la mappa',
        'CooperativeGesturesHandler.MobileHelpText': 'Usa due dita per muovere la mappa',
        'AttributionControl.ToggleAttribution': 'Mostra i crediti della mappa',
      },
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      map.addSource('seq', { type: 'geojson', data: prep.geojson });
      map.addLayer({
        id: 'seq',
        type: 'circle',
        source: 'seq',
        layout: { 'circle-sort-key': ['get', 'mag'] },
        filter: ['<=', ['get', 't'], -1],
        paint: {
          'circle-radius': radiusExpr(def),
          'circle-stroke-width': 0.6,
          'circle-stroke-color': theme === 'dark' ? '#0b1418' : '#ffffff',
        },
      });
      map.addLayer({
        id: 'seq-milestone',
        type: 'circle',
        source: 'seq',
        filter: ['==', ['get', 'i'], -1],
        paint: {
          'circle-radius': ['+', radiusExpr(def), 5] as ExpressionSpecification,
          'circle-opacity': 0,
          'circle-stroke-width': 3,
          'circle-stroke-color': theme === 'dark' ? '#ffffff' : '#14212b',
        },
      });
      mapRef.current = map;
      paint(tRef.current);
    });
    return () => {
      mapRef.current = null;
      map.remove();
    };
    // paint usa solo ref e prep: non serve rifare la mappa quando cambia t.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prep, theme]);

  /** Ridisegna i punti al minuto t: visibili quelli già avvenuti, arancioni quelli recenti. */
  function paint(time: number) {
    const map = mapRef.current;
    if (!map || !prep || !map.getLayer('seq')) return;
    const recent = def.recentDays * 1440;
    map.setFilter('seq', ['<=', ['get', 't'], time]);
    map.setPaintProperty('seq', 'circle-color', [
      'case', ['>=', ['get', 't'], time - recent], RECENT, PAST,
    ]);
    map.setPaintProperty('seq', 'circle-opacity', [
      'case', ['>=', ['get', 't'], time - recent], 0.9, 0.35,
    ]);
    const active = currentMilestone(time);
    map.setFilter('seq-milestone', ['==', ['get', 'i'], active >= 0 ? prep.milestones[active].index : -1]);
  }

  /** L'ultima tappa già passata (per la frase da mostrare), o -1. */
  function currentMilestone(time: number): number {
    if (!prep) return -1;
    let k = -1;
    prep.milestones.forEach((m, i) => {
      if (m.t <= time) k = i;
    });
    return k;
  }

  // Riproduzione: avanza il tempo, si ferma un attimo su ogni tappa.
  useEffect(() => {
    if (!playing || !prep) return;
    let raf = 0;
    let last = performance.now();
    let lastPaint = 0;
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      if (now >= pauseUntil.current) {
        const prev = tRef.current;
        let next = Math.min(prep.total, prev + (dt / PLAY_MS) * prep.total);
        const crossed = prep.milestones.find((m) => m.t > prev && m.t <= next);
        if (crossed) {
          next = crossed.t;
          pauseUntil.current = now + MILESTONE_PAUSE_MS;
        }
        tRef.current = next;
        if (now - lastPaint > 50 || crossed || next >= prep.total) {
          lastPaint = now;
          setT(next);
          paint(next);
        }
        if (next >= prep.total) {
          setPlaying(false);
          return;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, prep]);

  const seek = (time: number) => {
    tRef.current = time;
    pauseUntil.current = 0;
    setT(time);
    paint(time);
  };

  const maxBin = useMemo(() => (prep ? Math.max(1, ...prep.bins) : 1), [prep]);

  if (error) return <p className="notice notice--warn">Non riesco a caricare i dati della sequenza. Riprova più tardi.</p>;

  const now = prep ? new Date(prep.start + t * 60_000) : null;
  const shown = prep ? countUntil(prep.times, t) : 0;
  const k = currentMilestone(t);
  const milestone = k >= 0 ? def.milestones[k] : null;
  const milestoneTime = k >= 0 && prep ? new Date(prep.start + prep.milestones[k].t * 60_000) : null;
  const atEnd = prep ? t >= prep.total : false;

  return (
    <div className="seq-replay stack">
      {allowSwitch && (
        <Segmented
          legend="Quale sequenza vuoi vedere?"
          options={(Object.keys(SEQUENCES) as SequenceId[]).map((sid) => ({ value: sid, label: SEQUENCES[sid].name }))}
          value={id}
          onChange={setId}
        />
      )}
      <p className="strong">{def.lesson}</p>

      <div className="seq-replay__map-wrap">
        <div ref={container} className="seq-replay__map" role="img" aria-label={`Mappa della sequenza: ${def.name}`} />
        {now && (
          <div className="seq-replay__clock" aria-hidden="true">
            <span className="strong">{dateFmt.format(now)}</span>
            <span>{formatInt(shown)} scosse</span>
          </div>
        )}
        {!prep && <div className="seq-replay__loading">Sto caricando i dati INGV…</div>}
      </div>

      {prep && (
        <>
          <div className="row seq-replay__controls">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                if (atEnd) seek(0);
                setPlaying((p) => !p);
              }}
            >
              {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              {playing ? 'Pausa' : atEnd ? 'Rivedi' : t > 0 ? 'Continua' : 'Avvia'}
            </button>
            {t > 0 && !playing && (
              <button type="button" className="btn btn--ghost" onClick={() => seek(0)}>
                <RotateCcw aria-hidden="true" /> Dall’inizio
              </button>
            )}
          </div>

          <div className="seq-replay__timeline">
            <div className="seq-replay__bars" aria-hidden="true">
              {prep.bins.map((n, i) => (
                <span
                  key={i}
                  style={{ height: `${Math.max(n > 0 ? 6 : 0, (n / maxBin) * 100)}%` } as CSSProperties}
                  className={(i + 1) * def.binDays * 1440 <= t ? 'is-past' : undefined}
                />
              ))}
              {prep.milestones.map((m, i) => (
                <i key={i} className="seq-replay__tick" style={{ left: `${(m.t / prep.total) * 100}%` }} />
              ))}
            </div>
            <input
              type="range"
              className="seq-replay__range"
              min={0}
              max={Math.round(prep.total)}
              step={60}
              value={Math.round(t)}
              aria-label="Giorno della sequenza"
              aria-valuetext={now ? `${dateFmt.format(now)}, ${formatInt(shown)} scosse` : undefined}
              onChange={(e) => {
                setPlaying(false);
                seek(Number(e.target.value));
              }}
            />
            <div className="seq-replay__ends small muted" aria-hidden="true">
              <span>{dateFmt.format(new Date(prep.start))}</span>
              <span>{dateFmt.format(new Date(Date.parse(prep.data.fine) - 60_000))}</span>
            </div>
          </div>

          <div className="seq-replay__caption" aria-live="polite">
            {milestone && milestoneTime ? (
              <>
                <p className="strong">{milestone.title}</p>
                <p className="small muted">Ore {timeFmt.format(milestoneTime)} (ora italiana)</p>
                <p>{milestone.text}</p>
              </>
            ) : (
              <p className="muted">Premi «Avvia»: i punti compaiono giorno dopo giorno. In arancione le scosse più recenti.</p>
            )}
          </div>

          <details className="seq-replay__notes">
            <summary className="strong">Da sapere: cosa questa mappa non dice</summary>
            <ul className="advice">
              {def.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </details>

          <p className="small muted">
            Dati: catalogo INGV, licenza CC BY 4.0 —{' '}
            {prep.data.richieste.map((u, i) => (
              <span key={u}>
                {i > 0 && ', '}
                <ExternalLink href={u}>{prep.data.richieste.length > 1 ? `richiesta ${i + 1}` : 'richiesta usata'}</ExternalLink>
              </span>
            ))}
            .{' '}
            {def.sources.map((s) => (
              <ExternalLink key={s.href} href={s.href}>
                {s.label}
              </ExternalLink>
            ))}
          </p>
        </>
      )}
    </div>
  );
}
