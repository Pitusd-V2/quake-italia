import { describe, expect, it } from 'vitest';
import { ALL_MISSIONS, LEVELS, migrateChecklist, missionDone, missionKeys, progress, withKeys } from './prepare';
import { sanitizeSettings } from '../state/settings';

const mission = (id: string) => ALL_MISSIONS.find((m) => m.id === id)!;

describe('«Prepara la tua casa» a livelli', () => {
  it('ha chiavi valide per il salvataggio e tutte diverse', () => {
    const keys = ALL_MISSIONS.flatMap(missionKeys);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(k).toMatch(/^[a-z]{1,20}$/);
    // Il salvataggio tiene fino a 60 chiavi: ne serve molto meno.
    expect(keys.length).toBeLessThan(60);
  });

  it('una missione a pezzi è fatta solo quando sono fatti tutti', () => {
    const gas = mission('gas');
    let c = withKeys({}, ['gasrubinetto', 'acquarubinetto'], true);
    expect(missionDone(gas, c)).toBe(false);
    c = withKeys(c, ['luceinterruttore'], true);
    expect(missionDone(gas, c)).toBe(true);
    // Togliere la spunta alla missione toglie tutti i pezzi, senza lasciare chiavi «false» nel salvataggio.
    expect(withKeys(c, missionKeys(gas), false)).toEqual({});
  });

  it('il distintivo arriva a livello finito', () => {
    const level1 = LEVELS[0].missions.flatMap(missionKeys);
    const p = progress(withKeys({}, level1, true));
    expect(p.levels[0].complete).toBe(true);
    expect(p.levels[1].complete).toBe(false);
    expect(p.done).toBe(LEVELS[0].missions.length);
    expect(progress(withKeys({}, ALL_MISSIONS.flatMap(missionKeys), true)).complete).toBe(true);
  });

  it('chi aveva spuntato la vecchia lista non perde niente', () => {
    const old = { area: true, gas: true, kit: true, medicine: true, casa: true, punto: true };
    const c = migrateChecklist(old);
    expect(missionDone(mission('area'), c)).toBe(true);
    expect(missionDone(mission('gas'), c)).toBe(true);
    expect(missionDone(mission('punto'), c)).toBe(true);
    expect(missionDone(mission('tecnico'), c)).toBe(true);
    // Il vecchio kit (torcia, radio, acqua, pronto soccorso) e le vecchie «medicine e documenti» fanno il kit intero.
    expect(missionDone(mission('kit'), c)).toBe(true);
    expect(c).not.toHaveProperty('gas');
    expect(c).not.toHaveProperty('casa');
    // E succede già quando le impostazioni vengono lette.
    expect(sanitizeSettings({ checklist: old }).checklist).toEqual(c);
  });
});
