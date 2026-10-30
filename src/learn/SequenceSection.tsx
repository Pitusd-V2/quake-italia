import { lazy, Suspense, useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { useSettings } from '../state/settings';
import { chooseSequence, SEQUENCES, type SequenceId } from './sequences';

// Mappa e dati pesano: si scaricano solo se qualcuno chiede di vedere l'animazione.
const SequenceReplay = lazy(() => import('./SequenceReplay'));

/**
 * Riquadro «Rivedi la sequenza sulla mappa» dentro un articolo. Parte dalla sequenza vicina a casa tua (se c'è),
 * altrimenti da quella adatta all'articolo (`preferred`).
 */
export function SequenceSection({ preferred }: { preferred: SequenceId }) {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const initial = chooseSequence(settings.home, preferred);

  return (
    <section className="card stack seq-section" aria-label="Rivedi una sequenza sulla mappa">
      <h3 className="icon-title">
        <MapIcon aria-hidden="true" /> Rivedi la sequenza sulla mappa
      </h3>
      {open ? (
        <Suspense fallback={<p className="muted">Sto aprendo la mappa…</p>}>
          <SequenceReplay initial={initial} />
        </Suspense>
      ) : (
        <>
          <p>
            Guarda come sono arrivate le scosse, giorno dopo giorno, con i dati veri dell’INGV. Si parte da «
            {SEQUENCES[initial].name}»: puoi cambiare sequenza in qualsiasi momento.
          </p>
          <div>
            <button type="button" className="btn btn--secondary" onClick={() => setOpen(true)}>
              Apri la mappa
            </button>
          </div>
        </>
      )}
    </section>
  );
}
