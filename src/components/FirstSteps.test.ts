import { describe, expect, it } from 'vitest';
import { localDay, shouldShowFirstSteps } from './FirstSteps';

describe('«Per cominciare» dopo la scelta del comune', () => {
  const today = '2026-11-13';

  it('resta per la giornata in cui si è scelto il comune, finché non si chiude', () => {
    expect(shouldShowFirstSteps({ day: today, closed: false }, today)).toBe(true);
    expect(shouldShowFirstSteps({ day: today, closed: true }, today)).toBe(false);
  });

  it('il giorno dopo non ricompare, e senza dati salvati non compare', () => {
    expect(shouldShowFirstSteps({ day: '2026-11-12', closed: false }, today)).toBe(false);
    expect(shouldShowFirstSteps(null, today)).toBe(false);
    expect(shouldShowFirstSteps({ day: 'ieri' }, today)).toBe(false);
  });

  it('scrive la data del dispositivo come AAAA-MM-GG', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
