/**
 * Le fonti delle pagine del sito che non sono articoli. Stanno qui, in un file di soli dati, per due motivi:
 *  - le pagine le mostrano in fondo (SafetyPage, DamagePage, RumorsPage, la storia sismica in «Il mio comune»…);
 *  - scripts/build-credits.mjs le mette nei crediti del README, insieme alle fonti degli articoli.
 * Una fonte aggiunta qui compare in tutti e due i posti. Un test controlla che il README sia aggiornato.
 * Niente import: questo file lo legge anche Node, senza passare dal build.
 */
export interface Source {
  label: string;
  url?: string;
}

/** «Cosa fare»: numerate, perché ogni consiglio cita il numero della sua fonte. */
export const SAFETY_SOURCES: (Source & { n: number; url: string })[] = [
  { n: 1, label: 'Io non rischio (Protezione Civile) — Cosa fare: terremoto', url: 'https://iononrischio.protezionecivile.it/it/preparati/terremoto/cosa-fare/' },
  { n: 2, label: 'Dipartimento della Protezione Civile — Se arriva il terremoto', url: 'https://www.protezionecivile.gov.it/it/approfondimento/se-arriva-il-terremoto/' },
  { n: 3, label: 'Dipartimento della Protezione Civile — Rischio sismico. Sei preparato?', url: 'https://rischi.protezionecivile.it/it/sismico/sei-preparato/' },
  { n: 4, label: 'Ministero dell’Interno — Che cosa fare se si è coinvolti in un terremoto? I consigli dei Vigili del Fuoco', url: 'https://www.interno.gov.it/it/cosa-fare-e-coinvolti-terremoto' },
  { n: 5, label: 'AREU Lombardia (agenzia che gestisce il 112) — Domande frequenti sull’app del 112', url: 'https://www.areu.lombardia.it/web/home/faq-where-are-u' },
];

/** La scheda a simboli della Protezione Civile, linkata in «Cosa fare» (citata nella fonte 3). */
export const CAA_SOURCE: Source = {
  label: 'Dipartimento della Protezione Civile — Scheda in Comunicazione Aumentativa e Alternativa sul terremoto (Istituto Leonarda Vaccari, revisione ISAAC Italy)',
  url: 'https://www.protezionecivile.gov.it/static/e8131fdaea1248f821bcb3029623fb1e/scheda-caa-terremoto.pdf',
};

/** «La casa ha dei danni». */
export const DAMAGE_SOURCES: Source[] = [
  { label: 'Dipartimento della Protezione Civile — Se arriva il terremoto', url: 'https://www.protezionecivile.gov.it/it/approfondimento/se-arriva-il-terremoto/' },
  { label: 'Dipartimento della Protezione Civile — La scheda AeDES', url: 'https://www.protezionecivile.gov.it/it/approfondimento/scheda-aedes/' },
  {
    label: 'Dipartimento della Protezione Civile — Terremoto Emilia 2012, verifiche di agibilità ed esiti A–F (in inglese)',
    url: 'https://emergenze.protezionecivile.gov.it/en/seismic/emilia-romagna-and-lombardy-earthquake-2012/safety-checks/',
  },
  {
    label: 'Dipartimento della Protezione Civile — Terremoto Centro Italia 2016, verifiche di agibilità',
    url: 'https://emergenze.protezionecivile.gov.it/it/sismiche/terremoto-centro-italia-2016/verifiche-di-agibilita/',
  },
  {
    label: 'Dipartimento della Protezione Civile — Chiarimenti sul contributo di autonoma sistemazione (CAS)',
    url: 'https://domande-risposte.protezionecivile.gov.it/it/approfondimento/terremoto-centro-italia-chiarimenti-cas/',
  },
  { label: 'Io non rischio — campagna di comunicazione sui rischi', url: 'https://iononrischio.protezionecivile.it/' },
];

/** «È vero? Le voci sui terremoti». */
export const RUMOR_SOURCES: Source[] = [
  {
    label: 'A. Amato (INGV), Alcune riflessioni in caso di una sequenza sismica, INGVterremoti, 2019',
    url: 'https://ingvterremoti.com/2019/11/11/alcune-riflessioni-in-caso-di-una-sequenza-sismica-come-quella-di-sora-balsorano-del-7-novembre-2019/',
  },
  { label: 'INGV — FAQ, domande frequenti sui terremoti (Quale magnitudo?)', url: 'https://ingvterremoti.com/faq/faq-domande-frequenti-sui-terremoti/' },
  { label: 'INGV — La magnitudo del terremoto del 30 ottobre 2016', url: 'https://ingvterremoti.com/2016/10/31/la-magnitudo-del-terremoto-del-30-ottobre-2016/' },
  { label: 'USGS — Earthquake Facts & Earthquake Fantasy (in inglese)', url: 'https://www.usgs.gov/programs/earthquake-hazards/earthquake-facts-earthquake-fantasy' },
  { label: 'USGS — Can you predict earthquakes? (in inglese)', url: 'https://www.usgs.gov/faqs/can-you-predict-earthquakes' },
  { label: 'Il Post — La bufala sul governo che avrebbe abbassato la magnitudo del terremoto, 2016', url: 'https://www.ilpost.it/2016/08/26/magnitudo-terremoto-bufala/' },
  { label: 'Focus — Terremoto: perché i dati sulle magnitudo sono diversi', url: 'https://www.focus.it/scienza/scienze/terremoto-perche-i-dati-sulle-magnitudo-sono-diversi' },
  {
    label: 'Dipartimento della Protezione Civile — Domande e risposte sui Campi Flegrei',
    url: 'https://rischi.protezionecivile.gov.it/it/vulcanico/vulcani-italia/campi-flegrei/il-bradisismo-ai-campi-flegrei/domande-e-risposte/domande-e-risposte-sul-rischio-vulcanico-e-il-bradisismo-ai-campi-flegrei/',
  },
];

/**
 * Database Macrosismico Italiano (storia sismica in «Il mio comune»). LA CITAZIONE: l'INGV chiede che la fonte sia
 * sempre citata, «anche per un uso parziale», con queste parole. Copiate dalla pagina ufficiale di download, uguali al
 * registro dati INGV e al registro del DOI (controllati il 12/11/2026). Non vanno riformulate né accorciate.
 */
export const DBMI_CITATION =
  'Locati M., Camassi R., Rovida A., Ercolani E., Bernardini F., Castelli V., Caracciolo C.H., Tertulliani A., Rossi A., Azzaro R., D’Amico S., Antonucci A. (2022). Database Macrosismico Italiano (DBMI15), versione 4.0 [Data set]. Istituto Nazionale di Geofisica e Vulcanologia (INGV).';
export const DBMI_DOI = 'https://doi.org/10.13127/dbmi/dbmi15.4';

/** Le altre fonti delle funzioni del sito (stime, scale, dati dal vivo, zone): quelle elencate nella pagina «Informazioni». */
export const SITE_SOURCES: { title: string; sources: Source[] }[] = [
  {
    title: 'Terremoti, zone sismiche e storia dei comuni',
    sources: [
      { label: 'INGV — Istituto Nazionale di Geofisica e Vulcanologia, servizio FDSN degli eventi sismici (dati CC BY 4.0)', url: 'https://terremoti.ingv.it/' },
      { label: 'Dipartimento della Protezione Civile — Classificazione sismica dei comuni (maggio 2025)', url: 'https://rischi.protezionecivile.gov.it/it/sismico/attivita/classificazione-sismica/' },
      { label: 'Dipartimento della Protezione Civile — Piani nazionali per il Vesuvio e per i Campi Flegrei (zone rossa e gialla)', url: 'https://www.protezionecivile.gov.it/it/approfondimento/aggiornamento-del-piano-nazionale-di-protezione-civile-il-vesuvio/' },
      { label: DBMI_CITATION, url: DBMI_DOI },
      { label: 'INGV, Database Fotografico Macrosismico — Scala MCS (descrizioni dei gradi)', url: 'https://dfm.ingv.it/?page=scale.mcs' },
    ],
  },
  {
    title: 'Stime di quanto si è sentita una scossa',
    sources: [
      { label: 'Allen, T. I., Wald, D. J. & Worden, C. B. (2012). Intensity attenuation for active crustal regions. Journal of Seismology, 16', url: 'https://doi.org/10.1007/s10950-012-9278-7' },
      { label: 'USGS — The Modified Mercalli Intensity Scale', url: 'https://www.usgs.gov/programs/earthquake-hazards/modified-mercalli-intensity-scale' },
      { label: 'British Geological Survey — EMS-98, sintesi della scala (da Grünthal 1998)', url: 'https://quakes.bgs.ac.uk/education/faqs/ems_synopsis.html' },
    ],
  },
];
