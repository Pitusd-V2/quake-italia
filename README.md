# Quake Italia

**Capire i terremoti, con i dati ufficiali INGV.**

Quake Italia è un sito gratuito che mostra i terremoti in Italia e aiuta a capirli. È pensato per chi non fa il
sismologo di mestiere: chi ha sentito una scossa e vuole sapere cos’era, chi vuole capire come funzionano i terremoti,
chi cerca risposte chiare e verificabili. Con un occhio di riguardo per chi usa poco la tecnologia (per esempio le
persone anziane), e una sezione Analisi per chi vuole i numeri.

## Perché esiste, se c'è già l'INGV?

Pensalo come le mod dei videogiochi che si chiamano «Better…»: non sostituiscono il gioco originale, lo rendono più
comodo da usare. Quake Italia fa lo stesso con i dati dell'[INGV](https://terremoti.ingv.it/): stessa fonte ufficiale,
nessun dato inventato, ma **i dati spiegati**.

- **Ogni scossa, con il suo significato.** Accanto ai numeri: quanto è stata forte, se e come si è sentita dove
  abiti (una stima, con il suo margine), cosa fare. Le sigle restano, per chi le vuole.
- **La scienza dei terremoti, raccontata sul serio.** Nella sezione «Capire», articoli per chi non fa ricerca ma vuole
  capire davvero: con le fonti, i dati veri e il codice per rifare i conti. Dal riassunto di 30 secondi agli studi
  originali.
- **Le risposte alle domande di tutti.** «Cos'era la scossa che ho sentito?», «In che zona sismica è il mio comune?»,
  «È vero che…?», «La casa ha delle crepe: cosa faccio?». Ogni risposta porta alle fonti ufficiali.
- **Per chi vuole i numeri.** La sezione Analisi: catalogo, grafici, sequenze, esportazione dei dati.
- **Aperto e senza secondi fini.** Gratuito, senza pubblicità, senza account e senza tracciamento.
- **Facile da leggere per tutti.** Scritte grandi, colori chiari e, se preferisci, la lettura ad alta voce.

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
- **Capire**: articoli «a strati» sulla scienza dei terremoti, per chi non fa ricerca ma vuole capire davvero: fonti verificabili, dati INGV e il codice per rifare i conti. Le regole sono pubbliche, nella pagina «Come scriviamo gli articoli».
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
- **Articoli di «Capire»**: un file per articolo in `contenuti/articoli/*.mdx` (Markdown con i dati in cima). Come scriverne uno: [`contenuti/COME-SCRIVERE.md`](contenuti/COME-SCRIVERE.md); regole editoriali: pagina `/come-scriviamo`. Il build controlla ogni articolo (`plugins/articoli.ts`); `npm run check:fonti` verifica link e DOI (anche ogni lunedì su GitHub).
- Dati delle sequenze da rivedere sulla mappa (sezione «Capire»): `node scripts/build-sequence-data.mjs`; tappe e note in `src/learn/sequences.ts`.
- Dati dell'articolo «Esiste il tempo da terremoto?»: `node scripts/build-weather-myth-data.mjs` (catalogo INGV e meteo ERA5 da Open-Meteo; qualche minuto, con `CACHE_DIR=<cartella>` i download si riusano).
- Zone sismiche dei comuni: `src/data/zone-sismiche.json`, dal file ufficiale della Protezione Civile. Ogni lunedì GitHub controlla se ne è uscito uno nuovo (`.github/workflows/zone-sismiche.yml`) e, se sì, apre una segnalazione. Per controllare o aggiornare a mano: `node scripts/check-zone-update.mjs` (aggiungi `--update` per riscrivere i dati).
- Sicurezza: vedi [SECURITY.md](SECURITY.md).
- Dati legali (titolare, contatti, hosting): `src/legal/config.ts`.
- Pagine per Google e anteprime dei link: `npm run build` genera anche un file HTML per ogni pagina (`scripts/prerender.mjs`), con titolo e descrizione da `src/seo/pages.ts`. Gli articoli e le pagine che non invecchiano hanno il testo già dentro; quelle con dati dal vivo solo titolo e descrizione. Link canonici, mappa del sito e immagine di anteprima (`public/og-image.png`, da `scripts/build-og-image.mjs`) compaiono quando `siteUrl` in `src/legal/config.ts` (o la variabile `SITE_URL`) è l'indirizzo vero del sito.

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
Quake Italia è gratuito, senza pubblicità e senza guadagni: ogni contributo, comprese le revisioni degli articoli, è
volontario e non retribuito, e a titolo personale (non impegna l'ente per cui lavori).
La regola più importante è la stessa del sito: **scientifico ma capibile, niente disinformazione**.

- **Ogni contenuto scientifico deve citare una fonte verificabile** (INGV, Protezione Civile, articoli scientifici,
  cataloghi ufficiali). Numeri, date e magnitudo «a memoria» non vengono accettati.
- Testi chiari, pensati per chi non fa ricerca (e per chi usa poco la tecnologia); tono mai allarmista.
- Quake Italia non sostituisce nessuno: verso l'INGV e gli altri enti, tono di ringraziamento, mai di confronto.
- Prima di proporre una modifica: `npm run build` deve passare (typecheck, test, build).
- Problemi di sicurezza: **non** aprire una segnalazione pubblica, vedi [SECURITY.md](SECURITY.md).
