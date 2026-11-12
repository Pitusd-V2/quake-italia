/**
 * Quando ricordare «Prepara la tua casa» nella pagina iniziale. Non subito e non sempre: la pagina iniziale serve a
 * sapere se è successo qualcosa, e un promemoria fisso diventa rumore che nessuno legge più.
 *
 * Il promemoria compare solo se:
 *  - il gioco non è finito;
 *  - sono passati almeno 2 giorni dalla prima visita con il comune impostato (chi arriva oggi ha altro da guardare);
 *  - è passata almeno una settimana dall'ultima volta che è comparso (se è comparso nelle ultime ore resta, così non
 *    sparisce ricaricando la pagina);
 *  - chi legge non ha detto «Non ora» nelle ultime due settimane.
 * La pagina iniziale aggiunge l'ultima condizione: è un giorno tranquillo (nessuna scossa sentita da te).
 * Tutto resta sul dispositivo, come le altre scelte.
 */
const DAY = 86_400_000;
export const REMINDER_RULES = { firstAfter: 2 * DAY, every: 7 * DAY, keepFor: 12 * 3_600_000, snooze: 14 * DAY };

export interface ReminderState {
  firstSeen?: number;
  lastShown?: number;
  snoozedUntil?: number;
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

/** Lo stato salvato può essere stato modificato a mano: teniamo solo numeri. */
export function sanitizeReminder(raw: unknown): ReminderState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return { firstSeen: num(r.firstSeen), lastShown: num(r.lastShown), snoozedUntil: num(r.snoozedUntil) };
}

export function shouldRemind(s: ReminderState, now: number, complete: boolean): boolean {
  if (complete || s.firstSeen == null) return false;
  if (now - s.firstSeen < REMINDER_RULES.firstAfter) return false;
  if (s.snoozedUntil != null && now < s.snoozedUntil) return false;
  if (s.lastShown == null) return true;
  const since = now - s.lastShown;
  return since < REMINDER_RULES.keepFor || since >= REMINDER_RULES.every;
}
