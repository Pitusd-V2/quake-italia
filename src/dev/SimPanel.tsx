/**
 * Pannello SIMULAZIONI — esiste solo con `npm run dev` (mai nel sito pubblicato).
 * Serve per provare l'app senza aspettare un terremoto vero.
 * Di base è nascosto: si apre aggiungendo «?simulazioni» all'indirizzo (resta fino alla chiusura della scheda).
 * Se una simulazione è attiva, la striscia gialla si vede comunque: i dati finti non devono mai sembrare veri.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FlaskConical, X } from 'lucide-react';
import { useSettings } from '../state/settings';
import { getSim, setSim, type Scenario } from './simulation';

const DEFAULT_CENTER = { lat: 42.7924, lon: 13.0929, name: 'Norcia' };
const PANEL_FLAG = 'quakeitalia:sim-panel';

function panelEnabled(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has('simulazioni')) {
      sessionStorage.setItem(PANEL_FLAG, '1');
      return true;
    }
    return sessionStorage.getItem(PANEL_FLAG) === '1';
  } catch {
    return false;
  }
}

const LABELS: Record<Scenario, string> = {
  off: 'nessuna scossa finta',
  forte: 'scossa forte con repliche',
  leggera: 'scossa leggera',
  danni: 'scossa che può fare danni',
  giorni: 'sequenza di 4 giorni',
};

export default function SimPanel() {
  const { settings } = useSettings();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(panelEnabled);
  const [state, setState] = useState(getSim);
  const active = !!state && (state.scenario !== 'off' || state.fakeGps);

  const apply = (scenario: Scenario, fakeGps: boolean) => {
    const center = settings.home ? { lat: settings.home.lat, lon: settings.home.lon, name: settings.home.name } : DEFAULT_CENTER;
    const next = scenario === 'off' && !fakeGps ? null : { scenario, fakeGps, center, startedAt: Date.now() };
    setSim(next);
    setState(next);
    // Ricarica tutti i dati: le nuove scosse "arrivano" come se fossero vere.
    void qc.invalidateQueries();
  };

  return (
    <>
      {active && (
        <div className="sim-bar" role="status">
          SIMULAZIONE ATTIVA — {LABELS[state!.scenario]}
          {state!.fakeGps ? ' · GPS finto' : ''} · i dati simulati non sono reali
        </div>
      )}
      {enabled && (
        <button type="button" className="sim-fab" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <FlaskConical aria-hidden="true" /> Simulazioni
        </button>
      )}
      {enabled && open && (
        <div className="sim-panel card stack-sm" role="dialog" aria-label="Simulazioni">
          <div className="row row--between">
            <p className="strong">Simulazioni (solo sviluppo)</p>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Chiudi">
              <X aria-hidden="true" />
            </button>
          </div>
          <p className="small muted">
            Gli eventi finti vengono aggiunti ai dati INGV veri vicino a {settings.home?.name ?? DEFAULT_CENTER.name}.
          </p>
          <button type="button" className="btn btn--secondary" onClick={() => apply('forte', state?.fakeGps ?? false)}>
            Scossa forte (M 4,8) + repliche
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => apply('leggera', state?.fakeGps ?? false)}>
            Scossa leggera (M 3,1) appena avvenuta
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => apply('danni', state?.fakeGps ?? false)}>
            Scossa molto forte (M 5,8) a 6 km
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => apply('giorni', state?.fakeGps ?? false)}>
            Sequenza iniziata 4 giorni fa (M 4,6)
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => apply(state?.scenario ?? 'off', !state?.fakeGps)}>
            GPS finto: {state?.fakeGps ? 'attivo' : 'spento'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => apply('off', false)}>
            Ferma tutte le simulazioni
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              try {
                sessionStorage.removeItem(PANEL_FLAG);
              } catch {
                /* niente */
              }
              setOpen(false);
              setEnabled(false);
            }}
          >
            Nascondi il pannello
          </button>
        </div>
      )}
    </>
  );
}
