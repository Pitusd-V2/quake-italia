import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readArticles } from '../../plugins/articoli.ts';
import { CATALOG, hasArticleFile } from './catalog';
import { PERCORSI } from './percorsi';
import { formatInt } from '../lib/format';
import slab from '../data/learn/slab.json';
import gr from '../data/learn/gr-italia.json';
import cpti from '../data/learn/cpti15.json';
import tempo from '../data/learn/tempo-terremoto.json';
import { amatrice, conMw, d1, flegreiMd, marche, momentoVolte, norcia } from './facts/magnitudo';
import * as loc from './facts/localizzazione';
import * as fa from './facts/faglie';

const { articles } = readArticles();
const summary = (slug: string) => articles.find((a) => a.slug === slug)!.riassunto.join(' ');

describe('Articoli di «Capire»', () => {
  it('il catalogo dell’app e i file coincidono', () => {
    expect(CATALOG.map((c) => c.slug).sort()).toEqual(articles.map((a) => a.slug).sort());
    for (const c of CATALOG) expect(hasArticleFile(c.slug), c.slug).toBe(true);
  });

  it('ogni percorso usato esiste e ogni articolo ha almeno 3 fonti, di cui una con link', () => {
    for (const a of articles) {
      expect(PERCORSI.some((p) => p.id === a.percorso), a.slug).toBe(true);
      expect(a.fonti.length, a.slug).toBeGreaterThanOrEqual(3);
      expect(a.fonti.some((f) => f.url), a.slug).toBe(true);
    }
  });

  // I riassunti sono testo fisso: questi numeri devono restare uguali ai dati da cui vengono.
  it('i numeri dei riassunti coincidono con i dati', () => {
    expect(summary('perche-l-italia-trema')).toContain(`${slab.statistiche.maxProfonditaKm} km`);
    expect(summary('tante-piccole-poche-grandi')).toContain(formatInt(gr.totale));
    expect(summary('grandi-terremoti-della-storia')).toContain(`${formatInt(cpti.totaleEventi)} terremoti dall’anno ${cpti.primoAnno} al ${cpti.ultimoAnno}`);
    expect(summary('tempo-da-terremoto')).toContain(`${tempo.meteo.terremoti} terremoti forti`);
    expect(summary('tempo-da-terremoto')).toContain(`${formatInt(tempo.mesi.n)} terremoti`);
    expect(summary('perche-la-magnitudo-cambia')).toContain(`la ML era ${d1(norcia.mlPrincipale)} e la Mw ${d1(norcia.mw)}`);
  });

  // L'articolo sulle magnitudo racconta questi fatti: se un giorno il catalogo INGV cambiasse, il test lo dice.
  it('«Perché la magnitudo cambia»: i fatti del testo valgono ancora nei dati INGV', () => {
    expect(norcia.mwTutteUguali).toBe(true); // «le stime della magnitudo momento danno tutte 6,5»
    expect(norcia.mw! - norcia.mlMax!).toBeGreaterThan(0.2); // Norcia si stacca da tutte le sue ML
    expect(conMw.filter((s) => s.mw! > 6.1).map((s) => s.nome)).toEqual(['Norcia']); // «l’unica con Mw sopra 6,1»
    for (const s of conMw.filter((x) => x.nome !== 'Norcia')) {
      // «per quasi tutte, la Mw cade dentro o accanto al gruppo delle ML»
      expect(s.mw!).toBeGreaterThanOrEqual(s.mlMin! - 0.11);
      expect(s.mw!).toBeLessThanOrEqual(s.mlMax! + 0.21);
    }
    expect(marche.mw!).toBeLessThan(marche.mlPrincipale!); // la Mw più bassa della ML
    expect(Math.round(momentoVolte(norcia.mw!, amatrice.mw!) * 2) / 2).toBe(5.5); // «circa cinque volte e mezzo»
    expect([flegreiMd.prima, flegreiMd.finale]).toEqual([4.4, 4.6]);
  });

  it('«Come l’INGV trova un terremoto»: i fatti del testo valgono ancora nei dati INGV', () => {
    expect(summary('come-si-trova-un-terremoto')).toContain(
      `l’epicentro a ${loc.int(loc.stat.auto.epiMeta)} km da quello finale e la profondità a ${loc.int(loc.stat.auto.profMeta)} km`,
    );
    expect(summary('come-si-trova-un-terremoto')).toContain('circa 7-8 km per ogni secondo');
    expect(loc.kmPerSecondo).toBeGreaterThan(7);
    expect(loc.kmPerSecondo).toBeLessThan(8.5);
    expect(loc.primaAuto.dopoSecondi).toBe(19); // il titolo della prima parte: «Diciannove secondi»
    expect(loc.stat.auto.profMeta).toBeGreaterThan(loc.stat.auto.epiMeta); // «la profondità sbagliava di più»
    expect(Math.max(loc.stat.sala.epiMeta, loc.stat.sala.profMeta)).toBeLessThan(2.5); // «entro un paio di chilometri»
    expect(loc.piuVicina.km).toBeLessThan(loc.bollettino.profKm); // «a Pietrapaola la regola era rispettata»
    expect(loc.piuVicina.nome).toBe('Pietrapaola');
  });

  it('«Le faglie»: i fatti del testo valgono ancora nei dati INGV', () => {
    const app = fa.zona('Appennino centrale');
    const pad = fa.zona('Pianura Padana');
    const sic = fa.zona('Sicilia e Tirreno meridionale');
    expect(fa.suDieci(app.quota[0])).toBe('quasi 9 su 10'); // riassunto: «quasi 9 scosse su 10 … su faglie normali»
    expect(summary('le-faglie')).toContain('quasi 9 scosse su 10');
    expect(pad.quota[1]).toBeGreaterThan(0.7); // «sotto la Pianura Padana … su faglie inverse»
    expect(sic.quota[2]).toBeGreaterThan(0.4); // «quasi metà delle scosse è trascorrente»
    expect(sic.quota[2]).toBeLessThan(0.5);
    expect([fa.norcia.tipo, fa.aquila.tipo, fa.amatrice.tipo]).toEqual(['normale', 'normale', 'normale']);
    expect([fa.finale.tipo, fa.medolla.tipo, fa.marche.tipo]).toEqual(['inversa', 'inversa', 'inversa']);
    expect(fa.croazia.tipo).toBe('trascorrente');
    expect(fa.profondeSud.length).toBeGreaterThan(fa.profonde.length / 2);
  });
});

describe('Controlli sugli articoli (fermano il build)', () => {
  const write = (name: string, fm: string) => {
    const dir = mkdtempSync(join(tmpdir(), 'articoli-'));
    writeFileSync(join(dir, name), `---\n${fm}\n---\n\nTesto.\n`);
    return dir;
  };
  const good = `titolo: Prova
sottotitolo: Un articolo di prova per i test.
domanda: A cosa serve un articolo di prova?
percorso: le-basi
ordine: 1
minuti: 3
verificato: 2026-11-01
riassunto: [Primo punto., Secondo punto.]
fonti:
  - testo: Fonte uno
    url: https://doi.org/10.1/abc
  - testo: Fonte due
  - testo: Fonte tre`;

  it('un articolo in regola passa', () => {
    expect(readArticles(write('prova.mdx', good), '2026-11-03').articles).toHaveLength(1);
  });

  it('meno di 3 fonti: errore', () => {
    const fm = good.replace('  - testo: Fonte tre', '');
    expect(() => readArticles(write('prova.mdx', fm), '2026-11-03')).toThrow(/almeno 3 fonti/);
  });

  it('link a un sito non in lista: errore', () => {
    const fm = good.replace('https://doi.org/10.1/abc', 'https://sito-a-caso.example/x');
    expect(() => readArticles(write('prova.mdx', fm), '2026-11-03')).toThrow(/link non ammesso/);
  });

  it('data di verifica nel futuro o percorso inesistente: errore', () => {
    expect(() => readArticles(write('prova.mdx', good.replace('2026-11-01', '2030-01-01')), '2026-11-03')).toThrow(/nel futuro/);
    expect(() => readArticles(write('prova.mdx', good.replace('le-basi', 'boh')), '2026-11-03')).toThrow(/sconosciuto/);
  });

  it('nome del file non valido: errore', () => {
    expect(() => readArticles(write('Prova Strana.mdx', good), '2026-11-03')).toThrow(/nome del file/);
  });
});
