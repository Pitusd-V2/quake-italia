import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { creditsSection, END, README, START } from '../scripts/build-credits.mjs';

/** Le righe dell'elenco (una per fonte) dentro un testo dei crediti. */
const entries = (text: string) => text.split('\n').filter((l) => l.startsWith('- '));

describe('Crediti nel README', () => {
  it('il README contiene tutte le fonti citate dal sito, e nessuna che non c’è più', () => {
    const readme = readFileSync(README, 'utf8').replace(/\r\n/g, '\n');
    const a = readme.indexOf(START.slice(0, 20));
    const b = readme.indexOf(END);
    if (a < 0 || b < a) throw new Error('Nel README mancano i crediti completi. Esegui: npm run crediti');

    const expected = creditsSection();
    const actual = readme.slice(a, b + END.length);
    if (actual === expected) return;

    const have = entries(actual);
    const want = entries(expected);
    const missing = want.filter((l) => !have.includes(l));
    const gone = have.filter((l) => !want.includes(l));
    const lines = [
      'I crediti del README non sono aggiornati.',
      missing.length
        ? `\n${missing.length === 1 ? 'Manca 1 riconoscimento' : `Mancano ${missing.length} riconoscimenti`}:\n${missing.join('\n')}`
        : '',
      gone.length
        ? `\n${gone.length === 1 ? 'C’è 1 fonte che non è più citata' : `Ci sono ${gone.length} fonti che non sono più citate`}:\n${gone.join('\n')}`
        : '',
      !missing.length && !gone.length ? '\nLe fonti ci sono tutte, ma sono cambiati titoli, ordine o conteggi.' : '',
      '\nPer sistemare: npm run crediti',
    ];
    throw new Error(lines.filter(Boolean).join('\n'));
  });

  it('ogni articolo ha il suo gruppo, e la citazione del database storico è quella dell’INGV', () => {
    const text = creditsSection();
    expect(text).toContain('#### Effetti di sito');
    expect(text).toContain('Database Macrosismico Italiano (DBMI15), versione 4.0 \\[Data set\\]');
    expect(text.match(/<details>/g)).toHaveLength(2);
  });
});
