import { describe, expect, it } from 'vitest';
import { hsitHint } from './hsit';

describe('Indicazioni per il questionario INGV', () => {
  it('usa data e ora italiane, come la lista del questionario (ora solare)', () => {
    // Nel catalogo INGV: 2026-10-31T16:41:35 UTC; nel questionario: «[31 ott 2026 17:41] 3 Km W Palena (CH)».
    expect(hsitHint({ time: new Date('2026-10-31T16:41:35Z') })).toEqual({ inList: '31 ott 2026 17:41', date: '31/10/2026', time: '17:41' });
  });

  it('con l’ora legale aggiunge due ore e non arrotonda i minuti', () => {
    expect(hsitHint({ time: new Date('2026-07-31T17:46:59Z') })).toEqual({ inList: '31 lug 2026 19:46', date: '31/07/2026', time: '19:46' });
  });

  it('una scossa poco dopo la mezzanotte UTC può essere già il giorno dopo in Italia', () => {
    expect(hsitHint({ time: new Date('2016-08-24T01:36:32Z') }).date).toBe('24/08/2016');
    expect(hsitHint({ time: new Date('2016-10-29T23:30:00Z') }).inList).toBe('30 ott 2016 01:30');
  });
});
