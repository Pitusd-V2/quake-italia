/**
 * Registro pubblico delle correzioni importanti agli articoli e alle pagine informative (mostrato in /come-scriviamo).
 * Regola: gli errori non si cancellano di nascosto. Si aggiunge una voce qui, con la data, in cima all'elenco.
 */
export interface Correzione {
  /** AAAA-MM-GG */
  data: string;
  pagina: string;
  /** Indirizzo della pagina corretta. */
  link: string;
  prima: string;
  ora: string;
}

export const CORREZIONI: Correzione[] = [
  {
    data: '2026-10-31',
    pagina: 'Campi Flegrei: la caldera che respira',
    link: '/capire/campi-flegrei',
    prima: 'Diceva che «a oggi non ci sono evidenze di risalita di magma».',
    ora:
      'Studi recenti, citati anche dall’Osservatorio Vesuviano, indicano magma in movimento intorno ai 4–8 km di profondità. L’articolo ora lo spiega, insieme al fatto che l’Osservatorio, nel bollettino di settembre 2026, non vede elementi che suggeriscano cambiamenti significativi a breve termine.',
  },
  {
    data: '2026-10-31',
    pagina: 'Campi Flegrei: la caldera che respira',
    link: '/capire/campi-flegrei',
    prima: 'Diceva che da novembre 2025 era stata adottata «la fase di attenzione»; sui gas citava solo il valore di CO₂, senza la tendenza.',
    ora: 'Precisato che il livello giallo è diviso in due fasi ed è in vigore la «fase 2». Precisato che il flusso di CO₂ di settembre 2026 è tra i più bassi degli ultimi mesi, pur restando elevato.',
  },
  {
    data: '2026-10-31',
    pagina: 'Il mio comune',
    link: '/il-mio-comune',
    prima: 'Diceva che la zona sismica «serve a decidere come vanno costruiti gli edifici».',
    ora: 'Dal 2009 non è più così: per progettare si usa la pericolosità calcolata punto per punto (Norme Tecniche per le Costruzioni). La zona serve a Regione e Genio civile per pianificare e controllare il territorio.',
  },
];
