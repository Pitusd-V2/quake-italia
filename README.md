# Quake Italia

**Capire i terremoti, con i dati ufficiali INGV.**

[![CI](https://github.com/Pitusd-V2/quake-italia/actions/workflows/ci.yml/badge.svg)](https://github.com/Pitusd-V2/quake-italia/actions/workflows/ci.yml)
[![Fonti degli articoli](https://github.com/Pitusd-V2/quake-italia/actions/workflows/fonti.yml/badge.svg)](https://github.com/Pitusd-V2/quake-italia/actions/workflows/fonti.yml)

Quake Italia è un sito gratuito e a codice aperto che mostra i terremoti in Italia e aiuta a capirli. Usa gli stessi
dati ufficiali dell'[INGV](https://terremoti.ingv.it/) e li spiega in parole che chiunque può capire, con le fonti
accanto.

> Quake Italia **non è un sito ufficiale**, non è collegato all'INGV, **non prevede i terremoti** e **non è un sistema
> di allerta**. In caso di emergenza chiama il 112.

## La missione

Quake Italia è nato pensando a Napoli. Ai Campi Flegrei la terra ha ripreso a muoversi, e a ogni scossa le domande
sono le stesse: cos'era? Era forte? Ne arriverà un'altra? Le risposte esistono, e le danno da una vita i ricercatori
dell'INGV. Ma chi non sa dove cercarle, o non sa leggerle, resta solo con la paura. Il progetto è nato per loro, e poi
è cresciuto con il resto d'Italia, perché quelle domande se le fanno tutti, da Norcia a Catania.

Sui terremoti in Italia si sa moltissimo, e gran parte di questa conoscenza è pubblica. È però sparsa in tanti posti
ed è scritta per chi la studia di mestiere: sigle, tabelle, articoli scientifici in inglese. **Quake Italia prova ad
accorciare questa distanza.** Raccoglie in un solo posto i dati e le conoscenze ufficiali e li traduce, senza
impoverirli: i concetti difficili restano, spiegati bene, e ogni affermazione porta alla sua fonte.

Tre principi guidano ogni scelta:

- **Scientifico, ma capibile.** È l'unica regola del progetto. Niente semplificazioni che diventano errori, niente
  sigle lasciate senza spiegazione.
- **Verificabile.** Su un tema che fa paura non basta dire «fidati»: ogni numero ha una fonte, e i calcoli del sito
  sono nel codice, dove chiunque può controllarli.
- **Di tutti.** La cultura scientifica è un bene comune. Gran parte di questa conoscenza nasce dalla ricerca
  pubblica e deve restare accessibile: senza abbonamenti, senza pubblicità, senza registrazioni.

La versione completa è nella pagina «Informazioni» del sito ([`src/pages/InfoPage.tsx`](src/pages/InfoPage.tsx)).

## Quake Italia e l'INGV

L'INGV è la fonte ufficiale: registra ogni terremoto in Italia e mette i suoi dati a disposizione di tutti. È grazie a
questo lavoro che Quake Italia può esistere. Il sito **non sostituisce l'INGV**: usa gli stessi dati e aggiunge quello
che serve per capirli. Per i dati scientifici completi e per le comunicazioni ufficiali il posto giusto resta l'INGV, e
ogni scheda di una scossa rimanda alla sua pagina ufficiale.

## Cosa c'è nel sito

| Sezione | A cosa serve |
|---|---|
| **Vicino a te** | Cosa è successo nelle ultime 24 ore attorno al tuo comune, in una frase. Il tono dipende da quanto la scossa si è sentita da te (intensità stimata), non dalla sola magnitudo. |
| **Ho sentito una scossa** | Trova il terremoto che probabilmente hai sentito e spiega cos'era. |
| **Terremoti** | Elenco e mappa delle scosse registrate dall'INGV, con filtri semplici. Ogni scossa ha la sua scheda. |
| **Cosa sta succedendo** | Il racconto di una sequenza dopo una scossa forte, con l'andamento delle repliche a parole. |
| **Il mio comune** | Zona sismica ufficiale, zone dei piani per Vesuvio e Campi Flegrei, terremoti più forti dal 1985. |
| **Cosa fare** | I consigli di Protezione Civile e Vigili del Fuoco per dopo, durante e prima di una scossa. Ogni consiglio ha accanto la sua fonte. |
| **Prepara la tua casa** | Gli stessi consigli come missioni da fare una alla volta. |
| **La casa ha dei danni** | Quando preoccuparsi, chi chiamare, come funziona il controllo di agibilità. |
| **Capire** | Articoli sulla scienza dei terremoti, organizzati in percorsi, con ricerca nel testo e glossario. |
| **È vero?** | Le voci più comuni sui terremoti, con la risposta degli scienziati. |
| **Analisi** | Per chi vuole i numeri: ricerca nel catalogo, grafici, sequenze, esportazione CSV e GeoJSON. |

Il sito si installa come app (PWA) e funziona anche senza rete, con gli ultimi dati scaricati.

## Come lavoriamo

**Gli articoli.** Ogni articolo di «Capire» risponde a una domanda che le persone si fanno davvero, usa dati INGV e
cita fonti verificabili (enti ufficiali, studi scientifici, cataloghi). Gli articoli sono scritti insieme a
un'intelligenza artificiale e **letti e approvati da una persona** prima della pubblicazione: lo diciamo all'inizio di
ogni articolo. Le regole sono pubbliche, nella pagina «Come scriviamo gli articoli» e in
[`contenuti/COME-SCRIVERE.md`](contenuti/COME-SCRIVERE.md).

**Le stime.** Frasi come «sentita forte» sono stime indicative, calcolate da magnitudo, profondità e distanza con la
relazione di [Allen, Wald e Worden (2012)](https://doi.org/10.1007/s10950-012-9278-7), con un margine di circa un
grado. Il sito lo dichiara ovunque le usa.

**La privacy.** Nessun account, nessun cookie, nessuna statistica, nessuna pubblicità. Il comune, il punto di casa e
le preferenze restano sul dispositivo. Verso i servizi esterni escono solo coordinate arrotondate (circa 1 km verso
l'INGV), mai il punto esatto.

**I controlli automatici.** A ogni modifica GitHub esegue typecheck, test e build. Ogni lunedì ricontrolla le
dipendenze, verifica che i link e i DOI citati negli articoli rispondano ancora e controlla se la Protezione Civile ha
pubblicato un nuovo elenco delle zone sismiche.

## Per sviluppatori

```bash
npm install        # installa le dipendenze (versioni bloccate)
npm run dev        # sviluppo su http://localhost:5173
npm test           # test
npm run build      # typecheck + test + build in dist/ + pagine HTML per i motori di ricerca
npm run preview    # prova la build con gli stessi header di sicurezza della produzione
```

**Stack.** React 19, TypeScript, Vite, TanStack Query, MapLibre GL, React Router, MDX. Nessun backend: il sito è
statico e parla direttamente con i servizi pubblici elencati sotto.

**Dove sono le cose.**

| Percorso | Contenuto |
|---|---|
| `contenuti/articoli/*.mdx` | Gli articoli di «Capire»: un file per articolo, con i dati in cima (titolo, domanda, fonti, glossario). |
| `plugins/` | Il controllo degli articoli al build e la preparazione di catalogo, glossario e indice per la ricerca. |
| `src/pages/` | Le pagine del sito. |
| `src/learn/` | La sezione «Capire»: pagine, figure, ricerca, dati calcolati degli articoli. |
| `src/lib/` | La logica: dati INGV, stime di intensità, zone sismiche, testi in parole semplici. |
| `src/legal/` | Privacy Policy, Termini d'uso e i loro dati (`config.ts`). |
| `scripts/` | Preparazione dei dati degli articoli, controllo delle fonti, generazione delle pagine HTML. |
| `security/` | Header di sicurezza (Content-Security-Policy) della build. |

**Comandi utili.**

- `node scripts/check-article.mjs <file.mdx>`: controlla un solo articolo, anche una bozza.
- `npm run check:fonti`: verifica link e DOI di tutti gli articoli.
- `npm run check:zone`: controlla se è uscito un nuovo elenco delle zone sismiche (`--update` per aggiornare i dati).
- `http://localhost:5173/?simulazioni`: pannello per simulare scosse in sviluppo (codice in `src/dev/`, mai nel sito pubblicato).

Per aggiungere uno strumento alla sezione Analisi vedi `src/pages/expert/registry.ts`. Titoli e descrizioni delle
pagine per i motori di ricerca sono in `src/seo/pages.ts`.

## Dati e crediti

- **Terremoti**: © [INGV](https://terremoti.ingv.it/), licenza [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.it).
- **Zone sismiche**: [Dipartimento della Protezione Civile](https://rischi.protezionecivile.gov.it/it/sismico/attivita/classificazione-sismica/) (maggio 2025).
- **Consigli di sicurezza**: Protezione Civile (campagna [Io non rischio](https://iononrischio.protezionecivile.it/)) e Vigili del Fuoco.
- **Mappe**: [OpenFreeMap](https://openfreemap.org/), © OpenMapTiles, dati © [contributori di OpenStreetMap](https://www.openstreetmap.org/copyright).
- **Ricerca dei comuni e delle vie**: [Photon](https://photon.komoot.io/) (komoot).
- **Carattere** Atkinson Hyperlegible Next (SIL OFL), **icone** Lucide (ISC).
- **Sagoma dell'Italia** nel logo: [Natural Earth](https://www.naturalearthdata.com/) (pubblico dominio).

## Licenze

- **Codice**: [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0). Puoi usarlo, studiarlo, modificarlo e
  ridistribuirlo. Se pubblichi un sito basato su questo codice, anche modificato, devi rendere disponibile il suo
  codice sorgente con la stessa licenza.
- **Testi** degli articoli e delle pagine informative: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.it).
  Puoi riusarli citando Quake Italia e con la stessa licenza.
- **Dati di terzi** (INGV, Protezione Civile, OpenStreetMap, Natural Earth): restano con le loro licenze.
- **Nome e logo** «Quake Italia» non sono coperti da queste licenze. Se pubblichi una versione modificata, usa un
  nome e un logo diversi, così nessuno la scambia per questo progetto.

Il codice è fornito «così com'è», senza garanzie. Per chi usa il sito valgono i Termini d'uso e la Privacy Policy
pubblicati sul sito.

## Contribuire

Segnalazioni e proposte sono benvenute, soprattutto da chi lavora con i terremoti: sismologi, geologi, tecnici,
protezione civile. Quake Italia è gratuito, senza pubblicità e senza guadagni. Ogni contributo, comprese le revisioni
degli articoli, è volontario, non retribuito e a titolo personale: non impegna l'ente per cui lavori.

- **Ogni contenuto scientifico cita una fonte verificabile.** Numeri, date e magnitudo «a memoria» non vengono accettati.
- **Testi chiari e mai allarmisti**, pensati per chi non fa ricerca e per chi usa poco la tecnologia.
- **Rispetto per gli enti.** Quake Italia non sostituisce nessuno: verso l'INGV e gli altri enti il tono è di
  ringraziamento, mai di confronto.
- **Prima di proporre una modifica**, `npm run build` deve passare.

Hai trovato un errore in un articolo? In fondo a ogni articolo c'è il link per segnalarlo.

## Sicurezza e contatti

Per i problemi di sicurezza **non aprire una segnalazione pubblica**: segui [SECURITY.md](SECURITY.md).
Per tutto il resto: quakeitalia@gmail.com.
