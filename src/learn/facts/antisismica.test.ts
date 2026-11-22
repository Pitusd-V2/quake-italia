import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BeforeClassificationBars, BuildingAgeBars, LimitStatesLadder } from '../figures12';
import {
  altroPerEpoca,
  antisismicaData,
  caPerEpoca,
  classificati,
  collassoAquila50,
  collassoMuraturaAquila50,
  comuniNcAllegato,
  differenzaSenzaCampania,
  edificiDal1991,
  edificiDal2006,
  edificiFino1970,
  edificiFino1980,
  edificiPerEpoca,
  edificiPrima1919,
  edificiTotali,
  EPOCHE,
  mirandola,
  mirandolaPrima2001,
  muraturaPerEpoca,
  ncZona2,
  ncZona3,
  ncZona4,
  nonClassificati,
  passaggi,
  pct0,
  pct1,
  PERIODI,
  periodiCasa,
  periodiScuola,
  periodiStrategico,
  periodoRitorno,
  probAnnuaSlv,
  probDaTasso,
  probInAnni,
  probSlvIn100Anni,
  pubblicati,
  quotaAltro,
  quotaCa,
  quotaCumulata,
  quotaDal1991,
  quotaDal2006,
  quotaEdificiNonUniti,
  quotaFino1970,
  quotaFino1980,
  quotaMirandolaPrima2001,
  quotaMuratura,
  quotaPrima1919,
  quotaPrima2001,
  rapportoMirandola,
  STATI,
  totaliMateriale,
  unione,
  vittimeEmiliaDpc,
} from './antisismica';

const somma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe('casa antisismica: edifici residenziali ISTAT 2011', () => {
  it('i totali coincidono con quelli pubblicati dall’ISTAT', () => {
    expect(edificiTotali).toBe(12187698);
    expect(edificiPrima1919).toBe(1832504);
    expect(pct1(quotaPrima1919)).toBe('15,0%');
    expect(EPOCHE).toHaveLength(9);
    expect(edificiPerEpoca).toEqual([1832504, 1327007, 1700836, 2050833, 2117651, 1462767, 871017, 465104, 359979]);
  });

  it('materiali ed epoche tornano', () => {
    edificiPerEpoca.forEach((v, i) => expect(muraturaPerEpoca[i] + caPerEpoca[i] + altroPerEpoca[i]).toBe(v));
    expect(somma(edificiPerEpoca)).toBe(edificiTotali);
    expect(totaliMateriale).toEqual({ muratura: 6975977, ca: 3594695, altro: 1617026 });
    expect(caPerEpoca[0]).toBe(0); // nel file non c'è calcestruzzo armato prima del 1919
    expect([pct1(quotaMuratura), pct1(quotaCa), pct1(quotaAltro)]).toEqual(['57,2%', '29,5%', '13,3%']);
  });

  it('le quote cumulate del testo', () => {
    expect(edificiFino1970).toBe(6911180);
    expect(pct1(quotaFino1970)).toBe('56,7%');
    expect(edificiFino1980).toBe(9028831);
    expect(pct1(quotaFino1980)).toBe('74,1%');
    expect(edificiDal1991).toBe(1696100);
    expect(pct1(quotaDal1991)).toBe('13,9%');
    expect(edificiDal2006).toBe(359979);
    expect(pct1(quotaDal2006)).toBe('3,0%');
    expect(quotaCumulata[8]).toBeCloseTo(1, 10);
    expect(pct0(quotaFino1980)).toBe('74%');
  });
});

describe('casa antisismica: unione con la classificazione', () => {
  it('quasi tutti i comuni si ritrovano', () => {
    expect(unione.comuniAllegato).toBe(8101);
    expect(unione.comuniIstat).toBe(8092);
    expect(unione.uniti).toBe(8086);
    expect(unione.nonUnitiIstat).toHaveLength(6);
    expect([nonClassificati.comuni, comuniNcAllegato]).toEqual([5111, 5126]);
    expect(unione.edificiUniti + unione.edificiNonUniti).toBe(edificiTotali);
    expect(unione.edificiNonUniti).toBe(7290);
    expect(quotaEdificiNonUniti).toBeLessThan(0.001);
  });

  it('i gruppi sommano e l’età è simile', () => {
    const g = antisismicaData.gruppi;
    expect(g.nonClassificati.edifici + g.classificati.edifici + g.senzaCategoria.edifici).toBe(unione.edificiUniti);
    expect(ncZona2.edifici + ncZona3.edifici + ncZona4.edifici).toBe(nonClassificati.edifici);
    expect(somma(Object.values(passaggi).map((p) => p.comuni))).toBe(g.nonClassificati.comuni + g.classificati.comuni);
    expect([ncZona2.comuni, ncZona3.comuni, ncZona4.comuni]).toEqual([85, 1611, 3415]);
    expect([pct1(quotaPrima2001(nonClassificati)), pct1(quotaPrima2001(classificati))]).toEqual(['92,4%', '94,3%']);
    expect([pct1(quotaPrima2001(ncZona2)), pct1(quotaPrima2001(ncZona3)), pct1(quotaPrima2001(ncZona4))]).toEqual(['94,6%', '92,3%', '92,4%']);
    // senza la Campania il risultato non cambia di fatto
    expect(differenzaSenzaCampania).toBeLessThan(0.001);
  });

  it('Mirandola: non classificata fino al 2003, poi zona 3', () => {
    expect([mirandola.cat1984, mirandola.zona2003, mirandola.totale]).toEqual(['N.C.', 3, 4655]);
    expect(mirandolaPrima2001).toBe(4313);
    expect(pct1(quotaMirandolaPrima2001)).toBe('92,7%');
  });
});

describe('casa antisismica: stati limite e periodi di ritorno', () => {
  it('le probabilità della Tab. 3.2.I', () => {
    expect(STATI.map((s) => [s.id, s.pvr])).toEqual([['SLO', 0.81], ['SLD', 0.63], ['SLV', 0.1], ['SLC', 0.05]]);
    expect(pubblicati.ntc.statiLimite.pvr).toEqual({ SLO: 0.81, SLD: 0.63, SLV: 0.1, SLC: 0.05 });
  });

  it('la formula [3.2.0] dà i periodi di ritorno', () => {
    expect(periodiCasa).toEqual({ SLO: 30, SLD: 50, SLV: 475, SLC: 975 });
    expect(periodiScuola).toEqual({ SLO: 45, SLD: 75, SLV: 712, SLC: 1462 });
    expect(periodiStrategico).toEqual({ SLO: 60, SLD: 101, SLV: 949, SLC: 1950 });
    for (const p of PERIODI) {
      expect(p.vr).toBe(50 * p.cu);
      for (const s of STATI) expect(p.tr[s.id]).toBe(Math.round(periodoRitorno(p.vr, s.pvr)));
    }
  });

  it('i conti di probabilità', () => {
    expect(probInAnni(periodoRitorno(50, 0.1), 50)).toBeCloseTo(0.1, 10);
    expect(pct1(probAnnuaSlv).replace('%', '')).toBe('0,2');
    expect(Math.round(probSlvIn100Anni * 100)).toBe(19);
    expect(probDaTasso(1e-4)).toBeCloseTo(0.005, 3);
    expect(pct1(collassoAquila50[0])).toBe('0,2%');
    expect(pct1(collassoAquila50[1])).toBe('1,0%');
  });
});

describe('casa antisismica: numeri pubblicati', () => {
  it('Emilia 2012', () => {
    const e = pubblicati.emilia;
    expect([e.ingv.scossa20.evento, e.ingv.scossa20.mw, e.ingv.scossa29.evento, e.ingv.scossa29.mw]).toEqual([772691, 5.8, 841091, 5.6]);
    expect([e.rapportoDpc.scossa20.mwRcmt, e.rapportoDpc.scossa29.mwRcmt]).toEqual([6.11, 5.96]);
    expect([e.paginaDpc.vittime, e.paginaDpc.magnitudo20, e.paginaDpc.magnitudo29]).toEqual([28, 5.9, 5.8]);
    expect(vittimeEmiliaDpc).toBe(26); // conteggio del rapporto al 15 giugno 2012, non il bilancio finale
    expect(e.magliulo.attritoCaltrans).toEqual([0.2, 0.4]);
    expect(e.magliulo.pgaRiferimentoRoccia475).toBe(0.14);
    expect(rapportoMirandola).toBeCloseTo(1.89, 2);
    expect(e.magliulo.attritoMisurato).toEqual([0.09, 0.13]);
    expect(e.dl74.sogliaSicurezza).toBe(0.6);
  });

  it('RINTC: i tassi di collasso per tipo di edificio', () => {
    const r = pubblicati.rintc;
    expect(r.tassoCollassoNapoliC).toEqual([1e-5, 3.85e-5]);
    expect(r.tassoCollassoMuraturaRegolareAquilaC).toEqual([3.83e-4, 9.27e-4]);
    expect(collassoMuraturaAquila50.map(pct1)).toEqual(['1,9%', '4,5%']);
    expect(r.tassoCollassoMuraturaRegolareAquilaC.map((t) => Math.round(probAnnuaSlv / t))).toEqual([5, 2]);
    // la muratura irregolare peggiore supera il tasso della scossa SLV (1/475, circa 211 su 100.000)
    expect(r.tassoCollassoMuraturaIrregolareAquilaCMax).toBeGreaterThan(probAnnuaSlv);
    expect(Math.round(probAnnuaSlv * 1e5)).toBe(211);
    expect(pct1(probDaTasso(r.tassoCollassoPrefabbricatiAquilaCMax))).toBe('6,5%');
    expect(pct1(probDaTasso(r.tassoCollassoIsolatiAquilaCMax))).toBe('5,4%');
    // Tab. 7.3.1: tre prefabbricati tra 9 e 14 su 100.000 l'anno, uno a 135
    expect(r.tassoCollassoPrefabbricatiAquilaCAltri).toEqual([8.8e-5, 1.42e-4]);
    expect(r.tassoCollassoPrefabbricatiAquilaCMax).toBe(1.35e-3);
    expect(r.tassoCollassoPrefabbricatiAquilaCAltri.map((t) => Math.round(t * 1e5))).toEqual([9, 14]);
    expect(Math.round(r.tassoCollassoPrefabbricatiAquilaCMax * 1e5)).toBe(135);
    // Tab. 7.6.1: isolati da 16 a 111 su 100.000 l'anno
    expect(r.tassoCollassoIsolatiAquilaCMin).toBe(1.55e-4);
    expect([r.tassoCollassoIsolatiAquilaCMin, r.tassoCollassoIsolatiAquilaCMax].map((t) => Math.round(t * 1e5))).toEqual([16, 111]);
  });

  it('ogni gruppo di numeri pubblicati ha la sua fonte', () => {
    const p = pubblicati;
    for (const f of [p.ntc, p.classificazione1984, p.dpcNonStrutturali, p.emilia.ingv, p.emilia.paginaDpc, p.emilia.rapportoDpc, p.emilia.magliulo, p.emilia.dl74, p.rintc, p.rischioNazionale, p.norcia]) {
      expect(f.fonte.length).toBeGreaterThan(10);
    }
    expect(p.classificazione1984.comuniClassificati).toBe(2965);
  });
});

describe('casa antisismica: le figure', () => {
  it('si disegnano con i numeri giusti, senza valori mancanti', () => {
    const a = renderToStaticMarkup(createElement(BuildingAgeBars));
    const b = renderToStaticMarkup(createElement(LimitStatesLadder));
    const c = renderToStaticMarkup(createElement(BeforeClassificationBars));
    for (const html of [a, b, c]) expect(html).not.toMatch(/NaN|undefined|Infinity/);
    expect(a).toContain('12.187.698');
    expect(a).toContain('74,1%');
    expect(a).toContain('2.965');
    expect(b).toContain('1.950');
    expect(b).toContain('10% in 50 anni');
    expect(c).toContain('94,6%');
    expect(c).toContain('0,08 punti percentuali');
  });
});
