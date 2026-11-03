/**
 * I numeri dell'articolo «Esiste il tempo da terremoto?», calcolati dai dati (src/data/learn/tempo-terremoto.json,
 * prodotti da scripts/build-weather-myth-data.mjs). Stanno qui, e non scritti a mano nel testo, così restano
 * sempre uguali ai dati.
 */
import { weatherData as d } from '../figures3';

export { d };
export const pct = (v: number) => `${Math.round(v * 100)}%`;
const share = (n: number, of: number[]) => n / of.reduce((a, b) => a + b, 0);
const seasons = (t: { conteggi: number[]; attesi: number[] }) => {
  const r = (ms: number[]) => ms.reduce((s, m) => s + t.conteggi[m], 0) / ms.reduce((s, m) => s + t.attesi[m], 0);
  return { inverno: r([11, 0, 1]), estate: r([5, 6, 7]) };
};
export const oldS = seasons(d.catalogoVecchio.vecchio.test);
export const modS = seasons(d.mesi);
export const hot = share(d.meteo.caldo.quinti[4], d.meteo.caldo.quinti);
export const calm = share(d.meteo.vento.quinti[0], d.meteo.vento.quinti);
export const windy = share(d.meteo.vento.quinti[4], d.meteo.vento.quinti);
export const aquila = d.meteo.grandi.find((g) => g.data === '2009-04-06');
export const amatrice = d.meteo.grandi.find((g) => g.data === '2016-08-24');
