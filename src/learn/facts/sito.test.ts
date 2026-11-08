import { describe, expect, it } from 'vitest';
import {
  CATEGORIE,
  curva,
  dispersione,
  f1,
  fattoriPga,
  fattoriSa1,
  ITA10,
  ntcLungo,
  ntcLungoC,
  NTC_SS_MAX,
  quotaMisurate,
  righeMisurate,
  righeNonMisurate,
  scossaMax,
  scossaMaxVicina,
  scossaVicina,
  onnaSuMonticchio,
  onnaV,
  perCategoria,
  pocheStazioni,
  quotaGeologia,
  righe,
  righeGeologia,
  robustezza,
  robustezzaC,
  scossa,
  scossaFattore,
  scossaRoccia,
  scossaSoffici,
  sitoData,
  volte,
} from './sito';

describe('effetti di sito: dati ESM e nostro calcolo', () => {
  it('la selezione è quella descritta nell’articolo', () => {
    expect(righe).toBe(6891);
    expect(righeGeologia).toBe(3340);
    expect(Math.round(quotaGeologia * 100)).toBe(48);
    // la categoria è misurata solo in poco più di un terzo delle righe: il testo dice «quasi due righe su tre» non misurate
    expect(righeMisurate).toBe(2571);
    expect(righeNonMisurate).toBe(6891 - 2571);
    expect(quotaMisurate).toBeGreaterThan(0.33);
    expect(quotaMisurate).toBeLessThan(0.4);
    expect(Object.values(sitoData.metodoCategoriaRighe).reduce((a, b) => a + b, 0)).toBe(righe);
    const s = sitoData.selezione;
    expect([s.registrazioni, s.terremoti, s.stazioni]).toEqual([2895, 40, 796]);
    // i conteggi per categoria tornano con il totale
    expect(CATEGORIE.reduce((a, c) => a + perCategoria[c].registrazioni, 0)).toBe(s.registrazioni);
    expect(CATEGORIE.reduce((a, c) => a + perCategoria[c].stazioni, 0)).toBe(s.stazioni);
    expect(Object.values(s.metodoCategoriaStazioni).reduce((a, b) => a + b, 0)).toBe(s.stazioni);
    // le esclusioni più le registrazioni scelte fanno tutte le righe
    expect(Object.values(sitoData.esclusioni).reduce((a, b) => a + b, 0) + s.registrazioni).toBe(righe);
    expect(sitoData.richiesta).toContain('endtime=2026-10-31');
  });

  it('A = 1 < B < C, e ogni intervallo contiene la stima', () => {
    for (const f of [fattoriPga, fattoriSa1]) {
      expect(f.A).toEqual({ f: 1, lo: 1, hi: 1 });
      expect(f.B.f).toBeGreaterThan(1);
      expect(f.C.f).toBeGreaterThan(f.B.f);
      expect(f.B.lo).toBeGreaterThan(1); // B è più di A anche al limite basso dell'intervallo
      for (const c of CATEGORIE) expect(f[c].lo <= f[c].f && f[c].f <= f[c].hi).toBe(true);
    }
    expect([f1(fattoriPga.B.f), f1(fattoriPga.C.f), f1(fattoriSa1.C.f)]).toEqual(['1,5', '2,6', '3']);
    expect([f1(fattoriPga.C.lo), f1(fattoriPga.C.hi)]).toEqual(['2,2', '3']);
    expect(volte(fattoriPga.C.f)).toBe('×2,6');
    expect(sitoData.bootstrap.repliche).toBe(500);
  });

  it('D ed E sono segnate come «pochi dati»', () => {
    expect(pocheStazioni('D') && pocheStazioni('E')).toBe(true);
    expect(pocheStazioni('A') || pocheStazioni('B') || pocheStazioni('C')).toBe(false);
  });

  it('le prove di robustezza tengono C tra 2 e 3,5 volte', () => {
    expect(robustezza).toHaveLength(5);
    expect(robustezzaC[0]).toBeGreaterThan(2);
    expect(robustezzaC[1]).toBeLessThan(3.5);
    for (const p of robustezza) expect(p.pga.C!).toBeGreaterThan(p.pga.B!);
  });

  it('la dispersione tra stazioni è ordinata e larga', () => {
    for (const c of ['A', 'B', 'C'] as const) {
      const d = dispersione[c];
      expect(d.p10! <= d.p50! && d.p50! <= d.p90!).toBe(true);
    }
    expect(dispersione.A.p10!).toBeLessThan(0.6);
    expect(dispersione.A.p90!).toBeGreaterThan(2);
    expect(dispersione.C.p50!).toBeGreaterThan(dispersione.A.p50!);
  });

  it('la scossa del 24 agosto 2016 è quella giusta', () => {
    expect(scossa.mw).toBe(6);
    expect(scossa.tempo.startsWith('2016-08-24T01:36')).toBe(true);
    expect(scossa.punti).toHaveLength(118);
    expect(scossa.punti.every((p) => p[0] <= sitoData.filtri.rjbMaxKm && p[1] > 0)).toBe(true);
    // la curva cala con la distanza e C sta sopra A
    expect(curva(10)).toBeGreaterThan(curva(100));
    expect(curva(30, 'C') / curva(30, 'A')).toBeCloseTo(fattoriPga.C.f, 6);
    // in questa scossa le stazioni sui terreni C stanno sopra quelle su roccia
    expect(scossaFattore.C.f).toBeGreaterThan(scossaFattore.A.f);
    expect(scossaSoffici).toEqual({ tot: 34, sopraRoccia: 33 });
    expect(scossaRoccia).toEqual({ tot: 26, sopraC: 0 });
    // il testo dice che il valore più alto l'ha registrato la stazione più vicina: se i dati cambiano, va riscritto
    expect(scossaMaxVicina).toBe(true);
    expect(scossaMax).toEqual(scossaVicina);
  });

  it('numeri pubblicati e conti di contorno', () => {
    expect(Math.round(onnaSuMonticchio * 10) / 10).toBe(3.2);
    expect(onnaV).toEqual([320, 480]);
    expect(f1(ITA10.B)).toBe('1,6');
    expect(ITA10.C.map(f1)).toEqual(['1,8', '2,1']);
    // ITA10 per B è simile al nostro calcolo (non più basso); per C è più basso
    expect(Math.abs(ITA10.B - fattoriPga.B.f)).toBeLessThan(0.15);
    expect(ITA10.C[1]).toBeLessThan(fattoriPga.C.f);
    // la norma: sull'accelerazione di picco al massimo 1,5 per C; a 1 secondo SS·CC, circa da 2,1 a 2,5
    expect(NTC_SS_MAX.C).toBe(1.5);
    expect(ntcLungoC.map(f1)).toEqual(['2,1', '2,5']);
    expect(f1(ntcLungo('C', 0.3))).toBe('2,3');
    expect(ntcLungoC[1]).toBeLessThan(fattoriSa1.C.f);
  });
});
