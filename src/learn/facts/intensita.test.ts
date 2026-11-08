import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FeltPercentBars, FormulaCheckBars, IntensityDistanceChart } from '../figures10';
import { intensityAt } from '../../lib/impact';
import type { Quake } from '../../lib/types';
import {
  classe,
  classi,
  confronto,
  conSegno,
  db,
  emilia150,
  eventi,
  ischia,
  norcia150,
  PERCENTUALE_GRADO,
  piccoleEntro1SenzaFacili,
  policastro,
  policastroNord,
  policastroSud,
  profonde,
  quotaNonSentito,
  scale,
  romano,
  valI,
  type Evento,
} from './intensita';

// Sul server non c'è larghezza: la fissiamo noi, per disegnare il grafico come su un telefono o su un computer.
const larghezza = vi.hoisted(() => ({ w: 375 }));
vi.mock('../../components/charts/ChartFrame', async (orig) => ({
  ...(await orig<typeof import('../../components/charts/ChartFrame')>()),
  useWidth: () => ({ ref: { current: null }, width: larghezza.w }),
}));

const quake = (e: Evento): Quake => ({
  id: e.id,
  time: new Date(`${e.tempo.replace(' ', 'T')}Z`),
  lat: e.lat,
  lon: e.lon,
  depthKm: e.prof,
  mag: e.mag,
  magType: e.magTipo,
  place: e.ingv.luogo,
  author: 'test',
  version: null,
  type: 'earthquake',
});
/** Un punto a `km` chilometri a nord dell'epicentro (lungo il meridiano l'haversine è esatta). */
const aNord = (e: Evento, km: number) => ({ lat: e.lat + (km / 6371) * (180 / Math.PI), lon: e.lon });

describe('la formula dello script è quella del sito (impact.intensityAt)', () => {
  it.each(eventi.map((e) => [e.chiave, e] as const))('%s: curva e valore sopra l’epicentro', (_, e) => {
    for (const [d, v] of e.curva) expect(intensityAt(quake(e), aNord(e, d))).toBeCloseTo(v, 1);
    expect(intensityAt(quake(e), { lat: e.lat, lon: e.lon })).toBeCloseTo(e.formulaEpicentro, 2);
  });
});

describe('database HSIT I.4', () => {
  it('ha le dimensioni attese', () => {
    expect(db.righe).toBe(442_274);
    expect(db.terremoti).toBe(16_899);
    expect(db.nonSentito + db.sentito).toBe(db.conIntensita);
    // Le righe con −9 (nessun questionario valido) non sono intensità: il testo usa conIntensita.
    expect(db.conIntensita).toBe(439_848);
    expect(db.intensitaMassima).toBe(8);
    expect(quotaNonSentito).toBeCloseTo(0.674, 3);
    expect(db.primo.startsWith('2007-06-15')).toBe(true);
    expect(db.ultimo.startsWith('2024-12-31')).toBe(true);
  });
});

describe('le quattro scosse', () => {
  it('hanno i parametri del catalogo INGV', () => {
    expect(eventi.map((e) => e.chiave)).toEqual(['ischia', 'emilia', 'norcia', 'policastro']);
    for (const e of eventi) {
      expect(e.ingv.mag).toBe(e.mag);
      expect(e.ingv.prof).toBe(e.prof);
      expect(e.punti.length).toBe(e.comuniUsati);
      expect(e.punti.every(([d, v], i) => v >= 1 && v <= 8 && (i === 0 || d >= e.punti[i - 1][0]))).toBe(true);
    }
    expect([ischia.mag, ischia.prof]).toEqual([3.9, 2]);
    expect([policastro.mag, policastro.prof]).toEqual([5.4, 287]);
  });

  it('Ischia: forte vicino, non sentita già a 50 km', () => {
    expect(ischia.massimo).toMatchObject({ comune: 'Lacco Ameno', I: 7, q: 15 });
    expect(ischia.distMaxSentito).toBe(48);
    // La formula sopra l'epicentro (circa VI-VII) resta sotto l'VIII EMS del rilievo QUEST.
    expect(ischia.formulaEpicentro).toBeCloseTo(6.64, 2);
    expect(ischia.formulaEpicentro).toBeLessThan(8);
  });

  it('Emilia tra 150 e 200 km si sente quanto o più di Norcia', () => {
    expect(emilia150.mediana).toBe(4);
    expect(norcia150.mediana).toBe(3.7);
  });

  it('la scossa profonda si sente molto più a sud che a nord', () => {
    expect(policastroSud.sentito).toBeCloseTo(91.2, 1);
    expect(policastroNord.sentito).toBeCloseTo(27.9, 1);
    expect(policastroSud.mediana).toBe(3);
    expect(policastroNord.mediana).toBe(1);
  });
});

describe('quanto sbaglia la formula del sito', () => {
  it('scarti e quote per classe di magnitudo', () => {
    expect(classi.map((c) => [c.da, c.mediana, c.entro1])).toEqual([
      [2, 0, 77],
      [3, 0.32, 73.3],
      [4, 0.23, 73.8],
      [5, 0.11, 76.9],
      [6, -0.36, 79.4],
    ]);
    expect(classe(3).n).toBe(34_164);
    expect(classe(5, confronto.q10).entro1).toBe(87.8);
    expect(classe(6, confronto.q10).entro1).toBe(91.3);
  });

  it('per le scosse piccole molti accordi sono «facili»; le forti sono quasi tutte in Mw', () => {
    expect(classi.map((c) => c.nonSentitoEntrambi)).toEqual([37.1, 15.3, 12.1, 0.5, 0]);
    expect(piccoleEntro1SenzaFacili).toBeCloseTo(63.4, 1);
    expect(classe(2).tipiMagnitudo.ML).toBeGreaterThan(90);
    expect(classe(6).tipiMagnitudo.Mw).toBe(100);
  });

  it('con almeno 10 questionari: meglio per le forti, mezzo grado sotto per le piccole (selezione)', () => {
    for (const m of [5, 6]) expect(classe(m, confronto.q10).nonSentito).toBeLessThan(classe(m).nonSentito / 2);
    for (const m of [2, 3, 4]) {
      expect(classe(m, confronto.q10).mediana).toBeGreaterThanOrEqual(0.4);
      expect(classe(m, confronto.q10).mediana).toBeLessThanOrEqual(0.6);
    }
    // «quasi mai sotto»: tra magnitudo 2 e 3 la Mw c'è, ma arrotondata è 0.
    expect(classe(2).tipiMagnitudo.Mw).toBe(0);
  });

  it('le scosse profonde escluse e le due scale negli stessi comuni', () => {
    expect(profonde).toEqual({ terremoti: 250, m4: 46, m5: 22 });
    expect(confronto.righeProfonde).toBe(18_993);
    expect(scale.tutti.emsPiuAlta).toBeGreaterThan(scale.tutti.emsPiuBassa);
    expect([Math.round(scale.tutti.emsPiuAlta), Math.round(scale.tutti.emsPiuBassa)]).toEqual([26, 11]);
  });

  it('togliere i comuni «non sentito» fa sembrare la formula peggiore (selezione)', () => {
    for (const m of [2, 3, 4]) {
      expect(classe(m, confronto.soloSentiti).mediana).toBeGreaterThan(classe(m).mediana + 0.3);
      expect(classe(m, confronto.soloSentiti).entro1).toBeLessThan(classe(m).entro1);
    }
  });
});

describe('scrittura e tabella HSIT', () => {
  it('le fasce di percentuale sono contigue', () => {
    expect(PERCENTUALE_GRADO[0].da).toBe(0.1);
    expect(PERCENTUALE_GRADO.at(-1)!.a).toBe(100);
    PERCENTUALE_GRADO.slice(1).forEach((g, i) => expect(g.da).toBe(PERCENTUALE_GRADO[i].a));
  });
  it('numeri all’italiana', () => {
    expect(romano(6.64)).toBe('VII');
    expect(valI(6)).toBe('6');
    expect(valI(2.1)).toBe('2,1');
    expect(conSegno(0.32)).toBe('+0,3');
    expect(conSegno(-0.36)).toBe('−0,4');
    expect(conSegno(0)).toBe('0,0');
  });
});

describe('le figure si disegnano', () => {
  it.each([343, 375, 720])('quattro pannelli larghi in tutto %i px, senza punti fuori', (w) => {
    larghezza.w = w;
    const html = renderToStaticMarkup(createElement(IntensityDistanceChart));
    expect(html).not.toContain('NaN');
    const svg = html.match(/<svg width="([\d.]+)" height="([\d.]+)"/)!;
    const [W, H] = [Number(svg[1]), Number(svg[2])];
    const cerchi = [...html.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const attesi = eventi.reduce((a, e) => a + e.punti.length + e.mediane.length, 0);
    expect(cerchi.length).toBe(attesi);
    for (const [x, y] of cerchi) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(W);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(H);
    }
  });
  it('barre e tabelle', () => {
    const barre = renderToStaticMarkup(createElement(FormulaCheckBars));
    expect(barre).toContain('77% · scarto 0,0');
    expect(barre).toContain('79% · scarto −0,4');
    const gradi = renderToStaticMarkup(createElement(FeltPercentBars));
    expect(gradi).toContain('Grado VI o più');
    expect(gradi).toContain('12,5%–37,5%');
  });
});
