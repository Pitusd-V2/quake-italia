/**
 * I percorsi di «Capire»: gruppi di articoli sullo stesso tema, dal più semplice al più specifico.
 * Ogni articolo dichiara il suo percorso nei dati in cima al file (`percorso: le-basi`).
 * Questo file è letto anche al build (plugins/articoli.ts): solo dati, niente import.
 */
export interface Percorso {
  id: string;
  titolo: string;
  descrizione: string;
}

export const PERCORSI: Percorso[] = [
  { id: 'le-basi', titolo: 'Le basi', descrizione: 'Cos’è un terremoto, come si misura e come si comporta: le idee che servono per capire tutto il resto.' },
  { id: 'italia', titolo: 'L’Italia che trema', descrizione: 'Perché il nostro Paese ha tanti terremoti, dove e come: faglie, mappe e cataloghi.' },
  { id: 'storia', titolo: 'Terremoti nella storia', descrizione: 'I terremoti che hanno segnato l’Italia, raccontati con i dati e con quello che ci hanno insegnato.' },
  { id: 'vulcani', titolo: 'Vulcani d’Italia', descrizione: 'Etna, Vesuvio, Campi Flegrei e il bradisismo, Stromboli e gli altri: perché vicino ai vulcani la terra trema in modo diverso.' },
  { id: 'sicurezza', titolo: 'Case e sicurezza', descrizione: 'Perché gli edifici crollano o resistono, come prepararsi e cosa succede dopo una scossa.' },
  { id: 'scienza', titolo: 'La scienza di oggi', descrizione: 'Satelliti, intelligenza artificiale, previsioni di probabilità: come lavorano oggi i sismologi.' },
  { id: 'miti', titolo: 'Miti e verità', descrizione: 'Le credenze più diffuse sui terremoti, messe alla prova con i dati e con la ricerca.' },
  { id: 'persone', titolo: 'Vivere un terremoto', descrizione: 'Paura, sonno, capogiri, bambini e anziani: cosa prova chi vive un terremoto, e cosa aiuta.' },
];
