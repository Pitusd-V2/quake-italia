/**
 * «Esiste il tempo da terremoto?»: il primo articolo «a strati».
 * In 30 secondi (per tutti) → La storia → Cosa dicono i dati → Per chi vuole andare a fondo.
 * Ogni numero viene da src/data/learn/tempo-terremoto.json (scripts/build-weather-myth-data.mjs);
 * ogni affermazione ha una fonte in fondo all'articolo.
 */
import { Link } from 'react-router';
import type { Article } from './articles';
import { Part } from './LearnPart';
import { formatInt } from '../lib/format';
import { BigQuakesWeather, HoursChart, MonthsChart, OldCatalogChart, pText, WeatherFifths, weatherData as d } from './figures3';

const pct = (v: number) => `${Math.round(v * 100)}%`;
const share = (n: number, of: number[]) => n / of.reduce((a, b) => a + b, 0);
const seasons = (t: { conteggi: number[]; attesi: number[] }) => {
  const r = (ms: number[]) => ms.reduce((s, m) => s + t.conteggi[m], 0) / ms.reduce((s, m) => s + t.attesi[m], 0);
  return { inverno: r([11, 0, 1]), estate: r([5, 6, 7]) };
};
const oldS = seasons(d.catalogoVecchio.vecchio.test);
const modS = seasons(d.mesi);
const hot = share(d.meteo.caldo.quinti[4], d.meteo.caldo.quinti);
const calm = share(d.meteo.vento.quinti[0], d.meteo.vento.quinti);
const windy = share(d.meteo.vento.quinti[4], d.meteo.vento.quinti);
const aquila = d.meteo.grandi.find((g) => g.data === '2009-04-06');
const amatrice = d.meteo.grandi.find((g) => g.data === '2016-08-24');

export const WEATHER_ARTICLE: Article = {
  slug: 'tempo-da-terremoto',
  title: 'Esiste il «tempo da terremoto»?',
  subtitle: 'Una credenza di 2.400 anni messa alla prova con 40 anni di dati italiani.',
  minutes: 8,
  summaryTitle: 'In 30 secondi',
  summary: [
    `No. Abbiamo controllato il tempo nelle 24 ore prima di ${d.meteo.terremoti} terremoti forti in Italia dal 1985: non faceva più caldo, non c’era meno vento e non pioveva più del solito.`,
    `Non c’è nemmeno una stagione o un’ora «da terremoto»: su ${formatInt(d.mesi.n)} terremoti degli ultimi vent’anni, mesi e ore sono distribuiti come vuole il caso.`,
    'L’idea nasce da Aristotele, che pensava ai terremoti come a vento chiuso sottoterra. Sopravvive perché ricordiamo il tempo dei giorni terribili e dimentichiamo tutti i giorni uguali in cui non è successo niente.',
  ],
  body: () => (
    <>
      {/* ---------------- 1. La storia ---------------- */}
      <Part n={1} kicker="La storia">
        Cielo grigio, aria ferma, caldo strano
      </Part>
      <p>
        Dopo ogni scossa qualcuno lo dice: «Si sentiva, era tempo da terremoto». Le versioni cambiano da paese a paese, ma
        il ritratto è quasi sempre lo stesso: cielo grigio e uniforme, aria immobile, un caldo che non dovrebbe esserci. Il
        sismologo dell’INGV Alessandro Amato, intervistato nell’agosto 2026, l’ha definita una diceria antichissima.
      </p>
      <p>
        Antichissima davvero. Circa 2.400 anni fa <strong>Aristotele</strong> scrisse che i terremoti sono causati dal{' '}
        <dfn>pneuma</dfn>, un soffio di vento che entra nelle cavità della Terra e la scuote dall’interno. Da qui una
        conseguenza logica, per la sua teoria: se il vento va sottoterra, fuori resta la calma. Per questo, scrisse, i
        terremoti più numerosi e più forti arrivano con l’aria ferma, di notte oppure verso mezzogiorno, le ore più calme.
      </p>
      <p>
        Quattro secoli dopo <strong>Plinio il Vecchio</strong> rincarò la dose: la terra trema solo quando il mare è
        piatto e il cielo è così fermo che gli uccelli non riescono a volare. Era un’ipotesi ragionevole per chi non
        aveva strumenti. Oggi sappiamo che un terremoto è una roccia che si rompe lungo una <dfn>faglia</dfn>, di solito
        tra 5 e 20 km di profondità (lo spieghiamo in <Link to="/capire/cos-e-un-terremoto">Cos’è un terremoto</Link>).
        Laggiù il tempo che fa in superficie non arriva.
      </p>
      <p>
        Ma «laggiù il meteo non arriva» è un ragionamento, non una prova. Allora abbiamo fatto quello che Aristotele non
        poteva fare: <strong>abbiamo contato</strong>.
      </p>

      {/* ---------------- 2. Cosa dicono i dati ---------------- */}
      <Part n={2} kicker="Cosa dicono i dati">
        Tre prove, 40 anni di terremoti
      </Part>
      <p>
        Per tutte le prove usiamo il catalogo dell’INGV. Prima, però, togliamo le <dfn>repliche</dfn>: dopo una scossa
        forte ne arrivano centinaia di più piccole, e conterle tutte vorrebbe dire contare tante volte lo stesso terremoto.
        Nell’ottobre 2016, con la sequenza di Norcia, un solo mese avrebbe «pesato» più di un anno intero di terremoti.
      </p>

      <h3>Prova 1: c’è una stagione dei terremoti?</h3>
      <p>
        Se il caldo contasse, d’estate ci sarebbero più terremoti. Non è così: negli ultimi vent’anni l’estate ne ha avuti
        il {pct(1 - modS.estate)} in meno di quanti ce ne aspetteremmo, l’inverno il {pct(modS.inverno - 1)} in più.
        Differenze così piccole le produce il caso: il test statistico dà <dfn>p</dfn> = {pText(d.mesi.p)}, cioè
        squilibri come questi capitano spesso anche mescolando le date a caso.
      </p>
      <MonthsChart />

      <h3>Prova 2: c’è un’ora dei terremoti?</h3>
      <p>
        Aristotele diceva «di notte o a mezzogiorno». I dati dicono: a qualsiasi ora (p = {pText(d.ore.p)}). Qui però
        abbiamo trovato una trappola interessante. Le scosse <em>minuscole</em>, quelle che nessuno sente, nel catalogo
        sono davvero di più di notte. Non perché la Terra si muova di più al buio, ma perché di notte c’è meno traffico e
        meno rumore: i sismografi «sentono» meglio e registrano anche le scosse più deboli. È un effetto di chi ascolta,
        non di chi trema.
      </p>
      <HoursChart />

      <h3>Prova 3: che tempo faceva prima delle scosse?</h3>
      <p>
        La prova decisiva. Per {d.meteo.terremoti} terremoti indipendenti di magnitudo 4 o più, quelli che si sentono
        bene, abbiamo guardato il tempo nelle <strong>24 ore prima</strong> della scossa, nello stesso punto, usando i dati
        meteorologici ricostruiti per ogni ora degli ultimi decenni. Poi li abbiamo confrontati con le stesse 24 ore dei 15
        giorni prima e dei 15 giorni dopo. Così confrontiamo un giorno di aprile con altri giorni di aprile, nello stesso
        posto: il caldo di agosto non può ingannarci.
      </p>
      <WeatherFifths kind="caldo" />
      <p>
        Se il «tempo da terremoto» esistesse, le scosse si accumulerebbero nelle giornate più calde. Invece nel gruppo
        «tra le più calde» ci sono solo il {pct(hot)} dei terremoti, perfino meno del 20% che darebbe il caso. Con il vento
        succede lo stesso: «tra le più calme» il {pct(calm)}, «tra le più ventose» il {pct(windy)}. E la pioggia? Nelle 24
        ore prima dei terremoti ha piovuto il {pct(d.meteo.pioggia.primaDellaScossa)} delle volte, nei giorni di confronto
        il {pct(d.meteo.pioggia.giorniDiConfronto)}.
      </p>
      <WeatherFifths kind="vento" />

      <h3>E allora perché ci sembra vero?</h3>
      <p>
        Guardiamo i grandi terremoti uno per uno. La notte de L’Aquila, nel 2009, l’aria era davvero ferma: il vento medio
        delle 24 ore prima era di {aquila?.ventoMedio24h?.toString().replace('.', ',')} km/h, una delle notti più calme di
        quel periodo. Chi la ricorda così ha ragione. Ma Amatrice, sette anni dopo, arrivò dopo le 24 ore più ventose del
        suo mese ({amatrice?.ventoMedio24h?.toString().replace('.', ',')} km/h di media), con la pioggia. Norcia, in una
        mattina d’autunno senza niente di speciale.
      </p>
      <BigQuakesWeather />
      <p>
        È così che sopravvive una credenza. Il tempo di un giorno terribile resta nella memoria per sempre, e quando
        «torna» ci colpisce. Le migliaia di giorni caldi e immobili in cui non è successo niente, invece, non li ricorda
        nessuno. Gli psicologi lo chiamano <dfn>bias di conferma</dfn>: notiamo i casi che confermano quello che pensiamo
        già.
      </p>

      {/* ---------------- 3. Per chi vuole andare a fondo ---------------- */}
      <Part n={3} kicker="Per chi vuole andare a fondo">
        Come abbiamo fatto i conti, e cosa dice la ricerca
      </Part>
      <div className="learn-deep stack">
        <h3>Il metodo, in breve</h3>
        <ul className="advice">
          <li>
            <strong>Dati:</strong> catalogo INGV dal 1985 al 2024, Italia e mari intorno (località con
            sigla di provincia o «MARE»). Le prove su mesi e ore usano il 2005–2024 con magnitudo ≥ 2,5; la
            prova sul tempo usa i terremoti di magnitudo ≥ 4 dal 1985, fino a 40 km di profondità.
          </li>
          <li>
            <strong>Repliche:</strong> tolte con il metodo di Gardner e Knopoff (1974). Ogni scossa ha una «finestra» di
            spazio e tempo che cresce con la magnitudo (per una magnitudo 6, circa 50 km e oltre un anno); le scosse più
            piccole dentro la finestra di una più forte sono considerate sue repliche. Una conseguenza: Amatrice, Visso e
            Norcia contano come un’unica sequenza.
          </li>
          <li>
            <strong>Test statistico:</strong> chi quadro, con il valore p calcolato «a rotazione». Facciamo scorrere il
            calendario di ogni anno di un numero di giorni a caso (per le ore, ogni settimana di un numero di ore a caso),
            5.000 volte, e contiamo quante volte lo squilibrio fra i mesi è grande almeno quanto quello vero. Così i
            grappoli di scosse che il declustering non toglie del tutto restano interi e non ci ingannano.
          </li>
          <li>
            <strong>Meteo:</strong> rianalisi ERA5 del servizio europeo Copernicus, tramite Open-Meteo. Per ogni terremoto:
            temperatura massima, vento medio e pioggia delle 24 ore prima, e la posizione di quei valori fra i 31 «istanti»
            del confronto. Con {d.meteo.terremoti} terremoti, un effetto in cui le giornate calde avessero circa un terzo di
            terremoti in più si vedrebbe.
          </li>
        </ul>

        <h3>La trappola che abbiamo trovato: il catalogo vecchio</h3>
        <p>
          Con tutti i 40 anni, i mesi non sembravano casuali: d’estate il {pct(oldS.estate - 1)} di terremoti in più,
          d’inverno il {pct(1 - oldS.inverno)} in meno (p = {pText(d.catalogoVecchio.vecchio.test.p)}). Una scoperta? No.
          L’effetto c’è solo fino al 2004 e sparisce dal 2005, quando la rete di stazioni dell’INGV è diventata molto più
          fitta e la magnitudo si è iniziata a calcolare in un altro modo.
        </p>
        <OldCatalogChart />
        <p>
          Un effetto della natura non sparirebbe nel 2005: è cambiato il modo di misurare, non la Terra. La spiegazione più
          probabile è questa. Fino al 2004 quasi tutte le magnitudo del catalogo erano <dfn>magnitudo di durata</dfn> (Md),
          calcolate da quanto dura il segnale sul sismografo. D’inverno le mareggiate e le tempeste fanno «vibrare» tutta
          la crosta con un rumore di fondo più forte, i <dfn>microsismi</dfn>: la fine del segnale si confonde prima con il
          rumore, la durata sembra più corta e alcune scosse finiscono sotto la soglia. Lo raccontiamo perché è il cuore del
          metodo scientifico: prima di credere a un risultato, bisogna chiedersi se è la natura o lo strumento.
        </p>

        <h3>Il tempo non c’entra mai? Quasi mai</h3>
        <p>
          La ricerca ha trovato effetti minuscoli, in posti particolari, su faglie già vicine alla rottura. In Irpinia la
          ricarica stagionale delle falde nelle rocce carsiche modula la sismicità della faglia del terremoto del 1980
          (D’Agostino e altri, 2018). In Baviera piogge eccezionali hanno fatto aumentare le microscosse sotto il monte
          Hochstaufen (Hainzl e altri, 2006). In Himalaya il peso dell’acqua dei monsoni cambia la sismicità tra estate e
          inverno (Bettinelli e altri, 2008). E le maree della Terra solida, quando spingono di più, rendono un po’ più
          probabili le scosse grandi (Ide e altri, 2016).
        </p>
        <p>
          Sono effetti veri, ma si vedono solo con la statistica su migliaia di scosse e non permettono di prevedere niente.
          Le variazioni di pressione dell’aria valgono al massimo qualche migliaio di pascal. Gli sforzi che si liberano in
          un terremoto sono di solito di alcuni milioni di pascal (Allmann e Shearer, 2009). Il meteo può al massimo dare
          l’ultima spintarella a una faglia che si sarebbe rotta comunque. Nessuno di questi studi descrive il cielo grigio,
          il caldo e l’aria ferma del «tempo da terremoto».
        </p>

        <h3>Rifai i conti</h3>
        <p>
          Il codice è aperto. Lo script <code>scripts/build-weather-myth-data.mjs</code> scarica gli stessi dati, toglie
          le repliche, fa i test e salva tutto in <code>src/data/learn/tempo-terremoto.json</code>, con le richieste
          esatte. Dati scaricati il {d.scaricato}. Se trovi un errore, segnalacelo: è così che funziona la scienza.
        </p>
      </div>
    </>
  ),
  glossary: [
    ['Pneuma', 'Per Aristotele, il «soffio» di aria e vapore che, chiuso nelle cavità della Terra, avrebbe causato i terremoti.'],
    ['Replica', 'Scossa più piccola che segue un terremoto forte, nella stessa zona. In un catalogo, le repliche si tolgono per contare i terremoti indipendenti (declustering).'],
    ['Valore p', 'Quanto è probabile vedere un risultato almeno così squilibrato per puro caso. Un p grande (per esempio 0,4) vuol dire: niente di strano.'],
    ['Rianalisi', 'Ricostruzione del tempo passato, ora per ora, fatta combinando milioni di misure con un modello dell’atmosfera. ERA5 è quella del servizio europeo Copernicus.'],
    ['Magnitudo di durata (Md)', 'Magnitudo calcolata da quanto dura il segnale sul sismografo. Era la più usata in Italia fino ai primi anni Duemila.'],
    ['Microsismi', 'Vibrazioni continue e debolissime del terreno causate soprattutto dalle onde del mare. Sono più forti d’inverno, con le tempeste.'],
    ['Bias di conferma', 'La tendenza a notare e ricordare i casi che confermano quello che pensiamo già, e a dimenticare gli altri.'],
  ],
  sources: [
    {
      label: 'Aristotele, Meteorologica, libro II, capitolo 8 (traduzione inglese di E. W. Webster, The Internet Classics Archive, MIT)',
      href: 'https://classics.mit.edu/Aristotle/meteorology.2.ii.html',
    },
    {
      label: 'Plinio il Vecchio, Naturalis historia, libro II, capitolo 81 (traduzione inglese di J. Bostock e H. T. Riley, 1855, Perseus Digital Library)',
      href: 'https://www.perseus.tufts.edu/hopper/text?doc=Plin.+Nat.+2.81',
    },
    {
      label: 'La Nazione, «Basta “sismobufale” sul caldo: “Non esiste un tempo per le scosse”», intervista ad A. Amato (INGV), 5 agosto 2026',
      href: 'https://www.lanazione.it/lucca/cronaca/basta-sismobufale-sul-caldo-non-88a05f6c',
    },
    { label: 'ISIDe Working Group (2007). Italian Seismological Instrumental and Parametric Database (ISIDe). INGV', href: 'https://doi.org/10.13127/ISIDE' },
    {
      label: 'Hersbach, H. e altri (2020). The ERA5 global reanalysis. Quarterly Journal of the Royal Meteorological Society, 146',
      href: 'https://doi.org/10.1002/qj.3803',
    },
    { label: 'Zippenfenig, P. (2024). Open-Meteo.com Weather API. Zenodo (dati con licenza CC BY 4.0)', href: 'https://doi.org/10.5281/zenodo.7970649' },
    {
      label: 'Gardner, J. K. & Knopoff, L. (1974). Is the sequence of earthquakes in Southern California, with aftershocks removed, Poissonian? Bulletin of the Seismological Society of America, 64(5)',
      href: 'https://doi.org/10.1785/BSSA0640051363',
    },
    { label: 'van Stiphout, T., Zhuang, J. & Marsan, D. (2012). Seismicity declustering. Community Online Resource for Statistical Seismicity Analysis (CORSSA)', href: 'https://doi.org/10.5078/corssa-52382934' },
    {
      label: 'Rydelek, P. A. & Sacks, I. S. (1989). Testing the completeness of earthquake catalogues and the hypothesis of self-similarity. Nature, 337',
      href: 'https://doi.org/10.1038/337251a0',
    },
    { label: 'Stutzmann, E. e altri (2009). Global climate imprint on seismic noise. Geochemistry, Geophysics, Geosystems, 10', href: 'https://doi.org/10.1029/2009GC002619' },
    {
      label: 'D’Agostino, N. e altri (2018). Crustal deformation and seismicity modulated by groundwater recharge of karst aquifers. Geophysical Research Letters, 45',
      href: 'https://doi.org/10.1029/2018GL079794',
    },
    { label: 'Hainzl, S. e altri (2006). Evidence for rainfall-triggered earthquake activity. Geophysical Research Letters, 33', href: 'https://doi.org/10.1029/2006GL027642' },
    {
      label: 'Bettinelli, P. e altri (2008). Seasonal variations of seismicity and geodetic strain in the Himalaya induced by surface hydrology. Earth and Planetary Science Letters, 266',
      href: 'https://doi.org/10.1016/j.epsl.2007.11.021',
    },
    {
      label: 'Ide, S., Yabe, S. & Tanaka, Y. (2016). Earthquake potential revealed by tidal influence on earthquake size–frequency statistics. Nature Geoscience, 9',
      href: 'https://doi.org/10.1038/ngeo2796',
    },
    {
      label: 'Allmann, B. P. & Shearer, P. M. (2009). Global variations of stress drop for moderate to large earthquakes. Journal of Geophysical Research, 114',
      href: 'https://doi.org/10.1029/2008JB005821',
    },
  ],
  dataNote: (
    <>
      I grafici usano il catalogo INGV (licenza CC BY 4.0) e i dati meteo di Open-Meteo (licenza CC BY 4.0, rianalisi ERA5
      del Copernicus Climate Change Service), scaricati e analizzati con lo script <code>scripts/build-weather-myth-data.mjs</code>.
    </>
  ),
};
