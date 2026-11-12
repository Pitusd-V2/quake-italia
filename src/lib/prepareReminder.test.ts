import { describe, expect, it } from 'vitest';
import { REMINDER_RULES, sanitizeReminder, shouldRemind } from './prepareReminder';

const H = 3_600_000;
const D = 24 * H;
const T0 = Date.UTC(2026, 10, 1);

describe('Promemoria «Prepara la tua casa» nella pagina iniziale', () => {
  it('non compare il primo giorno, né a gioco finito', () => {
    expect(shouldRemind({}, T0, false)).toBe(false); // prima visita: si segna solo la data
    expect(shouldRemind({ firstSeen: T0 }, T0 + 1 * D, false)).toBe(false);
    expect(shouldRemind({ firstSeen: T0 }, T0 + 3 * D, false)).toBe(true);
    expect(shouldRemind({ firstSeen: T0 }, T0 + 3 * D, true)).toBe(false);
  });

  it('dopo che è comparso resta per qualche ora, poi torna solo dopo una settimana', () => {
    const shown = T0 + 3 * D;
    expect(shouldRemind({ firstSeen: T0, lastShown: shown }, shown + 2 * H, false)).toBe(true);
    expect(shouldRemind({ firstSeen: T0, lastShown: shown }, shown + 2 * D, false)).toBe(false);
    expect(shouldRemind({ firstSeen: T0, lastShown: shown }, shown + REMINDER_RULES.every, false)).toBe(true);
  });

  it('«Non ora» lo nasconde per due settimane', () => {
    const until = T0 + 3 * D + REMINDER_RULES.snooze;
    expect(shouldRemind({ firstSeen: T0, snoozedUntil: until }, until - D, false)).toBe(false);
    expect(shouldRemind({ firstSeen: T0, snoozedUntil: until }, until + 1, false)).toBe(true);
  });

  it('dei dati salvati tiene solo numeri', () => {
    expect(sanitizeReminder({ firstSeen: 'ieri', lastShown: 5, x: 1 })).toEqual({ firstSeen: undefined, lastShown: 5, snoozedUntil: undefined });
    expect(sanitizeReminder(null)).toEqual({ firstSeen: undefined, lastShown: undefined, snoozedUntil: undefined });
  });
});
