# Quake Italia

**Capire i terremoti, con i dati ufficiali INGV.**

Quake Italia è un sito gratuito che mostra i terremoti in Italia in modo semplice e accessibile, soprattutto per chi
non è pratico di tecnologia (per esempio le persone anziane), con una sezione Analisi per chi vuole approfondire.

## Perché esiste, se c'è già l'INGV?

Pensalo come le mod dei videogiochi che si chiamano «Better…»: non sostituiscono il gioco originale, lo rendono più
comodo da usare. Quake Italia fa lo stesso con i dati dell'[INGV](https://terremoti.ingv.it/): stessa fonte ufficiale,
nessun dato inventato, ma **tutto più facile**.

- **Capisci al primo sguardo.** Niente sigle: invece di «ML 3.2» leggi «Scossa leggera, di solito non fa danni».
- **Parla di te.** Ti dice subito se è successo qualcosa vicino a casa tua e se potresti averlo sentito.
- **Una scossa ti ha spaventato?** Premi «Ho sentito una scossa» e scopri in un attimo cos'era.
- **Tutto in un posto.** Terremoti, zona sismica del tuo comune e cosa fare: non devi cercare su tanti siti.
- **Comodo da leggere.** Scritte grandi e colori chiari. E se preferisci, te lo legge ad alta voce.
- **Ti aiuta a capire.** Brevi spiegazioni per sapere cosa succede, con meno paura.

Per i dati scientifici completi e le comunicazioni ufficiali resta l'INGV: ogni scheda rimanda alla pagina ufficiale.
Quake Italia **non è un sito ufficiale**, non è collegato all'INGV e **non è un sistema di allerta**.

## Funzioni

- **Vicino a te**: stato delle ultime 24 ore attorno al tuo comune, in una frase. Il tono dipende da quanto la scossa si è sentita a casa tua (intensità stimata), non dalla sola magnitudo: il 112 compare solo se sono plausibili danni.
- **Ho sentito una scossa**: trova il terremoto che probabilmente hai sentito.
- **Terremoti**: elenco e mappa, con filtri semplici.
- **Il mio comune**: zona sismica ufficiale, zona rossa o gialla di Vesuvio e Campi Flegrei (con la regione gemellata), terremoti più forti dal 1985, checklist per preparare la casa.
- **Cosa sta succedendo**: racconto in tempo reale di una sequenza dopo una scossa forte, con l'andamento delle repliche a parole («in calo», «stabile»…).
- **Cosa fare**: consigli della campagna «Io non rischio» e glossario.
- **La casa ha dei danni**: segnali per capire se uscire, chi chiamare, come funziona il controllo di agibilità (esiti A–F), foto e assicurazione, aiuti come il contributo di autonoma sistemazione.
- **È vero?**: le voci più comuni sui terremoti (previsioni, «tempo da terremoto», magnitudo «abbassata»…) con la risposta degli scienziati, e come riconoscere un messaggio falso.
- **Analisi** (per esperti, sempre nel menu): ricerca nel catalogo, mappa per profondità, sequenza, Gutenberg-Richter, tabella, esportazione CSV/GeoJSON.
- App installabile (PWA), funziona anche senza rete con gli ultimi dati.

## Per sviluppatori

```bash
npm install        # installa le dipendenze (versioni bloccate)
npm run dev        # sviluppo su http://localhost:5173 (pannello «Simulazioni»: aggiungi ?simulazioni)
npm test           # test
npm run build      # typecheck + test + build in dist/
npm run preview    # prova la build con gli stessi header di sicurezza della produzione
```

Stack: React 19, TypeScript, Vite, TanStack Query, MapLibre GL, React Router. Nessun backend: il sito è statico.

- Aggiungere uno strumento alla sezione Analisi: vedi `src/pages/expert/registry.ts`.
- Simulazioni (solo sviluppo, mai nel sito pubblicato): aggiungi `?simulazioni` all'indirizzo, es. `http://localhost:5173/?simulazioni`. Codice in `src/dev/`.
- Dati delle sequenze da rivedere sulla mappa (sezione «Capire»): `node scripts/build-sequence-data.mjs`; tappe e note in `src/learn/sequences.ts`.
- Dati dell'articolo «Esiste il tempo da terremoto?»: `node scripts/build-weather-myth-data.mjs` (catalogo INGV e meteo ERA5 da Open-Meteo; qualche minuto, con `CACHE_DIR=<cartella>` i download si riusano).
- Sicurezza: vedi [SECURITY.md](SECURITY.md).
- Dati legali (titolare, contatti, hosting): `src/legal/config.ts`.

## Dati e licenze

- Terremoti: © [INGV](https://terremoti.ingv.it/), licenza [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.it).
- Zone sismiche: [Dipartimento della Protezione Civile](https://rischi.protezionecivile.gov.it/it/sismico/attivita/classificazione-sismica/) (maggio 2025).
- Mappe: [OpenFreeMap](https://openfreemap.org/), © OpenMapTiles, dati © [contributori di OpenStreetMap](https://www.openstreetmap.org/copyright).
- Ricerca dei comuni: [Photon](https://photon.komoot.io/) (komoot).
- Carattere Atkinson Hyperlegible Next (SIL OFL), icone Lucide (ISC).
- Sagoma dell'Italia nel logo: [Natural Earth](https://www.naturalearthdata.com/) (pubblico dominio). Icone dell'app: `npm run icons`.

## Codice aperto

Quake Italia è **open source**: chiunque può controllare come funziona, da dove arrivano i dati e come vengono
spiegati. Non ci sono server privati, account o chiavi segrete: quello che vedi qui è tutto il sito.

- **Codice**: [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0). Puoi usarlo, studiarlo, modificarlo e
  ridistribuirlo; se pubblichi un sito basato su questo codice (anche modificato), devi rendere disponibile il suo
  codice sorgente con la stessa licenza.
- **Testi** degli articoli e delle pagine informative: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.it).
  Puoi riusarli citando Quake Italia e con la stessa licenza.
- **Dati di terzi** (INGV, Protezione Civile, OpenStreetMap, Natural Earth…): restano con le loro licenze, elencate sopra.
- **Nome e logo** «Quake Italia» **non** sono coperti da queste licenze: se pubblichi una versione modificata, usa un
  nome e un logo diversi, così nessuno la scambia per questo progetto.

Il codice è fornito «così com'è», senza garanzie (vedi la licenza). Per chi usa il sito valgono i
Termini d'uso e la Privacy Policy pubblicati sul sito: Quake Italia **non è un sistema di allerta**.

## Contribuire

Segnalazioni e proposte sono benvenute, soprattutto da chi lavora con i terremoti (sismologi, geologi, protezione civile).
La regola più importante è la stessa del sito: **scientifico ma capibile, niente disinformazione**.

- **Ogni contenuto scientifico deve citare una fonte verificabile** (INGV, Protezione Civile, articoli scientifici,
  cataloghi ufficiali). Numeri, date e magnitudo «a memoria» non vengono accettati.
- Testi semplici, pensati anche per chi non è pratico di tecnologia; tono chiaro, mai allarmista.
- Quake Italia non sostituisce nessuno: verso l'INGV e gli altri enti, tono di ringraziamento, mai di confronto.
- Prima di proporre una modifica: `npm run build` deve passare (typecheck, test, build).
- Problemi di sicurezza: **non** aprire una segnalazione pubblica, vedi [SECURITY.md](SECURITY.md).
