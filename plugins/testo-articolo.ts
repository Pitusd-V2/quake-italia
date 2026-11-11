/**
 * Dal file di un articolo (MDX) al suo testo semplice, diviso in paragrafi con il loro titolo: serve alla ricerca
 * di «Capire» (plugins/articoli.ts ne fa un indice al build).
 *
 * Non è una lettura completa di MDX: conosce le forme usate negli articoli (contenuti/COME-SCRIVERE.md). I numeri
 * presi dai dati, scritti come {n(x)}, qui diventano «…»: l'indice non può calcolarli. Un test controlla che in
 * tutti gli articoli veri non restino pezzi di codice nel testo estratto.
 */
import type { Sezione } from '../src/learn/articleTypes.ts';

/** Toglie i gruppi tra graffe: «…» se sono un numero dentro una frase, niente se sono commenti o codice su più righe. */
function stripBraces(s: string): string {
  let out = '';
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (c === '}' && depth > 0) {
      depth--;
      if (depth === 0) {
        const group = s.slice(start, i + 1);
        out += group.includes('\n') || group.startsWith('{/*') ? '' : '…';
      }
    } else if (depth === 0) out += c;
  }
  return out;
}

const clean = (line: string) =>
  line
    .replace(/^>\s?/, '')
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*|__|`/g, '')
    .replace(/(^|[\s(«“"’'])[*_](?=\S)/g, '$1')
    .replace(/(?<=\S)[*_](?=$|[\s.,;:!?)»”"’'])/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s*\|\s*/g, ' · ')
    .replace(/^ · | · $/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function articleSections(source: string): Sezione[] {
  let s = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  s = s.replace(/^---\n[\s\S]*?\n---\n/, '');
  // I titoli delle parti («a strati») diventano righe di titolo.
  s = s.replace(/<Part\b[^>]*>([\s\S]*?)<\/Part>/g, (_m, title: string) => `\n## ${title.trim()}\n`);
  s = stripBraces(s);
  // Marcatori dentro le frasi (<dfn>, <strong>, <p className=…>): resta il testo.
  s = s.replace(/<\/?[a-z][^<>]*>/g, '');

  const sections: Sezione[] = [];
  let parte: string | null = null;
  let current: { titolo: string | null; parte: string | null; paragraphs: string[] } = { titolo: null, parte, paragraphs: [] };
  let paragraph: string[] = [];
  const endParagraph = () => {
    const text = paragraph.join(' ').trim();
    if (text) current.paragraphs.push(text);
    paragraph = [];
  };
  const endSection = () => {
    endParagraph();
    if (current.titolo || current.paragraphs.length) sections.push({ titolo: current.titolo, parte: current.parte, testo: current.paragraphs.join('\n') });
  };

  for (const raw of s.split('\n')) {
    const line = raw.trim();
    if (!line) {
      endParagraph();
      continue;
    }
    // Import, figure e righe di separazione delle tabelle non sono testo.
    if (/^(import|export)\s/.test(line) || /^<[A-Z]/.test(line) || /^\|?[\s:|-]+\|?$/.test(line)) continue;
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      endSection();
      const titolo = clean(heading[2]);
      if (heading[1].length <= 2) parte = titolo;
      current = { titolo, parte, paragraphs: [] };
      continue;
    }
    const text = clean(line);
    if (text && text !== '…') paragraph.push(text);
  }
  endSection();
  return sections;
}
