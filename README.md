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
- `npm run crediti`: aggiorna i crediti completi qui sotto (la build si ferma se mancano fonti).
- `npm run check:zone`: controlla se è uscito un nuovo elenco delle zone sismiche (`--update` per aggiornare i dati).
- `http://localhost:5173/?simulazioni`: pannello per simulare scosse in sviluppo (codice in `src/dev/`, mai nel sito pubblicato).

Per aggiungere uno strumento alla sezione Analisi vedi `src/pages/expert/registry.ts`. Titoli e descrizioni delle
pagine per i motori di ricerca sono in `src/seo/pages.ts`.

## Fonti e ringraziamenti

Quake Italia esiste grazie al lavoro di chi raccoglie, studia e rende pubblici i dati sui terremoti: i ricercatori e i
tecnici dell'INGV, la Protezione Civile, i Vigili del Fuoco, gli autori degli studi citati negli articoli e chi
mantiene i dati e i programmi liberi su cui il sito è costruito. Grazie.

### Dati e servizi

- **Terremoti**: © [INGV](https://terremoti.ingv.it/), licenza [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.it).
- **Storia sismica dei comuni**: Locati M., Camassi R., Rovida A., Ercolani E., Bernardini F., Castelli V., Caracciolo C.H., Tertulliani A., Rossi A., Azzaro R., D’Amico S., Antonucci A. (2022). Database Macrosismico Italiano (DBMI15), versione 4.0 [Data set]. Istituto Nazionale di Geofisica e Vulcanologia (INGV). https://doi.org/10.13127/dbmi/dbmi15.4. Licenza [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.it). Il sito ne mostra una scelta, preparata con `scripts/build-dbmi-data.mjs`.
- **Zone sismiche**: [Dipartimento della Protezione Civile](https://rischi.protezionecivile.gov.it/it/sismico/attivita/classificazione-sismica/) (maggio 2025).
- **Consigli di sicurezza**: Protezione Civile (campagna [Io non rischio](https://iononrischio.protezionecivile.it/)) e Vigili del Fuoco.
- **Mappe**: [OpenFreeMap](https://openfreemap.org/), © OpenMapTiles, dati © [contributori di OpenStreetMap](https://www.openstreetmap.org/copyright).
- **Ricerca dei comuni e delle vie**: [Photon](https://photon.komoot.io/) (komoot).
- **Carattere** Atkinson Hyperlegible Next (SIL OFL), **icone** Lucide (ISC).
- **Sagoma dell'Italia** nel logo: [Natural Earth](https://www.naturalearthdata.com/) (pubblico dominio).

<!-- CREDITI_INIZIO: questa parte la scrive «npm run crediti», non modificarla a mano -->

### Tutte le fonti citate

Ogni fonte citata nel sito, senza eccezioni: anche quelle usate una volta sola. Le fonti degli articoli sono riportate
come sono scritte negli articoli; dove c’è «e altri», l’elenco completo degli autori si trova dal link o dal DOI.
Questa parte si aggiorna da sola con `npm run crediti`, e la build si ferma se manca qualcosa.

<details>
<summary><strong>Fonti degli articoli di «Capire» — 150 fonti in 16 articoli</strong></summary>

#### Cos’è un terremoto

*Le basi* · [leggi l’articolo](contenuti/articoli/cos-e-un-terremoto.mdx)

- INGV — FAQ, domande frequenti sui terremoti — [link](https://ingvterremoti.com/faq/faq-domande-frequenti-sui-terremoti/)
- Reid, H. F. (1910). The Mechanics of the Earthquake. The California Earthquake of April 18, 1906, Report of the State Investigation Commission, vol. 2
- Wells, D. L. & Coppersmith, K. J. (1994). New empirical relationships among magnitude, rupture length… Bulletin of the Seismological Society of America, 84(4) — [link](https://doi.org/10.1785/BSSA0840040974)

#### Magnitudo e intensità: perché la stessa scossa fa effetti diversi

*Le basi* · [leggi l’articolo](contenuti/articoli/magnitudo-e-intensita.mdx)

- INGV — «Cinque anni dal terremoto di Casamicciola del 21 agosto 2017», blog INGVterremoti, 21 agosto 2022 — [link](https://ingvterremoti.com/2022/08/21/cinque-anni-dal-terremoto-di-casamicciola-del-21-agosto-2017/)
- Azzaro, R., Del Mese, S., Graziani, L., Maramai, A., Martini, G., Paolini, S., Screpanti, A., Verrubbi, V., Arcoraci, L. & Tertulliani, A. (2017). QUEST – Rilievo macrosismico per il terremoto dell’isola di Ischia del 21 agosto 2017. Rapporto finale. INGV — [link](https://doi.org/10.5281/zenodo.886047)
- INGV — «Evento sismico Mw 6.1 al largo della Costa Calabra nord occidentale, 2 giugno 2026», blog INGVterremoti, 2 giugno 2026 — [link](https://ingvterremoti.com/2026/06/02/evento-sismico-mw-6-1-al-largo-della-costa-calabra-nord-occidentale-2-giugno-2026/)
- INGV — «Il terremoto del 2 giugno 2026 (Mw 6.1 ML 6.2) e l’attenuazione delle onde sismiche nelle zone di subduzione», blog INGVterremoti, 17 giugno 2026 — [link](https://ingvterremoti.com/2026/06/17/il-terremoto-del-2-giugno-2026-mw-6-1-ml-6-2-e-lattenuazione-delle-onde-sismiche-nelle-zone-di-subduzione/)
- INGV — «Hai Sentito Il Terremoto?»: intensità per comune della scossa del 2 giugno 2026 (evento 46107472) — [link](https://e.hsit.it/46107472/index.html)
- INGV — «Terremoto del 20 maggio 2012 in Pianura Padana: il contributo dei cittadini per la stima degli effetti», blog INGVterremoti, 20 maggio 2026 — [link](https://ingvterremoti.com/2026/05/20/terremoto-del-20-maggio-2012-in-pianura-padana-il-contributo-dei-cittadini-per-la-stima-degli-effetti/)
- INGV — La scala MCS (Database Fotografico Macrosismico) — [link](https://dfm.ingv.it/?page=scale.mcs)
- INGV — «Hai Sentito Il Terremoto?»: informazioni sul sito e sui dati — [link](https://www.hsit.it/explain.html)
- Tosi, P., De Rubeis, V., Sbarra, P. & Sorrentino, D. (2026). Hai Sentito Il Terremoto (HSIT) – Macroseismic intensity database 2007-2024, version 4. INGV — [link](https://doi.org/10.13127/HSIT/I.4)
- Rovida, A., Locati, M., Camassi, R., Lolli, B., Gasperini, P. & Antonucci, A. (2022). Catalogo Parametrico dei Terremoti Italiani (CPTI15), versione 4.0. INGV — [link](https://doi.org/10.13127/cpti/cpti15.4)
- Grünthal, G. (a cura di) (2019). Scala Macrosismica Europea 1998 (EMS-98). Edizione italiana a cura di Tertulliani, A., Azzaro, R. & Buffarini, G. Cahiers du Centre Européen de Géodynamique et de Séismologie, 32 (originale: vol. 15, 1998) — [link](https://doi.org/10.2312/EMS-98.full.it)
- Musson, R. M. W., Grünthal, G. & Stucchi, M. (2010). The comparison of macroseismic intensity scales. Journal of Seismology, 14(2), 413–428 — [link](https://doi.org/10.1007/s10950-009-9172-0)
- Sbarra, P., Tosi, P., De Rubeis, V. & Sorrentino, D. (2025). The importance of on-request reports for the correct assessment of low macroseismic intensities: the experience of «Hai Sentito Il Terremoto». Natural Hazards, 121(2), 1489–1504 — [link](https://doi.org/10.1007/s11069-024-06869-7)
- Allen, T. I., Wald, D. J. & Worden, C. B. (2012). Intensity attenuation for active crustal regions. Journal of Seismology, 16(3) — [link](https://doi.org/10.1007/s10950-012-9278-7)
- Faenza, L. & Michelini, A. (2010). Regression analysis of MCS intensity and ground motion parameters in Italy and its application in ShakeMap. Geophysical Journal International, 180(3) — [link](https://doi.org/10.1111/j.1365-246X.2009.04467.x)
- Hanks, T. C. & Kanamori, H. (1979). A moment magnitude scale. Journal of Geophysical Research, 84(B5) — [link](https://doi.org/10.1029/JB084iB05p02348)

#### Tante piccole, poche grandi

*Le basi* · [leggi l’articolo](contenuti/articoli/tante-piccole-poche-grandi.mdx)

- INGV — catalogo dei terremoti, richiesta usata per il grafico — [link](https://webservices.ingv.it/fdsnws/event/1/query?format=text&orderby=time-asc&limit=20000&starttime=2025-01-01&endtime=2026-01-01&minlat=35&maxlat=48&minlon=6&maxlon=19)
- Gutenberg, B. & Richter, C. F. (1944). Frequency of earthquakes in California. Bulletin of the Seismological Society of America, 34(4) — [link](https://doi.org/10.1785/BSSA0340040185)
- Aki, K. (1965). Maximum likelihood estimate of b in the formula log N = a − bM and its confidence limits. Bulletin of the Earthquake Research Institute, 43

#### Repliche e sequenze

*Le basi* · [leggi l’articolo](contenuti/articoli/repliche-e-sequenze.mdx)

- INGV — catalogo dei terremoti, richiesta usata per il grafico — [link](https://webservices.ingv.it/fdsnws/event/1/query?format=text&orderby=time-asc&limit=20000&starttime=2016-08-20&endtime=2017-03-01&minmag=2.5&lat=42.8&lon=13.2&maxradiuskm=40)
- INGVterremoti — Sequenza sismica in Italia Centrale 2016–2017 — [link](https://ingvterremoti.com/category/terremoti_italia/sequenza-sismica-amatrice/)
- Utsu, T., Ogata, Y. & Matsu’ura, R. S. (1995). The centenary of the Omori formula for a decay law of aftershock activity. Journal of Physics of the Earth, 43(1) — [link](https://doi.org/10.4294/jpe1952.43.1)
- Båth, M. (1965). Lateral inhomogeneities of the upper mantle. Tectonophysics, 2(6) — [link](https://doi.org/10.1016/0040-1951%2865%2990003-X)

#### Si possono prevedere i terremoti?

*Le basi* · [leggi l’articolo](contenuti/articoli/si-possono-prevedere.mdx)

- INGV — FAQ, domande frequenti sui terremoti — [link](https://ingvterremoti.com/faq/faq-domande-frequenti-sui-terremoti/)
- INGV — Terremoto a Roma l’11 maggio 2011 (sulla falsa previsione) — [link](https://www.ingv.it/stampa-urp/ufficio-stampa/news/terremoto-a-roma-l11-maggio-2011)
- INGV — Mappa di pericolosità sismica (MPS04) — [link](https://zonesismiche.mi.ingv.it/)
- Dipartimento della Protezione Civile — Descrizione del rischio sismico — [link](https://rischi.protezionecivile.gov.it/it/sismico/descrizione-del-rischio/)

#### Le faglie: tre modi di rompersi, e quali si muovono in Italia

*Le basi* · [leggi l’articolo](contenuti/articoli/le-faglie.mdx)

- INGV — «I meccanismi focali e le faglie», blog INGVterremoti, 18 giugno 2012 — [link](https://ingvterremoti.com/2012/06/18/approfondimento-i-meccanismi-focali-e-le-faglie-2/)
- INGV — «I meccanismi focali dei terremoti M≥4.0 della sequenza sismica di Amatrice-Visso-Norcia», blog INGVterremoti, 16 settembre 2026 — [link](https://ingvterremoti.com/2026/09/16/i-meccanismi-focali-dei-terremoti-m%E2%89%A54-0-della-sequenza-sismica-di-amatrice-visso-norcia/)
- INGV — «24 agosto 2016, sei anni dopo», blog INGVterremoti, 24 agosto 2022 — [link](https://ingvterremoti.com/2022/08/24/24-agosto-2016-sei-anni-dopo/)
- INGV — «Le reti GPS aiutano a comprendere il potenziale delle faglie dell’Appennino centrale», blog INGVterremoti, 23 settembre 2020 — [link](https://ingvterremoti.com/2020/09/23/le-reti-gps-aiutano-a-comprendere-il-potenziale-delle-faglie-dellappennino-centrale/)
- INGV — «I terremoti dell’Emilia 2012, l’effetto della liquefazione e le conoscenze sismiche pregresse», blog INGVterremoti, 6 giugno 2014 — [link](https://ingvterremoti.com/2014/06/06/i-terremoti-dellemilia-2012-leffetto-della-liquefazione-e-le-conoscenze-sismiche-pregresse/)
- ISPRA, Servizio Geologico d’Italia — ITHACA, catalogo delle faglie capaci — [link](https://www.isprambiente.gov.it/it/progetti/cartella-progetti-in-corso/suolo-e-territorio-1/ithaca-catalogo-delle-faglie-capaci)
- DISS Working Group (2025). Database of Individual Seismogenic Sources (DISS), version 3.3.1: a compilation of potential sources for earthquakes larger than M 5.5 in Italy and surrounding areas. INGV — [link](https://doi.org/10.13127/diss3.3.1)
- ISIDe Working Group (2007). Italian Seismological Instrumental and Parametric Database (ISIDe). INGV — [link](https://doi.org/10.13127/ISIDE)
- D’Agostino, N., Giuliani, R., Mattone, M. & Bonci, L. (2001). Active crustal extension in the Central Apennines (Italy) inferred from GPS measurements in the interval 1994–1999. Geophysical Research Letters, 28(10) — [link](https://doi.org/10.1029/2000GL012462)
- Scognamiglio, L., Tinti, E. & Michelini, A. (2009). Real-time determination of seismic moment tensor for the Italian region. Bulletin of the Seismological Society of America, 99(4) — [link](https://doi.org/10.1785/0120080104)
- Civico, R. e altri (2018). Surface ruptures following the 30 October 2016 Mw 6.5 Norcia earthquake, central Italy. Journal of Maps, 14(2) — [link](https://doi.org/10.1080/17445647.2018.1441756)
- Ciaccio, M. G. e altri (2021). First-motion focal mechanism solutions for 2015–2019 M ≥ 4.0 Italian earthquakes. Frontiers in Earth Science, 9 — [link](https://doi.org/10.3389/feart.2021.630116)

#### Una scossa, tante magnitudo: perché i numeri cambiano

*Le basi* · [leggi l’articolo](contenuti/articoli/perche-la-magnitudo-cambia.mdx)

- INGV — «La magnitudo del terremoto del 30 ottobre 2016», blog INGVterremoti, 31 ottobre 2016 — [link](https://ingvterremoti.com/2016/10/31/la-magnitudo-del-terremoto-del-30-ottobre-2016/)
- INGV — «Campi Flegrei: aggiornamento della magnitudo Md del terremoto del 13 marzo 2025», blog INGVterremoti, 19 marzo 2025 — [link](https://ingvterremoti.com/2025/03/19/campi-flegrei-aggiornamento-della-magnitudo-md-del-terremoto-del-13-marzo-2025/)
- INGV — Domande frequenti sui terremoti (FAQ) — [link](https://ingvterremoti.com/faq/faq-domande-frequenti-sui-terremoti/)
- ISIDe Working Group (2007). Italian Seismological Instrumental and Parametric Database (ISIDe). INGV — [link](https://doi.org/10.13127/ISIDE)
- USGS — Earthquake Magnitude, Energy Release, and Shaking Intensity — [link](https://www.usgs.gov/programs/earthquake-hazards/earthquake-magnitude-energy-release-and-shaking-intensity)
- USGS — Moment magnitude, Richter scale: what are the different magnitude scales, and why are there so many? — [link](https://www.usgs.gov/faqs/moment-magnitude-richter-scale-what-are-different-magnitude-scales-and-why-are-there-so-many)
- Il Post — «La bufala sul governo che avrebbe abbassato la magnitudo del terremoto», 26 agosto 2016 — [link](https://www.ilpost.it/2016/08/26/magnitudo-terremoto-bufala/)
- Richter, C. F. (1935). An instrumental earthquake magnitude scale. Bulletin of the Seismological Society of America, 25(1) — [link](https://doi.org/10.1785/BSSA0250010001)
- Gutenberg, B. & Richter, C. F. (1956). Magnitude and energy of earthquakes. Annali di Geofisica, 9 — [link](https://doi.org/10.4401/ag-5590)
- Kanamori, H. (1977). The energy release in great earthquakes. Journal of Geophysical Research, 82(20) — [link](https://doi.org/10.1029/JB082i020p02981)
- Hanks, T. C. & Kanamori, H. (1979). A moment magnitude scale. Journal of Geophysical Research, 84(B5) — [link](https://doi.org/10.1029/JB084iB05p02348)
- Scognamiglio, L., Tinti, E. & Michelini, A. (2009). Real-time determination of seismic moment tensor for the Italian region. Bulletin of the Seismological Society of America, 99(4) — [link](https://doi.org/10.1785/0120080104)
- Gasperini, P., Lolli, B. & Vannucci, G. (2013). Empirical calibration of local magnitude data sets versus moment magnitude in Italy. Bulletin of the Seismological Society of America, 103(4) — [link](https://doi.org/10.1785/0120120356)
- Di Bona, M. (2016). A local magnitude scale for crustal earthquakes in Italy. Bulletin of the Seismological Society of America, 106(1) — [link](https://doi.org/10.1785/0120150155)
- Munafò, I., Malagnini, L. & Chiaraluce, L. (2016). On the relationship between Mw and ML for small earthquakes. Bulletin of the Seismological Society of America, 106(5) — [link](https://doi.org/10.1785/0120160130)
- Deichmann, N. (2017). Theoretical basis for the observed break in ML/Mw scaling between small and large earthquakes. Bulletin of the Seismological Society of America, 107(2) — [link](https://doi.org/10.1785/0120160318)
- Scognamiglio, L. e altri (2018). Complex fault geometry and rupture dynamics of the Mw 6.5, 30 October 2016, Central Italy earthquake. Journal of Geophysical Research: Solid Earth, 123(4) — [link](https://doi.org/10.1002/2018JB015603)
- Lolli, B., Gasperini, P., Biondini, E. & Vannucci, G. (2020). The relationship between ML and Mw for small earthquakes (ML \< 2-4) in Italy. EGU General Assembly 2020 (riassunto) — [link](https://doi.org/10.5194/egusphere-egu2020-18821)
- Mele, F. M. & Quintiliani, M. (2020). Correzioni di stazione per il calcolo della Magnitudo Locale in Italia. Rapporti Tecnici INGV, 413 — [link](https://doi.org/10.13127/rpt/413)

#### Come l’INGV trova un terremoto, in pochi minuti

*Le basi* · [leggi l’articolo](contenuti/articoli/come-si-trova-un-terremoto.mdx)

- INGV — «La localizzazione automatica degli eventi sismici sbarca anche sul web», blog INGVterremoti, 11 giugno 2019 — [link](https://ingvterremoti.com/2019/06/11/la-localizzazione-automatica-sbarca-anche-sul-web/)
- INGV — «Notifica errata del sistema di localizzazione automatica di un evento nel basso Lazio, 17 febbraio 2025», blog INGVterremoti — [link](https://ingvterremoti.com/2025/02/17/notifica-errata-del-sistema-di-localizzazione-automatica-di-un-evento-nel-basso-lazio-17-febbraio-2025/)
- INGV — «1985-2025: 40 anni del Bollettino Sismico Italiano», blog INGVterremoti, 16 giugno 2025 — [link](https://ingvterremoti.com/2025/06/16/1985-2025-40-anni-del-bollettino-sismico-italiano/)
- INGV, Sezione di Pisa (2019). I numeri del terremoto, a cura di S. Cianetti e altri (determinazione dell’epicentro) — [link](https://www.pi.ingv.it/flipbook/Terremoti/files/basic-html/page10.html)
- BSI Working Group (2015). Bollettino Sismico Italiano (BSI). INGV — [link](https://doi.org/10.13127/bsi)
- ISIDe Working Group (2007). Italian Seismological Instrumental and Parametric Database (ISIDe). INGV — [link](https://doi.org/10.13127/ISIDE)
- USGS — At what depth do earthquakes occur? What is the significance of the depth? — [link](https://www.usgs.gov/faqs/what-depth-do-earthquakes-occur-what-significance-depth)
- USGS — Why do so many earthquakes occur at a depth of 10km? — [link](https://www.usgs.gov/faqs/why-do-so-many-earthquakes-occur-a-depth-10km)
- Mazza, S. e altri (2012). AIDA – Seismic data acquisition, processing, storage and distribution at the National Earthquake Center, INGV. Annals of Geophysics, 55(4) — [link](https://doi.org/10.4401/ag-6145)
- Michelini, A. e altri (2016). The Italian National Seismic Network and the earthquake and tsunami monitoring and surveillance systems. Advances in Geosciences, 43 — [link](https://doi.org/10.5194/adgeo-43-31-2016)
- Marchetti, A. e altri (2016). The Italian Seismic Bulletin: strategies, revised pickings and locations of the central Italy seismic sequence. Annals of Geophysics, 59 — [link](https://doi.org/10.4401/ag-7169)

#### Effetti di sito: perché due case vicine tremano in modo diverso

*Le basi* · [leggi l’articolo](contenuti/articoli/effetti-di-sito.mdx)

- Dipartimento della Protezione Civile — «Microzonazione sismica», rischio sismico, attività — [link](https://rischi.protezionecivile.gov.it/it/sismico/attivita/microzonazione-sismica/)
- Gruppo di lavoro MS (2008). Indirizzi e criteri per la microzonazione sismica. Conferenza delle Regioni e delle Province autonome e Dipartimento della Protezione Civile, Roma — [link](https://www.protezionecivile.gov.it/en/pubblicazione/indirizzi-e-criteri-la-microzonazione-sismica-0/)
- Ministero delle Infrastrutture e dei Trasporti — D.M. 17 gennaio 2018, «Aggiornamento delle Norme tecniche per le costruzioni», Gazzetta Ufficiale n. 42 del 20 febbraio 2018, S.O. n. 8, §3.2.2 e §3.2.3 — [link](https://www.gazzettaufficiale.it/eli/id/2018/02/20/18A00716/sg)
- Regio decreto 18 aprile 1909, n. 193, norme tecniche e igieniche per le costruzioni nei Comuni colpiti dal terremoto del 28 dicembre 1908 (Normattiva) — [link](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1909-04-18;193)
- Commissario straordinario per la ricostruzione sisma 2016 — Ordinanza n. 24 del 12 maggio 2017, studi di microzonazione sismica di III livello — [link](https://sisma2016.gov.it/wp-content/uploads/2017/05/Ordinanza-24-del-12-maggio-2017.pdf)
- EMERSITO Working Group (2016). Rapporto preliminare sulle attività svolte dal gruppo operativo EMERSITO a seguito del terremoto di Amatrice Mw 6.0 (24 agosto 2016, Italia centrale). INGV — [link](https://doi.org/10.5281/zenodo.151655)
- Lanzano, G., Luzi, L., Russo, E., Felicetta, C., D’Amico, M. C., Sgobba, S. & Pacor, F. (2018). Engineering Strong Motion Database (ESM) flatfile. INGV — [link](https://doi.org/10.13127/esm/flatfile.1.0)
- Luzi, L., Lanzano, G., Felicetta, C., D’Amico, M. C., Russo, E., Sgobba, S., Pacor, F. & ORFEUS Working Group 5 (2020). Engineering Strong Motion Database (ESM), version 2.0. INGV — [link](https://doi.org/10.13127/esm.2)
- Galli, P. e altri (2009). Il terremoto aquilano del 6 aprile 2009: rilievo macrosismico, effetti di superficie ed implicazioni sismotettoniche. Il Quaternario, 22(2) — [link](https://amq.aiqua.it/index.php/amq/article/view/303)
- Di Giulio, G. e altri (2011). Local variability of the ground shaking during the 2009 L’Aquila earthquake (April 6, 2009 — Mw 6.3): the case study of Onna and Monticchio villages. Bulletin of Earthquake Engineering, 9(3) — [link](https://doi.org/10.1007/s10518-011-9243-9)
- Cantore, L., Rovelli, A. & Calderoni, G. (2017). Separation of source and site effects in ground motions recorded in the village of Onna during aftershocks of the 2009 April 6, Mw 6.1 L’Aquila earthquake. Geophysical Journal International, 210(1). Testo integrale ad accesso aperto su Earth-prints (INGV), handle 2122/11553 — [link](https://doi.org/10.1093/gji/ggx135)
- Mele, G., Rovelli, A., Fodarella, A. & Mancini, M. (2020). Site effects of Onna during the 2009 L’Aquila (Central Italy) seismic sequence: constraints on bedrock depth and 1D local velocity structure from aftershock seismograms. Bulletin of the Seismological Society of America, 110(2) — [link](https://doi.org/10.1785/0120180344)
- Bindi, D., Pacor, F., Luzi, L., Puglia, R., Massa, M., Ameri, G. & Paolucci, R. (2011). Ground motion prediction equations derived from the Italian strong motion database. Bulletin of Earthquake Engineering, 9(6). Versione dell’autore ad accesso aperto su Earth-prints (INGV), handle 2122/7515 — [link](https://doi.org/10.1007/s10518-011-9313-z)
- Priolo, E. e altri (2020). Seismological analyses of the seismic microzonation of 138 municipalities damaged by the 2016–2017 seismic sequence in Central Italy. Bulletin of Earthquake Engineering, 18(12) — [link](https://doi.org/10.1007/s10518-019-00652-x)
- Zhu, C., Cotton, F., Kawase, H., Haendel, A., Pilz, M. & Nakano, K. (2022). How well can we predict earthquake site response so far? Site-specific approaches. Earthquake Spectra, 38(2) — [link](https://doi.org/10.1177/87552930211060859)

#### Perché l’Italia trema

*L’Italia che trema* · [leggi l’articolo](contenuti/articoli/perche-l-italia-trema.mdx)

- INGV — catalogo dei terremoti, richiesta usata per il grafico — [link](https://webservices.ingv.it/fdsnws/event/1/query?format=text&orderby=time-asc&limit=20000&starttime=2005-01-01&endtime=2026-01-01&minmag=2.5&minlat=37&maxlat=41.5&minlon=13&maxlon=18)
- D’Agostino, N. et al. (2001). Active crustal extension in the central Apennines (Italy) inferred from GPS measurements in the interval 1994–1999. Geophysical Research Letters (archivio INGV Earth-prints) — [link](https://www.earth-prints.org/handle/2122/2051)
- Studi INGV/EGU sulla convergenza Africa–Eurasia e sulla microplacca adriatica (EGU General Assembly 2008, abstract A-03934)
- INGV — FAQ, domande frequenti sui terremoti — [link](https://ingvterremoti.com/faq/faq-domande-frequenti-sui-terremoti/)

#### Le zone sismiche, spiegate

*L’Italia che trema* · [leggi l’articolo](contenuti/articoli/le-zone-sismiche.mdx)

- Dipartimento della Protezione Civile — Classificazione sismica: pagina con l’elenco dei comuni aggiornato a maggio 2025 (CC BY 4.0) e la tabella degli atti regionali al 31 maggio 2025 — [link](https://rischi.protezionecivile.gov.it/it/sismico/attivita/classificazione-sismica/)
- Dipartimento della Protezione Civile — «I bambini di San Giuliano» — [link](https://servizio-nazionale.protezionecivile.gov.it/static/c3af747c828efe603dd059eaf7d5a8aa/i-bambini-di-san-giuliano.pdf)
- Ordinanza del Presidente del Consiglio dei Ministri n. 3274 del 20 marzo 2003 (GU n. 105 dell’8 maggio 2003, S.O. 72): Allegato 1, criteri per le zone, e Allegato A, classificazione dei comuni (copie pubblicate dall’INGV) — [link](https://zonesismiche.mi.ingv.it/pcm3274.html)
- Gruppo di Lavoro istituito con decreto n. 4485 del 4 dicembre 2002 — Normativa tecnica per le costruzioni in zona sismica e connessa classificazione sismica del territorio nazionale. Documento esplicativo, 15 gennaio 2003 — [link](https://zonesismiche.mi.ingv.it/documenti/esplica.pdf)
- Ordinanza del Presidente del Consiglio dei Ministri n. 3519 del 28 aprile 2006, criteri generali per l’individuazione delle zone sismiche (GU n. 108 dell’11 maggio 2006) — [link](https://rischi.protezionecivile.gov.it/static/9b53084678011aa60f249f05e7e4d9ed/ordinanza-3519.pdf)
- Meletti, C. & Stucchi, M. (2009). Pericolosità sismica, normativa e zone sismiche nell’Aquilano. INGV, Sezione di Milano, 16 aprile 2009 — [link](https://zonesismiche.mi.ingv.it/documenti/Pericolo_aq_090416.pdf)
- Decreto del Presidente della Repubblica 6 giugno 2001, n. 380 (Testo unico dell’edilizia), articoli 93, 94 e 94-bis, testo vigente — [link](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:2001-06-06;380)
- Decreto del Ministero delle Infrastrutture e dei Trasporti 17 gennaio 2018, Norme Tecniche per le Costruzioni (GU n. 42 del 20 febbraio 2018, S.O. 8), paragrafi 2.4, 3.2 e 7.0 — [link](https://www.gazzettaufficiale.it/eli/gu/2018/02/20/42/so/8/sg/pdf)
- Decreto del Ministro delle Infrastrutture 14 gennaio 2008, Norme Tecniche per le Costruzioni (GU n. 29 del 4 febbraio 2008, S.O. 30), Allegati A e B: la griglia di riferimento e i valori per le isole, a cui rimandano ancora le norme del 2018 — [link](https://www.gazzettaufficiale.it/eli/gu/2008/02/04/29/so/30/sg/pdf)
- Decreto-legge 28 aprile 2009, n. 39, convertito dalla legge 24 giugno 2009, n. 77, articoli 1-bis (norme tecniche dal 1° luglio 2009) e 11 (fondo per la prevenzione del rischio sismico) — [link](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2009-04-28;39)
- Decreto-legge 4 giugno 2013, n. 63, articolo 16 (detrazioni per gli interventi antisismici), testo vigente — [link](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2013-06-04;63~art16)
- Regione Toscana — Azioni sismiche per la progettazione — [link](https://www.regione.toscana.it/-/azioni-sismiche-per-la-progettazione)
- Gruppo di Lavoro MPS: Stucchi, M., Meletti, C., Montaldo, V., Akinci, A., Faccioli, E., Gasperini, P., Malagnini, L. & Valensise, G. (2004). Pericolosità sismica di riferimento per il territorio nazionale MPS04 \[dati\]. INGV — [link](https://doi.org/10.13127/sh/mps04/ag)
- Stucchi, M., Meletti, C., Montaldo, V., Crowley, H., Calvi, G. M. & Boschi, E. (2011). Seismic Hazard Assessment (2003–2009) for the Italian Building Code. Bulletin of the Seismological Society of America, 101(4), 1885–1911 — [link](https://doi.org/10.1785/0120100130)
- Meletti, C. e altri (2021). The new Italian seismic hazard model (MPS19). Annals of Geophysics, 64(1), SE112 — [link](https://doi.org/10.4401/ag-8579)
- Peruzza, L. & Pessina, V. (2016). Zone sismiche e pericolosità in Italia: dalle norme regionali alla comunicazione del rischio. Geologia tecnica & ambientale, 1/2016, 15–31 — [link](https://www.earth-prints.org/handle/2122/10366)
- Rovida, A., Locati, M., Camassi, R., Lolli, B., Gasperini, P. & Antonucci, A. (2022). Catalogo Parametrico dei Terremoti Italiani (CPTI15), versione 4.0. INGV — [link](https://doi.org/10.13127/CPTI/CPTI15.4)
- ISTAT — Popolazione residente per comune al 1° gennaio 2025 (CC BY 4.0) — [link](https://demo.istat.it/app/?i=POS&l=it)

#### I grandi terremoti della storia d’Italia

*I grandi terremoti* · [leggi l’articolo](contenuti/articoli/grandi-terremoti-della-storia.mdx)

- Rovida A., Locati M., Camassi R., Lolli B., Gasperini P., Antonucci A. (2022). Catalogo Parametrico dei Terremoti Italiani (CPTI15), versione 4.0. INGV — [link](https://doi.org/10.13127/CPTI/CPTI15.4)
- INGV — CFTI5Med, Catalogo dei Forti Terremoti in Italia — [link](https://storing.ingv.it/cfti/cfti5/)
- INGV — CFTI, linea del tempo dei forti terremoti — [link](https://cfti.ingv.it/timeline/)
- INGV — CFTI, scheda del terremoto del Friuli del 6 maggio 1976 — [link](https://storing.ingv.it/cfti/cfti4/quakes/38902.html)
- INGVterremoti — La “catastrofe sismica” del 28 dicembre 1908 — [link](https://ingvterremoti.com/2015/12/28/i-terremoti-del-900-la-catastrofe-sismica-del-28-dicembre-1908/)
- Protezione Civile — The Irpinia earthquake — [link](https://servizio-nazionale.protezionecivile.gov.it/en/pagina-base/irpinia-earthquake/)
- Protezione Civile — The Abruzzo earthquake — [link](https://servizio-nazionale.protezionecivile.gov.it/en/pagina-base/abruzzo-earthquake/)
- Protezione Civile — The earthquake in Central Italy — [link](https://servizio-nazionale.protezionecivile.gov.it/en/pagina-base/earthquake-central-italy/)

#### Terremoti e vulcani: Etna, Vesuvio, Campi Flegrei

*Vulcani e terremoti* · [leggi l’articolo](contenuti/articoli/terremoti-e-vulcani.mdx)

- Rovida A., Locati M., Camassi R., Lolli B., Gasperini P., Antonucci A. (2022). Catalogo Parametrico dei Terremoti Italiani (CPTI15), versione 4.0. INGV — [link](https://doi.org/10.13127/CPTI/CPTI15.4)
- INGV — Il terremoto sull’Etna del 26 dicembre e la rottura della faglia di Fiandaca — [link](https://www.ingv.it/stampa-urp/ufficio-stampa/note-stampa/il-terremoto-sull-etna-del-26-dicembre-e-la-rottura-della-faglia-di-fiandaca)
- INGVterremoti — La fagliazione superficiale prodotta dal terremoto etneo del 26 dicembre 2018, Mw 4.9 — [link](https://ingvterremoti.com/2019/03/06/la-fagliazione-superficiale-prodotta-dal-terremoto-etneo-del-26-dicembre-2018-mw-4-9/)
- INGV — ASMI, 28 luglio 1883, Isola d’Ischia — [link](https://emidius.mi.ingv.it/ASMI/event/18830728_2025_000)
- INGVterremoti — 28 luglio 1883, la catastrofe di Casamicciola — [link](https://ingvterremoti.com/2018/07/27/i-terremoti-nella-storia-28-luglio-1883-la-catastrofe-di-casamicciola-sullisola-dischia/)
- INGV — catalogo dei terremoti (Vesuvio e Ischia 2017) — [link](https://webservices.ingv.it/fdsnws/event/1/query?format=text&starttime=1985-01-01&lat=40.821&lon=14.426&maxradiuskm=6&orderby=magnitude&limit=5)

#### Campi Flegrei: la caldera che respira

*Vulcani e terremoti* · [leggi l’articolo](contenuti/articoli/campi-flegrei.mdx)

- INGV – Osservatorio Vesuviano, Bollettino di sorveglianza Campi Flegrei, settembre 2026 — [link](https://www.ov.ingv.it/index.php/monitoraggio-e-infrastrutture/bollettini-tutti/bollett-mensili-cf/anno-2026-3/2017-bollettino-mensile-campi-flegrei-2026-09/file)
- INGV – Osservatorio Vesuviano — I Campi Flegrei: inquadramento — [link](https://www.ov.ingv.it/index.php/monitoraggio-sismico-e-vulcanico/campi-flegrei)
- Dipartimento della Protezione Civile — Il bradisismo ai Campi Flegrei: linea del tempo — [link](https://rischi.protezionecivile.gov.it/it/vulcanico/vulcani-italia/campi-flegrei/il-bradisismo-ai-campi-flegrei/linea-del-tempo/)
- AGI, «Campi Flegrei: confermata l’allerta gialla per rischio vulcanico» (fase 2 di Attenzione), 4 novembre 2025 — [link](https://www.agi.it/cronaca/news/2025-11-04/campi-flegrei-confermata-allerta-gialla-per-rischio-vulcanico-34020016/)
- Astort A. e altri (2024). Tracking the 2007–2023 magma-driven unrest at Campi Flegrei caldera (Italy). Communications Earth & Environment 5 — [link](https://doi.org/10.1038/s43247-024-01665-4)
- Caliro S. e altri (2025). Escalation of caldera unrest indicated by increasing emission of isotopically light sulfur. Nature Geoscience 18 — [link](https://doi.org/10.1038/s41561-024-01632-w)
- Dipartimento della Protezione Civile — Pianificazione nazionale di emergenza per il rischio vulcanico ai Campi Flegrei — [link](https://rischi.protezionecivile.gov.it/it/vulcanico/vulcani-italia/campi-flegrei/la-pianificazione-nazionale-di-emergenza-il-rischio-vulcanico-i-campi-flegrei/)
- Io non rischio — Campi Flegrei: cosa sapere — [link](https://iononrischio.protezionecivile.gov.it/it/preparati/vulcani/campi-flegrei/cosa-sapere/)
- INGV — Miscellanea INGV sulle crisi bradisismiche del 1970–72 e 1982–84 — [link](https://collane-editoriali.ingv.it/index.php/mi/article/view/171/pdf)
- INGV — catalogo dei terremoti, richiesta usata per i grafici — [link](https://webservices.ingv.it/fdsnws/event/1/query?format=text&orderby=time-asc&limit=20000&starttime=2026-01-01&endtime=2027-01-01&lat=40.827&lon=14.139&maxradiuskm=8)

#### Esiste il «tempo da terremoto»?

*Miti e verità* · [leggi l’articolo](contenuti/articoli/tempo-da-terremoto.mdx)

- Aristotele, Meteorologica, libro II, capitolo 8 (traduzione inglese di E. W. Webster, The Internet Classics Archive, MIT) — [link](https://classics.mit.edu/Aristotle/meteorology.2.ii.html)
- Plinio il Vecchio, Naturalis historia, libro II, capitolo 81 (traduzione inglese di J. Bostock e H. T. Riley, 1855, Perseus Digital Library) — [link](https://www.perseus.tufts.edu/hopper/text?doc=Plin.+Nat.+2.81)
- La Nazione, «Basta “sismobufale” sul caldo: “Non esiste un tempo per le scosse”», intervista ad A. Amato (INGV), 5 agosto 2026 — [link](https://www.lanazione.it/lucca/cronaca/basta-sismobufale-sul-caldo-non-88a05f6c)
- ISIDe Working Group (2007). Italian Seismological Instrumental and Parametric Database (ISIDe). INGV — [link](https://doi.org/10.13127/ISIDE)
- Hersbach, H. e altri (2020). The ERA5 global reanalysis. Quarterly Journal of the Royal Meteorological Society, 146 — [link](https://doi.org/10.1002/qj.3803)
- Zippenfenig, P. (2024). Open-Meteo.com Weather API. Zenodo (dati con licenza CC BY 4.0) — [link](https://doi.org/10.5281/zenodo.7970649)
- Gardner, J. K. & Knopoff, L. (1974). Is the sequence of earthquakes in Southern California, with aftershocks removed, Poissonian? Bulletin of the Seismological Society of America, 64(5) — [link](https://doi.org/10.1785/BSSA0640051363)
- van Stiphout, T., Zhuang, J. & Marsan, D. (2012). Seismicity declustering. Community Online Resource for Statistical Seismicity Analysis (CORSSA) — [link](https://doi.org/10.5078/corssa-52382934)
- Rydelek, P. A. & Sacks, I. S. (1989). Testing the completeness of earthquake catalogues and the hypothesis of self-similarity. Nature, 337 — [link](https://doi.org/10.1038/337251a0)
- Stutzmann, E. e altri (2009). Global climate imprint on seismic noise. Geochemistry, Geophysics, Geosystems, 10 — [link](https://doi.org/10.1029/2009GC002619)
- D’Agostino, N. e altri (2018). Crustal deformation and seismicity modulated by groundwater recharge of karst aquifers. Geophysical Research Letters, 45 — [link](https://doi.org/10.1029/2018GL079794)
- Hainzl, S. e altri (2006). Evidence for rainfall-triggered earthquake activity. Geophysical Research Letters, 33 — [link](https://doi.org/10.1029/2006GL027642)
- Bettinelli, P. e altri (2008). Seasonal variations of seismicity and geodetic strain in the Himalaya induced by surface hydrology. Earth and Planetary Science Letters, 266 — [link](https://doi.org/10.1016/j.epsl.2007.11.021)
- Ide, S., Yabe, S. & Tanaka, Y. (2016). Earthquake potential revealed by tidal influence on earthquake size–frequency statistics. Nature Geoscience, 9 — [link](https://doi.org/10.1038/ngeo2796)
- Allmann, B. P. & Shearer, P. M. (2009). Global variations of stress drop for moderate to large earthquakes. Journal of Geophysical Research, 114 — [link](https://doi.org/10.1029/2008JB005821)

#### Il «mal da terremoto»

*Le persone* · [leggi l’articolo](contenuti/articoli/mal-da-terremoto.mdx)

- Miwa T., Matsuyoshi H., Nomura Y., Minoda R. (2021). Post-earthquake dizziness syndrome following the 2016 Kumamoto earthquakes, Japan. PLOS ONE 16(8): e0255816 — [link](https://doi.org/10.1371/journal.pone.0255816)
- Honma M., Endo N., Osada Y., Kim Y., Kuriyama K. (2012). Disturbances in equilibrium function after major earthquake. Scientific Reports 2: 749 — [link](https://doi.org/10.1038/srep00749)
- Miwa T. (2021). Vestibular function after the 2016 Kumamoto earthquakes: a retrospective chart review. Frontiers in Neurology 11: 626613 — [link](https://doi.org/10.3389/fneur.2020.626613)
- Bozduman Çelebi S. e altri (2024). Identifying predictors of persistent post-earthquake dizziness among adolescents after the 2023 earthquakes in Türkiye. Auris Nasus Larynx 51 — [link](https://doi.org/10.1016/j.anl.2024.10.013)
- Nomura Y., Toi T. (2014). Post Earthquake Dizziness Syndrome. Equilibrium Research 73(3): 167–173 — [link](https://doi.org/10.3757/jser.73.167)
- Cha Y.-H. (2009). Mal de debarquement. Seminars in Neurology 29(5): 520–527 — [link](https://doi.org/10.1055/s-0029-1241038)
- Cohen B., Yakushin S. B., Cho C. (2018). Hypothesis: the vestibular and cerebellar basis of the mal de debarquement syndrome. Frontiers in Neurology 9: 28 — [link](https://doi.org/10.3389/fneur.2018.00028)
- Staab J. P. e altri (2017). Diagnostic criteria for persistent postural-perceptual dizziness (PPPD): consensus document of the Bárány Society. Journal of Vestibular Research 27(4): 191–208 — [link](https://doi.org/10.3233/VES-170622)
- Allen T. I., Wald D. J., Worden C. B. (2012). Intensity attenuation for active crustal regions. Journal of Seismology 16 — [link](https://doi.org/10.1007/s10950-012-9278-7)
- ISSalute (Istituto Superiore di Sanità) — Ictus: sintomi e cosa fare — [link](https://www.issalute.it/index.php/la-salute-dalla-a-alla-z-menu/i/ictus)

</details>

<details>
<summary><strong>Fonti delle pagine e delle funzioni del sito — 27 fonti</strong></summary>

#### Cosa fare in caso di terremoto

- Io non rischio (Protezione Civile) — Cosa fare: terremoto — [link](https://iononrischio.protezionecivile.it/it/preparati/terremoto/cosa-fare/)
- Dipartimento della Protezione Civile — Se arriva il terremoto — [link](https://www.protezionecivile.gov.it/it/approfondimento/se-arriva-il-terremoto/)
- Dipartimento della Protezione Civile — Rischio sismico. Sei preparato? — [link](https://rischi.protezionecivile.it/it/sismico/sei-preparato/)
- Ministero dell’Interno — Che cosa fare se si è coinvolti in un terremoto? I consigli dei Vigili del Fuoco — [link](https://www.interno.gov.it/it/cosa-fare-e-coinvolti-terremoto)
- AREU Lombardia (agenzia che gestisce il 112) — Domande frequenti sull’app del 112 — [link](https://www.areu.lombardia.it/web/home/faq-where-are-u)
- Dipartimento della Protezione Civile — Scheda in Comunicazione Aumentativa e Alternativa sul terremoto (Istituto Leonarda Vaccari, revisione ISAAC Italy) — [link](https://www.protezionecivile.gov.it/static/e8131fdaea1248f821bcb3029623fb1e/scheda-caa-terremoto.pdf)

#### La casa ha dei danni

- Dipartimento della Protezione Civile — Se arriva il terremoto — [link](https://www.protezionecivile.gov.it/it/approfondimento/se-arriva-il-terremoto/)
- Dipartimento della Protezione Civile — La scheda AeDES — [link](https://www.protezionecivile.gov.it/it/approfondimento/scheda-aedes/)
- Dipartimento della Protezione Civile — Terremoto Emilia 2012, verifiche di agibilità ed esiti A–F (in inglese) — [link](https://emergenze.protezionecivile.gov.it/en/seismic/emilia-romagna-and-lombardy-earthquake-2012/safety-checks/)
- Dipartimento della Protezione Civile — Terremoto Centro Italia 2016, verifiche di agibilità — [link](https://emergenze.protezionecivile.gov.it/it/sismiche/terremoto-centro-italia-2016/verifiche-di-agibilita/)
- Dipartimento della Protezione Civile — Chiarimenti sul contributo di autonoma sistemazione (CAS) — [link](https://domande-risposte.protezionecivile.gov.it/it/approfondimento/terremoto-centro-italia-chiarimenti-cas/)
- Io non rischio — campagna di comunicazione sui rischi — [link](https://iononrischio.protezionecivile.it/)

#### È vero? Le voci sui terremoti

- A. Amato (INGV), Alcune riflessioni in caso di una sequenza sismica, INGVterremoti, 2019 — [link](https://ingvterremoti.com/2019/11/11/alcune-riflessioni-in-caso-di-una-sequenza-sismica-come-quella-di-sora-balsorano-del-7-novembre-2019/)
- INGV — FAQ, domande frequenti sui terremoti (Quale magnitudo?) — [link](https://ingvterremoti.com/faq/faq-domande-frequenti-sui-terremoti/)
- INGV — La magnitudo del terremoto del 30 ottobre 2016 — [link](https://ingvterremoti.com/2016/10/31/la-magnitudo-del-terremoto-del-30-ottobre-2016/)
- USGS — Earthquake Facts & Earthquake Fantasy (in inglese) — [link](https://www.usgs.gov/programs/earthquake-hazards/earthquake-facts-earthquake-fantasy)
- USGS — Can you predict earthquakes? (in inglese) — [link](https://www.usgs.gov/faqs/can-you-predict-earthquakes)
- Il Post — La bufala sul governo che avrebbe abbassato la magnitudo del terremoto, 2016 — [link](https://www.ilpost.it/2016/08/26/magnitudo-terremoto-bufala/)
- Focus — Terremoto: perché i dati sulle magnitudo sono diversi — [link](https://www.focus.it/scienza/scienze/terremoto-perche-i-dati-sulle-magnitudo-sono-diversi)
- Dipartimento della Protezione Civile — Domande e risposte sui Campi Flegrei — [link](https://rischi.protezionecivile.gov.it/it/vulcanico/vulcani-italia/campi-flegrei/il-bradisismo-ai-campi-flegrei/domande-e-risposte/domande-e-risposte-sul-rischio-vulcanico-e-il-bradisismo-ai-campi-flegrei/)

#### Terremoti, zone sismiche e storia dei comuni

- INGV — Istituto Nazionale di Geofisica e Vulcanologia, servizio FDSN degli eventi sismici (dati CC BY 4.0) — [link](https://terremoti.ingv.it/)
- Dipartimento della Protezione Civile — Classificazione sismica dei comuni (maggio 2025) — [link](https://rischi.protezionecivile.gov.it/it/sismico/attivita/classificazione-sismica/)
- Dipartimento della Protezione Civile — Piani nazionali per il Vesuvio e per i Campi Flegrei (zone rossa e gialla) — [link](https://www.protezionecivile.gov.it/it/approfondimento/aggiornamento-del-piano-nazionale-di-protezione-civile-il-vesuvio/)
- Locati M., Camassi R., Rovida A., Ercolani E., Bernardini F., Castelli V., Caracciolo C.H., Tertulliani A., Rossi A., Azzaro R., D’Amico S., Antonucci A. (2022). Database Macrosismico Italiano (DBMI15), versione 4.0 \[Data set\]. Istituto Nazionale di Geofisica e Vulcanologia (INGV). — [link](https://doi.org/10.13127/dbmi/dbmi15.4)
- INGV, Database Fotografico Macrosismico — Scala MCS (descrizioni dei gradi) — [link](https://dfm.ingv.it/?page=scale.mcs)

#### Stime di quanto si è sentita una scossa

- Allen, T. I., Wald, D. J. & Worden, C. B. (2012). Intensity attenuation for active crustal regions. Journal of Seismology, 16 — [link](https://doi.org/10.1007/s10950-012-9278-7)
- USGS — The Modified Mercalli Intensity Scale — [link](https://www.usgs.gov/programs/earthquake-hazards/modified-mercalli-intensity-scale)
- British Geological Survey — EMS-98, sintesi della scala (da Grünthal 1998) — [link](https://quakes.bgs.ac.uk/education/faqs/ems_synopsis.html)

</details>

<!-- CREDITI_FINE -->

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
