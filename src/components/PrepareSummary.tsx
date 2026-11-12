import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, ClipboardCheck } from 'lucide-react';
import { useSettings } from '../state/settings';
import { ALL_MISSIONS, LEVELS, missionDone, progress } from '../lib/prepare';
import { readRaw, writeJson } from '../lib/storage';
import { REMINDER_RULES, sanitizeReminder, shouldRemind, type ReminderState } from '../lib/prepareReminder';

const REMINDER_KEY = 'quakeitalia:promemoria-casa:v1';

const missioni = (n: number) => (n === 1 ? '1 missione' : `${n} missioni`);

/**
 * Il gioco «Prepara la tua casa» in una riga: a che punto sei e il link per continuare. Il gioco ha una pagina sua
 * (/prepara-la-casa): in fondo a «Il mio comune» non lo trovava quasi nessuno. Questa riga sta nelle pagine da cui
 * è naturale arrivarci: «Il mio comune» e «Cosa fare». Nella pagina iniziale c'è solo il promemoria qui sotto.
 */
export function PrepareSummary({ as = 'card' }: { as?: 'card' | 'tip' }) {
  const { settings } = useSettings();
  const p = progress(settings.checklist);
  const text = p.complete
    ? 'Hai fatto tutte le missioni: casa preparata. Ogni tanto ricontrolla il kit.'
    : p.done === 0
      ? `${p.total} missioni concrete in ${LEVELS.length} livelli: dove si chiudono gas, acqua e luce, i mobili da fissare, il kit di emergenza.`
      : `Hai fatto ${missioni(p.done)} su ${p.total}. Continua da dove eri.`;

  if (as === 'tip') {
    return (
      <Link to="/prepara-la-casa" className="tip">
        <ClipboardCheck aria-hidden="true" />
        <span>
          <span className="strong">Prepara la tua casa, una missione alla volta.</span>
          <span className="muted"> {text}</span>
        </span>
      </Link>
    );
  }
  return (
    <Link to="/prepara-la-casa" className="link-card">
      <ClipboardCheck aria-hidden="true" />
      <span>
        <span className="strong">Prepara la tua casa</span>
        <span className="muted">{text}</span>
        {p.done > 0 && <progress className="percorso__bar" max={p.total} value={p.done} aria-label={`Missioni fatte: ${p.done} su ${p.total}`} />}
      </span>
      <ChevronRight aria-hidden="true" />
    </Link>
  );
}

/**
 * Il promemoria nella pagina iniziale: compare ogni tanto, nei giorni tranquilli, finché il gioco non è finito
 * (le regole sono in lib/prepareReminder.ts). Propone una missione sola, la prossima, invece del riassunto.
 */
export function PrepareReminder({ calm }: { calm: boolean }) {
  const { settings } = useSettings();
  const p = progress(settings.checklist);
  const [state, setState] = useState<ReminderState>(() => sanitizeReminder(readRaw(REMINDER_KEY)));
  // Deciso una volta all'apertura della pagina: non compare e scompare mentre la si guarda.
  const [eligible] = useState(() => shouldRemind(state, Date.now(), p.complete));
  const save = (next: ReminderState) => {
    setState(next);
    writeJson(REMINDER_KEY, next);
  };
  const snoozed = state.snoozedUntil != null && state.snoozedUntil > Date.now();
  const visible = eligible && calm && !p.complete && !snoozed;

  useEffect(() => {
    const now = Date.now();
    // La prima visita con il comune: da qui partono i due giorni di attesa.
    if (state.firstSeen == null) save({ ...state, firstSeen: now });
    else if (visible && (state.lastShown == null || now - state.lastShown >= REMINDER_RULES.keepFor)) save({ ...state, lastShown: now });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;
  const next = ALL_MISSIONS.find((m) => !missionDone(m, settings.checklist));
  return (
    <aside className="tip prep-reminder" aria-label="Promemoria: prepara la tua casa">
      <ClipboardCheck aria-hidden="true" />
      <span className="stack-sm">
        <span>
          <span className="strong">Un giorno tranquillo è il momento giusto per prepararsi.</span>
          <span className="muted">
            {' '}
            {p.done > 0 ? `Hai fatto ${missioni(p.done)} su ${p.total}. ` : ''}
            {next && `Prossima missione: «${next.title}» (${next.time}).`}
          </span>
        </span>
        <span className="row">
          <Link to="/prepara-la-casa" className="btn btn--secondary">
            {p.done > 0 ? 'Continua' : 'Comincia'}
          </Link>
          <button type="button" className="btn btn--ghost" onClick={() => save({ ...state, snoozedUntil: Date.now() + REMINDER_RULES.snooze })}>
            Non ora
          </button>
        </span>
      </span>
    </aside>
  );
}
