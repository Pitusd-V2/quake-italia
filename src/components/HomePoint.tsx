import { lazy, Suspense, useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { LocateFixed, MapPin, MapPinned, Search } from 'lucide-react';
import { useSettings } from '../state/settings';
import { coarse, distanceKm, formatKm } from '../lib/geo';
import { searchStreets, type StreetMatch } from '../lib/geocode';
import { ITALY_BOUNDS } from '../lib/ingv';
import { getPosition } from '../lib/position';
import type { Bounds, LatLon } from '../lib/types';
import type { HomePointTarget } from './QuakeMap';
import { Notice } from './ui';

// Sta nello stesso file della mappa dei terremoti: il codice della mappa si scarica una volta sola, e solo se serve.
const HomePointMap = lazy(() => import('./QuakeMap').then((m) => ({ default: m.HomePointMap })));

/** Oltre questa distanza è più probabile un altro comune che un'altra via. */
const FAR_KM = 20;
/** Sopra questo errore (metri) la posizione del dispositivo va controllata sulla mappa: succede spesso sui computer. */
const ROUGH_M = 150;

const metres = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} metri` : formatKm(m / 1000));
const middle = (b: Bounds): LatLon => ({ lat: (b.minLat + b.maxLat) / 2, lon: (b.minLon + b.maxLon) / 2 });
const inItaly = (p: LatLon) =>
  p.lat >= ITALY_BOUNDS.minLat && p.lat <= ITALY_BOUNDS.maxLat && p.lon >= ITALY_BOUNDS.minLon && p.lon <= ITALY_BOUNDS.maxLon;

/**
 * Il punto di casa: da dove partono le distanze dalle scosse. Scrivendo il comune il punto è il centro del comune,
 * che in una città grande può essere a molti km da casa: per una scossa vicina e poco profonda vuol dire anche un
 * grado di intensità in più o in meno. Qui si può indicare il punto vero, che resta solo sul dispositivo.
 *
 * Tre modi, dal più semplice: la posizione del dispositivo (non esce dal dispositivo), il nome della via (va al
 * servizio di ricerca dei luoghi, come il nome del comune), un tocco sulla mappa. La casetta sulla mappa è sempre
 * l'ultima parola: si vede dov'è e si può correggere prima di salvare.
 */
export function HomePoint({ as: Heading = 'h3' }: { as?: 'h2' | 'h3' }) {
  const { settings, update } = useSettings();
  const home = settings.home;
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LatLon | null>(null);
  const [saved, setSaved] = useState(false);
  const [target, setTarget] = useState<HomePointTarget | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [street, setStreet] = useState('');
  const [matches, setMatches] = useState<StreetMatch[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const count = useRef(0);
  const mapBox = useRef<HTMLDivElement>(null);
  if (!home) return null;

  const moved = draft ? distanceKm(home, draft) : 0;
  const goTo = (at: LatLon, bounds?: Bounds) => {
    setTarget({ at, bounds, n: ++count.current });
    // Sul telefono la mappa è più in basso: la portiamo sotto gli occhi, così si vede dove è finita la casetta.
    mapBox.current?.scrollIntoView({ block: 'center' });
  };
  const stop = () => {
    setEditing(false);
    setDraft(null);
    setTarget(null);
    setNote(null);
    setMatches(null);
    setSearchError(null);
    setStreet('');
  };
  const save = () => {
    if (!draft) return;
    // 5 decimali sono circa un metro: più che abbastanza per una casa.
    update({ home: { ...home, ...coarse(draft, 5), point: 'map' } });
    setSaved(true);
    stop();
  };

  // La posizione serve solo a spostare la casetta: resta in questa pagina, non viene mandata a nessuno.
  const useGps = async () => {
    setLocating(true);
    setNote(null);
    try {
      const fix = await getPosition(true);
      if (!inItaly(fix)) {
        setNote('La posizione trovata è fuori dall’Italia: non la uso. Puoi scrivere la via o toccare la mappa.');
        return;
      }
      goTo({ lat: fix.lat, lon: fix.lon });
      setNote(
        fix.accuracyM != null && fix.accuracyM > ROUGH_M
          ? `Il dispositivo ha trovato una posizione approssimata (può sbagliare di circa ${metres(fix.accuracyM)}). Guarda la casetta sulla mappa e, se non è casa tua, tocca il punto giusto.`
          : 'Ho messo la casetta dove sei adesso. Guarda sulla mappa se è casa tua.',
      );
    } catch (e) {
      setNote(`${(e as Error).message} Puoi scrivere la via o toccare la mappa.`);
    } finally {
      setLocating(false);
    }
  };

  const pickStreet = (m: StreetMatch) => {
    goTo(middle(m.bounds), m.bounds);
    setNote(`Ho messo la casetta a metà di ${m.name}. Se la via è lunga, tocca sulla mappa il punto dove abiti.`);
  };

  const findStreet = async (e: FormEvent) => {
    e.preventDefault();
    if (street.trim().length < 3) {
      setSearchError('Scrivi almeno 3 lettere.');
      return;
    }
    setSearching(true);
    setSearchError(null);
    setMatches(null);
    try {
      const found = await searchStreets(street, home);
      setMatches(found);
      // Una sola via: ci andiamo subito, senza un tocco in più.
      if (found.length === 1) pickStreet(found[0]);
    } catch {
      setSearchError('Non riesco a cercare in questo momento. Puoi toccare la mappa.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="stack home-point">
      <Heading className="icon-title">
        <MapPinned aria-hidden="true" /> Il punto di casa
      </Heading>

      {!editing && (
        <>
          {home.point === 'map' ? (
            <p>
              Le distanze dalle scosse partono dal <span className="strong">punto di casa che hai indicato</span>.
            </p>
          ) : home.point === 'gps' ? (
            <p>
              Le distanze dalle scosse partono dalla <span className="strong">posizione trovata dal tuo dispositivo</span>{' '}
              quando hai scelto il comune. Se in quel momento non eri a casa, sposta il punto.
            </p>
          ) : (
            <p>
              Adesso le distanze dalle scosse partono dal <span className="strong">centro di {home.name}</span>. Se indichi
              dove abiti, la stima di quanto una scossa si è sentita da te diventa più precisa, soprattutto per le scosse
              vicine e poco profonde.
            </p>
          )}
          {saved && (
            <p className="strong" role="status">
              Punto salvato su questo dispositivo.
            </p>
          )}
          <div className="row">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setSaved(false);
                setEditing(true);
              }}
            >
              {home.point ? 'Sposta il punto di casa' : 'Indica il punto di casa'}
            </button>
          </div>
        </>
      )}

      {editing && (
        <>
          <p>Scegli il modo più comodo. La casetta sulla mappa ti fa vedere il punto prima di salvarlo.</p>

          <button type="button" className="btn btn--secondary btn--block" onClick={useGps} disabled={locating}>
            <LocateFixed aria-hidden="true" />
            {locating ? 'Sto cercando la tua posizione…' : 'Sono a casa adesso: usa la mia posizione'}
          </button>

          <p className="place-picker__or">oppure</p>

          <form className="field" onSubmit={findStreet}>
            <label htmlFor={`${id}-via`} className="field__label">
              Scrivi la tua via
            </label>
            <div className="input-with-icon">
              <Search aria-hidden="true" />
              <input
                id={`${id}-via`}
                className="input"
                type="search"
                inputMode="search"
                autoComplete="off"
                spellCheck={false}
                maxLength={80}
                placeholder="Esempio: Via Roma"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                aria-describedby={`${id}-via-help`}
              />
            </div>
            <p id={`${id}-via-help`} className="field__help">
              Basta la via, senza numero: la cerco a {home.name} e dintorni. Quello che scrivi va al servizio di ricerca dei
              luoghi, come il nome del comune.
            </p>
            <button type="submit" className="btn btn--secondary" disabled={searching}>
              {searching ? 'Sto cercando…' : 'Cerca la via'}
            </button>
            <p className={searchError ? 'field__error' : 'field__help'} aria-live="polite">
              {searchError ??
                (matches && matches.length === 0
                  ? 'Non trovo questa via. Controlla come è scritta, oppure tocca la mappa.'
                  : matches && matches.length > 1
                    ? `Trovate ${matches.length} vie: tocca quella giusta.`
                    : '')}
            </p>
          </form>

          {matches && matches.length > 1 && (
            <ul className="place-results">
              {matches.map((m) => (
                <li key={`${m.name}-${m.detail}`}>
                  <button type="button" className="place-result" onClick={() => pickStreet(m)}>
                    <MapPin aria-hidden="true" />
                    <span>
                      <span className="strong">{m.name}</span>
                      {m.detail && <span className="muted"> — {m.detail}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="place-picker__or">oppure tocca la mappa dove abiti</p>

          <div ref={mapBox}>
            <Suspense fallback={<div className="quake-map quake-map--loading">Sto caricando la mappa…</div>}>
              <HomePointMap start={home} name={home.name} close={!!home.point} onMove={setDraft} target={target} />
            </Suspense>
          </div>
          <p className="small muted">Puoi anche trascinare la casetta. Sul telefono, per muovere la mappa usa due dita.</p>

          <div aria-live="polite" className="stack-sm">
            {note && <p>{note}</p>}
            <p className="small">
              {draft ? `Hai spostato il punto di ${metres(moved * 1000)}.` : 'Non hai ancora spostato il punto.'}
            </p>
          </div>
          {moved > FAR_KM && (
            <Notice tone="warn" title="Il punto è lontano da dove era">
              <p>
                Se abiti in un altro comune, annulla e cambia comune: il nome e la zona sismica restano quelli di {home.name}.
              </p>
            </Notice>
          )}
          <div className="row">
            <button type="button" className="btn btn--primary" onClick={save} disabled={!draft}>
              Salva questo punto
            </button>
            <button type="button" className="btn btn--ghost" onClick={stop}>
              Annulla
            </button>
          </div>
        </>
      )}

      <p className="small muted">
        Il punto resta salvato solo su questo dispositivo. Per cercare le scosse vicine mandiamo all’INGV coordinate
        arrotondate a circa 1 km, non il punto esatto. <Link to="/privacy">Privacy</Link>
      </p>
    </div>
  );
}
