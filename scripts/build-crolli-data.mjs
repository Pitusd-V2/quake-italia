/**
 * Dati dell'articolo «Perché gli edifici crollano» (contenuti/bozze/perche-gli-edifici-crollano.mdx).
 * Uso: node scripts/build-crolli-data.mjs
 *
 * Questo script non scarica niente. I numeri sono trascritti a mano da tabelle e figure pubblicate, indicate una per una
 * accanto ai valori, e controllati sui PDF originali il 21/11/2026. I dati grezzi dei sopralluoghi (Da.D.O.) non sono usati:
 * l'accesso richiede una registrazione e un regolamento che limita uso e diffusione.
 *
 * Cosa calcoliamo noi (non è un risultato pubblicato): le probabilità di danno per ogni valore di PGA, con la curva
 * lognormale degli studi e i loro parametri:
 *     P(danno ≥ Dk | PGA) = Φ( ln(PGA / mediana_k) / β )
 * dove Φ è la funzione di ripartizione della normale standard.
 */
import fs from 'node:fs';

const OUT = new URL('../src/data/learn/crolli.json', import.meta.url);

const FONTI = {
  sisti2022: {
    citazione: 'Sisti, Di Ludovico, Borri e Prota (2022), Bulletin of Earthquake Engineering 20(1), 321–348',
    url: 'https://doi.org/10.1007/s10518-021-01248-0',
    licenza: 'CC BY 4.0',
  },
  lagomarsino2021: {
    citazione: 'Lagomarsino, Cattari e Ottonelli (2021), Bulletin of Earthquake Engineering 19(8), 3129–3163',
    url: 'https://doi.org/10.1007/s10518-021-01063-7',
    licenza: 'CC BY 4.0',
  },
  rosti2021: {
    citazione: 'Rosti, Del Gaudio, Rota, Ricci, Di Ludovico, Penna e Verderame (2021), Bulletin of Earthquake Engineering 19(8), 3165–3183',
    url: 'https://doi.org/10.1007/s10518-020-00971-4',
    licenza: 'CC BY 4.0',
  },
  sorrentino2019: {
    citazione: 'Sorrentino, Cattari, da Porto, Magenes e Penna (2019), Bulletin of Earthquake Engineering 17(10), 5583–5607 (versione accettata degli autori, archivio IRIS Sapienza)',
    url: 'https://doi.org/10.1007/s10518-018-0370-4',
    archivio: 'https://iris.uniroma1.it/handle/11573/1121183',
  },
  dolce2021: {
    citazione: 'Dolce e altri (2021), Bulletin of Earthquake Engineering 19(8), 2999–3032',
    url: 'https://doi.org/10.1007/s10518-020-01009-5',
    licenza: 'CC BY 4.0',
  },
  daPorto2021: {
    citazione: 'da Porto e altri (2021), Bulletin of Earthquake Engineering 19(8), 3209–3252',
    url: 'https://doi.org/10.1007/s10518-021-01120-1',
    licenza: 'CC BY 4.0',
  },
  dpc2018: {
    citazione: 'Dipartimento della Protezione Civile, «I numeri del sisma in Centro Italia» (dati al 22 agosto 2018)',
    url: 'https://emergenze.protezionecivile.gov.it/static/f438b5ebc904a11a47dd5db891db0fbb/Relazione_di_aggiornamento_numeri_dell_emergenza__22_agosto_2018_.pdf',
  },
};

/* ---------- Norcia e Campi Alto: Sisti e altri (2022) ---------- */

const NORCIA_CAMPI = {
  fonte: 'sisti2022',
  /* Percentuali delle unità strutturali in muratura per indice di danno da 0 a 5 (scala EMS-98, dalle schede AeDES).
     Per Norcia la figura non etichetta il danno 5: resta null, senza inventare la divisione del resto. */
  danno: {
    dove: 'Fig. 12b, p. 334',
    norcia: { unita: 670, quote: [24, 32, 22, 17, 4, null] },
    campiAlto: { unita: 49, quote: [4, 6, 16, 37, 6, 29] },
  },
  /* A agibile; B agibile solo dopo il pronto intervento; C agibile in parte; E inagibile. */
  agibilita: {
    dove: 'Fig. 12a, p. 334, e testo, p. 333',
    norcia: { A: 26, BC: 42, E: 32 },
    campiAlto: { A: 0, BC: 8, E: 92, unitaBC: 4, unitaE: 45 },
  },
  crolli: {
    dove: 'p. 335',
    norcia: { totali: 4, parziali: 7, quotaCirca: 2 },
    /* «26%» è riferito dagli autori all'intero costruito; dei 9 crolli totali: 4 mai consolidate, 4 rinnovate prima del 1982, 1 dopo.
       I 4 crolli parziali riguardano tutti unità rinnovate dopo il 1982. */
    campiAlto: {
      totali: 9,
      parziali: 4,
      quota: 26,
      totaliMaiConsolidate: 4,
      totaliRinnovatePrima1982: 4,
      totaliRinnovateDopo1982: 1,
      parzialiRinnovateDopo1982: 4,
    },
  },
  /* PGA in cm/s², componente est-ovest, nelle due scosse del 26 ottobre 2016 (19:10 e 21:18), in valore assoluto.
     CMI è la stazione a 1 km da Campi Alto, NRC una delle due vicino al centro di Norcia. Il 30 ottobre CMI non ha registrato. */
  accelerazioni26Ottobre: { dove: 'Tab. 1, p. 329', campiAltoCMI: [707, 638], norciaNRC: [295, 248] },
  /* Quota di unità con muratura regolare/buona, mista, irregolare/scadente. */
  qualitaMuratura: {
    dove: 'Fig. 8 e testo, p. 331–332',
    norcia: { buona: 27, mista: 34, scadente: 38 },
    campiAlto: { buona: 6, mista: 29, scadente: 55 },
  },
  /* Quota di unità con danno fino a 3, secondo quando sono state rinnovate. */
  dannoFinoA3: {
    dove: 'p. 335',
    norcia: { rinnovateDopo1982: 97, rinnovatePrima1982Circa: 95 },
    campiAlto: { rinnovateDopo1982: 80, rinnovatePrima1982: 50 },
  },
  /* Unità costruite prima del 1982 e rinforzate dopo. */
  rinforzateDopo1982: { dove: 'p. 331', norcia: 60, campiAlto: 65 },
  demolite1979Norcia: { dove: 'p. 324', edifici: 44 },
};

/* ---------- Curve di fragilità ---------- */

/* Mediane della PGA in g per D1, D2, D3, D4, e dispersione β. Il livello D5 non è trascritto: le sue mediane stanno oltre
   i valori osservati (fino a 7,4 g nel cemento armato). */
const MURATURA = {
  fonte: 'lagomarsino2021',
  dove: 'Tab. 13, p. 3155 (classi della piattaforma IRMA; uguali per ogni altezza)',
  classi: {
    A: { mediane: [0.047, 0.128, 0.26, 0.526], beta: 0.9 },
    B: { mediane: [0.087, 0.202, 0.368, 0.671], beta: 0.77 },
    C: { mediane: [0.159, 0.319, 0.522, 0.855], beta: 0.64 },
    D: { mediane: [0.293, 0.504, 0.741, 1.09], beta: 0.51 },
  },
};
const CEMENTO_ARMATO = {
  fonte: 'rosti2021',
  dove: 'Tab. 3, p. 3178 (edifici di 3–4 piani)',
  classi: {
    'C2-M': { mediane: [0.126, 0.25, 0.397, 0.806], beta: 0.693 },
    'D-M': { mediane: [0.253, 0.774, 1.417, 2.682], beta: 0.995 },
  },
};

/** Funzione di ripartizione della normale standard (algoritmo di Hart, come in West, 2005). */
function phi(x) {
  const a = Math.abs(x);
  let c;
  if (a > 37) c = 0;
  else {
    const e = Math.exp((-a * a) / 2);
    if (a < 7.07106781186547) {
      let b = 3.52624965998911e-2 * a + 0.700383064443688;
      b = b * a + 6.37396220353165;
      b = b * a + 33.912866078383;
      b = b * a + 112.079291497871;
      b = b * a + 221.213596169931;
      b = b * a + 220.206867912376;
      c = e * b;
      b = 8.83883476483184e-2 * a + 1.75566716318264;
      b = b * a + 16.064177579207;
      b = b * a + 86.7807322029461;
      b = b * a + 296.564248779674;
      b = b * a + 637.333633378831;
      b = b * a + 793.826512519948;
      b = b * a + 440.413735824752;
      c /= b;
    } else {
      let b = a + 0.65;
      b = a + 4 / b;
      b = a + 3 / b;
      b = a + 2 / b;
      b = a + 1 / b;
      c = e / b / 2.506628274631;
    }
  }
  return x > 0 ? 1 - c : c;
}

/** Griglia di PGA da 0 a 0,6 g, ogni 0,02 g. Oltre non andiamo: i dati osservati diventano pochi. */
const GRIGLIA = Array.from({ length: 31 }, (_, i) => Math.round(i * 2) / 100);
const prob = (pga, mediana, beta) => (pga === 0 ? 0 : Math.round(phi(Math.log(pga / mediana) / beta) * 10000) / 10000);
const curve = (classi) =>
  Object.fromEntries(
    Object.entries(classi).map(([c, { mediane, beta }]) => [
      c,
      { D3: GRIGLIA.map((x) => prob(x, mediane[2], beta)), D4: GRIGLIA.map((x) => prob(x, mediane[3], beta)) },
    ]),
  );

/* ---------- Quanto ha tremato: Sorrentino e altri (2019), Tab. 1 ---------- */

/* Intensità EMS-98 dopo il 24 agosto e cumulativa dopo il 30 ottobre; PGV in cm/s e PGA in g delle scosse del 24/8 e del 30/10.
   «misurato»: nella tabella originale il valore è in grassetto, cioè viene da un accelerometro; altrimenti è una stima da
   ShakeMap. San Capone: la tabella non dà l'intensità cumulativa. */
const SCUOTIMENTO = {
  fonte: 'sorrentino2019',
  dove: 'Tab. 1, p. 3 della versione accettata',
  luoghi: [
    { luogo: 'Amatrice', ems: ['X', 'XI'], pgv: [44, 38], pga: [0.87, 0.53], misurato: [true, true] },
    { luogo: 'San Capone', nota: 'frazione di Amatrice', ems: ['VII–VIII', null], pgv: [43, 43], pga: [0.77, 0.41], misurato: [false, false] },
    { luogo: 'Accumoli', ems: ['VIII', 'X'], pgv: [42, 40], pga: [0.76, 0.56], misurato: [false, true] },
    { luogo: 'Norcia', ems: ['V–VI', 'VIII–IX'], pgv: [30, 56], pga: [0.37, 0.49], misurato: [true, true] },
  ],
  /* PGV attesa con periodo di ritorno di 475 anni (p. 4): 21–22 cm/s nella quasi totalità dei paesi più colpiti, 14–27 cm/s
     nell'intero insieme. PGV osservata nei paesi più colpiti (conclusioni, p. 18). */
  pgvAttesa475: [21, 22],
  pgvAttesa475Intervallo: [14, 27],
  pgvOsservata: [35, 60],
};

/* ---------- Altri numeri pubblicati, per il testo ---------- */

const NUMERI = {
  vittime2016: { fonte: 'dpc2018', dove: 'p. 3', totale: 299, amatrice: 237, accumoli: 11, arquata: 51, feritiOspedalizzati: 365 },
  norcia1859: { fonte: 'sorrentino2019', dove: 'p. 6–7', morti: 101 },
  patrimonio: {
    fonte: 'daPorto2021',
    dove: 'p. 3211 e p. 3239 (censimento ISTAT 2001)',
    muratura: 61,
    cementoArmato: 25,
    altro: 14,
    caDopo1972: 66,
    caDopo1981: 37,
    muraturaDopo1972: 24,
    muraturaDopo1981: 11,
  },
  muraturaComuni2016: { fonte: 'sorrentino2019', dove: 'p. 5', quota: [78, 97] },
  rischio: {
    fonte: 'dolce2021',
    dove: 'Tab. 3 e 4, p. 3017; Tab. 6 e testo, p. 3020 e seguenti',
    abitazioniCrollateAnno: { media: 2100, min: 400, max: 3300 },
    abitazioniCrollate50Anni: { media: 103600, min: 19500, max: 161900 },
    inagibiliAnno: 36000,
    senzatettoAnno: 80000,
    perditeMiliardiAnno: 2,
  },
  /* Spesa dello Stato per emergenza, ripresa e ricostruzione: comprende anche altri edifici, beni culturali e infrastrutture,
     mentre le perdite di «rischio» riguardano solo le abitazioni (Dolce e altri 2021, p. 3024–3025). */
  speseStato50Anni: { fonte: 'daPorto2021', dove: 'p. 3244, da Dolce e altri (2020)', miliardi: 211, miliardiAnno: 4.2 },
  dado: { fonte: 'dolce2021', dove: 'p. 3009', edifici: 322728, bancheDati: 10 },
  modelli: { fonte: 'daPorto2021', dove: 'p. 3211 e seguenti', muratura: 4, cementoArmato: 2 },
};

const uscita = {
  titolo: 'Danni osservati e curve di fragilità degli edifici italiani: numeri da studi pubblicati',
  compilato: '2026-11-21',
  nota:
    'Numeri trascritti da tabelle e figure degli studi indicati in ogni blocco. Le probabilità in «fragilita» sono un nostro calcolo con la curva lognormale e i parametri pubblicati. Nessun dato di Da.D.O.',
  fonti: FONTI,
  norciaCampi: NORCIA_CAMPI,
  fragilita: {
    formula: 'P(danno ≥ Dk | PGA) = Φ(ln(PGA / mediana_k) / β)',
    griglia: GRIGLIA,
    muratura: { ...MURATURA, probabilita: curve(MURATURA.classi) },
    cementoArmato: { ...CEMENTO_ARMATO, probabilita: curve(CEMENTO_ARMATO.classi) },
  },
  scuotimento: SCUOTIMENTO,
  numeri: NUMERI,
};

fs.writeFileSync(OUT, `${JSON.stringify(uscita)}\n`);
const p = uscita.fragilita.muratura.probabilita;
const i03 = GRIGLIA.indexOf(0.3);
console.log(`Scritto ${OUT.pathname}: ${fs.statSync(OUT).size} byte`);
console.log('A 0,3 g, danno almeno D3:', Object.keys(p).map((c) => `${c} ${p[c].D3[i03]}`).join(', '));
