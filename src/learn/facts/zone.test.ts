import { describe, expect, it } from 'vitest';
import {
  agMaxMps04,
  altiCalabria,
  altiSicilia,
  comuniPrimaDiMps04,
  elenco,
  milioniPrimaDiMps04,
  regione,
  popPrimaDiMps04,
  primaDiMps04,
  puntoMax,
  quotaComuniPrimaDiMps04,
  quotaPopPrimaDiMps04,
  sogliaAlti,
  ugualiAl2003,
  aquila,
  atto,
  attoPiuRecente,
  attoPiuVecchio,
  bloccoAgMax,
  bloccoAgMin,
  bloccoColonne,
  bloccoGriglia,
  bloccoRighe,
  cagliari,
  calabria,
  cat1984,
  classificati1984,
  codiciDiversi,
  comuni2003,
  comuniOggi,
  comuniZona,
  daIIaZona1,
  daNonClassificati,
  divisi,
  g2,
  magliaAg,
  magliaIndici,
  mirandola,
  nEnti,
  nessunoDeclassato,
  nuoviSenzaCategoria,
  passoGrigliaKm,
  piemonte3S,
  popDivisi,
  popTotale,
  popZona,
  proposta1998,
  puntiGriglia,
  quotaPop,
  quotaPopZone12,
  regioni,
  roma,
  romaStoria,
  sanGiuliano,
  sardegna,
  senzaZona1,
  senzaZona4,
  SOGLIE,
  sottozoneStessaZona,
  unaSolaZona,
  zone2003,
  zoneData,
} from './zone';

const somma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe('zone sismiche: i dati scaricati sono quelli attesi', () => {
  it('l’elenco DPC coincide con quello del sito e con l’ISTAT', () => {
    const c = zoneData.controlli;
    expect(c.ugualeAlSito).toBe(true);
    expect(c.senzaPopolazione).toEqual([]);
    expect(c.comuniIstat).toBe(comuniOggi);
    expect(c.popIstatTotale).toBe(popTotale);
    expect(c.attiInvariati).toBe(true);
  });

  it('ogni file scaricato ha la sua impronta e la sua richiesta', () => {
    expect(Object.keys(zoneData.impronteSha256)).toHaveLength(5);
    expect(zoneData.impronteSha256['all_1_Com_Class.xls']).toBe('d177a9588dff814b353291b9391629e8a615dcd48ef6d4e60967a5629aeda2ac');
    expect(zoneData.richieste).toHaveLength(5);
  });
});

describe('zone sismiche oggi (DPC, maggio 2025)', () => {
  it('comuni per zona principale', () => {
    expect(comuniOggi).toBe(7896);
    expect(comuniZona).toEqual([796, 2339, 3049, 1712]);
    expect(somma(comuniZona)).toBe(comuniOggi);
  });

  it('tre comuni divisi tra zone con numeri diversi, quasi tutto Roma', () => {
    expect(divisi.map((d) => d.comune).sort()).toEqual(['Pescorocchiano', 'Roma', 'Vejano']);
    expect(roma.codice).toBe('2A-3A-3B');
    expect(roma.pop).toBe(2747290);
    expect(sottozoneStessaZona).toHaveLength(3);
    expect(codiciDiversi).toBe(22);
  });

  it('abitanti per zona (ISTAT, 1° gennaio 2025)', () => {
    expect(popZona).toEqual([3280772, 20466495, 24266440, 8178505]);
    expect(popDivisi).toBe(2751252);
    expect(popTotale).toBe(58943464);
    expect(somma(popZona) + popDivisi).toBe(popTotale);
    expect(quotaPop).toEqual([5.6, 34.7, 41.2, 13.9]);
    expect(quotaPopZone12).toBe(40.3);
  });
});

describe('zone sismiche per regione', () => {
  it('21 enti, ognuno con il suo atto', () => {
    expect(nEnti).toBe(21);
    expect(regioni.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.atto.data))).toBe(true);
    expect(somma(regioni.map((r) => r.comuni))).toBe(comuniOggi);
    for (let k = 0; k < 4; k++) expect(somma(regioni.map((r) => r.zone[k]))).toBe(comuniZona[k]);
  });

  it('l’atto più vecchio e il più recente', () => {
    expect(attoPiuVecchio.nome).toBe('Campania');
    expect(atto(attoPiuVecchio)).toBe('Delibera della Giunta regionale n. 5447 del 7 novembre 2002');
    expect(attoPiuRecente.nome).toBe('Abruzzo');
    expect(attoPiuRecente.atto.data).toBe('2024-07-15');
  });

  it('i casi particolari', () => {
    expect(sardegna.zone).toEqual([0, 0, 0, 377]);
    expect(calabria.zone).toEqual([257, 147, 0, 0]);
    expect(piemonte3S).toBe(165);
    expect(unaSolaZona.map((r) => r.nome).sort()).toEqual(['Provincia autonoma di Bolzano', 'Sardegna', "Valle d'Aosta"]);
    expect(senzaZona1).toContain('Toscana');
    expect(senzaZona4).toHaveLength(12);
  });

  it('quattro elenchi sono più vecchi della mappa MPS04, tre uguali al 2003', () => {
    expect(primaDiMps04.map((r) => r.nome)).toEqual(['Campania', 'Calabria', 'Puglia', 'Sardegna']);
    expect(comuniPrimaDiMps04).toBe(1588);
    expect(quotaComuniPrimaDiMps04).toBe(20);
    expect(popPrimaDiMps04).toBeGreaterThan(12.8e6);
    expect(popPrimaDiMps04).toBeLessThan(13e6);
    expect(quotaPopPrimaDiMps04).toBe(22);
    expect(ugualiAl2003).toEqual(['Calabria', 'Puglia', 'Sardegna']);
    expect(calabria.confronto2003).toEqual({ trovati: 398, uguali: 398, nonTrovati: 6 });
    expect(milioniPrimaDiMps04).toBe(12.9);
    // In Campania quasi tutti i comuni hanno ancora la zona del 2003.
    const cam = regione('Campania').confronto2003;
    expect(cam.uguali / cam.trovati).toBeGreaterThan(0.95);
  });
});

describe('la storia (Allegato A dell’OPCM 3274/2003)', () => {
  it('nel 1984 i comuni classificati erano 2.965', () => {
    expect(comuni2003).toBe(8101);
    expect(cat1984).toEqual({ I: 368, II: 2498, III: 99, NC: 5126 });
    expect(classificati1984).toBe(2965);
    expect(nuoviSenzaCategoria).toBe(10);
    expect(classificati1984 + cat1984.NC + nuoviSenzaCategoria).toBe(comuni2003);
  });

  it('la proposta del 1998 e le zone del 2003', () => {
    expect(proposta1998).toEqual({ I: 542, II: 1810, III: 2258, NC: 3481 });
    expect(zone2003).toEqual([716, 2324, 1634, 3427]);
  });

  it('dove finirono i non classificati, e nessuno scese', () => {
    expect(daNonClassificati).toEqual([0, 85, 1621, 3420]);
    expect(daIIaZona1).toBe(348);
    expect(nessunoDeclassato).toBe(true);
  });

  it('i comuni d’esempio, letti dai file', () => {
    expect([sanGiuliano.cat1984, sanGiuliano.proposta1998, sanGiuliano.zona2003, sanGiuliano.codice2025]).toEqual(['N.C.', 'II', 2, '2']);
    expect([aquila.cat1984, aquila.zona2003, aquila.zona2025]).toEqual(['II', 2, 1]);
    expect([mirandola.cat1984, mirandola.zona2003, mirandola.zona2025]).toEqual(['N.C.', 3, 3]);
    expect([romaStoria.zona2003, romaStoria.codice2025]).toEqual([3, '2A-3A-3B']);
    expect([cagliari.zona2003, cagliari.zona2025]).toEqual([4, 4]);
  });
});

describe('la griglia MPS04 (nostro calcolo)', () => {
  it('passo e valori', () => {
    expect(puntiGriglia).toBe(16921);
    expect(passoGrigliaKm).toBe(5.6);
    expect(zoneData.griglia.passoKmP05).toBeGreaterThan(5.5);
    expect(zoneData.griglia.passoKmP95).toBeLessThan(5.6);
    expect(agMaxMps04).toBe(0.28);
    expect(agMaxMps04).toBeLessThan(SOGLIE[1].a);
  });

  it('i valori più alti: pochi punti in Calabria e in Sicilia sud-orientale', () => {
    expect(sogliaAlti).toBe(0.275);
    expect(altiCalabria).toHaveLength(19);
    expect(altiSicilia).toHaveLength(6);
    // Il massimo è nella Sicilia sud-orientale (Iblei), non in Calabria.
    expect(puntoMax[2]).toBe(zoneData.griglia.agMax);
    expect(puntoMax[1]).toBeLessThan(37.3);
    expect(Math.max(...altiCalabria.map((p) => p[2]))).toBe(0.2766);
    for (const p of altiCalabria) expect(p[1]).toBeGreaterThan(38.9);
    for (const p of altiSicilia) expect(p[1]).toBeLessThan(37.3);
  });

  it('il blocco del disegno è una griglia di 5 righe per 4, tutta in zona 2', () => {
    expect([bloccoRighe, bloccoColonne]).toEqual([5, 4]);
    expect(bloccoGriglia).toHaveLength(20);
    expect(bloccoAgMin).toBeGreaterThan(SOGLIE[2].da);
    expect(bloccoAgMax).toBeLessThanOrEqual(SOGLIE[2].a);
    expect(magliaIndici).toEqual([9, 10, 13, 14]);
    expect(magliaAg).toEqual([0.2083, 0.2082, 0.2106, 0.2093]);
    // Righe da nord a sud, in ogni riga da ovest a est.
    for (let i = 1; i < bloccoGriglia.length; i++) {
      if (i % bloccoColonne) expect(bloccoGriglia[i][0]).toBeGreaterThan(bloccoGriglia[i - 1][0]);
      else expect(bloccoGriglia[i][1]).toBeLessThan(bloccoGriglia[i - 1][1] - 0.04);
    }
  });
});

describe('scrittura', () => {
  it('g2 tiene due decimali con la virgola', () => {
    expect(g2(0.25)).toBe('0,25');
    expect(g2(0.2)).toBe('0,20');
    expect(g2(0.2083)).toBe('0,21');
    expect(g2(0)).toBe('0,00');
  });

  it('elenco unisce con le virgole e la «e»', () => {
    expect(elenco(['A'])).toBe('A');
    expect(elenco(['A', 'B', 'C'])).toBe('A, B e C');
  });
});
