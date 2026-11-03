/** Numeri scritti all'italiana dentro gli articoli: 12.345 e 6,5. */
import { formatInt } from '../../lib/format';

export const n = (v: number) => formatInt(v);
export const dec = (v: number) => String(v).replace('.', ',');
