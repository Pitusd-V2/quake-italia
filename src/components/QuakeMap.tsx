/**
 * Mappa dei terremoti con MapLibre + OpenFreeMap (gratuito, senza chiavi).
 * Viene caricata solo quando serve (React.lazy), perché la libreria è pesante.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import type { FeatureCollection } from 'geojson';
import { GeoJSONSource, Map as MlMap, Marker, NavigationControl, Popup, setWorkerUrl, type ExpressionSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre 6 cerca il suo worker accanto al proprio file: con Vite il percorso cambia,
// quindi gli diciamo noi dove si trova (funziona sia in sviluppo sia in produzione).
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { MAG_LEVELS, magLevel, placeText } from '../lib/describe';
import { formatMag, formatWhen } from '../lib/format';
import { ITALY_BOUNDS } from '../lib/ingv';
import type { LatLon, Place, Quake } from '../lib/types';
import { useResolvedTheme } from '../state/settings';

setWorkerUrl(workerUrl);

export type ColorBy = 'level' | 'depth';

export interface QuakeMapProps {
  quakes: Quake[];
  home?: Place | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  colorBy?: ColorBy;
  /** Dove guardare all'apertura. */
  focus?: { center: LatLon; zoom: number } | 'quakes' | 'italy';
  /** Sulle mappe dentro una pagina: muovere con due dita, così non "blocca" lo scorrimento. */
  cooperative?: boolean;
  label?: string;
  className?: string;
}

const STYLE = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

const LOCALE = {
  'NavigationControl.ZoomIn': 'Ingrandisci',
  'NavigationControl.ZoomOut': 'Rimpicciolisci',
  'NavigationControl.ResetBearing': 'Riporta il nord in alto',
  'AttributionControl.ToggleAttribution': 'Mostra i crediti della mappa',
  'CooperativeGesturesHandler.WindowsHelpText': 'Tieni premuto Ctrl e usa la rotellina per ingrandire la mappa',
  'CooperativeGesturesHandler.MacHelpText': 'Tieni premuto ⌘ e usa la rotellina per ingrandire la mappa',
  'CooperativeGesturesHandler.MobileHelpText': 'Usa due dita per muovere la mappa',
  'Map.Title': 'Mappa dei terremoti',
};

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Raggio del cerchio in base alla magnitudo (cresce anche con lo zoom). */
const radiusByMag = (k: number): ExpressionSpecification => [
  'interpolate', ['linear'], ['get', 'mag'],
  0, 3 * k, 2, 5 * k, 3, 8 * k, 4, 12 * k, 5, 18 * k, 6, 26 * k,
];

/**
 * Profondità: una sola tinta (blu) dal chiaro allo scuro. Più è profondo, più il colore
 * si stacca dallo sfondo: scuro sulla mappa chiara, chiaro sulla mappa scura.
 */
export const DEPTH_STOPS: Record<'light' | 'dark', [number, string][]> = {
  light: [[0, '#86b6ef'], [10, '#5598e7'], [20, '#2a78d6'], [40, '#1c5cab'], [100, '#104281'], [300, '#0d366b']],
  dark: [[0, '#184f95'], [10, '#256abf'], [20, '#3987e5'], [40, '#6da7ec'], [100, '#9ec5f4'], [300, '#cde2fb']],
};

function colorExpression(by: ColorBy, theme: 'light' | 'dark'): ExpressionSpecification {
  if (by === 'depth') {
    return ['interpolate', ['linear'], ['get', 'depth'], ...DEPTH_STOPS[theme].flat()] as ExpressionSpecification;
  }
  // Il colore segue lo stesso livello dei badge (magnitudo e profondità, vedi magLevel): non possono andare fuori sincrono.
  const last = MAG_LEVELS[MAG_LEVELS.length - 1];
  return [
    'match', ['get', 'lvl'],
    ...MAG_LEVELS.slice(0, -1).flatMap((l) => [l.level, cssVar(`--lvl${l.level}`)]),
    cssVar(`--lvl${last.level}`),
  ] as unknown as ExpressionSpecification;
}

function toGeoJson(quakes: Quake[]): FeatureCollection {
  const hourAgo = Date.now() - 3_600_000;
  return {
    type: 'FeatureCollection',
    features: quakes.map((q) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [q.lon, q.lat] },
      properties: { id: q.id, mag: q.mag, depth: q.depthKm, lvl: magLevel(q.mag, q.depthKm).level, recent: q.time.getTime() >= hourAgo },
    })),
  };
}

function popupContent(q: Quake, go: (path: string) => void): HTMLElement {
  // Costruito con textContent: i testi arrivano da un servizio esterno.
  const root = document.createElement('div');
  root.className = 'map-popup';
  const title = document.createElement('p');
  title.className = 'strong';
  title.textContent = `${magLevel(q.mag, q.depthKm).name} · magnitudo ${formatMag(q.mag)}`;
  const place = document.createElement('p');
  place.textContent = placeText(q.place).full;
  const when = document.createElement('p');
  when.className = 'muted';
  when.textContent = formatWhen(q.time);
  const link = document.createElement('a');
  link.href = `/terremoto/${encodeURIComponent(q.id)}`;
  link.textContent = 'Vedi i dettagli';
  link.addEventListener('click', (e) => {
    e.preventDefault();
    go(link.pathname);
  });
  root.append(title, place, when, link);
  return root;
}

function homeMarkerEl(name: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'home-marker';
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', `Casa: ${name}`);
  el.title = name;
  // Costruito elemento per elemento: nessun HTML interpretato da stringhe.
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  const attrs: Record<string, string> = {
    viewBox: '0 0 24 24', width: '20', height: '20', fill: 'none', stroke: 'currentColor',
    'stroke-width': '2.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
  };
  for (const [k, v] of Object.entries(attrs)) svg.setAttribute(k, v);
  for (const d of ['M3 10.5 12 3l9 7.5', 'M5 9.5V20h14V9.5']) {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  el.append(svg);
  return el;
}

export default function QuakeMap({
  quakes,
  home,
  selectedId,
  onSelect,
  colorBy = 'level',
  focus = 'italy',
  cooperative = false,
  label = 'Mappa dei terremoti',
  className,
}: QuakeMapProps) {
  const theme = useResolvedTheme();
  const navigate = useNavigate();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const latest = useRef({ quakes, selectedId, colorBy, onSelect, theme, navigate });
  latest.current = { quakes, selectedId, colorBy, onSelect, theme, navigate };

  // Creazione della mappa (una volta sola).
  useEffect(() => {
    if (!container.current) return;
    const map = new MlMap({
      container: container.current,
      style: STYLE[latest.current.theme],
      bounds: [
        [ITALY_BOUNDS.minLon + 0.6, ITALY_BOUNDS.minLat + 1.4],
        [ITALY_BOUNDS.maxLon - 0.4, ITALY_BOUNDS.maxLat - 0.9],
      ],
      attributionControl: { compact: true },
      cooperativeGestures: cooperative,
      locale: LOCALE,
      dragRotate: false,
      pitchWithRotate: false,
      maxZoom: 13,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    const popup = new Popup({ closeButton: true, maxWidth: '280px', focusAfterOpen: true });

    // Gli strati dei terremoti vanno (ri)aggiunti a ogni cambio di stile (es. tema scuro).
    const addLayers = () => {
      const { quakes: qs, selectedId: sel, colorBy: by, theme: th } = latest.current;
      if (map.getSource('quakes')) return;
      map.addSource('quakes', { type: 'geojson', data: toGeoJson(qs) });
      map.addLayer({
        id: 'quakes-halo',
        type: 'circle',
        source: 'quakes',
        filter: ['==', ['get', 'recent'], true],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, radiusByMag(1.25), 10, radiusByMag(2)],
          'circle-opacity': 0,
          'circle-stroke-width': 3,
          'circle-stroke-color': th === 'dark' ? '#ffffff' : '#14212b',
        },
      });
      map.addLayer({
        id: 'quakes',
        type: 'circle',
        source: 'quakes',
        layout: { 'circle-sort-key': ['get', 'mag'] },
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, radiusByMag(0.85), 10, radiusByMag(1.5)],
          'circle-color': colorExpression(by, th),
          'circle-opacity': 0.88,
          'circle-stroke-width': 1.25,
          'circle-stroke-color': th === 'dark' ? '#0e1418' : '#ffffff',
        },
      });
      map.addLayer({
        id: 'quakes-selected',
        type: 'circle',
        source: 'quakes',
        filter: ['==', ['get', 'id'], sel ?? ''],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, radiusByMag(1.4), 10, radiusByMag(2.2)],
          'circle-opacity': 0,
          'circle-stroke-width': 4,
          'circle-stroke-color': cssVar('--focus'),
        },
      });
    };
    map.on('style.load', addLayers);

    map.on('click', 'quakes', (e) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (!id) return;
      const { onSelect: select, quakes: qs } = latest.current;
      if (select) {
        select(id);
        return;
      }
      const q = qs.find((x) => x.id === id);
      if (q) popup.setLngLat([q.lon, q.lat]).setDOMContent(popupContent(q, latest.current.navigate)).addTo(map);
    });
    map.on('mouseenter', 'quakes', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'quakes', () => (map.getCanvas().style.cursor = ''));

    return () => {
      popup.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tema chiaro/scuro.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(STYLE[theme]);
  }, [theme]);

  // Dati aggiornati.
  useEffect(() => {
    const src = mapRef.current?.getSource('quakes') as GeoJSONSource | undefined;
    src?.setData(toGeoJson(quakes));
  }, [quakes]);

  // Colore per magnitudo o profondità.
  useEffect(() => {
    const map = mapRef.current;
    if (map?.getLayer('quakes')) map.setPaintProperty('quakes', 'circle-color', colorExpression(colorBy, theme));
  }, [colorBy, theme]);

  // Evento selezionato.
  useEffect(() => {
    const map = mapRef.current;
    if (map?.getLayer('quakes-selected')) map.setFilter('quakes-selected', ['==', ['get', 'id'], selectedId ?? '']);
    const q = selectedId ? quakes.find((x) => x.id === selectedId) : undefined;
    if (map && q && !map.getBounds().contains([q.lon, q.lat])) map.easeTo({ center: [q.lon, q.lat] });
  }, [selectedId, quakes]);

  // Inquadratura iniziale / al cambio di "focus".
  const focusKey = typeof focus === 'string' ? focus : `${focus.center.lat},${focus.center.lon},${focus.zoom}`;
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (typeof focus === 'object') {
      map.jumpTo({ center: [focus.center.lon, focus.center.lat], zoom: focus.zoom });
    } else if (focus === 'quakes' && quakes.length) {
      let [w, s, e, n] = [180, 90, -180, -90];
      for (const q of quakes) {
        w = Math.min(w, q.lon); e = Math.max(e, q.lon);
        s = Math.min(s, q.lat); n = Math.max(n, q.lat);
      }
      map.fitBounds([[w, s], [e, n]], { padding: 48, maxZoom: 9, duration: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, focus === 'quakes' ? quakes.length > 0 : null]);

  // Indicatore "casa".
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !home) return;
    const marker = new Marker({ element: homeMarkerEl(home.name) }).setLngLat([home.lon, home.lat]).addTo(map);
    return () => {
      marker.remove();
    };
  }, [home]);

  return <div ref={container} className={`quake-map ${className ?? ''}`} role="region" aria-label={label} />;
}
