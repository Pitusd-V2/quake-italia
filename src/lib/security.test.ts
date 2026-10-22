import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { cleanText, isAllowedLink, isSafeId } from './sanitize';
import { parseFeature } from './ingv';
import { sanitizeSettings } from '../state/settings';
import { SECURITY_HEADERS, headersFile } from '../../security/headers';
import { toCsv } from './export';
import type { Quake } from './types';

const feature = (props: Record<string, unknown>, coords: unknown[] = [13.1, 42.8, 10]) => ({
  properties: { eventId: 123, time: '2026-10-20T10:00:00.000000', mag: 3, magType: 'ML', place: '4 km E Norcia (PG)', ...props },
  geometry: { coordinates: coords },
});

describe('Pulizia dei testi esterni', () => {
  it('toglie link, caratteri invisibili e di direzione del testo', () => {
    expect(cleanText('Norcia https://evil.example/x')).toBe('Norcia');
    expect(cleanText('Visita www.truffa.it ora')).toBe('Visita ora');
    expect(cleanText('Paga su soldi-facili.com subito')).toBe('Paga su subito');
    expect(cleanText('No​rcia')).toBe('Norcia'); // zero-width
    expect(cleanText('abc‮gnp.exe')).toBe('abcgnp.exe'); // inversione del testo
    expect(cleanText('a\n\tb')).toBe('ab');
    expect(cleanText('x'.repeat(500), 120)).toHaveLength(120);
  });

  it('lascia intatti i nomi normali, anche con accenti e apostrofi', () => {
    expect(cleanText("4 km a nord-est di L'Aquila (AQ)")).toBe("4 km a nord-est di L'Aquila (AQ)");
    expect(cleanText('Forlì-Cesena')).toBe('Forlì-Cesena');
  });

  it('toglie i pezzi di HTML (che React comunque non eseguirebbe)', () => {
    expect(cleanText('Norcia <img src=x onerror="alert(1)"> centro')).toBe('Norcia centro');
    expect(cleanText('<script>alert(1)</script>Visso')).toBe('alert(1)Visso');
    expect(cleanText('a < b > c')).toBe('a c');
  });
});

describe('Dati INGV manomessi', () => {
  it('scarta eventi con ID, coordinate o magnitudo non plausibili', () => {
    expect(parseFeature(feature({}))).not.toBeNull();
    expect(parseFeature(feature({ eventId: '../../admin' }))).toBeNull();
    expect(parseFeature(feature({ eventId: 'javascript:alert(1)' }))).toBeNull();
    expect(parseFeature(feature({}, [13, 95, 10]))).toBeNull(); // latitudine impossibile
    expect(parseFeature(feature({ mag: 99 }))).toBeNull();
  });

  it('pulisce i testi e i campi tecnici', () => {
    const q = parseFeature(feature({ place: 'Norcia — clicca www.phishing.example', magType: '<b>ML</b>', author: 'x'.repeat(300) }))!;
    expect(q.place).toBe('Norcia — clicca');
    expect(q.magType).toBe('');
    expect(q.author.length).toBeLessThanOrEqual(60);
  });

  it('accetta solo ID sicuri', () => {
    expect(isSafeId('47587292')).toBe(true);
    expect(isSafeId('a b')).toBe(false);
    expect(isSafeId('%2e%2e')).toBe(false);
  });
});

describe('Impostazioni salvate manomesse', () => {
  it('tiene solo valori validi', () => {
    const s = sanitizeSettings({
      home: { name: 'Norcia <script>', lat: 42.79, lon: 13.09 },
      radiusKm: 99999,
      theme: 'evil',
      textSize: 'xlarge',
      expertMode: 'yes',
      alerts: { enabled: true, minMag: -5 },
      checklist: { gas: true, __proto__: true, 'x y': true, mobili: 'sì' },
    });
    expect(s.home?.name).toBe('Norcia'); // i pezzi di HTML vengono tolti
    expect(s.radiusKm).toBe(100);
    expect(s.theme).toBe('light');
    expect(s.textSize).toBe('xlarge');
    // Le chiavi che non esistono più (come la vecchia "modalità esperto") vengono scartate.
    expect('expertMode' in s).toBe(false);
    expect(s.alerts).toEqual({ enabled: true, minMag: 2.5 });
    expect(s.checklist).toEqual({ gas: true });
  });

  it('ignora coordinate impossibili e dati non oggetto', () => {
    expect(sanitizeSettings({ home: { name: 'X', lat: 500, lon: 0 } }).home).toBeNull();
    expect(sanitizeSettings('ciao').theme).toBe('light');
    expect(sanitizeSettings(null).home).toBeNull();
  });
});

describe('Link esterni', () => {
  it('solo https e solo domini in lista', () => {
    expect(isAllowedLink('https://terremoti.ingv.it/event/1')).toBe(true);
    expect(isAllowedLink('http://terremoti.ingv.it/')).toBe(false);
    expect(isAllowedLink('https://terremoti.ingv.it.evil.com/')).toBe(false);
    expect(isAllowedLink('https://user:pw@terremoti.ingv.it/')).toBe(false);
    expect(isAllowedLink('javascript:alert(1)')).toBe(false);
  });

  it('ogni link esterno scritto nel codice è in lista', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(p) && !p.endsWith('.test.ts')) files.push(p);
      }
    };
    walk(join(__dirname, '..'));
    const urls = files.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]));
    expect(urls.length).toBeGreaterThan(5);
    expect(urls.filter((u) => !isAllowedLink(u))).toEqual([]);
  });
});

describe('Header di sicurezza', () => {
  const csp = SECURITY_HEADERS['Content-Security-Policy'];

  it('la CSP non permette script in linea, eval o domini a caso', () => {
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toMatch(/\*/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
  });

  it('contiene gli header principali', () => {
    for (const h of ['Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'X-Frame-Options']) {
      expect(SECURITY_HEADERS[h]).toBeTruthy();
    }
    expect(headersFile()).toContain('Content-Security-Policy:');
  });

  it("la pagina HTML non contiene script in linea (la CSP li bloccherebbe)", () => {
    const html = readFileSync(join(__dirname, '../../index.html'), 'utf8');
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)];
    expect(inline).toHaveLength(0);
  });
});

describe('Privacy allineata al codice', () => {
  // Ogni servizio esterno con cui il sito può collegarsi DEVE essere descritto nella Privacy Policy.
  const DESCRITTI: Record<string, string> = {
    'https://webservices.ingv.it': 'INGV',
    'https://photon.komoot.io': 'Photon',
    'https://tiles.openfreemap.org': 'OpenFreeMap',
  };

  it('ogni dominio permesso dalla CSP è spiegato nella Privacy Policy', async () => {
    const { ALLOWED_CONNECT } = await import('../../security/headers');
    const privacy = readFileSync(join(__dirname, '../legal/PrivacyPage.tsx'), 'utf8');
    for (const host of ALLOWED_CONNECT) {
      expect(DESCRITTI[host], `Nuovo servizio esterno ${host}: aggiorna la Privacy Policy e questo test`).toBeTruthy();
      expect(privacy).toContain(DESCRITTI[host]);
    }
  });
});

describe('Esportazione CSV', () => {
  const q = (over: Partial<Quake>): Quake => ({
    id: '1', time: new Date('2026-10-20T10:00:00Z'), lat: 42.8, lon: 13.1, depthKm: -0.5, mag: 3,
    magType: 'ML', place: 'Norcia', author: 'INGV', version: 1, type: 'earthquake', ...over,
  });

  it('neutralizza i testi che Excel eseguirebbe come formule', () => {
    const row = toCsv([q({ place: '=HYPERLINK("x","clic")', author: '+1+1', magType: '@SUM(A1)' })]).split('\n')[1];
    expect(row).toContain(`"'=HYPERLINK(""x"",""clic"")"`);
    expect(row).toContain("'+1+1");
    expect(row).toContain("'@SUM(A1)");
  });

  it('lascia intatti i numeri, anche negativi', () => {
    const row = toCsv([q({})]).split('\n')[1];
    expect(row).toContain(',-0.5,');
    expect(row).not.toContain("'-0.5");
  });
});
