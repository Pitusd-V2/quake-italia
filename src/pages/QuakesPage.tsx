import { Fragment, lazy, Suspense, useId, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { useSettings } from '../state/settings';
import { useQuakeFeed } from '../state/quakes';
import { useNow } from '../hooks/useNow';
import { distanceKm } from '../lib/geo';
import { MAG_LEVELS, placeText, SHALLOW_KM, SHALLOW_STRONG_MAG } from '../lib/describe';
import { formatInt, formatMag, hoursAgo } from '../lib/format';
import type { LatLon } from '../lib/types';
import { isLat, isLon } from '../lib/sanitize';
import { QuakeCard, QuakeList } from '../components/QuakeCard';
import { LevelBars } from '../components/MagBadge';
import { ErrorBox, LoadingCards, PageHeader, Segmented, Switch } from '../components/ui';

const QuakeMap = lazy(() => import('../components/QuakeMap'));

type Period = '24h' | '3g' | '7g';
type View = 'elenco' | 'mappa';
const PERIOD_HOURS: Record<Period, number> = { '24h': 24, '3g': 72, '7g': 168 };
const PERIODS: { value: Period; label: string }[] = [
  { value: '24h', label: 'Ultime 24 ore' },
  { value: '3g', label: '3 giorni' },
  { value: '7g', label: '7 giorni' },
];
/** Come il periodo viene scritto nel riassunto del pulsante "Filtri". */
const PERIOD_SUMMARY: Record<Period, string> = {
  '24h': 'Ultime 24 ore',
  '3g': 'Ultimi 3 giorni',
  '7g': 'Ultimi 7 giorni',
};
const VIEWS: { value: View; label: string }[] = [
  { value: 'elenco', label: 'Elenco' },
  { value: 'mappa', label: 'Mappa' },
];

function parseCenter(s: string | null): LatLon | null {
  const m = s?.split(',').map(Number);
  return m && m.length === 2 && isLat(m[0]) && isLon(m[1]) ? { lat: m[0], lon: m[1] } : null;
}

export function MapLegend() {
  return (
    <ul className="legend" aria-label="Legenda dei colori">
      {MAG_LEVELS.map((l) => (
        <li key={l.level} style={{ ['--lvl' as string]: `var(--lvl${l.level})` }}>
          <span className="legend__dot" aria-hidden="true" />
          <LevelBars level={l.level} />
          <span>
            {l.name}
            <span className="muted"> {l.min === -Infinity ? 'sotto 2' : `da ${String(l.min).replace('.', ',')}`}</span>
          </span>
        </li>
      ))}
      <li className="legend__note small muted">
        Le scosse molto superficiali (fino a {SHALLOW_KM} km, come ai vulcani) salgono di un livello da magnitudo{' '}
        {String(SHALLOW_STRONG_MAG).replace('.', ',')}: vicino all’epicentro fanno più di quanto dica il numero.
      </li>
    </ul>
  );
}

export function QuakesPage() {
  const { settings, update } = useSettings();
  const feed = useQuakeFeed();
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  // Pannello dei filtri chiuso all'inizio: l'elenco deve vedersi subito, anche sul telefono.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();
  const filtersBtn = useRef<HTMLButtonElement>(null);

  const period = (PERIODS.some((p) => p.value === params.get('periodo')) ? params.get('periodo') : '24h') as Period;
  const view = (params.get('vista') === 'mappa' ? 'mappa' : 'elenco') as View;
  const onlyNear = params.get('vicino') === '1' && !!settings.home;
  const center = parseCenter(params.get('centro'));

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null) next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    if (!feed.data) return [];
    const since = hoursAgo(PERIOD_HOURS[period], now.getTime()).getTime();
    return feed.data.filter(
      (q) =>
        q.time.getTime() >= since &&
        (settings.showMicro || q.mag >= 2) &&
        (!onlyNear || distanceKm(settings.home!, q) <= settings.radiusKm),
    );
  }, [feed.data, period, now, settings.showMicro, settings.home, settings.radiusKm, onlyNear]);

  const strongest = list.reduce<(typeof list)[number] | undefined>((a, b) => (!a || b.mag > a.mag ? b : a), undefined);
  const selectedQuake = selected ? list.find((q) => q.id === selected) : undefined;

  // Riassunto dei filtri attivi, sempre visibile nel pulsante anche a pannello chiuso.
  const filterSummary = [
    PERIOD_SUMMARY[period],
    onlyNear ? `entro ${settings.radiusKm} km da ${settings.home!.name}` : 'tutta Italia',
    ...(settings.showMicro ? ['anche le microscosse'] : []),
  ];

  const closeFilters = () => {
    setFiltersOpen(false);
    filtersBtn.current?.focus();
  };

  return (
    <div className={`container ${view === 'mappa' ? 'container--wide' : ''} stack-lg quakes-page`}>
      <PageHeader title="Terremoti in Italia" intro="Tutti i terremoti registrati dall'INGV, dal più recente." />

      {/* Barra compatta: Elenco/Mappa sempre a vista, il resto dei filtri dietro un solo pulsante. */}
      <section className="quakes-toolbar" aria-label="Cosa vuoi vedere">
        <Segmented
          legend="Come vuoi vederli?"
          hideLegend
          options={VIEWS}
          value={view}
          onChange={(v) => setParam('vista', v === 'elenco' ? null : v)}
        />

        <button
          ref={filtersBtn}
          type="button"
          className="filters-toggle"
          aria-expanded={filtersOpen}
          aria-controls={filtersId}
          onClick={() => setFiltersOpen((o) => !o)}
        >
          <span className="filters-toggle__title">
            <SlidersHorizontal aria-hidden="true" /> Filtri
            <span className="visually-hidden">:</span>
          </span>
          <span className="filters-toggle__summary">
            {filterSummary.map((s, i) => (
              <Fragment key={s}>
                {i > 0 && (
                  <>
                    <span className="visually-hidden">, </span>
                    <span className="filters-toggle__sep" aria-hidden="true">
                      {' · '}
                    </span>
                  </>
                )}
                {s}
              </Fragment>
            ))}
          </span>
          <span className="filters-toggle__action">
            {filtersOpen ? 'Chiudi' : 'Cambia'}
            {filtersOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
          </span>
        </button>

        <div
          id={filtersId}
          className="card filters filters-panel"
          hidden={!filtersOpen}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeFilters();
          }}
        >
          <Segmented legend="Periodo" options={PERIODS} value={period} onChange={(v) => setParam('periodo', v === '24h' ? null : v)} />
          {settings.home && (
            <Switch
              label={`Solo vicino a ${settings.home.name}`}
              description={`Entro ${settings.radiusKm} km`}
              checked={onlyNear}
              onChange={(v) => setParam('vicino', v ? '1' : null)}
            />
          )}
          <Switch
            label="Mostra anche le microscosse"
            description="Scosse sotto magnitudo 2, che le persone non sentono"
            checked={settings.showMicro}
            onChange={(v) => update({ showMicro: v })}
          />
          <button type="button" className="btn btn--primary btn--block" onClick={closeFilters}>
            Fatto
          </button>
        </div>
      </section>

      {feed.isPending && <LoadingCards />}
      {feed.isError && !feed.data && <ErrorBox message={(feed.error as Error).message} onRetry={() => feed.refetch()} />}

      {feed.data && (
        <p className="summary" role="status">
          <span className="strong">{formatInt(list.length)}</span> {list.length === 1 ? 'terremoto' : 'terremoti'}
          {strongest && (
            <>
              . Il più forte: magnitudo <span className="strong">{formatMag(strongest.mag)}</span>, {placeText(strongest.place).full}.
            </>
          )}
        </p>
      )}

      {feed.data && view === 'elenco' && (
        <QuakeList
          quakes={list}
          now={now}
          home={settings.home}
          emptyText="Nessun terremoto in questo periodo con questi filtri. Prova un periodo più lungo."
        />
      )}

      {feed.data && view === 'mappa' && (
        <div className="map-layout">
          <Suspense fallback={<div className="quake-map quake-map--loading">Sto caricando la mappa…</div>}>
            <QuakeMap
              quakes={list}
              home={settings.home}
              selectedId={selected}
              onSelect={setSelected}
              focus={center ? { center, zoom: 9 } : 'italy'}
              className="quake-map--page"
            />
          </Suspense>
          <aside className="map-side stack" aria-live="polite">
            {selectedQuake ? (
              <>
                <h2 className="visually-hidden">Terremoto selezionato</h2>
                <QuakeCard quake={selectedQuake} now={now} home={settings.home} headingLevel={3} />
                <button type="button" className="btn btn--ghost" onClick={() => setSelected(null)}>
                  Chiudi
                </button>
              </>
            ) : (
              <p className="muted">Tocca un cerchio sulla mappa per vedere di che terremoto si tratta.</p>
            )}
            <h2 className="h3">Legenda</h2>
            <p className="small muted">Più il cerchio è grande, più la scossa è forte. Il contorno scuro indica le scosse dell'ultima ora.</p>
            <MapLegend />
          </aside>
        </div>
      )}
    </div>
  );
}
