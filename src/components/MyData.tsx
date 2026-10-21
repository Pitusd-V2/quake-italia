import { useState } from 'react';
import { Link } from 'react-router';
import { Trash2 } from 'lucide-react';

/**
 * Cancella tutto ciò che Quake Italia ha salvato su questo dispositivo:
 * impostazioni, checklist, copia offline (cache) e service worker.
 * È il modo concreto per esercitare il "diritto alla cancellazione".
 */
async function wipeLocalData(): Promise<void> {
  const clear = (store: Storage) => {
    for (const key of Object.keys(store)) if (key.startsWith('quakeitalia:')) store.removeItem(key);
  };
  try {
    clear(localStorage);
    clear(sessionStorage);
  } catch {
    /* archivio non disponibile */
  }
  try {
    if ('caches' in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {
    /* niente da cancellare */
  }
}

export function MyData() {
  const [step, setStep] = useState<'idle' | 'confirm' | 'working'>('idle');

  const wipe = async () => {
    setStep('working');
    await wipeLocalData();
    // Ricarica da zero: il sito riparte come alla prima visita.
    window.location.assign('/');
  };

  return (
    <section className="card stack" aria-labelledby="s-data" id="i-tuoi-dati">
      <h2 id="s-data">I tuoi dati</h2>
      <p>
        Quake Italia salva solo su questo dispositivo: il tuo comune, le preferenze, la checklist e una copia dei dati per
        funzionare senza rete. Noi non riceviamo niente. Dettagli nella <Link to="/privacy">Privacy Policy</Link>.
      </p>
      {step === 'idle' && (
        <button type="button" className="btn btn--secondary btn--danger-text" onClick={() => setStep('confirm')}>
          <Trash2 aria-hidden="true" /> Cancella tutti i miei dati da questo dispositivo
        </button>
      )}
      {step !== 'idle' && (
        <div className="notice notice--warn" role="alert">
          <div className="notice__body">
            <p className="strong">Vuoi davvero cancellare tutto?</p>
            <p>Comune, preferenze e checklist verranno cancellati da questo dispositivo. Non si può annullare.</p>
            <div className="row">
              <button type="button" className="btn btn--primary" onClick={wipe} disabled={step === 'working'}>
                {step === 'working' ? 'Sto cancellando…' : 'Sì, cancella tutto'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setStep('idle')} disabled={step === 'working'}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
