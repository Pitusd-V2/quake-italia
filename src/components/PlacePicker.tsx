import { useEffect, useId, useState } from 'react';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import { searchPlaces } from '../lib/geocode';
import { useGeolocation } from '../hooks/useGeolocation';
import type { Place } from '../lib/types';

/**
 * Scelta di un luogo: posizione GPS con un tocco, oppure scrivendo il comune.
 * La ricerca parte da sola mentre si scrive (con una piccola attesa).
 */
export function PlacePicker({
  onPick,
  label = 'Scrivi il nome del tuo comune',
  gpsLabel = 'Usa la mia posizione',
}: {
  onPick: (p: Place) => void;
  label?: string;
  gpsLabel?: string;
}) {
  const id = useId();
  const [text, setText] = useState('');
  const [results, setResults] = useState<Place[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const geo = useGeolocation();

  useEffect(() => {
    const q = text.trim();
    if (q.length < 3) {
      setResults(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        setResults(await searchPlaces(q, ctrl.signal));
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError('Non riesco a cercare in questo momento. Riprova tra poco.');
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [text]);

  const useGps = async () => {
    const p = await geo.locate();
    if (p) onPick(p);
  };

  return (
    <div className="place-picker">
      <button type="button" className="btn btn--primary btn--block" onClick={useGps} disabled={geo.status === 'locating'}>
        <LocateFixed aria-hidden="true" />
        {geo.status === 'locating' ? 'Sto cercando la tua posizione…' : gpsLabel}
      </button>
      {geo.error && (
        <p className="field__error" role="alert">
          {geo.error}
        </p>
      )}

      <p className="place-picker__or">oppure</p>

      <div className="field">
        <label htmlFor={`${id}-q`} className="field__label">
          {label}
        </label>
        <div className="input-with-icon">
          <Search aria-hidden="true" />
          <input
            id={`${id}-q`}
            className="input"
            type="search"
            inputMode="search"
            autoComplete="address-level2"
            placeholder="Esempio: Norcia"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-describedby={`${id}-status`}
          />
        </div>
        <p id={`${id}-status`} className="field__help" aria-live="polite">
          {loading
            ? 'Sto cercando…'
            : error
              ? error
              : results && results.length === 0
                ? 'Nessun luogo trovato. Controlla come è scritto.'
                : results
                  ? `Trovati ${results.length} luoghi: tocca quello giusto.`
                  : 'Scrivi almeno 3 lettere.'}
        </p>
      </div>

      {results && results.length > 0 && (
        <ul className="place-results">
          {results.map((p) => (
            <li key={`${p.name}-${p.lat}-${p.lon}`}>
              <button type="button" className="place-result" onClick={() => onPick(p)}>
                <MapPin aria-hidden="true" />
                <span>
                  <span className="strong">{p.name}</span>
                  {p.detail && <span className="muted"> — {p.detail}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
