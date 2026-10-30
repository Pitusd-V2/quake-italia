/**
 * "Capire i terremoti": i post divulgativi.
 * Regola: linguaggio semplice, ma i termini scientifici restano (spiegati la prima volta)
 * e ogni affermazione importante ha una fonte pubblica in fondo al post.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { SequenceSection } from './SequenceSection';
import slab from '../data/learn/slab.json';
import norcia from '../data/learn/norcia2016.json';
import gr from '../data/learn/gr-italia.json';
import { formatInt } from '../lib/format';
import { EnergyChart, FaultDiagram, GRBars, MCSScale, NorciaChart, RiskDiagram, SlabChart } from './figures';
import { MORE_ARTICLES } from './articles2';

export interface Source {
  label: string;
  href?: string;
}

export interface Article {
  slug: string;
  title: string;
  subtitle: string;
  minutes: number;
  /** I punti chiave, da leggere anche se non si legge il resto. */
  summary: string[];
  body: () => ReactNode;
  glossary: [string, string][];
  sources: Source[];
}

const n = (v: number) => formatInt(v);
const dec = (v: number) => String(v).replace('.', ',');

const INGV_FAQ: Source = { label: 'INGV — FAQ, domande frequenti sui terremoti', href: 'https://ingvterremoti.com/faq/faq-domande-frequenti-sui-terremoti/' };
const USGS_MAG: Source = {
  label: 'USGS — Earthquake Magnitude, Energy Release, and Shaking Intensity',
  href: 'https://www.usgs.gov/programs/earthquake-hazards/earthquake-magnitude-energy-release-and-shaking-intensity',
};

export const ARTICLES: Article[] = [
  /* ------------------------------------------------------------------ */
  {
    slug: 'cos-e-un-terremoto',
    title: 'Cos’è un terremoto',
    subtitle: 'Rocce che si piegano, si rompono e fanno tremare la terra.',
    minutes: 4,
    summary: [
      'Un terremoto è la rottura improvvisa delle rocce lungo una frattura chiamata faglia.',
      'Il punto in profondità dove inizia la rottura è l’ipocentro; quello in superficie sopra di esso è l’epicentro.',
      'L’energia viaggia come onde sismiche: prima arrivano le onde P (il “colpo”), poi le onde S (lo “scuotimento”).',
    ],
    body: () => (
      <>
        <h2>Rocce che si caricano come una molla</h2>
        <p>
          La parte esterna della Terra è divisa in grandi <dfn>placche tettoniche</dfn> che si muovono lentissimamente, di
          pochi millimetri o centimetri all’anno. Dove le placche spingono, si allontanano o scorrono l’una contro l’altra, le
          rocce vengono deformate: si caricano di energia come una molla compressa.
        </p>
        <p>
          Quando lo sforzo supera la resistenza della roccia, questa si rompe di colpo e i due lati scorrono lungo una
          frattura, la <dfn>faglia</dfn>. L’energia accumulata in anni o secoli si libera in pochi secondi. È la teoria del{' '}
          <dfn>rimbalzo elastico</dfn>, proposta dal geofisico H. F. Reid dopo il terremoto di San Francisco del 1906.
        </p>

        <FaultDiagram />

        <h2>Ipocentro ed epicentro</h2>
        <p>
          Il punto in profondità dove la rottura comincia si chiama <dfn>ipocentro</dfn> (o fuoco). Il punto sulla superficie
          proprio sopra l’ipocentro è l’<dfn>epicentro</dfn>: è quello che vedi sulle mappe. In Italia la maggior parte dei
          terremoti ha l’ipocentro tra 5 e 20 km di profondità, ma sotto la Calabria e il Tirreno ce ne sono anche a centinaia
          di chilometri (lo vediamo in <Link to="/capire/perche-l-italia-trema">Perché l’Italia trema</Link>).
        </p>
        <p>
          La rottura non avviene in un punto solo: si allarga sulla faglia. Per un terremoto di magnitudo 6 la superficie
          rotta è lunga circa una decina di chilometri e si rompe in pochi secondi.
        </p>

        <h2>Le onde sismiche: il colpo e lo scuotimento</h2>
        <p>Dall’ipocentro partono onde in tutte le direzioni, come quando si lancia un sasso in uno stagno.</p>
        <ul className="advice">
          <li>
            Le <dfn>onde P</dfn> (prime) sono le più veloci, circa 6 km al secondo nella crosta: comprimono e allargano la
            roccia, come una fisarmonica. Spesso si sentono come un colpo secco o un boato.
          </li>
          <li>
            Le <dfn>onde S</dfn> (seconde) sono più lente, circa 3,5 km al secondo: muovono la roccia di lato, come una corda
            scossa. Di solito sono quelle che fanno più danni.
          </li>
          <li>
            Le <dfn>onde superficiali</dfn> viaggiano lungo la superficie e, lontano dall’epicentro, possono far oscillare a
            lungo gli edifici alti.
          </li>
        </ul>
        <p>
          Il tempo tra l’arrivo delle onde P e delle onde S cresce con la distanza: circa un secondo ogni 8 km. È uno dei
          modi in cui i sismologi capiscono quanto è lontano un terremoto, usando molte stazioni insieme.
        </p>
      </>
    ),
    glossary: [
      ['Placca tettonica', 'Grande blocco rigido della parte esterna della Terra (litosfera) che si muove lentamente.'],
      ['Faglia', 'Frattura nella roccia lungo la quale i due lati si sono spostati.'],
      ['Ipocentro', 'Punto in profondità dove inizia la rottura.'],
      ['Epicentro', 'Punto in superficie sopra l’ipocentro.'],
      ['Onde P e S', 'Onde sismiche “prime” (veloci, di compressione) e “seconde” (più lente, di taglio).'],
    ],
    sources: [
      INGV_FAQ,
      { label: 'Reid, H. F. (1910). The Mechanics of the Earthquake. The California Earthquake of April 18, 1906, Report of the State Investigation Commission, vol. 2' },
      {
        label: 'Wells, D. L. & Coppersmith, K. J. (1994). New empirical relationships among magnitude, rupture length… Bulletin of the Seismological Society of America, 84(4)',
        href: 'https://doi.org/10.1785/BSSA0840040974',
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'magnitudo-e-intensita',
    title: 'Magnitudo e intensità: due cose diverse',
    subtitle: 'Perché un terremoto ha una sola magnitudo ma tante intensità.',
    minutes: 5,
    summary: [
      'La magnitudo misura quanto è “grande” un terremoto: è un solo numero, calcolato dagli strumenti.',
      'Ogni punto in più di magnitudo vuol dire circa 32 volte più energia.',
      'L’intensità (scala MCS, 12 gradi) descrive gli effetti in un luogo: cambia da paese a paese.',
    ],
    body: () => (
      <>
        <h2>La magnitudo: la “taglia” del terremoto</h2>
        <p>
          La <dfn>magnitudo</dfn> si calcola dai <dfn>sismogrammi</dfn>, le registrazioni delle stazioni sismiche. Ogni
          terremoto ha <strong>una sola</strong> magnitudo, uguale per tutti, ovunque ci si trovi.
        </p>
        <ul className="advice">
          <li>
            La <dfn>magnitudo locale ML</dfn> (quella “Richter”, 1935) si basa sull’ampiezza massima delle onde registrate.
            L’INGV la usa per la maggior parte dei terremoti.
          </li>
          <li>
            La <dfn>magnitudo momento Mw</dfn> si basa sul <dfn>momento sismico</dfn>: rigidità della roccia × area della
            faglia rotta × quanto si è spostata. Descrive meglio i terremoti forti, per questo l’INGV la indica per i più
            grandi (ad esempio Mw 6,5 a Norcia nel 2016).
          </li>
        </ul>
        <p>
          Subito dopo una scossa la magnitudo è una <strong>stima automatica</strong>; poi i sismologi la rivedono. Per
          questo a volte cambia di qualche decimale.
        </p>

        <h2>Una scala logaritmica</h2>
        <p>
          La scala è <dfn>logaritmica</dfn>: ogni punto in più vuol dire onde 10 volte più ampie sui sismogrammi e circa{' '}
          <strong>32 volte più energia</strong>. Due punti in più: circa 1.000 volte. Quindi una magnitudo 6 non è “il
          doppio” di una 3: libera circa 32.000 volte più energia.
        </p>

        <EnergyChart />

        <h2>L’intensità: cosa succede dove sei tu</h2>
        <p>
          L’<dfn>intensità</dfn> descrive gli effetti di un terremoto in un luogo preciso: cosa hanno sentito le persone, cosa
          è caduto, che danni hanno avuto gli edifici. In Italia si usa la scala <dfn>Mercalli-Cancani-Sieberg (MCS)</dfn>, di
          12 gradi, scritti con i numeri romani. Lo stesso terremoto può essere di VIII grado vicino all’epicentro e di III a
          100 km di distanza.
        </p>

        <MCSScale />

        <h2>Perché la stessa scossa si sente in modo diverso</h2>
        <ul className="advice">
          <li><strong>Distanza e profondità:</strong> più lontano o più profondo è l’ipocentro, più le onde si indeboliscono.</li>
          <li>
            <strong>Terreno:</strong> i terreni morbidi (sabbie, argille, fondovalle) possono amplificare lo scuotimento: si
            chiamano <dfn>effetti di sito</dfn>.
          </li>
          <li><strong>Edificio e piano:</strong> ai piani alti si sente di più; gli edifici fragili si danneggiano prima.</li>
        </ul>
        <p>
          Per stimare l’intensità l’INGV usa anche i questionari dei cittadini «Hai sentito il terremoto?». Le frasi come
          «probabilmente avvertita» di Quake Italia sono una stima semplice dello stesso tipo, non un dato ufficiale.
        </p>
      </>
    ),
    glossary: [
      ['Magnitudo', 'Misura della grandezza di un terremoto, calcolata dagli strumenti. Una sola per terremoto.'],
      ['ML e Mw', 'Magnitudo locale (dall’ampiezza delle onde) e magnitudo momento (dal momento sismico).'],
      ['Momento sismico', 'Rigidità della roccia × area della faglia × spostamento: misura “fisica” della grandezza del terremoto.'],
      ['Intensità', 'Misura degli effetti in un luogo (scala MCS, 12 gradi).'],
      ['Effetti di sito', 'Amplificazione dello scuotimento dovuta al tipo di terreno.'],
    ],
    sources: [
      USGS_MAG,
      { label: 'INGV — Scala macrosismica MCS (Database Fotografico Macrosismico)', href: 'https://dfm.ingv.it/?page=scale.mcs' },
      { label: 'Hanks, T. C. & Kanamori, H. (1979). A moment magnitude scale. Journal of Geophysical Research, 84(B5)', href: 'https://doi.org/10.1029/JB084iB05p02348' },
      { label: 'INGV — Questionario «Hai sentito il terremoto?»', href: 'https://www.hsit.it/' },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'perche-l-italia-trema',
    title: 'Perché l’Italia trema',
    subtitle: 'Placche che si scontrano, una catena che si allarga e una placca che sprofonda.',
    minutes: 5,
    summary: [
      'L’Italia è al confine tra la placca africana e quella euroasiatica, che si avvicinano di pochi millimetri all’anno.',
      'L’Appennino si sta “stirando”: per questo molti terremoti forti dell’Italia centrale sono su faglie dette normali.',
      `Sotto la Calabria una placca sprofonda nel mantello: lì ci sono terremoti fino a ${slab.statistiche.maxProfonditaKm} km di profondità.`,
    ],
    body: () => (
      <>
        <h2>Tra Africa ed Europa</h2>
        <p>
          L’Italia si trova dove la <dfn>placca africana</dfn> e quella <dfn>euroasiatica</dfn> si avvicinano. All’altezza
          della Sicilia le misure GPS indicano una convergenza di circa 5 millimetri all’anno, verso nord-ovest. In mezzo c’è
          un pezzo di crosta più piccolo, la <dfn>microplacca adriatica</dfn>, che si muove in modo in parte indipendente.
          Il risultato non è un unico “scontro”, ma tante zone diverse, ognuna con il suo tipo di terremoti.
        </p>

        <h2>L’Appennino si sta allargando</h2>
        <p>
          Lungo la catena appenninica le stazioni GPS mostrano che i due versanti si allontanano di qualche millimetro
          all’anno: nell’Appennino centrale circa 3–6 mm, a seconda dello studio e della zona. La crosta si “stira” e si
          rompe lungo <dfn>faglie normali</dfn>, in cui un blocco scende rispetto all’altro. Sono di questo tipo i terremoti di
          L’Aquila (2009) e di Amatrice–Visso–Norcia (2016).
        </p>
        <p>
          Nel nord, invece (Pianura Padana, Alpi), prevale la <dfn>compressione</dfn>: è il caso dei terremoti dell’Emilia
          del 2012. E poi ci sono le aree vulcaniche (Etna, Campi Flegrei, Vesuvio, Eolie), con terremoti di solito poco
          profondi legati al movimento di magma e fluidi.
        </p>

        <h2>Una placca che sprofonda sotto la Calabria</h2>
        <p>
          Sotto la Calabria la crosta oceanica del Mar Ionio scende nel mantello verso nord-ovest, sotto il Tirreno: è una{' '}
          <dfn>zona di subduzione</dfn>. La placca che scende è fredda e rigida e produce terremoti anche a grandissima
          profondità. Se si mettono su un grafico i terremoti veri, la placca “si vede”:
        </p>

        <SlabChart />

        <p>
          In questa sezione ci sono {n(slab.statistiche.totale)} terremoti: {n(slab.statistiche.oltre100km)} sono più
          profondi di 100 km e il più profondo è a {slab.statistiche.maxProfonditaKm} km. I punti si allineano su un piano
          inclinato, chiamato <dfn>piano di Wadati-Benioff</dfn>, dal nome dei due sismologi che lo scoprirono. I terremoti
          così profondi di solito si sentono poco in superficie, perché le onde perdono energia nel lungo tragitto, ma possono
          essere avvertiti su un’area molto ampia.
        </p>
      </>
    ),
    glossary: [
      ['Convergenza', 'Avvicinamento tra due placche.'],
      ['Faglia normale', 'Faglia in cui un blocco scende rispetto all’altro, tipica delle zone che si allargano.'],
      ['Subduzione', 'Processo in cui una placca scende sotto un’altra e sprofonda nel mantello.'],
      ['Piano di Wadati-Benioff', 'Superficie inclinata su cui si allineano i terremoti di una placca in subduzione.'],
    ],
    sources: [
      { label: 'INGV — catalogo dei terremoti, richiesta usata per il grafico', href: slab.richiesta },
      {
        label: 'D’Agostino, N. et al. (2001). Active crustal extension in the central Apennines (Italy) inferred from GPS measurements in the interval 1994–1999. Geophysical Research Letters (archivio INGV Earth-prints)',
        href: 'https://www.earth-prints.org/handle/2122/2051',
      },
      { label: 'Studi INGV/EGU sulla convergenza Africa–Eurasia e sulla microplacca adriatica (EGU General Assembly 2008, abstract A-03934)' },
      INGV_FAQ,
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'tante-piccole-poche-grandi',
    title: 'Tante piccole, poche grandi',
    subtitle: 'La legge di Gutenberg-Richter, vista con i terremoti italiani del 2025.',
    minutes: 4,
    summary: [
      `Nel 2025 l’INGV ha localizzato ${n(gr.totale)} terremoti nell’area italiana: quasi tutti piccolissimi.`,
      'Per ogni punto di magnitudo in più, i terremoti sono circa dieci volte meno: è la legge di Gutenberg-Richter.',
      'Questa legge serve a stimare la pericolosità, ma non dice quando arriverà il prossimo terremoto.',
    ],
    body: () => {
      const at = Object.fromEntries(gr.almeno as [number, number][]);
      return (
        <>
          <h2>Un anno di terremoti in Italia</h2>
          <p>
            Nel 2025 la Rete Sismica Nazionale dell’INGV ha localizzato <strong>{n(gr.totale)}</strong> terremoti
            nell’area italiana e nei mari vicini. Sembrano tantissimi, ma guardiamo quanti erano almeno di una certa
            magnitudo: {n(at[1])} di magnitudo 1 o più, {n(at[2])} di magnitudo 2 o più, {n(at[3])} di magnitudo 3 o più e
            solo {n(at[4])} di magnitudo 4 o più.
          </p>

          <GRBars />

          <h2>La legge di Gutenberg-Richter</h2>
          <p>
            Nel 1944 i sismologi Beno Gutenberg e Charles Richter notarono che in California succedeva lo stesso, e lo
            scrissero con una formula semplice:
          </p>
          <p className="formula" aria-label="logaritmo in base dieci di N uguale a a meno b per M">
            log₁₀ N = a − b · M
          </p>
          <p>
            Qui N è il numero di terremoti di magnitudo almeno M, mentre <dfn>a</dfn> dice quanto è attiva una zona e{' '}
            <dfn>b</dfn> (il <dfn>b-value</dfn>) quanto velocemente calano i terremoti al crescere della magnitudo. In quasi
            tutto il mondo b è vicino a 1, cioè dieci volte meno terremoti per ogni punto di magnitudo. Con i dati italiani del
            2025 otteniamo b = {dec(gr.bValue)}.
          </p>

          <h2>I terremoti che “non si vedono”</h2>
          <p>
            Le scosse piccolissime spesso non vengono registrate da abbastanza stazioni. Per questo si calcola la{' '}
            <dfn>magnitudo di completezza</dfn> (Mc): sopra quel valore il catalogo è completo. Per il 2025 la stimiamo intorno
            a {dec(gr.mc)}. Puoi rifare questi calcoli, su qualsiasi zona e periodo, nella sezione{' '}
            <Link to="/analisi?strumento=gutenberg-richter">Analisi</Link> (per esperti).
          </p>

          <h2>A cosa serve, e a cosa no</h2>
          <p>
            Questa legge è uno dei mattoni delle mappe di <dfn>pericolosità sismica</dfn>: aiuta a stimare quanto spesso,
            in media, una zona può avere terremoti forti. Ma è una legge statistica: <strong>non dice quando</strong> arriverà
            il prossimo terremoto, né quanto sarà forte.
          </p>
        </>
      );
    },
    glossary: [
      ['Legge di Gutenberg-Richter', 'Relazione tra magnitudo e numero di terremoti: log₁₀N = a − bM.'],
      ['b-value', 'Quanto calano i terremoti al crescere della magnitudo; di solito vicino a 1.'],
      ['Magnitudo di completezza', 'Magnitudo sopra la quale il catalogo registra praticamente tutti i terremoti.'],
    ],
    sources: [
      { label: 'INGV — catalogo dei terremoti, richiesta usata per il grafico', href: gr.richiesta },
      { label: 'Gutenberg, B. & Richter, C. F. (1944). Frequency of earthquakes in California. Bulletin of the Seismological Society of America, 34(4)', href: 'https://doi.org/10.1785/BSSA0340040185' },
      { label: 'Aki, K. (1965). Maximum likelihood estimate of b in the formula log N = a − bM and its confidence limits. Bulletin of the Earthquake Research Institute, 43' },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'repliche-e-sequenze',
    title: 'Repliche e sequenze',
    subtitle: 'Perché dopo una scossa forte la terra continua a tremare, e perché bisogna restare prudenti.',
    minutes: 5,
    summary: [
      'Dopo una scossa forte arrivano molte scosse più piccole, le repliche, che diminuiscono col tempo (legge di Omori).',
      'Di solito la replica più forte è più debole della scossa principale, ma non è una regola fissa.',
      'Nel 2016, due mesi dopo Amatrice (Mw 6,0), è arrivata la scossa di Norcia, più forte (Mw 6,5).',
    ],
    body: () => (
      <>
        <h2>Le repliche</h2>
        <p>
          Dopo una scossa forte, la <dfn>scossa principale</dfn>, la crosta intorno alla faglia si riassesta e produce molte
          scosse più piccole: le <dfn>repliche</dfn> (in inglese aftershocks). Sono normali e possono continuare per giorni,
          mesi, a volte anni.
        </p>

        <h2>La legge di Omori: sempre meno, col passare del tempo</h2>
        <p>
          Già nel 1894 il sismologo giapponese Fusakichi Omori notò che il numero di repliche cala col tempo in modo
          regolare. Nella forma moderna (Utsu) si scrive:
        </p>
        <p className="formula" aria-label="n di t uguale a K diviso t più c elevato alla p">
          n(t) = K / (t + c)<sup>p</sup>
        </p>
        <p>
          Con <dfn>p</dfn> vicino a 1, vuol dire più o meno questo: il decimo giorno ci sono circa dieci volte meno repliche
          del primo. Ma “meno” non vuol dire “nessuna”.
        </p>

        <h2>Un caso vero: Amatrice, Visso, Norcia</h2>
        <p>
          La sequenza dell’Italia centrale del 2016–2017 è una delle più studiate al mondo: l’INGV ha localizzato oltre
          110.000 terremoti. Nel grafico ci sono solo quelli di magnitudo 2,5 o più vicino a Norcia ({n(norcia.totale)}).
        </p>

        <NorciaChart />

        <p>
          Si vedono tre cose. Dopo il 24 agosto (Mw 6,0, Amatrice) le repliche calano proprio come dice Omori. Il 26 ottobre
          arriva una scossa di Mw 5,9 vicino a Visso e, quattro giorni dopo, il 30 ottobre, la più forte di tutte: Mw 6,5 vicino
          a Norcia, con il picco di {n(Math.max(...(norcia.giornaliero as number[])))} scosse in un giorno. A gennaio 2017 una
          nuova fase con scosse fino a Mw 5,5 vicino a Capitignano.
        </p>

        <SequenceSection preferred="centro-italia" />

        <h2>La legge di Båth, e i suoi limiti</h2>
        <p>
          Il sismologo svedese Markus Båth (1965) osservò che, in media, la replica più forte è circa 1,2 punti di magnitudo
          più debole della scossa principale. Ma è solo una media: da una sequenza all’altra la differenza cambia molto, e a
          volte dopo una scossa ne arriva una più forte, come a Norcia. Allora la prima scossa diventa, “a posteriori”, una{' '}
          <dfn>scossa precursore</dfn> (foreshock).
        </p>

        <h2>Sciami sismici</h2>
        <p>
          A volte non c’è una scossa principale chiara, ma tante scosse simili tra loro, concentrate in una zona per giorni o
          settimane: è uno <dfn>sciame sismico</dfn>. Succede spesso nelle aree vulcaniche e dove ci sono fluidi in movimento
          nella crosta.
        </p>

        <h2>Cosa ci insegna</h2>
        <p>
          Nessuno può dire «il peggio è passato». Durante una sequenza è giusto restare prudenti, non rientrare in edifici
          danneggiati e seguire le indicazioni delle autorità. Quando c’è una sequenza in corso, Quake Italia la racconta nella
          pagina «Cosa sta succedendo».
        </p>
      </>
    ),
    glossary: [
      ['Scossa principale', 'La scossa più forte di una sequenza.'],
      ['Repliche', 'Scosse che seguono la scossa principale, nella stessa zona (aftershocks).'],
      ['Legge di Omori', 'Il numero di repliche cala nel tempo come K / (t + c)^p, con p vicino a 1.'],
      ['Legge di Båth', 'In media la replica più forte è circa 1,2 magnitudo sotto la principale (con grandi variazioni).'],
      ['Sciame sismico', 'Serie di scosse simili, senza una scossa principale netta.'],
    ],
    sources: [
      { label: 'INGV — catalogo dei terremoti, richiesta usata per il grafico', href: norcia.richiesta },
      { label: 'INGVterremoti — Sequenza sismica in Italia Centrale 2016–2017', href: 'https://ingvterremoti.com/category/terremoti_italia/sequenza-sismica-amatrice/' },
      { label: 'Utsu, T., Ogata, Y. & Matsu’ura, R. S. (1995). The centenary of the Omori formula for a decay law of aftershock activity. Journal of Physics of the Earth, 43(1)', href: 'https://doi.org/10.4294/jpe1952.43.1' },
      { label: 'Båth, M. (1965). Lateral inhomogeneities of the upper mantle. Tectonophysics, 2(6)', href: 'https://doi.org/10.1016/0040-1951(65)90003-X' },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'si-possono-prevedere',
    title: 'Si possono prevedere i terremoti?',
    subtitle: 'No. Ma si può fare molto per ridurre i danni.',
    minutes: 4,
    summary: [
      'Oggi nessuno può prevedere dove, quando e quanto forte avverrà un terremoto.',
      'Si può però stimare la probabilità che una zona abbia terremoti forti: è la pericolosità sismica.',
      'Il rischio dipende anche da quanto sono fragili gli edifici e da quante persone ci sono: questo si può ridurre.',
    ],
    body: () => (
      <>
        <h2>Previsione e probabilità</h2>
        <p>
          Una <dfn>previsione</dfn> vera dovrebbe dire esattamente dove, quando e con che magnitudo avverrà un terremoto.
          Secondo l’INGV, la complessità dei processi che generano i terremoti oggi <strong>non lo permette</strong>.
        </p>
        <p>
          Si può invece fare una stima di <dfn>probabilità</dfn>: quanto è probabile che in una certa zona, in un certo
          periodo, avvenga un terremoto di una certa magnitudo. È quello che fanno le mappe di pericolosità sismica.
        </p>

        <h2>Diffida delle “previsioni”</h2>
        <p>
          Sui social girano spesso “previsioni” basate su allineamenti di pianeti, animali, nuvole o sogni. Non hanno basi
          scientifiche. Un esempio famoso: nel 2011 si diffuse la voce che Roma sarebbe stata distrutta l’11 maggio, attribuita
          a Raffaele Bendandi; l’INGV ha ricordato che le sue idee non sono mai state pubblicate su riviste scientifiche e che
          nei suoi scritti quella previsione non c’era. Quel giorno, ovviamente, non successe nulla.
        </p>
        <p>
          Le voci più comuni, e come riconoscere un messaggio falso, sono raccolte in{' '}
          <Link to="/e-vero">È vero? Le voci sui terremoti</Link>.
        </p>

        <h2>Pericolosità e zone sismiche</h2>
        <p>
          La <dfn>pericolosità sismica</dfn> di un territorio dipende da quanto spesso e quanto forti sono i terremoti che lo
          colpiscono. L’INGV la calcola con la mappa di pericolosità (MPS04), usando cataloghi storici, faglie e leggi come
          quella di Gutenberg-Richter. Da questa mappa derivano le <dfn>zone sismiche</dfn> dei comuni, da 1 (la più
          pericolosa) a 4: puoi vedere quella del tuo in <Link to="/il-mio-comune">Il mio comune</Link>.
        </p>

        <h2>Il rischio si può ridurre</h2>
        <p>
          Il <dfn>rischio sismico</dfn> non dipende solo dalla natura. Secondo il Dipartimento della Protezione Civile è la
          combinazione di tre fattori:
        </p>

        <RiskDiagram />

        <p>
          Per l’Italia il Dipartimento indica una pericolosità medio-alta, una vulnerabilità molto elevata (tanti edifici
          vecchi o fragili) e un’esposizione altissima (città, borghi, patrimonio storico). La pericolosità non si può
          cambiare, ma la vulnerabilità sì: costruire e rinforzare bene gli edifici, preparare la casa e conoscere il piano di
          emergenza del proprio Comune salva vite. Per cominciare: <Link to="/cosa-fare">Cosa fare in caso di terremoto</Link>.
        </p>
      </>
    ),
    glossary: [
      ['Previsione', 'Indicazione esatta di luogo, tempo e magnitudo di un terremoto futuro: oggi non è possibile.'],
      ['Pericolosità sismica', 'Probabilità che una zona sia colpita da terremoti di una certa forza in un certo periodo.'],
      ['Vulnerabilità', 'Quanto gli edifici sono predisposti a subire danni.'],
      ['Esposizione', 'Quante persone e quanti beni ci sono in una zona.'],
      ['Rischio sismico', 'Danni attesi: combinazione di pericolosità, vulnerabilità ed esposizione.'],
    ],
    sources: [
      INGV_FAQ,
      { label: 'INGV — Terremoto a Roma l’11 maggio 2011 (sulla falsa previsione)', href: 'https://www.ingv.it/stampa-urp/ufficio-stampa/news/terremoto-a-roma-l11-maggio-2011' },
      { label: 'INGV — Mappa di pericolosità sismica (MPS04)', href: 'https://zonesismiche.mi.ingv.it/' },
      { label: 'Dipartimento della Protezione Civile — Descrizione del rischio sismico', href: 'https://rischi.protezionecivile.gov.it/it/sismico/descrizione-del-rischio/' },
    ],
  },
];

ARTICLES.push(...MORE_ARTICLES);

export const findArticle = (slug: string | undefined) => ARTICLES.find((a) => a.slug === slug);
