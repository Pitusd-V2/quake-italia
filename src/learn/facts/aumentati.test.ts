import { describe, expect, it } from 'vitest';
import {
  ANNI_FDSN,
  ANNI_HORUS,
  aumentatiData,
  cf1985_2014,
  cf2025,
  cfW3_2025,
  completoDal,
  fdsn,
  fdsnAnni,
  horus,
  horusAnni,
  ind25Dopo,
  ind25Prima,
  ind4Periodi,
  m25_1985,
  m25_2006,
  m3_1985,
  m3_2006,
  MC_ANNUALE,
  MC_TAB10,
  mw6Secolo,
  piccoW4,
  piuForte,
  quotaMd1985,
  quotaMl2006,
  quotaSeq2016,
  rapportoInd3,
  rapportoInd4,
  rapportoInd4Recente,
  richiesteFdsn,
  tot1985,
  tot2006,
  tot2016,
  tot2025,
  totMaxDal2019,
  totMinDal2019,
} from './aumentati';

describe('i terremoti sono aumentati? Il file dei dati', () => {
  it('ha le fonti, le licenze e le richieste per rifare il calcolo', () => {
    expect(aumentatiData.fonti.fdsn.licenza).toBe('CC BY 4.0');
    expect(aumentatiData.fonti.horus.licenza).toBe('CC BY 4.0');
    expect(aumentatiData.fonti.fdsn.doi).toBe('https://doi.org/10.13127/ISIDe');
    expect(aumentatiData.fonti.horus.doi).toBe('https://doi.org/10.13127/HORUS');
    expect(aumentatiData.scaricato.fdsn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(aumentatiData.scaricato.horus).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(richiesteFdsn).toBe(51);
    for (const u of aumentatiData.richieste) expect(u).toMatch(/^https:\/\/webservices\.ingv\.it\/fdsnws\/event\/1\/query\?/);
  });

  it('copre solo anni completi, senza buchi', () => {
    expect(ANNI_FDSN).toEqual([1985, 2025]);
    expect(ANNI_HORUS).toEqual([1960, 2025]);
    expect(fdsnAnni.map((r) => r.anno)).toEqual(Array.from({ length: 41 }, (_, i) => 1985 + i));
    expect(horusAnni.map((r) => r.anno)).toEqual(Array.from({ length: 66 }, (_, i) => 1960 + i));
  });

  it('i conteggi del catalogo INGV sono coerenti tra loro', () => {
    for (const r of fdsnAnni) {
      expect(r.resto + r.seq + r.cf).toBe(r.totale);
      expect(r.md + r.ml + r.mw + r.altre).toBe(r.totale);
      expect(r.totale).toBeGreaterThanOrEqual(r.m15);
      expect(r.m15).toBeGreaterThanOrEqual(r.m2);
      expect(r.m2).toBeGreaterThanOrEqual(r.m25);
      expect(r.m25).toBeGreaterThanOrEqual(r.m3);
      expect(r.m3).toBeGreaterThanOrEqual(r.m4);
      expect(r.m4).toBeGreaterThanOrEqual(r.m5);
      expect(r.m25).toBe(r.resto25 + r.seq25 + r.cf25);
      if (r.anno < 2005) expect(r.ind25).toBeNull();
      else {
        expect(r.ind25 ?? 0).toBeLessThanOrEqual(r.m25);
        expect(r.ind4 ?? 0).toBeLessThanOrEqual(r.m4);
      }
    }
  });

  it('i conteggi di HORUS sono coerenti tra loro', () => {
    for (const r of horusAnni) {
      expect(r.w25).toBeGreaterThanOrEqual(r.w3);
      expect(r.w3).toBeGreaterThanOrEqual(r.w35);
      expect(r.w35).toBeGreaterThanOrEqual(r.w4);
      expect(r.w4).toBeGreaterThanOrEqual(r.w45);
      expect(r.w45).toBeGreaterThanOrEqual(r.w5);
      expect(r.ind4).toBeLessThanOrEqual(r.w4);
      expect(r.ind3).toBeLessThanOrEqual(r.w3);
      expect(r.cf3).toBeLessThanOrEqual(r.w3);
    }
  });
});

describe('i numeri dell’articolo', () => {
  it('il catalogo cresce: 1985, 2006, 2016, 2025', () => {
    expect(tot1985).toBe(1635);
    expect(tot2006).toBe(6052);
    expect(tot2016).toBe(60522);
    expect(tot2025).toBe(15654);
    expect(totMinDal2019).toBe(15654);
    expect(totMaxDal2019).toBe(17713);
  });

  it('nel 2005 cambia la magnitudo: Md prima, ML dopo', () => {
    expect(Math.round(quotaMd1985 * 100)).toBe(91);
    expect(Math.round(quotaMl2006 * 100)).toBe(96);
    // la trappola: a magnitudo «così come sono», il 1985 sembra avere più scosse forti del 2006
    expect(m3_1985).toBe(312);
    expect(m3_2006).toBe(198);
    expect(m25_1985).toBeGreaterThan(m25_2006);
  });

  it('le grandi sequenze, con le scosse principali prese dal catalogo', () => {
    expect(Math.round(quotaSeq2016 * 100)).toBe(83);
    expect(fdsn(2009).seq).toBe(17243);
    expect(piuForte('centroItalia2016')).toMatchObject({ tempo: '2016-10-30T06:40:17', mag: 6.5 });
    expect(piuForte('aquila2009')).toMatchObject({ tempo: '2009-04-06T01:32:40', mag: 6.1 });
    expect(piuForte('emilia2012').tempo).toBe('2012-05-20T02:03:50');
  });

  it('Campi Flegrei: l’aumento vero', () => {
    expect(cf1985_2014).toBe(5);
    expect(cf2025).toBe(1017);
    expect(cfW3_2025).toBe(31);
    expect(fdsn(2025).cf).toBeGreaterThan(fdsn(2023).cf);
  });

  it('a soglia fissa le scosse indipendenti non aumentano', () => {
    // catalogo INGV dal 2006, magnitudo 2,5 o più senza repliche
    expect(Math.round(ind25Prima)).toBe(356);
    expect(Math.round(ind25Dopo)).toBe(335);
    // HORUS, Mw 4 o più senza repliche, in terraferma: media all'anno nei tre periodi
    expect(ind4Periodi.map((v) => Math.round(v * 10) / 10)).toEqual([11, 8.8, 7.2]);
    // nessun intervallo tutto sopra 1 (sarebbe un aumento)
    for (const r of [rapportoInd4, rapportoInd4Recente, rapportoInd3]) expect(r.lo).toBeLessThan(1);
    expect(Math.round(rapportoInd4.r * 100)).toBe(66);
    expect(rapportoInd4.hi).toBeLessThan(1);
    expect(rapportoInd4Recente.hi).toBeGreaterThan(1);
  });

  it('i picchi di HORUS sono gli anni delle sequenze', () => {
    expect([1980, 2016]).toContain(piccoW4.anno);
    expect(piccoW4.w4).toBe(79);
    expect(horus(1976).w4).toBe(60);
  });

  it('numeri pubblicati: completezza e CPTI15', () => {
    expect(MC_TAB10[0]).toEqual([1960, 1981, 4.0]);
    expect(MC_ANNUALE.find(([a]) => a === 2019)?.[1]).toBe(1.3);
    expect(completoDal(4)).toBe(1960);
    expect(completoDal(3)).toBe(1981);
    expect(completoDal(2.5)).toBe(1990);
    expect([17, 18, 19, 20].map(mw6Secolo)).toEqual([16, 20, 14, 13]);
  });
});

describe('Aggiunte dopo la verifica', async () => {
  const f = await import('./aumentati');
  it('il calo delle Mw≥4 avviene fra il 1980 e il 1981, poi il ritmo non cambia', () => {
    expect(f.ind4_1960_1980).toBeGreaterThan(f.ind4_1981_2004);
    expect(f.rapportoInd4Dal1981.lo).toBeLessThan(1);
    expect(f.rapportoInd4Dal1981.hi).toBeGreaterThan(1);
  });
  it("Campi Flegrei a soglia fissa e anni di HORUS (il titolo della parte 2 dice «66 anni»: si scrive a mano perché l’indice lo legge dal testo)", () => {
    expect(f.cf25_1985_2014).toBe(2);
    expect(f.anniHorus).toBe(66);
    expect(f.GIORNI_2005.prima + f.GIORNI_2005.dopo).toBe(365);
  });
});
