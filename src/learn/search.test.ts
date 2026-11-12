import { describe, expect, it } from 'vitest';
import { readArticles, buildTexts } from '../../plugins/articoli.ts';
import { articleSections } from '../../plugins/testo-articolo.ts';
import { searchSite, type Found } from './search';
import { buildIndex, matchTerm, search, sentenceWith, stem, termKey } from './searchEngine';

/** I primi risultati, scritti corti: «articolo:slug», «parola:Termine», «pagina:/indirizzo». */
const top = (q: string, n = 3) =>
  searchSite(q)
    .hits.slice(0, n)
    .map(({ item }: { item: Found }) =>
      item.kind === 'articolo' ? `articolo:${item.card.slug}` : item.kind === 'parola' ? `parola:${item.entry.termine}` : `pagina:${item.to.split('#')[0]}`,
    );

describe('Ricerca di «Capire»: le parole', () => {
  it('riduce singolari, plurali e accenti alla stessa parola', () => {
    expect(stem('previsioni')).toBe(stem('previsione'));
    expect(stem('sismiche')).toBe(stem('sismico'));
    expect(stem('repliche')).toBe(stem('replica'));
    expect(stem('questionario')).toBe(stem('questionari'));
    expect(stem('faglie')).toBe(stem('faglia'));
    expect(termKey('Effetti di sito')).toBe(termKey('effetto di sito'));
    expect(termKey('Pericolosità sismica')).toBe('pericolosit sismic');
  });

  it('riconosce quale voce del glossario spiega una parola del testo, senza somiglianze vaghe', () => {
    const terms = ['Magnitudo momento (Mw)', 'Replica', 'Accelerazione di picco (PGA)'];
    expect(matchTerm('repliche', terms)).toBe(1);
    expect(matchTerm('Mw', terms)).toBe(0);
    expect(matchTerm('accelerazione di picco', terms)).toBe(2);
    expect(matchTerm('magnitudo', terms)).toBe(-1);
  });

  it('mostra la frase trovata, con la parola segnata', () => {
    const s = sentenceWith('Prima frase. Le repliche durano settimane. Ultima.', ['replic']);
    expect(s?.map((x) => x.text).join('')).toBe('Le repliche durano settimane.');
    expect(s?.filter((x) => x.hit).map((x) => x.text)).toEqual(['repliche']);
  });

  it('mette prima chi contiene tutte le parole; se nessuno le contiene tutte, lo dice', () => {
    const index = buildIndex([
      { item: 'a', fields: [{ text: 'Magnitudo e intensità', weight: 10 }] },
      { item: 'b', fields: [{ text: 'Le faglie', weight: 10 }, { text: 'la magnitudo conta', weight: 1 }] },
    ]);
    expect(search(index, 'magnitudo').hits.map((h) => h.item)).toEqual(['a', 'b']);
    const none = search(index, 'faglie intensità');
    expect(none.partial).toBe(true);
    expect(none.hits).toHaveLength(2);
    // Solo parole che non aiutano («il», «come»): nessun risultato, invece di tutto il sito.
    expect(search(index, 'il la di come').hits).toHaveLength(0);
  });
});

describe('Ricerca di «Capire»: sugli articoli veri', () => {
  it('trova con le parole di tutti i giorni', () => {
    expect(top('assestamento')).toContain('articolo:repliche-e-sequenze');
    expect(top('scossa di assestamento')).toContain('articolo:repliche-e-sequenze');
    expect(top('previsioni')).toContain('articolo:si-possono-prevedere');
    expect(top('paura', 5)).toContain('articolo:mal-da-terremoto');
    expect(top('capogiri')).toContain('articolo:mal-da-terremoto');
    expect(top('richter mercalli differenza')).toContain('articolo:magnitudo-e-intensita');
    // La domanda a cui risponde l'articolo conta come le parole chiave.
    expect(top('quanto dura', 1)).toEqual(['articolo:repliche-e-sequenze']);
    expect(top('perché sento tremare', 1)).toEqual(['articolo:mal-da-terremoto']);
  });

  it('trova anche le pagine pratiche e le parole del glossario', () => {
    expect(top('crepe')).toContain('pagina:/danni-casa');
    expect(top('animali')).toContain('pagina:/e-vero');
    expect(top('kit', 1)).toEqual(['pagina:/prepara-la-casa']);
    expect(top('ipocentro', 1)).toEqual(['parola:Ipocentro']);
    expect(top('faglia normale', 1)).toEqual(['parola:Faglia normale']);
    expect(top('mw', 1)).toEqual(['parola:Magnitudo momento (Mw)']);
    // Una parola larga: prima la voce con quel nome, poi gli articoli, non tutte le voci che la contengono.
    expect(top('magnitudo', 3)).toEqual(['parola:Magnitudo', 'articolo:magnitudo-e-intensita', 'articolo:perche-la-magnitudo-cambia']);
  });

  it('nel testo estratto dagli articoli non restano pezzi di codice', () => {
    const { articles } = readArticles();
    for (const a of buildTexts(articles)) {
      expect(a.sezioni.length, a.slug).toBeGreaterThan(0);
      const text = a.sezioni.map((s) => `${s.titolo ?? ''}\n${s.testo}`).join('\n');
      expect(text, a.slug).not.toMatch(/[{}<>]|className|=>|^import /m);
      expect(text.length, a.slug).toBeGreaterThan(500);
    }
  });

  it('legge titoli, parti, numeri calcolati e figure di un articolo', () => {
    const mdx = [
      '---', 'titolo: x', '---',
      "import { A } from '../x'",
      '',
      '<Part n={1} kicker="La storia">Onna e Monticchio</Part>',
      '',
      'Sono gli <dfn>effetti di sito</dfn>: circa {f1(x)} volte, **molto**.',
      '',
      '<Figura />',
      '',
      '### Come lo sappiamo',
      '',
      '- Primo [punto](https://example.org).',
    ].join('\n');
    expect(articleSections(mdx)).toEqual([
      { titolo: 'Onna e Monticchio', parte: 'Onna e Monticchio', testo: 'Sono gli effetti di sito: circa … volte, molto.' },
      { titolo: 'Come lo sappiamo', parte: 'Onna e Monticchio', testo: 'Primo punto.' },
    ]);
  });
});
