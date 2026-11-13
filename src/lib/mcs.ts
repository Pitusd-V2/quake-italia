/**
 * I 12 gradi della scala Mercalli-Cancani-Sieberg (MCS), la scala dei cataloghi dei terremoti italiani e del database
 * DBMI15. Un solo elenco per tutto il sito: lo usano la figura dell'articolo «Magnitudo e intensità» e la storia
 * sismica in «Il mio comune».
 *
 * Le descrizioni sono riassunte dal testo ufficiale della scala (Sieberg 1930) pubblicato dall'INGV nel Database
 * Fotografico Macrosismico, e confrontate con quel testo il 13/11/2026. Riassumere vuol dire accorciare, non cambiare:
 * le proporzioni di case danneggiate o crollate dei gradi alti restano quelle della scala.
 */
export const MCS_SOURCE = { label: 'INGV, Database Fotografico Macrosismico — Scala MCS', url: 'https://dfm.ingv.it/?page=scale.mcs' };

export interface McsDegree {
  n: number;
  roman: string;
  name: string;
  text: string;
}

export const MCS: McsDegree[] = [
  { n: 1, roman: 'I', name: 'Impercettibile', text: 'Rilevato soltanto dai sismografi.' },
  { n: 2, roman: 'II', name: 'Molto leggero', text: 'Sentito solo da persone molto sensibili, in perfetta quiete, ai piani alti.' },
  { n: 3, roman: 'III', name: 'Leggero', text: 'Percepito da una piccola parte delle persone in casa, come il passaggio di un mezzo pesante.' },
  { n: 4, roman: 'IV', name: 'Moderato', text: 'Notato in casa da molte persone: tintinnano finestre e stoviglie, scricchiolano porte.' },
  { n: 5, roman: 'V', name: 'Abbastanza forte', text: 'Avvertito da quasi tutti; oggetti appesi oscillano, quadri sbattono, quasi tutti si svegliano.' },
  { n: 6, roman: 'VI', name: 'Forte', text: 'Avvertito da tutti con paura; cadono oggetti; danni leggeri agli edifici (crepe nell’intonaco).' },
  { n: 7, roman: 'VII', name: 'Molto forte', text: 'Danni moderati a molti edifici solidi; cadono tegole e camini; in casi isolati crollano case mal costruite.' },
  { n: 8, roman: 'VIII', name: 'Rovinoso', text: 'Circa un quarto delle case gravemente danneggiate, alcune crollano, molte diventano inabitabili.' },
  { n: 9, roman: 'IX', name: 'Distruttivo', text: 'Circa metà delle case in pietra distrutte; molte crollano, la maggior parte diventa inabitabile.' },
  { n: 10, roman: 'X', name: 'Completamente distruttivo', text: 'Circa tre quarti degli edifici distrutti, la maggior parte crolla; danni a ponti e dighe.' },
  { n: 11, roman: 'XI', name: 'Catastrofico', text: 'Crollano tutti gli edifici in muratura.' },
  { n: 12, roman: 'XII', name: 'Grandemente catastrofico', text: 'Nessuna opera umana resiste; il paesaggio cambia.' },
];

export const mcsDegree = (n: number): McsDegree | undefined => MCS.find((d) => d.n === n);
