import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CrolliFragilita, CrolliMeccanismi, CrolliNorciaCampi, CrolliScuotimento } from '../figures11';
import {
  abitazioniCrollateAnno,
  accelerazioni26Ottobre,
  agibilita,
  CLASSI,
  CLASSI_CA,
  crollateCampi,
  crollateNorcia,
  crollateRinnovateDopo1982Campi,
  crolliCampi,
  crolliData,
  curveCA,
  curveMuratura,
  danno5Campi,
  dannoCampi,
  dannoNorcia,
  edificiDado,
  esempioD3,
  esempioD4,
  finoA2Campi,
  finoA2Norcia,
  griglia,
  indicePga,
  luogo,
  modelli,
  parametriCA,
  parametriMuratura,
  patrimonio,
  pgvAttesa475,
  pgvOsservata,
  probCA,
  probMuratura,
  probPct,
  qualitaMuratura,
  rapportoAD,
  restoCampi,
  restoNorcia,
  rischio,
  scuotimento,
  speseStato50Anni,
  speseStatoAnno,
  unitaCampi,
  unitaNorcia,
  vittime2016,
} from './crolli';

// Le figure si disegnano alla larghezza di un telefono (375 px meno i margini).
vi.mock('../../components/charts/ChartFrame', async (originale) => ({
  ...(await originale<typeof import('../../components/charts/ChartFrame')>()),
  useWidth: () => ({ ref: { current: null }, width: 343 }),
}));

/** Φ ricalcolata in modo indipendente dallo script: integrale della gaussiana con la regola di Simpson. */
function phiSimpson(x: number) {
  const a = -10;
  const passi = 4000;
  const h = (x - a) / passi;
  const f = (t: number) => Math.exp((-t * t) / 2) / Math.sqrt(2 * Math.PI);
  let s = f(a) + f(x);
  for (let i = 1; i < passi; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

describe('Norcia e Campi Alto (Sisti e altri, 2022)', () => {
  it('le quote della figura tornano con il testo dello studio', () => {
    expect([unitaNorcia, unitaCampi]).toEqual([670, 49]);
    expect(dannoNorcia).toEqual([24, 32, 22, 17, 4, null]);
    expect(dannoCampi).toEqual([4, 6, 16, 37, 6, 29]);
    expect([finoA2Norcia, finoA2Campi]).toEqual([78, 26]);
    expect(danno5Campi).toBe(29);
    expect([restoNorcia, restoCampi]).toEqual([1, 2]);
  });

  it('agibilità e crolli', () => {
    expect(agibilita.norcia.A + agibilita.norcia.BC + agibilita.norcia.E).toBe(100);
    expect(agibilita.campiAlto.BC + agibilita.campiAlto.E).toBe(100);
    expect(agibilita.campiAlto.unitaBC + agibilita.campiAlto.unitaE).toBe(unitaCampi);
    expect(Math.round((agibilita.campiAlto.unitaE / unitaCampi) * 100)).toBe(agibilita.campiAlto.E);
    expect([crollateNorcia, crollateCampi]).toEqual([11, 13]);
    expect(Math.round((crollateNorcia / unitaNorcia) * 100)).toBe(2);
    expect(Math.floor((crollateCampi / unitaCampi) * 100)).toBe(crolliCampi.quota);
    expect(crolliCampi.totaliMaiConsolidate + crolliCampi.totaliRinnovatePrima1982 + crolliCampi.totaliRinnovateDopo1982).toBe(crolliCampi.totali);
    expect(qualitaMuratura.campiAlto.buona).toBe(6);
    expect(qualitaMuratura.norcia.buona).toBe(27);
  });

  it('i crolli di Campi Alto tra le unità rinnovate dopo il 1982 contano anche quelli parziali', () => {
    expect(crolliCampi.parzialiRinnovateDopo1982).toBe(crolliCampi.parziali);
    expect(crollateRinnovateDopo1982Campi).toBe(5);
  });

  it('le scosse del 26 ottobre: Tab. 1 dello studio', () => {
    expect(accelerazioni26Ottobre.campiAltoCMI).toEqual([707, 638]);
    expect(accelerazioni26Ottobre.norciaNRC).toEqual([295, 248]);
  });
});

describe('curve di fragilità', () => {
  it('i parametri sono quelli delle tabelle pubblicate', () => {
    expect(parametriMuratura.A).toEqual({ mediane: [0.047, 0.128, 0.26, 0.526], beta: 0.9 });
    expect(parametriMuratura.D).toEqual({ mediane: [0.293, 0.504, 0.741, 1.09], beta: 0.51 });
    expect(parametriCA['C2-M'].mediane[2]).toBe(0.397);
    expect(parametriCA['D-M'].beta).toBe(0.995);
    expect(modelli).toMatchObject({ muratura: 4, cementoArmato: 2 });
  });

  it('i valori di controllo a 0,3 g', () => {
    expect(CLASSI.map((c) => Math.round(esempioD3[c] * 100))).toEqual([56, 40, 19, 4]);
    expect(CLASSI.map((c) => Math.round(esempioD4[c] * 100))).toEqual([27, 15, 5, 1]);
    expect(Math.round(probMuratura('A', 'D3', 0.1) * 100)).toBe(14);
    expect(Math.round(probMuratura('B', 'D3', 0.1) * 100)).toBe(5);
    expect(Math.round(probCA('C2-M', 'D3', 0.3) * 100)).toBe(34);
    expect(Math.round(probCA('D-M', 'D3', 0.3) * 100)).toBe(6);
    expect(Math.round(rapportoAD)).toBe(15);
    expect(probPct(0.004)).toBe('meno dell’1%');
    expect(probPct(0.5632)).toBe('56%');
  });

  it('ogni probabilità nel JSON coincide con un calcolo indipendente', () => {
    expect(griglia).toHaveLength(31);
    expect(griglia[indicePga(0.3)]).toBe(0.3);
    const controlla = (m: number, b: number, valori: number[]) =>
      valori.forEach((p, i) => {
        const atteso = i === 0 ? 0 : phiSimpson(Math.log(griglia[i] / m) / b);
        expect(Math.abs(p - atteso)).toBeLessThan(0.0001);
      });
    for (const c of CLASSI) {
      controlla(parametriMuratura[c].mediane[2], parametriMuratura[c].beta, curveMuratura[c].D3);
      controlla(parametriMuratura[c].mediane[3], parametriMuratura[c].beta, curveMuratura[c].D4);
    }
    for (const c of CLASSI_CA) {
      controlla(parametriCA[c].mediane[2], parametriCA[c].beta, curveCA[c].D3);
      controlla(parametriCA[c].mediane[3], parametriCA[c].beta, curveCA[c].D4);
    }
  });

  it('a ogni PGA la classe più fragile ha la probabilità più alta, e D4 non supera D3', () => {
    griglia.forEach((_, i) => {
      for (let k = 1; k < CLASSI.length; k++) {
        expect(curveMuratura[CLASSI[k]].D3[i]).toBeLessThanOrEqual(curveMuratura[CLASSI[k - 1]].D3[i]);
      }
      for (const c of CLASSI) expect(curveMuratura[c].D4[i]).toBeLessThanOrEqual(curveMuratura[c].D3[i]);
    });
  });

  it('il livello D5 non è nei dati (mediane fuori dai valori osservati)', () => {
    for (const c of CLASSI) expect(parametriMuratura[c].mediane).toHaveLength(4);
    for (const c of CLASSI_CA) expect(parametriCA[c].mediane).toHaveLength(4);
    expect(JSON.stringify(crolliData.fragilita)).not.toContain('7.386');
  });
});

describe('scuotimento e numeri pubblicati', () => {
  it('Tab. 1 di Sorrentino e altri: valori e misure', () => {
    expect(scuotimento.map((l) => l.luogo)).toEqual(['Amatrice', 'San Capone', 'Accumoli', 'Norcia']);
    expect(luogo('Amatrice')).toMatchObject({ ems: ['X', 'XI'], pgv: [44, 38], pga: [0.87, 0.53], misurato: [true, true] });
    // San Capone è una stima da ShakeMap: il confronto con Amatrice va scritto come tale
    expect(luogo('San Capone')).toMatchObject({ pgv: [43, 43], pga: [0.77, 0.41], misurato: [false, false] });
    expect(luogo('Accumoli').misurato).toEqual([false, true]);
    expect(luogo('Norcia')).toMatchObject({ ems: ['V–VI', 'VIII–IX'], pgv: [30, 56], pga: [0.37, 0.49], misurato: [true, true] });
    // Il valore atteso nella quasi totalità dei paesi più colpiti, non l'intervallo completo 14–27
    expect(pgvAttesa475).toEqual([21, 22]);
    expect(crolliData.scuotimento.pgvAttesa475Intervallo).toEqual([14, 27]);
    expect(pgvOsservata).toEqual([35, 60]);
  });

  it('vittime, patrimonio e rischio', () => {
    expect(vittime2016.amatrice + vittime2016.accumoli + vittime2016.arquata).toBe(vittime2016.totale);
    expect(vittime2016.totale).toBe(299);
    expect(patrimonio.muratura + patrimonio.cementoArmato + patrimonio.altro).toBe(100);
    expect(rischio.abitazioniCrollateAnno).toEqual({ media: 2100, min: 400, max: 3300 });
    expect(abitazioniCrollateAnno).toBe('2.100 (da 400 a 3.300 secondo il modello)');
    expect(speseStato50Anni).toBe(211);
    expect(speseStatoAnno).toBe(4.2);
    expect(edificiDado).toBe(322728);
  });
});

describe('le figure', () => {
  const html = (F: () => ReactElement) => renderToStaticMarkup(createElement(F));

  it('si disegnano senza valori mancanti e con una descrizione accessibile', () => {
    for (const F of [CrolliNorciaCampi, CrolliFragilita, CrolliScuotimento, CrolliMeccanismi]) {
      const h = html(F);
      expect(h).not.toMatch(/NaN|undefined/);
      expect(h).toContain('learn-figure');
    }
    expect(html(CrolliFragilita)).toContain('role="img"');
    expect((html(CrolliMeccanismi).match(/role="img"/g) ?? []).length).toBe(3);
  });

  it('la figura delle curve parte da 0,3 g con i valori del testo', () => {
    const h = html(CrolliFragilita);
    expect(h).toContain('Scegli lo scuotimento: 0,3 g');
    expect(h).toContain('A 56% · B 40% · C 19% · D 4%');
  });

  it('la legenda delle classi non le associa a un tipo di edificio', () => {
    const h = html(CrolliFragilita);
    expect(h).toContain('Classe A (la più fragile)');
    expect(h).toContain('Classe D (la meno fragile delle quattro)');
    expect(h).not.toMatch(/muratura scadente|muratura moderna|progettati per il sisma/);
  });

  it('la figura di Norcia e Campi Alto dice che manca la registrazione del 30 ottobre', () => {
    const h = html(CrolliNorciaCampi);
    expect(h).toContain('manca la registrazione del 30 ottobre');
    expect(h).toContain('Agibili solo dopo interventi, o in parte (B, C)');
  });

  it('la tabella dello scuotimento segna come stime i valori senza accelerometro', () => {
    const h = html(CrolliScuotimento);
    const riga = (nome: string) => h.split('<tr>').find((r) => r.includes(`>${nome}<`)) ?? '';
    expect((riga('San Capone').match(/(stima)/g) ?? []).length).toBe(4);
    expect((riga('Accumoli').match(/(stima)/g) ?? []).length).toBe(2);
    expect(riga('Amatrice')).not.toContain('(stima)');
    expect(riga('Norcia')).not.toContain('(stima)');
  });
});
